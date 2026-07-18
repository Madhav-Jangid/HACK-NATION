from functools import lru_cache

from tavily import TavilyClient

from app.config import settings


@lru_cache
def get_tavily() -> TavilyClient | None:
    """Shared Tavily client, or None when TAVILY_API_KEY isn't configured yet."""
    if not settings.tavily_api_key:
        return None
    return TavilyClient(api_key=settings.tavily_api_key)
