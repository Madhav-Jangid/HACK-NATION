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
    insert_committee_agent_output,
    insert_committee_log,
    insert_investment_memo,
    insert_opportunity_score,
    update_committee_run,
)
from app.services.founders_repo import get_founder, get_latest_founder_score, list_founder_memory_full
from app.services.memo import generate_memo
from app.tools import get_openai

logger = logging.getLogger(__name__)


def _confidence_label(value) -> str:
    if value is None:
        return "low"
    if value >= 0.8:
        return "high"
    if value >= 0.5:
        return "medium"
    return "low"


def _record_opportunity_scores(
    run_id: str, founder_id: str, outputs: list[dict], final: dict, persistent_score: dict | None
) -> list[dict]:
    """Phase 9: the brief's 3-axis screening (Founder / Market / Idea vs Market),
    explicitly never averaged into one number — three separate rows, each with
    its own confidence and rationale, derived from the committee's outputs.
    """
    by_agent = {o["agent"]: o for o in outputs}
    founder_output = by_agent.get("founder", {})
    market_output = by_agent.get("market", {})

    founder_partner_score = founder_output.get("score", 50)
    if persistent_score:
        # Founder Score is one input into the Founder axis, not a substitute for
        # it — blended with the committee's own founder-quality read, weighted
        # toward the committee's fresher, opportunity-specific assessment.
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

    axis_rows = [
        {
            "axis": "founder",
            "score": founder_axis_score,
            "confidence": _confidence_label(founder_output.get("confidence")),
            "rationale": founder_rationale,
        },
        {
            "axis": "market",
            "score": market_output.get("score", 50),
            "confidence": _confidence_label(market_output.get("confidence")),
            "rationale": [
                f"Market Partner rated {market_output.get('score', 50)}/100: "
                f"{market_output.get('summary', '')}"
            ],
        },
        {
            "axis": "idea_vs_market",
            "score": final.get("idea_vs_market_score", 50),
            "confidence": _confidence_label(final.get("idea_vs_market_confidence")),
            "rationale": [
                final.get("idea_vs_market_reasoning")
                or "Managing Partner did not provide separate idea-vs-market reasoning."
            ],
        },
    ]

    inserted = []
    for row in axis_rows:
        inserted.append(
            insert_opportunity_score({**row, "founder_id": founder_id, "committee_run_id": run_id})
        )
    return inserted


def run_committee(run_id: str) -> None:
    """Runs the full Phase 8 committee for one queued run: four independent
    partners, a Devil's Advocate challenge, then a Managing Partner synthesis.

    Fire-and-forget: intended to be dispatched via FastAPI BackgroundTasks, so
    every failure path is caught and recorded on the run/log rows rather than
    raised back to a caller that isn't listening.
    """
    run = get_committee_run(run_id)
    founder = get_founder(run["founder_id"])

    update_committee_run(
        run_id, {"status": "running", "started_at": datetime.now(UTC).isoformat()}
    )

    client = get_openai()
    if client is None:
        insert_committee_log(
            run_id, "failed", "OPENAI_API_KEY is not configured on the backend.", "error"
        )
        update_committee_run(run_id, {"status": "failed", "error": "openai_not_configured"})
        return

    memory_items = list_founder_memory_full(founder["id"])
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
                run_id, f"agent_{agent_id}", f"{role_name} done — {result.get('summary', '')[:200]}"
            )

        insert_committee_log(run_id, "agent_devils_advocate", "Devil's Advocate challenging...")
        devils_advocate = run_devils_advocate(client, context, outputs)
        insert_committee_agent_output(run_id, devils_advocate)
        outputs.append(devils_advocate)
        insert_committee_log(
            run_id,
            "agent_devils_advocate",
            f"Devil's Advocate done — {devils_advocate.get('summary', '')[:200]}",
        )

        insert_committee_log(run_id, "agent_managing_partner", "Managing Partner synthesizing...")
        final = run_managing_partner(client, founder, outputs)
        insert_committee_agent_output(run_id, final)
        insert_committee_log(
            run_id,
            "agent_managing_partner",
            f"Final recommendation: {final.get('recommendation', 'unknown')}",
        )

        opportunity_rows = _record_opportunity_scores(run_id, founder["id"], outputs, final, score)
        insert_committee_log(
            run_id, "opportunity_scores", "Recorded Founder / Market / Idea-vs-Market scores."
        )

        insert_committee_log(run_id, "memo", "Drafting investment memo...")
        memo_content = generate_memo(client, context, outputs, score, opportunity_rows)
        insert_investment_memo(
            {"founder_id": founder["id"], "committee_run_id": run_id, "content": memo_content}
        )
        insert_committee_log(run_id, "memo", "Investment memo drafted.")
    except Exception as e:  # noqa: BLE001 — a bad/unparseable model response shouldn't crash silently
        logger.warning("committee run %s failed: %s", run_id, e)
        insert_committee_log(run_id, "failed", f"Committee run failed: {e}", "error")
        update_committee_run(run_id, {"status": "failed", "error": str(e)})
        return

    update_committee_run(
        run_id, {"status": "completed", "completed_at": datetime.now(UTC).isoformat()}
    )
