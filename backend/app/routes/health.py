import httpx
from fastapi import APIRouter

from app.config import settings
from app.services.scheduler import scheduler_status

router = APIRouter()


@router.get("/health")
async def health() -> dict:
    checks = {
        "openai_configured": bool(settings.openai_api_key),
        "tavily_configured": bool(settings.tavily_api_key),
        "supabase_configured": bool(
            settings.supabase_url and settings.supabase_service_role_key
        ),
    }

    supabase_reachable = None
    if checks["supabase_configured"]:
        try:
            async with httpx.AsyncClient(timeout=5) as client:
                resp = await client.get(
                    f"{settings.supabase_url}/rest/v1/",
                    headers={"apikey": settings.supabase_service_role_key},
                )
            supabase_reachable = resp.status_code < 500
        except httpx.HTTPError:
            supabase_reachable = False

    return {
        "status": "ok",
        **checks,
        "supabase_reachable": supabase_reachable,
        "outbound_sourcing_scheduler": scheduler_status(),
    }
