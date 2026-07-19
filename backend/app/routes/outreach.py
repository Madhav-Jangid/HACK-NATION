from fastapi import APIRouter, HTTPException
from postgrest.exceptions import APIError

from app.database import SupabaseNotConfigured
from app.schemas.outreach import OutreachDraft, OutreachRequest
from app.services.committee import build_founder_context
from app.services.founders_repo import get_founder, get_latest_founder_score, list_founder_memory_full
from app.services.outreach import generate_outreach_draft
from app.tools import get_openai

router = APIRouter(prefix="/founders", tags=["outreach"])


@router.post("/{founder_id}/outreach", response_model=OutreachDraft)
def draft_outreach(founder_id: str, body: OutreachRequest) -> OutreachDraft:
    """Phase 13: drafts a cold-outreach message. Returns the draft only — never
    sent automatically, since the schema has no founder email address to send to.
    """
    client = get_openai()
    if client is None:
        raise HTTPException(
            status_code=503, detail="OPENAI_API_KEY is not configured on the backend."
        )

    try:
        founder = get_founder(founder_id)
        memory_items = list_founder_memory_full(founder_id)
        score = get_latest_founder_score(founder_id)
    except SupabaseNotConfigured as e:
        raise HTTPException(status_code=503, detail=str(e)) from e
    except APIError as e:
        raise HTTPException(status_code=404, detail="Founder not found.") from e

    context = build_founder_context(founder, memory_items, score)
    draft = generate_outreach_draft(client, founder, context, body.model_dump())
    return OutreachDraft(**draft)
