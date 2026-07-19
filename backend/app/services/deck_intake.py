"""Inbound deck intake: the backend half of "Apply: deck + company name".

The frontend/Next.js side owns the actual file upload to Supabase Storage
(that's a CRUD/storage concern per this project's architecture, not core AI
reasoning) and passes the extracted or pasted deck text through here. This
project has no PDF-parsing dependency, so accepting already-extracted text is
the realistic hackathon-scoped interpretation of deck ingestion -- not OCR.

Deck-sourced facts are the founder's own direct claims about their company, so
they're stored at the trust layer's primary-source confidence tier, same as a
founder's own linked GitHub/LinkedIn/website content.
"""

import json

from app.services.trust_layer import CONFIDENCE_PRIMARY_SOURCE

MODEL = "gpt-4o-mini"

_SYSTEM_PROMPT = (
    "You extract structured facts from a startup pitch deck's text for a VC's "
    "internal research record. Only extract what's actually stated -- never "
    "infer or invent traction numbers, market size, or claims not present in "
    "the text. Respond with strict JSON only."
)


def extract_deck_signals(client, deck_text: str) -> list[dict]:
    """Returns a list of founder_memory-shaped dicts (category/payload/source_type/
    confidence) extracted from raw deck text -- caller attaches founder_id and
    source_url before inserting.
    """
    if not deck_text or not deck_text.strip():
        return []

    user_prompt = (
        f"Pitch deck text:\n{deck_text[:8000]}\n\n"
        'Respond with JSON: {"facts": [{"category": "company" | "project" | '
        '"funding" | "other", "title": string, "snippet": string}, ...]}. Each '
        "fact should be one concrete, checkable claim (problem statement, product "
        "description, stated traction/revenue, funding history, team size, etc.) "
        "-- not a paraphrase of the whole deck as one item."
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
    facts = parsed.get("facts", [])

    return [
        {
            "category": fact.get("category") if fact.get("category") in
            ("company", "project", "funding", "other") else "other",
            "payload": {"title": fact.get("title", ""), "snippet": fact.get("snippet")},
            "source_type": "deck",
            "confidence": CONFIDENCE_PRIMARY_SOURCE,
        }
        for fact in facts
        if fact.get("title")
    ]
