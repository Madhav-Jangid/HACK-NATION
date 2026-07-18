from fastapi import APIRouter, BackgroundTasks, HTTPException
from postgrest.exceptions import APIError

from app.schemas.founders import ResearchJob
from app.services import get_research_job, run_research_job
from app.services.founders_repo import SupabaseNotConfigured

router = APIRouter(prefix="/research", tags=["research"])


@router.post("/jobs/{job_id}/run", response_model=ResearchJob)
def run(job_id: str, background_tasks: BackgroundTasks) -> ResearchJob:
    """Manually (re-)run a research job — e.g. retrying one that failed because
    Tavily wasn't configured yet, or re-scanning an outbound candidate that
    wasn't tracked via the auto-triggered `/founders` path.
    """
    try:
        job = get_research_job(job_id)
    except SupabaseNotConfigured as e:
        raise HTTPException(status_code=503, detail=str(e)) from e
    except APIError as e:
        raise HTTPException(status_code=404, detail="Research job not found.") from e

    background_tasks.add_task(run_research_job, job_id)
    return job
