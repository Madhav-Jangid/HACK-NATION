from datetime import UTC, datetime

# Only categories we can objectively count from collected signals contribute here.
# Capped per category so a founder with 50 GitHub hits doesn't dwarf everything else.
_CATEGORY_WEIGHTS = {"open_source": 8, "project": 8, "research": 6}
_MAX_PER_CATEGORY = 3

_LINK_FIELDS = ["github_url", "linkedin_url", "twitter_url", "company_website"]
_LINK_WEIGHT = 4

# Neutral floor for a founder with *some* public footprint — higher than the
# cold-start floor (40) since there's real signal here, but this is still a proxy
# score off raw web content, not a verified assessment.
_BASE_SCORE = 50
_MAX_SCORE = 95

# Per the brief's own rule ("missing data must be explicitly flagged, never silently
# omitted"): these are Founder Score factors this heuristic genuinely cannot measure
# from unstructured web snippets alone — they need Phase 7's claim verification
# and/or real longitudinal history, so they're named as gaps rather than guessed at.
_UNMEASURED_FACTORS = [
    "Leadership",
    "Execution quality",
    "Consistency over time",
    "Technical ability (depth, not just presence)",
    "Innovation",
    "Community impact",
]


def compute_track_record_score(founder: dict, memory_items: list[dict]) -> dict:
    """Founder Score for a founder with *some* public footprint (not cold-start).

    Deliberately conservative and proxy-based: only scores what's objectively
    countable (open-source activity, launches, research, linked profiles found
    during research). Never claims to measure factors that need real claim
    verification or longitudinal tracking — those are listed in the rationale as
    not-yet-measured instead of being guessed at.
    """
    category_counts: dict[str, int] = {}
    for item in memory_items:
        category_counts[item["category"]] = category_counts.get(item["category"], 0) + 1

    score = _BASE_SCORE
    rationale = []

    for category, weight in _CATEGORY_WEIGHTS.items():
        count = min(category_counts.get(category, 0), _MAX_PER_CATEGORY)
        if count:
            gained = count * weight
            score += gained
            label = category.replace("_", " ").title()
            rationale.append(f"{label}: {count} signal(s) found (+{gained}).")

    linked = [field for field in _LINK_FIELDS if founder.get(field)]
    if linked:
        gained = len(linked) * _LINK_WEIGHT
        score += gained
        rationale.append(f"{len(linked)} linked profile(s)/site on file (+{gained}).")

    score = min(score, _MAX_SCORE)

    rationale.append(
        "Not yet measured from collected signals (needs claim verification or "
        "longitudinal history): " + ", ".join(_UNMEASURED_FACTORS) + "."
    )

    return {
        "score": score,
        "confidence": "medium",
        "is_cold_start_derived": False,
        "rationale": rationale,
        "computed_at": datetime.now(UTC).isoformat(),
    }
