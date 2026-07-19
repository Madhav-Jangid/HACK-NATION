"""Phase 8: Autonomous Investment Committee.

Four specialist partners (Technical/Founder/Market/Risk) each independently assess
the founder from the same collected-signal context, a Devil's Advocate challenges
their conclusions, and a Managing Partner reads everything -- including the
adversarial pass and a portfolio-concentration check -- to produce one final
recommendation. Every agent is instructed to ground claims in the provided signals
and cite sources, and to say "can't be assessed from what's here" rather than
invent facts -- the same evidence-first rule as the rest of this pipeline.
"""

import json

MODEL = "gpt-4o-mini"

_AGENT_SPECS: list[tuple[str, str, str]] = [
    (
        "technical",
        "Technical Partner",
        "Assess engineering capability, code quality signals, and architecture. "
        "A signal with source_type 'github_code_review' is a direct review of the "
        "founder's most-starred (or, if nothing has stars yet, most recently "
        "pushed) public repo -- its language breakdown, README, recent commit "
        "messages, and an actual source-file excerpt. Treat this as your primary "
        "basis for judging how they actually write code (naming, structure, "
        "testing/documentation habits, commit hygiene), not just repo/star counts "
        "or profile bio text. If no such review is present, say so explicitly "
        "rather than guessing at code quality from bio text alone.",
    ),
    (
        "founder",
        "Founder Partner",
        "Assess leadership, execution track record, experience, and founder-market fit "
        "based on the collected signals and Founder Score. The signals were built by "
        "cross-referencing every public profile available: if the founder was sourced "
        "from GitHub, LinkedIn was actively searched for (and vice versa) rather than "
        "relying on whichever one was on file first, and once a company name was "
        "known, dedicated searches ran for what the company actually does "
        "(source_type 'company_overview'), its team/board (category 'team'), and its "
        "registration (category 'registration'). Ground your assessment in these "
        "specific signals -- who the co-founders/board are, what the company does, "
        "their track record -- not just the founder's name and bio. If the founder is "
        "flagged cold-start (no prior track record), say so explicitly rather than "
        "silently penalizing or ignoring it. If cross-referencing genuinely found "
        "nothing on a channel (no LinkedIn/GitHub/team signal present at all), say so "
        "explicitly rather than assuming it wasn't looked for.",
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
    "you rely on. Never invent facts that aren't present in the provided data -- if "
    "something can't be assessed from the given signals, say so explicitly instead "
    "of guessing. Respond with strict JSON only, no prose outside the JSON object."
)

_PARTNER_RESPONSE_FORMAT = (
    'Respond with JSON: {"summary": string, "score": integer 0-100, '
    '"strengths": [{"claim": string, "source_url": string or null}], '
    '"concerns": [{"claim": string, "source_url": string or null}], '
    '"confidence": number between 0 and 1}. Each strength/concern must be one '
    "specific claim paired with the exact source_url (copied verbatim from the "
    "signals list above) that supports it -- this is the exact-data-point "
    "traceability the fund requires, not a vague citations list. Use "
    '"source_url": null only for a genuine inference with no single supporting '
    'signal. "score" is your independent 0-100 rating for this founder on your '
    "specific lens (technical capability, founder quality, market attractiveness, "
    "or risk level respectively) -- not a general vibe score."
)


def _claims_text(claims: list | None) -> str:
    if not claims:
        return "none"
    parts = []
    for c in claims:
        parts.append(c.get("claim", "") if isinstance(c, dict) else str(c))
    return "; ".join(parts)


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
            # The GitHub code-style review (languages/README/commits/a real
            # source-file sample) needs far more room than a generic search
            # snippet, or the Technical Partner never actually sees the code.
            source_type = item.get("source_type")
            if source_type == "github_code_review":
                cap = 2500
            elif source_type == "github_readme":
                cap = 1500
            else:
                cap = 300
            lines.append(f"  snippet: {snippet[:cap]}")
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


_MARKET_OUTLOOK_FORMAT = (
    ' Additionally include "outlook": "bullish" | "neutral" | "bear" -- the '
    "brief requires the Market axis be rated this way, not just a numeric score."
)


def run_partner_agent(client, agent_id: str, role_name: str, instructions: str, context: str) -> dict:
    response_format = _PARTNER_RESPONSE_FORMAT
    if agent_id == "market":
        response_format = _PARTNER_RESPONSE_FORMAT + _MARKET_OUTLOOK_FORMAT
    user_prompt = (
        f"Role: {role_name}\n\nInstructions: {instructions}\n\n{context}\n\n"
        f"{response_format}"
    )
    result = _call_json(client, user_prompt)
    return {"agent": agent_id, **result}


def partner_agent_specs() -> list[tuple[str, str, str]]:
    return _AGENT_SPECS


def run_devils_advocate(client, context: str, prior_outputs: list[dict]) -> dict:
    prior_summary = "\n\n".join(
        f"{o['agent']} partner said: {o['summary']} "
        f"(confidence {o.get('confidence')}, concerns: {_claims_text(o.get('concerns'))})"
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


def run_managing_partner(
    client,
    founder: dict,
    all_outputs: list[dict],
    portfolio_context: str | None = None,
    thesis_context: str | None = None,
) -> dict:
    combined = "\n\n".join(
        f"{o['agent']}: {o['summary']} (confidence {o.get('confidence')}, "
        f"strengths: {o.get('strengths')}, concerns: {o.get('concerns')})"
        for o in all_outputs
    )
    portfolio_section = (
        f"\n\nExisting invested-portfolio context (for concentration risk, not a veto):\n{portfolio_context}\n"
        if portfolio_context
        else "\n\nExisting invested-portfolio context: no invested portfolio companies on file yet.\n"
    )
    thesis_section = (
        f"\n\nInvestor's configured thesis (every recommendation must be filtered and "
        f"scored through this fund-specific lens per the brief):\n{thesis_context}\n"
        if thesis_context
        else "\n\nNo investment thesis configured yet -- proceed on merit alone but note this "
        "explicitly in your reasoning."
    )
    user_prompt = (
        "Role: Managing Partner\n\n"
        f"Founder: {founder.get('name')}\n\n"
        "Read every partner's assessment below, including the Devil's Advocate's "
        "challenge, and produce a final investment recommendation for a $100K check. "
        "Resolve disagreements explicitly rather than averaging them away.\n\n"
        f"{combined}\n"
        f"{thesis_section}\n"
        f"{portfolio_section}\n"
        "Weigh the investor's thesis explicitly: a founder outside the configured sectors, "
        "stage, geography, check-size range, or an excluded industry should not receive a "
        "bare 'invest' regardless of other merit -- reflect that in both thesis_fit and "
        "the recommendation itself.\n\n"
        "If the portfolio context shows meaningful sector or stage concentration, "
        "note it explicitly in your reasoning as a factor -- it should inform but "
        "not automatically override an otherwise strong recommendation.\n\n"
        "Also independently answer the brief's third screening axis -- Idea vs "
        "Market: does the idea, as it stands today, survive scrutiny on its own "
        "merits, or is the team strong enough to pivot to something better? This is "
        "distinct from the Market Partner's market-size/competition assessment -- "
        "it's about whether *this specific idea* is the right bet in that market.\n\n"
        "Finally, assess portfolio_fit: 'concentrated' only if this founder's likely "
        "sector/stage clearly overlaps with multiple invested companies noted above, "
        "'diversifying' if it doesn't meaningfully overlap, or 'no_data' if no "
        "invested-portfolio context was given above. Explain briefly in "
        "portfolio_notes. This is the brief's portfolio-check gate on the final "
        "decision -- a factor to weigh explicitly, not an automatic veto.\n\n"
        'Respond with JSON: {"recommendation": "invest" | "pass" | "more_info_needed", '
        '"thesis_fit": "in_thesis" | "partial_fit" | "outside_thesis", '
        '"reasoning": string, "confidence": number between 0 and 1, '
        '"key_strengths": [{"claim": string, "source_url": string or null}], '
        '"key_risks": [{"claim": string, "source_url": string or null}], '
        '"idea_vs_market_score": integer 0-100, "idea_vs_market_confidence": number '
        'between 0 and 1, "idea_vs_market_reasoning": string, '
        '"portfolio_fit": "diversifying" | "concentrated" | "no_data", '
        '"portfolio_notes": string}'
    )
    result = _call_json(client, user_prompt)
    summary = f"Recommendation: {str(result.get('recommendation', '')).upper()} -- {result.get('reasoning', '')}"
    return {"agent": "managing_partner", "summary": summary, **result}
