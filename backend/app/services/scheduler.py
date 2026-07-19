"""In-process continuous outbound sourcing scheduler.

The brief requires outbound sourcing to *continuously* scan GitHub, launches,
hackathons, etc. -- not just on a user's click. `POST /founders/discover/run-due`
already implements one sourcing pass and stays available for an external cron
(Railway/GitHub Actions) if this backend is ever split across processes, but by
default this in-process APScheduler runs that same pass on an interval so
"continuous scanning" works with zero extra deployment step -- as long as the
backend process is running, sourcing runs itself.
"""

import logging
import os

from apscheduler.schedulers.background import BackgroundScheduler

from app.services.research_pipeline import run_research_job
from app.services.sourcing_scheduler import run_due_discovery

logger = logging.getLogger(__name__)

_INTERVAL_MINUTES = int(os.getenv("DISCOVERY_INTERVAL_MINUTES", "60"))

_scheduler: BackgroundScheduler | None = None


def _run_discovery_job() -> None:
    try:
        result = run_due_discovery()
    except Exception as e:  # noqa: BLE001
        logger.warning("scheduled sourcing pass failed: %s", e)
        return

    tracked = result.get("founders_tracked", [])
    logger.info(
        "scheduled sourcing pass: %s theses scanned, %s candidates found, %s founders tracked",
        result.get("theses_scanned"),
        result.get("candidates_found"),
        len(tracked),
    )
    for item in tracked:
        try:
            run_research_job(item["research_job"]["id"])
        except Exception as e:  # noqa: BLE001
            logger.warning(
                "research job failed for scheduled-discovery founder %s: %s",
                item["founder"]["id"],
                e,
            )


def start_scheduler() -> BackgroundScheduler | None:
    global _scheduler
    if _INTERVAL_MINUTES <= 0:
        logger.info("DISCOVERY_INTERVAL_MINUTES <= 0 -- in-process sourcing scheduler disabled")
        return None
    if _scheduler is not None:
        return _scheduler
    _scheduler = BackgroundScheduler()
    _scheduler.add_job(_run_discovery_job, "interval", minutes=_INTERVAL_MINUTES)
    _scheduler.start()
    logger.info("in-process outbound sourcing scheduler started (every %s min)", _INTERVAL_MINUTES)
    return _scheduler


def stop_scheduler() -> None:
    global _scheduler
    if _scheduler is not None:
        _scheduler.shutdown(wait=False)
        _scheduler = None


def scheduler_status() -> dict:
    return {"enabled": _scheduler is not None, "interval_minutes": _INTERVAL_MINUTES}
