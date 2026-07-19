"""Phase 10: Investment Memo Generator.

Synthesizes the founder record, collected evidence, and every committee agent's
output (including the adversarial Devil's Advocate pass) into a single markdown
memo. Per the brief: required sections are non-negotiable, optional sections are
only included if they add real signal (padding counts against the memo), and
missing information must be explicitly marked (e.g. "Cap Table: Not disclosed")
rather than fabricated or silently omitted. The final recommendation is gated on
the Managing Partner's synthesis — which already resolved the Devil's Advocate's
challenge — not a re-derived, unrelated verdict.
"""

MODEL = "gpt-4o-mini"

_REQUIRED_SECTIONS = [
    "Company Snapshot",
    "Investment Hypothesis",
    "SWOT",
    "Founder Analysis",
    "Problem & Product",
    "Traction & KPIs",
]

_SYSTEM_PROMPT = (
    "You are the Managing Partner's scribe, writing an investor-ready investment "
    "memo for a $100K check decision. Ground every sentence in the evidence and "
    "committee assessments provided — never invent facts, figures, or claims not "
    "present in the input. Where information genuinely isn't available (cap table, "
    "financials, revenue, round structure, etc.), write that section's line as "
    '"Not disclosed" rather than omitting it or guessing. Do not pad the memo with '
    "optional sections that don't add real signal. Output clean markdown only, no "
    "commentary outside the memo itself."
)


def _committee_context(outputs: list[dict]) -> str:
    lines = []
    for o in outputs:
        lines.append(f"### {o['agent']}")
        lines.append(f"Summary: {o.get('summary', '')}")
        if o.get("strengths"):
            lines.append(f"Strengths: {o['strengths']}")
        if o.get("concerns"):
            lines.append(f"Concerns: {o['concerns']}")
        if o.get("confidence") is not None:
            lines.append(f"Confidence: {o['confidence']}")
        lines.append("")
    return "\n".join(lines)


def _scores_context(founder_score: dict | None, opportunity_rows: list[dict]) -> str:
    lines = []
    if founder_score:
        lines.append(
            f"Persistent Founder Score: {founder_score['score']} "
            f"({founder_score['confidence']} confidence, "
            f"cold_start_derived={founder_score['is_cold_start_derived']})"
        )
    for row in opportunity_rows:
        lines.append(f"{row['axis']} axis score: {row['score']} ({row['confidence']} confidence)")
    return "\n".join(lines)


def generate_memo(
    client,
    founder_context: str,
    committee_outputs: list[dict],
    founder_score: dict | None,
    opportunity_rows: list[dict],
) -> str:
    final = next((o for o in committee_outputs if o["agent"] == "managing_partner"), {})

    user_prompt = (
        f"Founder record and collected evidence:\n{founder_context}\n\n"
        f"Committee assessments (Technical/Founder/Market/Risk partners, Devil's "
        f"Advocate, Managing Partner):\n{_committee_context(committee_outputs)}\n\n"
        f"Scores:\n{_scores_context(founder_score, opportunity_rows)}\n\n"
        "Write the memo in markdown with these required sections, in this order, "
        f"each as a level-2 heading (##): {', '.join(_REQUIRED_SECTIONS)}. Add any of "
        "these optional sections only if the evidence actually supports them with "
        "real signal (do not pad): Technology & Defensibility, Market Analysis, "
        "Competition, Financials & Round Structure, Cap Table, Due Diligence Log, "
        "Exit Perspective, Questions, Recommendation. The final Recommendation "
        f"section (if included) must reflect the Managing Partner's actual verdict "
        f"({final.get('recommendation', 'unknown')}) and reasoning — do not re-derive "
        "a different one. Start the memo with a level-1 heading using the founder's "
        "and company's name."
    )

    response = client.chat.completions.create(
        model=MODEL,
        messages=[
            {"role": "system", "content": _SYSTEM_PROMPT},
            {"role": "user", "content": user_prompt},
        ],
        temperature=0.2,
    )
    return response.choices[0].message.content
