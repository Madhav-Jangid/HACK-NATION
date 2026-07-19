from app.database import require_supabase as _client


def create_committee_run(founder_id: str) -> dict:
    response = (
        _client()
        .table("committee_runs")
        .insert({"founder_id": founder_id, "status": "queued"})
        .execute()
    )
    return response.data[0]


def get_committee_run(run_id: str) -> dict:
    response = (
        _client().table("committee_runs").select("*").eq("id", run_id).single().execute()
    )
    return response.data


def update_committee_run(run_id: str, fields: dict) -> dict:
    response = (
        _client().table("committee_runs").update(fields).eq("id", run_id).execute()
    )
    return response.data[0]


def insert_committee_log(run_id: str, step: str, message: str, level: str = "info") -> dict:
    response = (
        _client()
        .table("committee_logs")
        .insert(
            {
                "committee_run_id": run_id,
                "step": step,
                "message": message,
                "level": level,
            }
        )
        .execute()
    )
    return response.data[0]


def insert_committee_agent_output(run_id: str, agent_output: dict) -> dict:
    payload = {
        "committee_run_id": run_id,
        "agent": agent_output["agent"],
        "summary": agent_output["summary"],
        "confidence": agent_output.get("confidence"),
        "output": agent_output,
    }
    response = _client().table("committee_agent_outputs").insert(payload).execute()
    return response.data[0]


def insert_opportunity_score(payload: dict) -> dict:
    response = _client().table("opportunity_scores").insert(payload).execute()
    return response.data[0]


def insert_investment_memo(payload: dict) -> dict:
    response = _client().table("investment_memos").insert(payload).execute()
    return response.data[0]


def insert_diligence_gap(payload: dict) -> dict:
    response = _client().table("diligence_gaps").insert(payload).execute()
    return response.data[0]


def list_diligence_gaps(founder_id: str) -> list[dict]:
    response = (
        _client()
        .table("diligence_gaps")
        .select("*")
        .eq("founder_id", founder_id)
        .order("created_at", desc=True)
        .execute()
    )
    return response.data


def get_previous_opportunity_score(founder_id: str, axis: str) -> dict | None:
    response = (
        _client()
        .table("opportunity_scores")
        .select("*")
        .eq("founder_id", founder_id)
        .eq("axis", axis)
        .order("computed_at", desc=True)
        .limit(1)
        .execute()
    )
    return response.data[0] if response.data else None
