import random
import re
from urllib.parse import urlparse

from tavily import errors as tavily_errors

from app.schemas.founders import FounderCandidate
from app.tools import get_tavily

_CHANNEL_DOMAINS = {
    "github": ["github.com"],
    "producthunt": ["producthunt.com"],
    "hackernews": ["news.ycombinator.com"],
}

# Forum meta-threads, job/hiring-board posts, and curated-list repos surface
# constantly alongside real individual founder signals once a channel search
# is domain-restricted (e.g. every "Ask HN"/"Who's hiring" thread lives on
# news.ycombinator.com) -- none of these are a person to score or reach out
# to, so they're dropped rather than tracked as a "founder".
_NOISE_RE = re.compile(
    r"\bask hn\b|\bwho'?s hiring\b|\bhiring\?|\blooking for work\b|\bfreelancer\b|"
    r"\bstartup roles\b|\bawesome[- ]|\bcurated list\b|\bdirector(y|ies)\b|"
    r"\bforum\b|\bdiscussion\b",
    re.IGNORECASE,
)

# Each channel surfaces a different shape of content, so a single generic
# query ("new startup founder building X") resolves very differently per
# domain -- these bias each channel's search toward the content type that
# actually indicates an individual founder there (a Show HN launch post, a
# Product Hunt maker listing, a GitHub bio), and explicitly exclude the
# noisiest known false-positive shapes in the query text itself.
_CHANNEL_QUERY_TEMPLATES = {
    "github": '"founder" OR "co-founder" building {focus} startup{where} -awesome -curated',
    "producthunt": '{focus} startup launch maker founder{where} -"looking for" -hiring -forum',
    "hackernews": 'Show HN {focus} startup I built{where} -"Ask HN" -"who is hiring" -"looking for work"',
}

_CHANNEL_BY_DOMAIN = {
    "github.com": "github",
    "linkedin.com": "linkedin",
    "twitter.com": "twitter",
    "x.com": "twitter",
    "producthunt.com": "producthunt",
    "news.ycombinator.com": "hackernews",
    "devpost.com": "devpost",
}

_URL_LIKE = re.compile(r"^([\w-]+\.)+[a-zA-Z]{2,}(/.*)?$")
_HANDLE_LIKE = re.compile(r"^@?[\w-]{1,39}$")


class TavilyNotConfigured(RuntimeError):
    pass


def _normalize_url(text: str) -> str | None:
    """Recognizes a pasted link (with or without a scheme) so it can be fetched
    directly instead of being treated as fuzzy search keywords. Returns None for
    anything that isn't URL-shaped (names, company names, multi-word queries).
    """
    text = text.strip()
    if not text or " " in text:
        return None
    if re.match(r"^https?://", text):
        return text
    if _URL_LIKE.match(text):
        return f"https://{text}"
    return None


def _looks_like_handle(text: str) -> bool:
    """A bare username/slug — no dot, no spaces, no scheme — as opposed to a
    multi-word name or company. Only meaningful once we already know which
    single-source channel (e.g. GitHub) the caller means it for.
    """
    return bool(_HANDLE_LIKE.match(text.strip()))


def _detect_channel(url: str) -> str:
    host = urlparse(url).netloc.removeprefix("www.")
    return _CHANNEL_BY_DOMAIN.get(host, "website")


def _extract_url(url: str) -> list[FounderCandidate]:
    """A pasted profile/company link is fetched directly via Tavily's extract
    API — the actual page content, not a re-search on its text. This is what
    makes pasting a GitHub/LinkedIn/company URL land an accurate, exact result
    instead of generic web-search noise.
    """
    client = get_tavily()
    if client is None:
        raise TavilyNotConfigured("TAVILY_API_KEY is not configured on the backend.")

    try:
        result = client.extract(urls=[url], extract_depth="basic")
    except tavily_errors.InvalidAPIKeyError as e:
        raise TavilyNotConfigured(
            "TAVILY_API_KEY is set but rejected by Tavily as invalid."
        ) from e

    channel = _detect_channel(url)
    candidates = [
        FounderCandidate(
            title=item.get("title") or url,
            url=item.get("url", url),
            snippet=(item.get("raw_content") or "")[:400] or None,
            source_channel=channel,
        )
        for item in result.get("results", [])
    ]

    if not candidates:
        # Extraction failed (private page, blocked, JS-only content, ...) — still
        # surface the link itself rather than silently returning nothing.
        candidates.append(
            FounderCandidate(
                title=url,
                url=url,
                snippet="Couldn't fetch this page's content directly — showing the link as-is.",
                source_channel=channel,
            )
        )

    return candidates


