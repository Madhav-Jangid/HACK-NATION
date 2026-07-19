"""Inbound/outbound screening: fast, cheap, rule-based first-pass filter.

Brief Section 2 item 4: "a fast first-pass filter removes clearly non-viable
ideas before full analysis begins." Deliberately not an LLM call -- the whole
point is to be cheap and fast, run before the 6-LLM-call committee, and only
catch the genuinely empty case (nothing collected, no company info at all) so
real cold-start founders with at least sparse signal are never false-rejected
here; that nuance is Phase 6/7's job (cold_start_scoring.py, trust_layer.py),
not this filter's.
"""


def screen_founder(founder: dict, memory_items: list[dict]) -> str | None:
    """Returns a rejection reason if the founder is clearly non-viable to
    analyze (nothing collected and nothing self-reported), else None.
    """
    if memory_items:
        return None
    if founder.get("company_name") or founder.get("company_website"):
        return None
    return (
        "No collected signals and no company name or website on file -- nothing "
        "for the committee to assess yet."
    )
