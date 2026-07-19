from pydantic import BaseModel


class OutreachRequest(BaseModel):
    sectors: list[str] = []
    stage: list[str] = []
    geography: list[str] = []
    risk_appetite: str | None = None


class OutreachDraft(BaseModel):
    subject: str
    body: str
