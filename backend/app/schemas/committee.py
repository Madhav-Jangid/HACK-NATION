from pydantic import BaseModel


class CommitteeRun(BaseModel):
    id: str
    founder_id: str
    status: str
    started_at: str | None = None
    completed_at: str | None = None
    error: str | None = None
    created_at: str
