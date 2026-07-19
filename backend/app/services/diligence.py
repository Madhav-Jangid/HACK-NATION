"""Diligence: truth-gap check.

The brief's flow diagram has a distinct Diligence stage between Screening and
Memo -- verify evidence externally and log gaps as a first-class output that
feeds back into Memory, not just a verify/pass step folded into committee
prose. This module turns two signals that already exist in the pipeline
(per-claim confidence from `trust_layer.py`, and the Risk Partner's explicit
"what's missing" callouts) into a persisted, queryable gap list rather than
leaving them buried inside free-form agent output.
"""

from app.services.trust_layer import VERIFIED_THRESHOLD

_RISK_AGENT = "risk"


def find_diligence_gaps(memory_items: list[dict], committee_outputs: list[dict]) -> list[dict]:
    """Returns gap rows (not yet persisted) for a committee run.

    - `unverified`: a collected claim whose confidence is below the trust
      layer's verified threshold -- shown as an open gap, not silently trusted.
    - `missing`: something the Risk Partner explicitly flagged as absent or
      unclear, promoted from a comment buried in one agent's output into a
      first-class, surfaced artifact.
    """
    gaps: list[dict] = []

    for item in memory_items:
        confidence = item.get("confidence")
        if confidence is None or confidence < VERIFIED_THRESHOLD:
            payload = item.get("payload") or {}
            claim = payload.get("title") or item.get("category") or "Uncategorized signal"
            gaps.append(
                {
                    "claim": claim[:500],
                    "gap_type": "unverified",
                    "note": f"Confidence {confidence} below verified threshold {VERIFIED_THRESHOLD} "
                    f"(source: {item.get('source_url') or 'unknown'}).",
                    "source_agent": "trust_layer",
                }
            )

    risk_output = next((o for o in committee_outputs if o.get("agent") == _RISK_AGENT), None)
    if risk_output:
        for concern in risk_output.get("concerns", []) or []:
            if isinstance(concern, dict):
                claim = concern.get("claim", "")
                source = concern.get("source_url")
            else:
                claim = str(concern)
                source = None
            note = "Flagged by the Risk Partner as missing/unclear information."
            if source:
                note += f" (source: {source})"
            gaps.append(
                {
                    "claim": claim[:500],
                    "gap_type": "missing",
                    "note": note,
                    "source_agent": _RISK_AGENT,
                }
            )

    return gaps
