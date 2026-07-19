import logging
from datetime import UTC, datetime

from tavily import errors as tavily_errors

from app.services.cold_start_scoring import compute_cold_start_score, is_cold_start
from app.services.founder_scoring import compute_track_record_score
from app.services.founder_synthesis import build_synthesis_memory_payload, classify_startup
from app.services.github_analysis import GitHubNotFound, review_github_code
from app.services.founders_repo import (
    get_existing_memory_source_urls,
    get_founder,
    get_research_job,
    insert_founder_memory,
    insert_founder_score,
    insert_research_log,
    list_founder_memory,
    list_founder_memory_categories,
    list_founder_memory_full,
    update_founder,
    update_research_job,
)
from app.services.trust_layer import verify_direct_source, verify_discovered_source
from app.tools import get_openai, get_tavily

logger = logging.getLogger(__name__)

# Direct-link steps: the founder record already has an exact URL for these, so we
# fetch that page's real content via Tavily's extract() API. Passing a known URL to
# search() instead (the earlier bug here) returns unrelated domain-matched noise,
# not the founder's actual profile — extract() is the only way to get the real page.
_DIRECT_LINK_STEPS = [
    ("searching_github", "github_url", "github", "open_source"),
    ("searching_linkedin", "linkedin_url", "linkedin", "social"),
    ("searching_twitter", "twitter_url", "twitter", "social"),
    ("searching_website", "company_website", "website", "company"),
]

# Discovery steps: no known URL yet for these, so we search by the founder/company's
# exact (quoted) name, restricted to the channel's domain where one exists, rather
# than a loose unquoted phrase that tends to surface irrelevant, same-topic pages.
# Covers every source the brief names by channel (GitHub/LinkedIn via direct-link
# above, Product Hunt, Devpost/hackathons, news, research papers, patents,
# accelerator cohorts) plus company registration/registry and board/team info —
# this list runs unconditionally for every founder regardless of how they were
# originally sourced (inbound search, deck application, or outbound scan).
_DISCOVERY_STEPS = [
    ("searching_producthunt", "producthunt", ["producthunt.com"], "project"),
    ("searching_devpost_hackathons", "devpost", ["devpost.com"], "project"),
    ("searching_news", "news", None, "other"),
    ("searching_research", "research", ["arxiv.org"], "research"),
    ("searching_patents", "patents", ["patents.google.com"], "patent"),
    ("searching_accelerators", "accelerator", None, "award"),
    ("searching_linkedin_discovery", "linkedin", ["linkedin.com"], "social"),
    ("searching_registry", "registry", ["crunchbase.com", "opencorporates.com"], "registration"),
    ("searching_team", "team", None, "team"),
    ("searching_company_overview", "company_overview", None, "company"),
]


def _discovery_query(founder: dict, channel: str) -> str | None:
    name = (founder.get("name") or "").strip()
    company = (founder.get("company_name") or "").strip()
    subject = company or name
    if not subject:
        return None

    if channel in ("producthunt", "devpost"):
        return f'"{company}" product launch' if company else None
    if channel == "news":
        return f'"{subject}" startup founder funding'
    if channel == "research":
        return f'"{name}" research paper' if name else None
    if channel == "patents":
        return f'"{subject}" patent'
    if channel == "accelerator":
        return f'"{subject}" accelerator cohort OR Y Combinator OR Techstars'
    if channel == "linkedin":
        return f'"{name}" LinkedIn founder OR CEO' if name else None
    if channel == "registry":
        return f'"{company}" company registration OR crunchbase profile OR business registry' if company else None
    if channel == "team":
        return f'"{company}" founders team board of directors OR leadership' if company else None
    if channel == "company_overview":
        # Founder Partner needs "what does this company actually do", not just
        # that it exists (already covered by "news"/"registry") -- a distinct
        # query aimed at a product/overview description.
        return f'"{company}" company overview what it does product' if company else None
    return None


def _mentions_subject(item: dict, founder: dict) -> bool:
    haystack = f"{item.get('title', '')} {item.get('content', '')}".lower()
    for subject in (founder.get("name"), founder.get("company_name")):
        if subject and subject.strip().lower() in haystack:
            return True
    return False


