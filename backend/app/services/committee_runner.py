import logging
from datetime import UTC, datetime

from app.database import require_supabase
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
    update_committee_run,
)
from app.services.founders_repo import get_founder
from app.tools import get_openai

logger = logging.getLogger(__name__)


def _latest_founder_score(founder_id: str) -> dict | None:
    response = (
        require_supabase()
        .table("founder_scores")
        .select("*")
        .eq("founder_id", founder_id)
        .order("computed_at", desc=True)
        .limit(1)
        .execute()
    )
    return response.data[0] if response.data else None


def _full_founder_memory(founder_id: str) -> list[dict]:
    response = (
        require_supabase()
        .table("founder_memory")
        .select("category, payload, source_url, source_type, confidence")
        .eq("founder_id", founder_id)
        .execute()
    )
    return response.data


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

    memory_items = _full_founder_memory(founder["id"])
    score = _latest_founder_score(founder["id"])
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
    except Exception as e:  # noqa: BLE001 — a bad/unparseable model response shouldn't crash silently
        logger.warning("committee run %s failed: %s", run_id, e)
        insert_committee_log(run_id, "failed", f"Committee run failed: {e}", "error")
        update_committee_run(run_id, {"status": "failed", "error": str(e)})
        return

    update_committee_run(
        run_id, {"status": "completed", "completed_at": datetime.now(UTC).isoformat()}
    )
