"""Type-of-startup classification: a synthesis step, not a raw search result.

Nothing collected during research states "this is a B2B SaaS company" outright
-- it has to be inferred from the scattered signals (product/problem snippets,
company description, deck facts if present). This is exactly the "enrichment"
half of the brief's Data Architecture pillar, distinct from raw collection.
"""

import json

from app.services.trust_layer import CONFIDENCE_INFERRED

MODEL = "gpt-4o-mini"

_SYSTEM_PROMPT = (
    "You classify a startup's type/category from research signals collected "
    "about it. Only infer from what's actually present -- if there isn't enough "
    "to classify confidently, say so rather than guessing a generic label. "
    "Respond with strict JSON only."
)


def classify_startup(client, founder: dict, memory_items: list[dict]) -> dict | None:
    """Returns {"startup_type": str, "summary": str} or None if there's nothing
    to synthesize from yet (no OpenAI client, or no collected signals at all).
    """
    if client is None or not memory_items:
        return None

    lines = [f"Founder: {founder.get('name')}", f"Company: {founder.get('company_name') or 'Not disclosed'}"]
    for item in memory_items[:25]:
        payload = item.get("payload") or {}
        lines.append(f"- [{item['category']}] {payload.get('title', '')}: {(payload.get('snippet') or '')[:200]}")
    context = "\n".join(lines)

    user_prompt = (
        f"{context}\n\n"
        'Respond with JSON: {"startup_type": string | null, "summary": string}. '
        '"startup_type" is a short category label (e.g. "B2B SaaS", "DevTool", '
        '"Consumer AI", "Marketplace", "Hardware", "Fintech") or null if the '
        "collected signals genuinely aren't enough to classify. \"summary\" is a "
        "one-sentence description of what the company actually does, grounded "
        "only in the signals above."
    )
    response = client.chat.completions.create(
        model=MODEL,
        messages=[
            {"role": "system", "content": _SYSTEM_PROMPT},
            {"role": "user", "content": user_prompt},
        ],
        response_format={"type": "json_object"},
        temperature=0.1,
    )
    parsed = json.loads(response.choices[0].message.content)
    if not parsed.get("startup_type"):
        return None
    return {"startup_type": parsed["startup_type"], "summary": parsed.get("summary", "")}


def build_synthesis_memory_payload(result: dict) -> dict:
    return {
        "category": "company",
        "payload": {
            "title": f"Startup type: {result['startup_type']}",
            "snippet": result.get("summary"),
        },
        "source_url": None,
        "source_type": "synthesis",
        "confidence": CONFIDENCE_INFERRED,
    }
