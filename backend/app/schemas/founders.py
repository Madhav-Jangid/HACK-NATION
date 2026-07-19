from typing import Literal

from pydantic import BaseModel


class FounderCandidate(BaseModel):
    title: str
    url: str
    snippet: str | None = None
    source_channel: str


class FounderSearchRequest(BaseModel):
    query: str
    max_results: int = 5
    channel: Literal["all", "github", "producthunt", "hackernews", "website"] = "all"


class FounderDiscoverRequest(BaseModel):
    channel: Literal["github", "producthunt", "hackernews"] = "github"
    sectors: list[str] = []
    geography: list[str] = []
    max_results: int = 5


class FounderCreateRequest(BaseModel):
    name: str
    company_name: str | None = None
    company_website: str | None = None
    github_url: str | None = None
    linkedin_url: str | None = None
    twitter_url: str | None = None
    source: Literal["inbound", "outbound"]
    source_channel: str | None = None
    deck_storage_path: str | None = None
    deck_text: str | None = None
    # Multi-tenant isolation: the signed-in investor tracking this founder.
    # Set by the Next.js route handler from the session, not user-editable.
    user_id: str


class Founder(BaseModel):
    id: str
    name: str
    company_name: str | None = None
    company_website: str | None = None
    github_url: str | None = None
    linkedin_url: str | None = None
    twitter_url: str | None = None
    source: str
    source_channel: str | None = None
    status: str
    is_cold_start: bool
    user_id: str
    created_at: str
    updated_at: str


class ResearchJob(BaseModel):
    id: str
    founder_id: str
    triggered_by: str
    status: str
    started_at: str | None = None
    completed_at: str | None = None
    error: str | None = None
    created_at: str


class FounderCreateResponse(BaseModel):
    founder: Founder
    research_job: ResearchJob