def _run_search(
    query: str, max_results: int, include_domains: list[str] | None, source_channel: str
) -> list[FounderCandidate]:
    client = get_tavily()
    if client is None:
        raise TavilyNotConfigured("TAVILY_API_KEY is not configured on the backend.")

    try:
        result = client.search(
            query=query,
            max_results=max_results,
            include_domains=include_domains,
            search_depth="advanced",
        )
    except tavily_errors.InvalidAPIKeyError as e:
        raise TavilyNotConfigured(
            "TAVILY_API_KEY is set but rejected by Tavily as invalid."
        ) from e

    return [
        FounderCandidate(
            title=item.get("title", ""),
            url=item.get("url", ""),
            snippet=item.get("content"),
            source_channel=source_channel,
        )
        for item in result.get("results", [])
    ]


def search_founders(
    query: str, max_results: int = 5, channel: str = "all"
) -> list[FounderCandidate]:
    """Inbound: a lookup by name, startup, LinkedIn, GitHub, or company URL.

    A pasted URL is detected and fetched directly (see `_extract_url`) rather
    than being searched as keywords. Otherwise, `channel` optionally restricts a
    plain-text query to one source (e.g. a real GitHub-scoped search), matching
    the accuracy of `discover_founders`'s domain-restricted scans.
    """
    url = _normalize_url(query)
    if url:
        return _extract_url(url)

    # A bare handle ("manan-gakkhar") under an explicit single-source filter is
    # someone's exact username, not search keywords — fetch that profile
    # directly, same as if they'd pasted the full URL.
    channel_domain = _CHANNEL_DOMAINS.get(channel)
    if channel_domain and len(channel_domain) == 1 and _looks_like_handle(query):
        handle = query.strip().lstrip("@")
        return _extract_url(f"https://{channel_domain[0]}/{handle}")

    source_channel = channel if channel != "all" else "application"
    return _run_search(query, max_results, channel_domain, source_channel=source_channel)


def discover_founders(
    channel: str,
    sectors: list[str],
    geography: list[str],
    max_results: int = 5,
) -> list[FounderCandidate]:
    """Outbound: continuously scan a channel for founders matching the thesis.

    Picks one sector/geography per scan rather than concatenating every
    configured value into one query ("AI, Developer Tools, B2B SaaS, Fintech,
    ... in India, Southeast Asia, Remote") -- that reads as a bag of keywords
    to the underlying search engine, not a specific request, and surfaces
    generic forum threads and curated-list repos instead of actual founder
    signals. Repeated scans (scheduled or manual) rotate through different
    sectors over time. Results are also over-fetched and filtered against
    `_NOISE_RE` since even a focused query still surfaces some noise.
    """
    focus = random.choice(sectors) if sectors else "AI"
    where = f" in {random.choice(geography)}" if geography else ""
    template = _CHANNEL_QUERY_TEMPLATES.get(
        channel, '"founder" building {focus} startup{where}'
    )
    query = template.format(focus=focus, where=where)

    candidates = _run_search(
        query,
        max_results * 3,
        include_domains=_CHANNEL_DOMAINS.get(channel),
        source_channel=f"{channel}_scan",
    )
    filtered = [c for c in candidates if not _NOISE_RE.search(f"{c.title} {c.snippet or ''}")]
    return filtered[:max_results]
