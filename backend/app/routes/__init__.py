"""Routes package."""

from app.routes.committee import router as committee_router
from app.routes.founders import router as founders_router
from app.routes.health import router as health_router
from app.routes.nl_search import router as nl_search_router
from app.routes.outreach import router as outreach_router
from app.routes.research import router as research_router

__all__ = [
    "health_router",
    "founders_router",
    "research_router",
    "committee_router",
    "outreach_router",
    "nl_search_router",
]
