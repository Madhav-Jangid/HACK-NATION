from fastapi import APIRouter, BackgroundTasks, HTTPException
from postgrest.exceptions import APIError

from app.database import SupabaseNotConfigured
from app.schemas.committee import CommitteeRun
from app.services import create_committee_run, get_committee_run, run_committee

router = APIRouter(prefix="/founders", tags=["committee"])


@router.post("/{founder_id}/committee", response_model=CommitteeRun)
def start_committee(founder_id: str, background_tasks: BackgroundTasks) -> CommitteeRun:
    """Kicks off the Phase 8 investment committee for a founder: four partner
    agents, a Devil's Advocate challenge, then a Managing Partner synthesis —
    run in the background so the response stays fast and the frontend can poll
    `committee_logs` for live progress, same pattern as the research pipeline.
    """
    try:
        run = create_committee_run(founder_id)
    except SupabaseNotConfigured as e:
        raise HTTPException(status_code=503, detail=str(e)) from e
    except APIError as e:
        raise HTTPException(status_code=404, detail="Founder not found.") from e

    background_tasks.add_task(run_committee, run["id"])
    return run


@router.post("/committee/{run_id}/run", response_model=CommitteeRun)
def rerun_committee(run_id: str, background_tasks: BackgroundTasks) -> CommitteeRun:
    """Manually (re-)run an existing committee run — e.g. retrying one that
    failed because OPENAI_API_KEY wasn't configured yet.
    """
    try:
        run = get_committee_run(run_id)
    except SupabaseNotConfigured as e:
        raise HTTPException(status_code=503, detail=str(e)) from e
    except APIError as e:
        raise HTTPException(status_code=404, detail="Committee run not found.") from e

    background_tasks.add_task(run_committee, run_id)
    return run
