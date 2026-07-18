"""Phase 8: Autonomous Investment Committee.

Four specialist partners (Technical/Founder/Market/Risk) each independently assess
the founder from the same collected-signal context, a Devil's Advocate challenges
their conclusions, and a Managing Partner reads everything — including the
adversarial pass — to produce one final recommendation. Every agent is instructed
to ground claims in the provided signals and cite sources, and to say "can't be
assessed from what's here" rather than invent facts — the same evidence-first rule
as the rest of this pipeline.
"""

import json

MODEL = "gpt-4o-mini"

_AGENT_SPECS: list[tuple[str, str, str]] = [
    (
        "technical",
        "Technical Partner",
        "Assess engineering capability, code quality signals, and architecture based "
        "on the founder's GitHub/open-source signals. If there's no open-source or "
        "technical evidence collected, say so explicitly rather than guessing.",
    ),
    (
        "founder",
        "Founder Partner",
        "Assess leadership, execution track record, experience, and founder-market fit "
        "based on the collected signals and Founder Score. If the founder is flagged "
        "cold-start (no prior track record), say so explicitly rather than silently "
        "penalizing or ignoring it.",
    ),
    (
        "market",
        "Market Partner",
        "Assess market size, competition, and timing for this founder's stated company "
        "and sector. If company/sector information is thin or absent, say so rather "
        "than inventing a market narrative not grounded in the provided signals.",
    ),
    (
        "risk",
        "Risk Partner",
        "Identify missing information, red flags, and technical/business risks. Be "
        "specific about what evidence is missing, not just what's present.",
    ),
]

_SYSTEM_PROMPT = (
    "You are a venture capital investment-committee partner reviewing a founder for "
    "a $100K check. You are given the founder's structured record and every signal "
    "collected about them (each with a source URL, category, and confidence level). "
    "Ground every claim in the provided signals and cite the source_url of anything "
    "you rely on. Never invent facts that aren't present in the provided data — if "
    "something can't be assessed from the given signals, say so explicitly instead "
    "of guessing. Respond with strict JSON only, no prose outside the JSON object."
)

_PARTNER_RESPONSE_FORMAT = (
    'Respond with JSON: {"summary": string, "strengths": [string], '
    '"concerns": [string], "confidence": number between 0 and 1, '
    '"citations": [source_url, ...]}'
)


def build_founder_context(founder: dict, memory_items: list[dict], score: dict | None) -> str:
    lines = [
        f"Founder: {founder.get('name')}",
        f"Company: {founder.get('company_name') or 'Not disclosed'}",
        f"Source: {founder.get('source')} ({founder.get('source_channel') or 'unknown'})",
        f"Cold-start (no prior track record): {founder.get('is_cold_start')}",
    ]
    if score:
        lines.append(
            f"Founder Score: {score['score']} ({score['confidence']} confidence, "
            f"cold_start_derived={score['is_cold_start_derived']})"
        )
    lines.append("")
    lines.append("Collected signals:")
    if not memory_items:
        lines.append("(none collected yet)")
    for item in memory_items:
        payload = item.get("payload") or {}
        lines.append(
            f"- [{item['category']}] {payload.get('title', '')} "
            f"(source: {item.get('source_url')}, confidence: {item.get('confidence')})"
        )
        snippet = payload.get("snippet")
        if snippet:
            lines.append(f"  snippet: {snippet[:300]}")
    return "\n".join(lines)


def _call_json(client, user_prompt: str) -> dict:
    response = client.chat.completions.create(
        model=MODEL,
        messages=[
            {"role": "system", "content": _SYSTEM_PROMPT},
            {"role": "user", "content": user_prompt},
        ],
        response_format={"type": "json_object"},
        temperature=0.2,
    )
    return json.loads(response.choices[0].message.content)


def run_partner_agent(client, agent_id: str, role_name: str, instructions: str, context: str) -> dict:
    user_prompt = (
        f"Role: {role_name}\n\nInstructions: {instructions}\n\n{context}\n\n"
        f"{_PARTNER_RESPONSE_FORMAT}"
    )
    result = _call_json(client, user_prompt)
    return {"agent": agent_id, **result}


def partner_agent_specs() -> list[tuple[str, str, str]]:
    return _AGENT_SPECS


def run_devils_advocate(client, context: str, prior_outputs: list[dict]) -> dict:
    prior_summary = "\n\n".join(
        f"{o['agent']} partner said: {o['summary']} "
        f"(confidence {o.get('confidence')}, concerns: {o.get('concerns')})"
        for o in prior_outputs
    )
    instructions = (
        "Challenge every positive assumption made by the other partners below. "
        "Actively look for reasons to reject this investment. Be specific, and cite "
        "the same signals if you disagree with another partner's read of them."
    )
    user_prompt = (
        f"Role: Devil's Advocate\n\nInstructions: {instructions}\n\n{context}\n\n"
        f"Other partners' assessments so far:\n{prior_summary}\n\n{_PARTNER_RESPONSE_FORMAT}"
    )
    result = _call_json(client, user_prompt)
    return {"agent": "devils_advocate", **result}


def run_managing_partner(client, founder: dict, all_outputs: list[dict]) -> dict:
    combined = "\n\n".join(
        f"{o['agent']}: {o['summary']} (confidence {o.get('confidence')}, "
        f"strengths: {o.get('strengths')}, concerns: {o.get('concerns')})"
        for o in all_outputs
    )
    user_prompt = (
        "Role: Managing Partner\n\n"
        f"Founder: {founder.get('name')}\n\n"
        "Read every partner's assessment below, including the Devil's Advocate's "
        "challenge, and produce a final investment recommendation for a $100K check. "
        "Resolve disagreements explicitly rather than averaging them away.\n\n"
        f"{combined}\n\n"
        'Respond with JSON: {"recommendation": "invest" | "pass" | "more_info_needed", '
        '"reasoning": string, "confidence": number between 0 and 1, '
        '"key_strengths": [string], "key_risks": [string]}'
    )
    result = _call_json(client, user_prompt)
    summary = f"Recommendation: {str(result.get('recommendation', '')).upper()} — {result.get('reasoning', '')}"
    return {"agent": "managing_partner", "summary": summary, **result}
