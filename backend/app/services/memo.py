"""Phase 10: Investment Memo Generator.

Synthesizes the founder record, collected evidence, and every committee agent's
output (including the adversarial Devil's Advocate pass and the diligence
truth-gap check) into a single markdown memo. Per the brief (Appendix 1 / FAQ
Q8, authoritative): exactly five sections are required -- Company snapshot,
Investment hypotheses, SWOT, Problem & product, Traction & KPIs. Everything else
is optional and must earn its place with real signal -- padding counts against
the memo. Missing information must be explicitly marked (e.g. "Cap Table: Not
disclosed") rather than fabricated or silently omitted. The final recommendation
is gated on the Managing Partner's synthesis -- which already resolved the
Devil's Advocate's challenge and the investor's thesis fit -- not a re-derived,
unrelated verdict.
"""

MODEL = "gpt-4o-mini"

# Exactly the brief's own required list (FAQ Q8) -- do not add to this. Anything
# else (Team & History, Technology & Defensibility, etc.) is optional and only
# included by the model if the evidence genuinely supports it.
_REQUIRED_SECTIONS = [
    "Company Snapshot",
    "Investment Hypotheses",
    "SWOT",
    "Problem & Product",
    "Traction & KPIs",
]

_OPTIONAL_SECTIONS = [
    "Team & History",
    "Technology & Defensibility",
    "Market Sizing",
    "Competition",
    "Financials & Round Structure",
    "Cap Table",
    "Due Diligence Log",
    "Exit Perspective",
    "Questions",
    "Recommendation",
]

_SYSTEM_PROMPT = (
    "You are the Managing Partner's scribe, writing an investor-ready investment "
    "memo for a $100K check decision. Ground every sentence in the evidence and "
    "committee assessments provided -- never invent facts, figures, or claims not "
    "present in the input. Where information genuinely isn't available (cap table, "
    "financials, revenue, round structure, etc.), write that section's line as "
    '"Not disclosed" rather than omitting it or guessing. Do not pad the memo with '
    "optional sections that don't add real signal. When a claim below carries a "
    "'(source: ...)' annotation, carry that citation inline in parentheses right "
    "after the claim in the memo text -- every claim in the memo should trace to "
    "the exact data point that drove it, per the fund's traceability requirement. "
    "Output clean markdown only, no commentary outside the memo itself."
)


def _format_claims(claims: list | None) -> str:
    if not claims:
        return ""
    parts = []
    for c in claims:
        if isinstance(c, dict):
            claim = c.get("claim", "")
            source = c.get("source_url")
            parts.append(f"{claim} (source: {source})" if source else f"{claim} (source: not cited)")
        else:
            parts.append(str(c))
    return "; ".join(parts)


def _committee_context(outputs: list[dict]) -> str:
    lines = []
    for o in outputs:
        lines.append(f"### {o['agent']}")
        lines.append(f"Summary: {o.get('summary', '')}")
        if o.get("strengths"):
            lines.append(f"Strengths: {_format_claims(o['strengths'])}")
        if o.get("concerns"):
            lines.append(f"Concerns: {_format_claims(o['concerns'])}")
        if o.get("key_strengths"):
            lines.append(f"Key strengths: {_format_claims(o['key_strengths'])}")
        if o.get("key_risks"):
            lines.append(f"Key risks: {_format_claims(o['key_risks'])}")
        if o.get("portfolio_fit"):
            lines.append(f"Portfolio fit: {o['portfolio_fit']} -- {o.get('portfolio_notes', '')}")
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
        line = f"{row['axis']} axis score: {row['score']} ({row['confidence']} confidence)"
        if row.get("outlook"):
            line += f", outlook: {row['outlook']}"
        if row.get("trend"):
            line += f", trend: {row['trend']}"
        lines.append(line)
    return "\n".join(lines)


def _diligence_context(diligence_gaps: list[dict] | None) -> str:
    if not diligence_gaps:
        return "No open diligence gaps logged for this founder."
    lines = ["Diligence gaps logged (feed these directly into Due Diligence Log if included):"]
    for gap in diligence_gaps:
        lines.append(f"- [{gap['gap_type']}] {gap['claim']} -- {gap.get('note', '')}")
    return "\n".join(lines)


def generate_memo(
    client,
    founder_context: str,
    committee_outputs: list[dict],
    founder_score: dict | None,
    opportunity_rows: list[dict],
    diligence_gaps: list[dict] | None = None,
) -> str:
    final = next((o for o in committee_outputs if o["agent"] == "managing_partner"), {})

    user_prompt = (
        f"Founder record and collected evidence:\n{founder_context}\n\n"
        f"Committee assessments (Technical/Founder/Market/Risk partners, Devil's "
        f"Advocate, Managing Partner):\n{_committee_context(committee_outputs)}\n\n"
        f"Scores:\n{_scores_context(founder_score, opportunity_rows)}\n\n"
        f"Diligence:\n{_diligence_context(diligence_gaps)}\n\n"
        "Write the memo in markdown with these required sections, in this order, "
        f"each as a level-2 heading (##): {', '.join(_REQUIRED_SECTIONS)}. Add any of "
        f"these optional sections only if the evidence actually supports them with "
        f"real signal (do not pad): {', '.join(_OPTIONAL_SECTIONS)}. If a Due "
        "Diligence Log section is included, list the diligence gaps above directly "
        "rather than re-deriving new ones. "
        f"The final Recommendation section (if included) must reflect the Managing "
        f"Partner's actual verdict ({final.get('recommendation', 'unknown')}) and "
        "reasoning -- do not re-derive a different one. Start the memo with a "
        "level-1 heading using the founder's and company's name."
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