def _store_memory_item(
    founder_id: str,
    category: str,
    channel: str,
    title: str,
    snippet: str | None,
    url: str | None,
    existing_urls: set[str],
    confidence: float,
) -> bool:
    if url and url in existing_urls:
        return False

    insert_founder_memory(
        {
            "founder_id": founder_id,
            "category": category,
            "payload": {"title": title, "snippet": snippet},
            "source_url": url,
            "source_type": channel,
            "confidence": confidence,
        }
    )
    if url:
        existing_urls.add(url)
    return True


def _run_extract(
    tavily,
    job_id: str,
    step: str,
    channel: str,
    category: str,
    founder: dict,
    url: str,
    existing_urls: set[str],
) -> int:
    insert_research_log(job_id, step, f"Fetching {channel} profile...")

    try:
        result = tavily.extract(urls=[url], extract_depth="basic")
    except tavily_errors.InvalidAPIKeyError:
        raise
    except Exception as e:  # noqa: BLE001 — one bad source must not sink the job
        logger.warning("extract failed for founder %s (%s): %s", founder["id"], channel, e)
        insert_research_log(job_id, step, f"Couldn't fetch {channel} profile, skipping.", "warn")
        return 0

    stored = 0
    for item in result.get("results", []):
        raw = item.get("raw_content") or ""
        if _store_memory_item(
            founder["id"],
            category,
            channel,
            item.get("title") or url,
            raw[:1000] or None,
            item.get("url", url),
            existing_urls,
            verify_direct_source(),
        ):
            stored += 1

    insert_research_log(job_id, step, f"Stored {stored} new item(s) from {channel}.")
    return stored


def _run_github_code_review(
    job_id: str, founder: dict, existing_urls: set[str]
) -> int:
    """Technical Partner signal: reviews the founder's most-starred (or, if
    nothing has stars yet, most recently pushed) public repo directly via the
    GitHub API -- languages, README, a real source-file sample, and recent
    commit messages -- rather than relying only on their profile bio.
    """
    github_url = founder.get("github_url")
    if not github_url:
        insert_research_log(job_id, "reviewing_github_code", "No github_url on file — skipping.")
        return 0

    insert_research_log(job_id, "reviewing_github_code", "Reviewing most-starred public repo for code style...")

    try:
        review = review_github_code(github_url)
    except GitHubNotFound as e:
        insert_research_log(job_id, "reviewing_github_code", str(e), "warn")
        return 0
    except Exception as e:  # noqa: BLE001 — one bad source must not sink the job
        logger.warning("github code review failed for founder %s: %s", founder["id"], e)
        insert_research_log(job_id, "reviewing_github_code", "GitHub code review failed, skipping.", "warn")
        return 0

    # The avatar/bio/company/blog/twitter come from the GitHub user profile
    # itself, independent of whether they have any reviewable code -- worth
    # backfilling even for a cold-start founder with no public repos yet.
    # Mutating the `founder` dict in place (not just the DB row) means every
    # discovery step still to come in this same run (team/registry/company
    # overview searches, which key off company_name) sees the enrichment
    # immediately, instead of only on the next research run.
    updates: dict = {}
    if review.get("avatar_url"):
        updates["avatar_url"] = review["avatar_url"]
    if review.get("company") and not founder.get("company_name"):
        updates["company_name"] = review["company"]
    if (review.get("blog") or "").startswith("http") and not founder.get("company_website"):
        updates["company_website"] = review["blog"]
    if review.get("twitter_username") and not founder.get("twitter_url"):
        updates["twitter_url"] = f"https://twitter.com/{review['twitter_username']}"
    if updates:
        update_founder(founder["id"], updates)
        founder.update(updates)
        insert_research_log(
            job_id,
            "reviewing_github_code",
            "Backfilled from GitHub profile: " + ", ".join(updates.keys()) + ".",
        )

    if not review.get("has_repo"):
        insert_research_log(job_id, "reviewing_github_code", "No public repos found to review.")
        return 0

    stored = _store_memory_item(
        founder["id"],
        "open_source",
        "github_code_review",
        review["title"],
        review["snippet"],
        review["repo_url"],
        existing_urls,
        verify_direct_source(),
    )
    if stored:
        insert_research_log(
            job_id,
            "reviewing_github_code",
            f"Reviewed {review['repo_full_name']} ({review['stars']}★, {review['language_summary']}).",
        )

    readme_stored = 0
    if review.get("readme_full"):
        readme_stored = int(
            _store_memory_item(
                founder["id"],
                "open_source",
                "github_readme",
                f"README: {review['repo_full_name']}",
                review["readme_full"],
                f"{review['repo_url']}#readme",
                existing_urls,
                verify_direct_source(),
            )
        )
        if readme_stored:
            insert_research_log(job_id, "reviewing_github_code", "Stored full README for display.")

    return int(stored) + readme_stored


