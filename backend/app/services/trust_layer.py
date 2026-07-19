"""Phase 7: Verification & Trust Layer.

Per the brief: Trust Score is per-claim, not per-company. Every `founder_memory`
row already *is* a claim with its evidence attached at creation time (source_url,
source_type, collected_at) — this module decides how much to trust that evidence,
given how it was obtained, rather than the flat placeholder confidence used before.

Workflow per claim: Evidence Search -> Verification -> Confidence Score -> Trust Layer.
"""

# Primary source: fetched directly from a URL the founder themselves provided (their
# own GitHub/LinkedIn/Twitter/company site) via Tavily's extract(). This is the
# strongest evidence tier available without a human verifier — it's the founder's
# own page, not an inference from a search match.
CONFIDENCE_PRIMARY_SOURCE = 0.85

# Secondary source: found via a relevance-filtered public search (Product Hunt,
# Devpost, news, research papers) that mentions the founder/company by name, but
# isn't a link the founder gave us directly — a real signal, one step removed.
CONFIDENCE_SECONDARY_SOURCE = 0.55

# Below this, a claim is shown as unverified in the UI rather than silently trusted.
VERIFIED_THRESHOLD = 0.8


def verify_direct_source() -> float:
    """Confidence for a claim whose evidence is the founder's own linked profile/site."""
    return CONFIDENCE_PRIMARY_SOURCE


def verify_discovered_source() -> float:
    """Confidence for a claim whose evidence is a relevance-filtered public search hit."""
    return CONFIDENCE_SECONDARY_SOURCE


def is_verified(confidence: float | None) -> bool:
    return confidence is not None and confidence >= VERIFIED_THRESHOLD


# Inferred/synthesized: not fetched from any single source at all -- derived by
# the model reasoning over everything else already collected (e.g. classifying
# "type of startup" from scattered signals). Deliberately below the secondary-
# source tier so it's never mistaken for verified evidence in the UI/memo.
CONFIDENCE_INFERRED = 0.4


def verify_inferred() -> float:
    """Confidence for a claim synthesized from other collected signals, not
    fetched from any single source itself.
    """
    return CONFIDENCE_INFERRED
