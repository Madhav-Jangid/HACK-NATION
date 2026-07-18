from functools import lru_cache

from supabase import Client, create_client

from app.config import settings


class SupabaseNotConfigured(RuntimeError):
    pass


@lru_cache
def get_supabase() -> Client | None:
    """Service-role Supabase client shared with the frontend's Postgres/Storage.

    Returns None when credentials aren't configured yet, so callers (e.g. the
    health check) can report that state instead of crashing at import time.
    """
    if not settings.supabase_url or not settings.supabase_service_role_key:
        return None
    return create_client(settings.supabase_url, settings.supabase_service_role_key)


def require_supabase() -> Client:
    """Same as `get_supabase()`, but raises when unconfigured — for repo modules
    that need a client or a clean error, not a nullable one to check every call.
    """
    client = get_supabase()
    if client is None:
        raise SupabaseNotConfigured(
            "SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are not configured on the backend."
        )
    return client
