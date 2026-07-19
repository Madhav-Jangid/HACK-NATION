from pydantic import BaseModel


class NlSearchRequest(BaseModel):
    query: str
    # Multi-tenant isolation: scopes the search to this investor's own
    # pipeline, not every founder ever tracked by any investor.
    user_id: str


class NlSearchResult(BaseModel):
    founder_id: str
    name: str
    company_name: str | None = None
    relevance: float
    reason: str
