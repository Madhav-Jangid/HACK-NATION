from pydantic import BaseModel


class NlSearchRequest(BaseModel):
    query: str


class NlSearchResult(BaseModel):
    founder_id: str
    name: str
    company_name: str | None = None
    relevance: float
    reason: str
