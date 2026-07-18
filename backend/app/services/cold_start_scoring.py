from datetime import UTC, datetime

# Categories that count as a "public footprint" signal per the brief's Area of
# Research 3 (open source, launches, published research). Deliberately excludes
# 'company'/'other' (news/website hits are often noisy name collisions, not a
# reliable track-record signal) and the not-yet-populated track-record categories
# (experience/education/funding) — those will drive full Phase 6 scoring once the
# pipeline collects them.
_FOOTPRINT_CATEGORIES = {"open_source", "project", "research"}

# Intentionally well below the range a founder with an actual track record could
# reach in Phase 6 — a cold-start score should never look like a confident high
# score.
_BASE_SCORE = 40


def _has_social_links(founder: dict) -> bool:
    return bool(founder.get("linkedin_url") or founder.get("twitter_url"))


def is_cold_start(founder: dict, memory_categories: set[str]) -> bool:
    """True when there's no public footprint signal at all — the brief's
    'no GitHub, no funding, no network' case — not merely a founder who happens
    to be missing one signal.
    """
    has_footprint_memory = bool(memory_categories & _FOOTPRINT_CATEGORIES)
    has_company_site = bool(founder.get("company_website"))
    return not (has_footprint_memory or _has_social_links(founder) or has_company_site)


def compute_cold_start_score(founder: dict, memory_categories: set[str]) -> dict:
    """Fallback score for a founder with zero public-footprint signal.

    Per the brief: this must never be blank, zero, or unscorable — it's an
    explicitly low-confidence neutral floor, not an assessment of quality (there's
    nothing yet to assess). Deliberately doesn't reward the near-empty signal set
    that got the founder flagged cold-start in the first place; if it later picks
    up footprint signals, a fresh (non-cold-start) research run will supersede it.
    """
    rationale = [
        "No GitHub activity, launches, published research, social profile, or "
        "company site found during research.",
        "Score reflects an intentionally neutral pre-track-record floor — not a "
        "quality judgment — pending real signal.",
    ]

    return {
        "score": _BASE_SCORE,
        "confidence": "low",
        "is_cold_start_derived": True,
        "rationale": rationale,
        "computed_at": datetime.now(UTC).isoformat(),
    }