def _run_discovery_search(
    tavily,
    job_id: str,
    step: str,
    channel: str,
    include_domains: list[str] | None,
    category: str,
    founder: dict,
    existing_urls: set[str],
) -> int:
    query = _discovery_query(founder, channel)
    if not query:
        insert_research_log(job_id, step, f"No name/company to search {channel} with — skipping.")
        return 0

    insert_research_log(job_id, step, f"Searching {channel}...")

    try:
        result = tavily.search(
            query=query,
            max_results=3,
            include_domains=include_domains,
            search_depth="advanced",
        )
    except tavily_errors.InvalidAPIKeyError:
        raise
    except Exception as e:  # noqa: BLE001 — one bad source must not sink the job
        logger.warning("research step %s failed for founder %s: %s", step, founder["id"], e)
        insert_research_log(job_id, step, f"{channel} search failed, skipping.", "warn")
        return 0

    stored = 0
    for item in result.get("results", []):
        if not _mentions_subject(item, founder):
            continue
        if _store_memory_item(
            founder["id"],
            category,
            channel,
            item.get("title", ""),
            item.get("content"),
            item.get("url", ""),
            existing_urls,
            verify_discovered_source(),
        ):
            stored += 1

    insert_research_log(job_id, step, f"Stored {stored} new item(s) from {channel}.")
    return stored


def _link_cross_profile(
    tavily, job_id: str, founder: dict, field: str, channel: str, domain: str
) -> None:
    """Founder Partner cross-referencing: if the founder was sourced from one
    profile (e.g. found via GitHub) but the other (LinkedIn) isn't on file yet,
    actively searches for it -- and, on a confident match, sets the field on
    the founder record itself, not just a memory item, so the direct-link
    extract step right after this in the same run picks it up and fetches the
    real profile content. Runs symmetrically for both directions.
    """
    if founder.get(field):
        return

    name = (founder.get("name") or "").strip()
    if not name:
        insert_research_log(job_id, f"linking_{channel}", f"No name on file to look up a {channel} profile with — skipping.")
        return

    company = (founder.get("company_name") or "").strip()
    query = f'"{name}" {company} {channel}'.strip() if company else f'"{name}" {channel} profile'

    insert_research_log(job_id, f"linking_{channel}", f"Looking for a matching {channel} profile...")

    try:
        result = tavily.search(
            query=query, max_results=3, include_domains=[domain], search_depth="advanced"
        )
    except tavily_errors.InvalidAPIKeyError:
        raise
    except Exception as e:  # noqa: BLE001 — one bad source must not sink the job
        logger.warning("cross-profile lookup (%s) failed for founder %s: %s", channel, founder["id"], e)
        insert_research_log(job_id, f"linking_{channel}", f"{channel} lookup failed, skipping.", "warn")
        return

    for item in result.get("results", []):
        if not _mentions_subject(item, founder):
            continue
        url = item.get("url")
        if not url:
            continue
        update_founder(founder["id"], {field: url})
        founder[field] = url
        insert_research_log(job_id, f"linking_{channel}", f"Linked {channel} profile: {url}")
        return

    insert_research_log(job_id, f"linking_{channel}", f"No confident {channel} match found.")


