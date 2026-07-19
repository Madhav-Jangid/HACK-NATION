"""Phase 13: AI Outreach.

Drafts a cold-outreach message for a founder who cleared scoring — the full
"Activate" step from Phase 2's outbound sourcing. Deliberately does not send
anything: the schema never collects a founder's email address (only profile
URLs), so there's no address to send to. The investor copies the draft and
sends it through whatever channel they actually have (LinkedIn, GitHub-linked
contact, etc.) — faking a "Send" button with nowhere to send would be dishonest
about what this system can actually do.
"""

import json

MODEL = "gpt-4o-mini"

_SYSTEM_PROMPT = (
    "You draft short, warm, specific cold-outreach messages from a VC to a "
    "founder. Ground every specific claim in the provided signals — cite what "
    "you actually know about them, never invent traction, background, or details "
    "not present in the input. Keep it brief (under 120 words), invite a short "
    "call, and avoid generic VC-speak. Respond with strict JSON only."
)


def generate_outreach_draft(
    client, founder: dict, founder_context: str, thesis: dict
) -> dict:
    thesis_line = (
        f"Investor's thesis: sectors={thesis.get('sectors')}, "
        f"stage={thesis.get('stage')}, geography={thesis.get('geography')}, "
        f"risk_appetite={thesis.get('risk_appetite')}"
    )
    user_prompt = (
        f"Founder: {founder.get('name')}\n\n{founder_context}\n\n{thesis_line}\n\n"
        'Respond with JSON: {"subject": string, "body": string}. The body should '
        "reference one concrete, real thing about this founder from the signals "
        "above, briefly say why they fit the thesis, and invite a short call."
    )
    response = client.chat.completions.create(
        model=MODEL,
        messages=[
            {"role": "system", "content": _SYSTEM_PROMPT},
            {"role": "user", "content": user_prompt},
        ],
        response_format={"type": "json_object"},
        temperature=0.4,
    )
    return json.loads(response.choices[0].message.content)
