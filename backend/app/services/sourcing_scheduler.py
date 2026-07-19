"""Outbound sourcing: cron-triggered continuous scanning.

The brief calls for founders to be surfaced "before they formally fundraise"
by continuously scanning GitHub, launches, hackathons, etc. `founder_search.py`'s
`discover_founders()` already does a single scan of one channel; this module
turns that into a repeatable job — one pass across every configured investor
thesis and every outbound channel — meant to be invoked on a schedule by an
external cron (Railway cron / GitHub Actions schedule) hitting
`POST /founders/discover/run-due`, not by a user clicking a button.
"""

import logging
from urllib.parse import urlparse

from app.services.founder_search import TavilyNotConfigured, discover_founders
from app.services.founders_repo import create_founder, create_research_job, list_founders, list_investment_theses

logger = logging.getLogger(__name__)

_OUTBOUND_CHANNELS = ["github", "producthunt", "hackernews"]

_URL_FIELDS = ["github_url", "linkedin_url", "twitter_url", "company_website"]


def _existing_urls() -> set[str]:
    urls: set[str] = set()
    for founder in list_founders():
        for field in _URL_FIELDS:
            value = founder.get(field)
            if value:
                urls.add(value)
    return urls


def _clean_name(candidate, channel: str) -> str:
    """The scraped page title is rarely a person's name -- for GitHub it's
    usually bio text ("cycorpgt (Public profile AI, infra, and startup
    MVPs...)"), so the URL's username is a far cleaner "name" for the founder
    record than the page title. Other channels fall back to the title, since
    there's no equivalent structured handle to extract from a PH/HN URL.
    """
    if channel == "github":
        path = urlparse(candidate.url).path.strip("/")
        if path:
            return path.split("/")[0]
    return candidate.title or candidate.url


def _candidate_payload(candidate, channel: str) -> dict:
    payload = {
        "name": _clean_name(candidate, channel)[:200],
        "source": "outbound",
        "source_channel": candidate.source_channel,
    }
    if channel == "github":
        payload["github_url"] = candidate.url
    else:
        payload["company_website"] = candidate.url
    return payload


def run_due_discovery(max_per_channel: int = 3) -> dict:
    """One sourcing pass: scan every outbound channel for every configured
    thesis, skip anything already tracked, and queue research for new hits.

    Returns a summary dict (theses scanned, candidates found, new founders
    tracked) so the caller — a route hit by an external cron — can log it.
    """
    theses = list_investment_theses()
    if not theses:
        return {"theses_scanned": 0, "candidates_found": 0, "founders_tracked": [], "skipped": "no investment thesis configured"}

    existing = _existing_urls()
    tracked: list[dict] = []
    candidates_found = 0

    for thesis in theses:
        sectors = thesis.get("sectors") or []
        geography = thesis.get("geography") or []
        for channel in _OUTBOUND_CHANNELS:
            try:
                candidates = discover_founders(channel, sectors, geography, max_per_channel)
            except TavilyNotConfigured as e:
                logger.warning("sourcing scan skipped, tavily not configured: %s", e)
                return {"theses_scanned": 0, "candidates_found": 0, "founders_tracked": [], "skipped": str(e)}

            candidates_found += len(candidates)
            for candidate in candidates:
                if candidate.url in existing:
                    continue
                existing.add(candidate.url)
                try:
                    founder = create_founder(_candidate_payload(candidate, channel))
                    job = create_research_job(founder["id"], "outbound")
                except Exception as e:  # noqa: BLE001
                    logger.warning("failed to track outbound candidate %s: %s", candidate.url, e)
                    continue
                tracked.append({"founder": founder, "research_job": job})

    return {
        "theses_scanned": len(theses),
        "candidates_found": candidates_found,
        "founders_tracked": tracked,
    }
