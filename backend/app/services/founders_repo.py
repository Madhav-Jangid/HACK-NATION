from app.database import SupabaseNotConfigured, require_supabase as _client  # noqa: F401 (re-exported)


def create_founder(payload: dict) -> dict:
    response = _client().table("founders").insert(payload).execute()
    return response.data[0]


def get_founder(founder_id: str) -> dict:
    response = _client().table("founders").select("*").eq("id", founder_id).single().execute()
    return response.data


def update_founder(founder_id: str, fields: dict) -> dict:
    response = _client().table("founders").update(fields).eq("id", founder_id).execute()
    return response.data[0]


def create_research_job(founder_id: str, triggered_by: str) -> dict:
    response = (
        _client()
        .table("research_jobs")
        .insert(
            {
                "founder_id": founder_id,
                "triggered_by": triggered_by,
                "status": "queued",
            }
        )
        .execute()
    )
    return response.data[0]


def get_research_job(job_id: str) -> dict:
    response = (
        _client().table("research_jobs").select("*").eq("id", job_id).single().execute()
    )
    return response.data


def update_research_job(job_id: str, fields: dict) -> dict:
    response = (
        _client().table("research_jobs").update(fields).eq("id", job_id).execute()
    )
    return response.data[0]


def insert_research_log(job_id: str, step: str, message: str, level: str = "info") -> dict:
    response = (
        _client()
        .table("research_logs")
        .insert(
            {
                "research_job_id": job_id,
                "step": step,
                "message": message,
                "level": level,
            }
        )
        .execute()
    )
    return response.data[0]


def get_existing_memory_source_urls(founder_id: str) -> set[str]:
    response = (
        _client()
        .table("founder_memory")
        .select("source_url")
        .eq("founder_id", founder_id)
        .execute()
    )
    return {row["source_url"] for row in response.data if row.get("source_url")}


def insert_founder_memory(payload: dict) -> dict:
    response = _client().table("founder_memory").insert(payload).execute()
    return response.data[0]


def list_founder_memory_categories(founder_id: str) -> set[str]:
    response = (
        _client()
        .table("founder_memory")
        .select("category")
        .eq("founder_id", founder_id)
        .execute()
    )
    return {row["category"] for row in response.data}


def list_founder_memory(founder_id: str) -> list[dict]:
    response = (
        _client()
        .table("founder_memory")
        .select("category")
        .eq("founder_id", founder_id)
        .execute()
    )
    return response.data


def list_founder_memory_full(founder_id: str) -> list[dict]:
    response = (
        _client()
        .table("founder_memory")
        .select("category, payload, source_url, source_type, confidence")
        .eq("founder_id", founder_id)
        .execute()
    )
    return response.data


def list_founders() -> list[dict]:
    response = _client().table("founders").select("*").execute()
    return response.data


def get_latest_founder_score(founder_id: str) -> dict | None:
    response = (
        _client()
        .table("founder_scores")
        .select("*")
        .eq("founder_id", founder_id)
        .order("computed_at", desc=True)
        .limit(1)
        .execute()
    )
    return response.data[0] if response.data else None


def insert_founder_score(payload: dict) -> dict:
    response = _client().table("founder_scores").insert(payload).execute()
    return response.data[0]


def list_investment_theses() -> list[dict]:
    response = _client().table("investment_thesis").select("*").execute()
    return response.data


def list_active_founders(exclude_founder_id: str | None = None) -> list[dict]:
    query = _client().table("founders").select("id, name, company_name").eq("status", "active")
    if exclude_founder_id:
        query = query.neq("id", exclude_founder_id)
    response = query.execute()
    return response.data
