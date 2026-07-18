from functools import lru_cache

from openai import OpenAI

from app.config import settings


@lru_cache
def get_openai() -> OpenAI | None:
    """Shared OpenAI client, or None when OPENAI_API_KEY isn't configured yet."""
    if not settings.openai_api_key:
        return None
    return OpenAI(api_key=settings.openai_api_key)
