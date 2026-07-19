import logging
from datetime import UTC, datetime

from app.services.committee import (
    build_founder_context,
    partner_agent_specs,
    run_devils_advocate,
    run_managing_partner,
    run_partner_agent,
)
from app.services.committee_repo import (
    get_committee_run,
    get_previous_opportunity_score,
    insert_committee_agent_output,
    insert_committee_log,
    insert_diligence_gap,
    insert_investment_memo,
    insert_opportunity_score,
    list_diligence_gaps,
    update_committee_run,
)
from app.services.diligence import find_diligence_gaps
from app.services.founders_repo import (
    get_active_thesis,
    get_founder,
    get_latest_founder_score,
    list_founder_memory_full,
    list_portfolio_founders,
    update_founder,
)
from app.services.memo import generate_memo
from app.services.screening import screen_founder
from app.tools import get_openai

logger = logging.getLogger(__name__)

_TREND_THRESHOLD = 3


def _confidence_label(value) -> str:
    if value is None:
        return "low"
    if value >= 0.8:
        return "high"
    if value >= 0.5:
        return "medium"
    return "low"


def _compute_trend(new_score: float, previous: dict | None) -> str | None:
    if previous is None:
        return None
    delta = new_score - previous["score"]
    if abs(delta) < _TREND_THRESHOLD:
        return "stable"
    return "improving" if delta > 0 else "declining"


def _thesis_context(thesis: dict | None) -> str | None:
    if not thesis:
        return None
    parts = [
        "sectors=" + str(thesis.get("sectors")),
        "stage=" + str(thesis.get("stage")),
        "geography=" + str(thesis.get("geography")),
        "check_size_min=" + str(thesis.get("check_size_min")),
        "check_size_max=" + str(thesis.get("check_size_max")),
        "ownership_target=" + str(thesis.get("ownership_target")),
        "risk_appetite=" + str(thesis.get("risk_appetite")),
        "excluded_industries=" + str(thesis.get("excluded_industries")),
    ]
    return ", ".join(parts)


def _portfolio_context(user_id: str, founder_id: str) -> str | None:
    """Brief's Investment Decision "portfolio check": concentration signal
    against founders actually invested in (status='invested') by this same
    investor -- not every founder merely sitting in the funnel, and not
    another investor's portfolio.
    """
    portfolio = list_portfolio_founders(user_id, exclude_founder_id=founder_id)
    if not portfolio:
        return None

    sector_counts: dict[str, int] = {}
    stage_counts: dict[str, int] = {}
    for p in portfolio:
        if p.get("sector"):
            sector_counts[p["sector"]] = sector_counts.get(p["sector"], 0) + 1
        if p.get("stage"):
            stage_counts[p["stage"]] = stage_counts.get(p["stage"], 0) + 1

    lines = [f"{len(portfolio)} invested portfolio founder(s) on file."]
    if sector_counts:
        by_sector = ", ".join(
            f"{k}: {v}" for k, v in sorted(sector_counts.items(), key=lambda kv: -kv[1])
        )
        lines.append(f"By sector: {by_sector}.")
    if stage_counts:
        by_stage = ", ".join(
            f"{k}: {v}" for k, v in sorted(stage_counts.items(), key=lambda kv: -kv[1])
        )
        lines.append(f"By stage: {by_stage}.")
    names = ", ".join(
        f"{p['name']} ({p.get('company_name') or 'no company on file'})" for p in portfolio[:10]
    )
    lines.append(f"Companies: {names}.")
    return " ".join(lines)


def _run_diligence_check(
    run_id: str, founder_id: str, memory_items: list[dict], outputs: list[dict]
) -> None:
    gaps = find_diligence_gaps(memory_items, outputs)
    for gap in gaps:
        insert_diligence_gap({**gap, "founder_id": founder_id, "committee_run_id": run_id})
    insert_committee_log(
        run_id, "diligence", f"Diligence check logged {len(gaps)} gap(s) (missing/unverified claims)."
    )


def _record_opportunity_scores(
    run_id: str, founder_id: str, outputs: list[dict], final: dict, persistent_score: dict | None
) -> list[dict]:
    """Phase 9: the brief's 3-axis screening (Founder / Market / Idea vs Market),
    explicitly never averaged into one number. Market also carries an "outlook"
    (bullish/neutral/bear, brief-required) and every axis carries a "trend"
    (improving/declining/stable, brief-required), computed against the prior
    row for that axis if one exists.
    """
    by_agent = {o["agent"]: o for o in outputs}
    founder_output = by_agent.get("founder", {})
    market_output = by_agent.get("market", {})

    founder_partner_score = founder_output.get("score", 50)
    if persistent_score:
        founder_axis_score = round(0.7 * founder_partner_score + 0.3 * persistent_score["score"])
        founder_rationale = [
            f"Founder Partner rated {founder_partner_score}/100: {founder_output.get('summary', '')}",
            f"Blended with persistent Founder Score {persistent_score['score']} "
            f"({persistent_score['confidence']} confidence).",
        ]
    else:
        founder_axis_score = founder_partner_score
        founder_rationale = [
            f"Founder Partner rated {founder_partner_score}/100: {founder_output.get('summary', '')}",
            "No persistent Founder Score on file yet.",
        ]

    market_score = market_output.get("score", 50)
    idea_vs_market_score = final.get("idea_vs_market_score", 50)

    axis_rows = [
        {
            "axis": "founder",
            "score": founder_axis_score,
            "confidence": _confidence_label(founder_output.get("confidence")),
            "rationale": founder_rationale,
            "outlook": None,
        },
        {
            "axis": "market",
            "score": market_score,
            "confidence": _confidence_label(market_output.get("confidence")),
            "rationale": [
                f"Market Partner rated {market_score}/100: {market_output.get('summary', '')}"
            ],
            "outlook": market_output.get("outlook"),
        },
        {
            "axis": "idea_vs_market",
            "score": idea_vs_market_score,
            "confidence": _confidence_label(final.get("idea_vs_market_confidence")),
            "rationale": [
                final.get("idea_vs_market_reasoning")
                or "Managing Partner did not provide separate idea-vs-market reasoning."
            ],
            "outlook": None,
        },
    ]

    inserted = []
    for row in axis_rows:
        previous = get_previous_opportunity_score(founder_id, row["axis"])
        trend = _compute_trend(row["score"], previous)
        inserted.append(
            insert_opportunity_score(
                {**row, "trend": trend, "founder_id": founder_id, "committee_run_id": run_id}
            )
        )
    return inserted


