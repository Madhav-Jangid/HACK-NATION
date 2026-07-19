from fastapi import APIRouter, HTTPException

from app.database import SupabaseNotConfigured
from app.schemas.nl_search import NlSearchRequest, NlSearchResult
from app.services.founders_repo import list_founder_memory_full, list_founders
from app.services.nl_search import run_nl_search
from app.tools import get_openai

router = APIRouter(prefix="/founders", tags=["nl-search"])


@router.post("/nl-search", response_model=list[NlSearchResult])
def nl_search(body: NlSearchRequest) -> list[NlSearchResult]:
    """Phase 14: resolves a compound natural-language query against founders
    already in the pipeline (not the open web — see founder_search.py for that).
    """
    client = get_openai()
    if client is None:
        raise HTTPException(
            status_code=503, detail="OPENAI_API_KEY is not configured on the backend."
        )

    try:
        founders = list_founders()
    except SupabaseNotConfigured as e:
        raise HTTPException(status_code=503, detail=str(e)) from e

    if not founders:
        return []

    founders_with_memory = [(f, list_founder_memory_full(f["id"])) for f in founders]
    results = run_nl_search(client, body.query, founders_with_memory)

    by_id = {f["id"]: f for f in founders}
    enriched = []
    for r in results:
        founder = by_id.get(r["founder_id"])
        if not founder:
            continue
        enriched.append(
            NlSearchResult(
                founder_id=r["founder_id"],
                name=founder["name"],
                company_name=founder.get("company_name"),
                relevance=r["relevance"],
                reason=r["reason"],
            )
        )
    return enriched