def run_research_job(job_id: str) -> None:
    """Runs the full Phase 3 pipeline for one queued research job.

    Fire-and-forget: intended to be dispatched via FastAPI BackgroundTasks, so
    every failure path is caught and recorded on the job/log rows rather than
    raised back to a caller that isn't listening. Direct-link extraction and
    discovery search both run unconditionally regardless of how the founder was
    originally sourced (inbound search, deck application, or outbound scan) —
    every founder gets the same full sweep.
    """
    job = get_research_job(job_id)
    founder = get_founder(job["founder_id"])

    update_research_job(
        job_id, {"status": "running", "started_at": datetime.now(UTC).isoformat()}
    )
    update_founder(founder["id"], {"status": "researching"})

    tavily = get_tavily()
    if tavily is None:
        insert_research_log(
            job_id, "failed", "TAVILY_API_KEY is not configured on the backend.", "error"
        )
        update_research_job(job_id, {"status": "failed", "error": "tavily_not_configured"})
        return

    existing_urls = get_existing_memory_source_urls(founder["id"])
    total_stored = 0

    try:
        # Cross-reference GitHub <-> LinkedIn before the direct-link steps below
        # so a newly-found URL gets extracted in the same pass, not just stored
        # as a loose search hit -- covers "found via GitHub, has no LinkedIn on
        # file" and the reverse symmetrically.
        _link_cross_profile(tavily, job_id, founder, "linkedin_url", "linkedin", "linkedin.com")
        _link_cross_profile(tavily, job_id, founder, "github_url", "github", "github.com")

        for step, field, channel, category in _DIRECT_LINK_STEPS:
            url = founder.get(field)
            if not url:
                insert_research_log(job_id, step, f"No {field} on file — skipping.")
                continue
            total_stored += _run_extract(
                tavily, job_id, step, channel, category, founder, url, existing_urls
            )

        total_stored += _run_github_code_review(job_id, founder, existing_urls)

        for step, channel, include_domains, category in _DISCOVERY_STEPS:
            if channel == "linkedin" and founder.get("linkedin_url"):
                # Already covered by the direct-link extract() above — a
                # discovery search here would just create a near-duplicate
                # entry for the same profile under a different URL variant.
                insert_research_log(job_id, step, "LinkedIn URL already on file — skipping discovery search.")
                continue
            total_stored += _run_discovery_search(
                tavily, job_id, step, channel, include_domains, category, founder, existing_urls
            )
    except tavily_errors.InvalidAPIKeyError:
        insert_research_log(
            job_id, "failed", "TAVILY_API_KEY rejected as invalid — stopping.", "error"
        )
        update_research_job(job_id, {"status": "failed", "error": "tavily_invalid_key"})
        return

    insert_research_log(job_id, "building_founder_memory", "Normalizing data...")
    insert_research_log(
        job_id,
        "building_founder_memory",
        f"Founder memory updated — {total_stored} new item(s) total.",
    )

    openai_client = get_openai()
    if openai_client is not None:
        synthesis_input = list_founder_memory_full(founder["id"])
        try:
            classification = classify_startup(openai_client, founder, synthesis_input)
        except Exception as e:  # noqa: BLE001 — synthesis is enrichment, not required for research to complete
            logger.warning("startup classification failed for founder %s: %s", founder["id"], e)
            classification = None
        if classification:
            insert_founder_memory(
                {**build_synthesis_memory_payload(classification), "founder_id": founder["id"]}
            )
            insert_research_log(
                job_id, "startup_classification", f"Classified as: {classification['startup_type']}."
            )
        else:
            insert_research_log(
                job_id, "startup_classification", "Not enough signal to classify startup type yet."
            )

    categories = list_founder_memory_categories(founder["id"])
    if is_cold_start(founder, categories):
        update_founder(founder["id"], {"is_cold_start": True})
        score = compute_cold_start_score(founder, categories)
        insert_founder_score({**score, "founder_id": founder["id"]})
        insert_research_log(
            job_id,
            "cold_start_scoring",
            f"No public track record found — flagging cold-start with a low-confidence "
            f"baseline Founder Score of {score['score']}.",
        )
    else:
        update_founder(founder["id"], {"is_cold_start": False})
        memory_items = list_founder_memory(founder["id"])
        score = compute_track_record_score(founder, memory_items)
        insert_founder_score({**score, "founder_id": founder["id"]})
        insert_research_log(
            job_id,
            "founder_scoring",
            f"Public footprint signals found — Founder Score updated to {score['score']} "
            f"({score['confidence']} confidence).",
        )

    update_research_job(
        job_id, {"status": "completed", "completed_at": datetime.now(UTC).isoformat()}
    )