def run_committee(run_id: str) -> None:
    """Runs the full Phase 8 committee for one queued run: a fast rule-based
    pre-screen, then (if it passes) four independent partners, a Devil's
    Advocate challenge, a diligence truth-gap check, then a Managing Partner
    synthesis informed by the investor's thesis and a portfolio-concentration
    check.

    Fire-and-forget: intended to be dispatched via FastAPI BackgroundTasks, so
    every failure path is caught and recorded on the run/log rows rather than
    raised back to a caller that isn't listening.
    """
    run = get_committee_run(run_id)
    founder = get_founder(run["founder_id"])

    update_committee_run(
        run_id, {"status": "running", "started_at": datetime.now(UTC).isoformat()}
    )

    memory_items = list_founder_memory_full(founder["id"])

    rejection_reason = screen_founder(founder, memory_items)
    if rejection_reason:
        insert_committee_log(run_id, "screening", f"Screened out: {rejection_reason}", "warn")
        update_founder(founder["id"], {"status": "rejected"})
        update_committee_run(
            run_id, {"status": "completed", "completed_at": datetime.now(UTC).isoformat()}
        )
        return

    client = get_openai()
    if client is None:
        insert_committee_log(
            run_id, "failed", "OPENAI_API_KEY is not configured on the backend.", "error"
        )
        update_committee_run(run_id, {"status": "failed", "error": "openai_not_configured"})
        return

    score = get_latest_founder_score(founder["id"])
    context = build_founder_context(founder, memory_items, score)

    outputs: list[dict] = []

    try:
        for agent_id, role_name, instructions in partner_agent_specs():
            insert_committee_log(run_id, f"agent_{agent_id}", f"{role_name} reviewing...")
            result = run_partner_agent(client, agent_id, role_name, instructions, context)
            insert_committee_agent_output(run_id, result)
            outputs.append(result)
            insert_committee_log(
                run_id, f"agent_{agent_id}", f"{role_name} done -- {result.get('summary', '')[:200]}"
            )

        insert_committee_log(run_id, "agent_devils_advocate", "Devil's Advocate challenging...")
        devils_advocate = run_devils_advocate(client, context, outputs)
        insert_committee_agent_output(run_id, devils_advocate)
        outputs.append(devils_advocate)
        insert_committee_log(
            run_id,
            "agent_devils_advocate",
            f"Devil's Advocate done -- {devils_advocate.get('summary', '')[:200]}",
        )

        _run_diligence_check(run_id, founder["id"], memory_items, outputs)

        thesis_context = _thesis_context(get_active_thesis(founder["user_id"]))
        try:
            portfolio_context = _portfolio_context(founder["user_id"], founder["id"])
        except Exception as e:  # noqa: BLE001 -- the portfolio check is an enrichment,
            # not required for a recommendation; a missing migration (e.g. the
            # `founders.sector`/`stage` columns from 0011_portfolio.sql not yet
            # applied) shouldn't take down the whole committee run.
            logger.warning("portfolio context lookup failed for founder %s: %s", founder["id"], e)
            insert_committee_log(
                run_id, "portfolio_check", f"Portfolio check skipped (lookup failed: {e}).", "warn"
            )
            portfolio_context = None
        insert_committee_log(run_id, "agent_managing_partner", "Managing Partner synthesizing...")
        final = run_managing_partner(client, founder, outputs, portfolio_context, thesis_context)
        insert_committee_agent_output(run_id, final)
        insert_committee_log(
            run_id,
            "agent_managing_partner",
            f"Final recommendation: {final.get('recommendation', 'unknown')} "
            f"(thesis_fit: {final.get('thesis_fit', 'unknown')})",
        )

        opportunity_rows = _record_opportunity_scores(run_id, founder["id"], outputs, final, score)
        insert_committee_log(
            run_id, "opportunity_scores", "Recorded Founder / Market / Idea-vs-Market scores."
        )

        insert_committee_log(run_id, "memo", "Drafting investment memo...")
        diligence_gaps = list_diligence_gaps(founder["id"])
        memo_content = generate_memo(client, context, outputs, score, opportunity_rows, diligence_gaps)
        insert_investment_memo(
            {"founder_id": founder["id"], "committee_run_id": run_id, "content": memo_content}
        )
        insert_committee_log(run_id, "memo", "Investment memo drafted.")
    except Exception as e:  # noqa: BLE001
        logger.warning("committee run %s failed: %s", run_id, e)
        insert_committee_log(run_id, "failed", f"Committee run failed: {e}", "error")
        update_committee_run(run_id, {"status": "failed", "error": str(e)})
        return

    update_committee_run(
        run_id, {"status": "completed", "completed_at": datetime.now(UTC).isoformat()}
    )
