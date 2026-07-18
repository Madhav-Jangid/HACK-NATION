import logging
from datetime import UTC, datetime

from tavily import errors as tavily_errors

from app.services.cold_start_scoring import compute_cold_start_score, is_cold_start
from app.services.founder_scoring import compute_track_record_score
from app.services.founders_repo import (
    get_existing_memory_source_urls,
    get_founder,
    get_research_job,
    insert_founder_memory,
    insert_founder_score,
    insert_research_log,
    list_founder_memory,
    list_founder_memory_categories,
    update_founder,
    update_research_job,
)
from app.services.trust_layer import verify_direct_source, verify_discovered_source
from app.tools import get_tavily

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
_DISCOVERY_STEPS = [
    ("searching_producthunt", "producthunt", ["producthunt.com"], "project"),
    ("searching_devpost_hackathons", "devpost", ["devpost.com"], "project"),
    ("searching_news", "news", None, "other"),
    ("searching_research", "research", ["arxiv.org"], "research"),
]


def _discovery_query(founder: dict, channel: str) -> str | None:
    name = (founder.get("name") or "").strip()
    company = (founder.get("company_name") or "").strip()
    subject = company or name
    if not subject:
        return None

    if channel in ("producthunt", "devpost"):
        # A launched product is named after the company/product, not the founder's
        # personal name — searching a bare personal name here mostly returns other
        # people who happen to share a first name, so skip without a company on file.
        return f'"{company}" product launch' if company else None
    if channel == "news":
        return f'"{subject}" startup founder funding'
    if channel == "research":
        return f'"{name}" research paper' if name else None
    return None


def _mentions_subject(item: dict, founder: dict) -> bool:
    """Cheap relevance filter: keep a discovery-search hit only if the founder's
    actual name or company appears in it — Tavily's search is semantic, not literal,
    so a quoted query alone doesn't guarantee the result is really about this founder.
    """
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
    url: str,
    existing_urls: set[str],
    confidence: float,
) -> bool:
    if not url or url in existing_urls:
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


def run_research_job(job_id: str) -> None:
    """Runs the full Phase 3 pipeline for one queued research job.

    Fire-and-forget: intended to be dispatched via FastAPI BackgroundTasks, so
    every failure path is caught and recorded on the job/log rows rather than
    raised back to a caller that isn't listening.
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
        for step, field, channel, category in _DIRECT_LINK_STEPS:
            url = founder.get(field)
            if not url:
                insert_research_log(job_id, step, f"No {field} on file — skipping.")
                continue
            total_stored += _run_extract(
                tavily, job_id, step, channel, category, founder, url, existing_urls
            )

        for step, channel, include_domains, category in _DISCOVERY_STEPS:
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
