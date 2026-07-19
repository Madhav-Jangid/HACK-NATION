from fastapi import APIRouter, BackgroundTasks, HTTPException

from app.schemas.founders import (
    FounderCandidate,
    FounderCreateRequest,
    FounderCreateResponse,
    FounderDiscoverRequest,
    FounderSearchRequest,
)
from app.services import (
    create_founder,
    create_research_job,
    discover_founders,
    run_due_discovery,
    run_research_job,
    search_founders,
)
from app.services.founder_search import TavilyNotConfigured
from app.services.founders_repo import SupabaseNotConfigured

router = APIRouter(prefix="/founders", tags=["founders"])


@router.post("/search", response_model=list[FounderCandidate])
def search(body: FounderSearchRequest) -> list[FounderCandidate]:
    """Inbound: search by founder name, startup, LinkedIn URL, or GitHub URL."""
    try:
        return search_founders(body.query, body.max_results, body.channel)
    except TavilyNotConfigured as e:
        raise HTTPException(status_code=503, detail=str(e)) from e


@router.post("/discover", response_model=list[FounderCandidate])
def discover(body: FounderDiscoverRequest) -> list[FounderCandidate]:
    """Outbound: scan a channel for founders matching the investor's thesis."""
    try:
        return discover_founders(body.channel, body.sectors, body.geography, body.max_results)
    except TavilyNotConfigured as e:
        raise HTTPException(status_code=503, detail=str(e)) from e


@router.post("/discover/run-due")
def discover_run_due(background_tasks: BackgroundTasks) -> dict:
    """Outbound sourcing, cron-triggered: not meant to be clicked from the UI.

    Scans every outbound channel (GitHub, ProductHunt, HackerNews) for every
    configured investment thesis, skips anything already tracked, and queues
    research for new hits — this is what makes sourcing "continuous scanning"
    per the brief instead of a one-shot user-triggered lookup. Point an
    external scheduler (Railway cron / GitHub Actions schedule) at this route
    on an interval, e.g. hourly.
    """
    try:
        result = run_due_discovery()
    except SupabaseNotConfigured as e:
        raise HTTPException(status_code=503, detail=str(e)) from e

    for tracked in result.get("founders_tracked", []):
        background_tasks.add_task(run_research_job, tracked["research_job"]["id"])

    return {
        "theses_scanned": result["theses_scanned"],
        "candidates_found": result["candidates_found"],
        "founders_tracked": len(result.get("founders_tracked", [])),
    }


@router.post("", response_model=FounderCreateResponse)
def track(body: FounderCreateRequest, background_tasks: BackgroundTasks) -> FounderCreateResponse:
    """Add a candidate to the pipeline and queue a research job for it.

    This is the convergence point for inbound and outbound sourcing: both land
    here before Phase 3's research pipeline picks it up — kicked off immediately
    in the background so the response stays fast and the frontend can poll
    `research_logs` for live progress.
    """
    try:
        founder = create_founder(body.model_dump())
        research_job = create_research_job(founder["id"], body.source)
    except SupabaseNotConfigured as e:
        raise HTTPException(status_code=503, detail=str(e)) from e

    background_tasks.add_task(run_research_job, research_job["id"])

    return FounderCreateResponse(founder=founder, research_job=research_job)
