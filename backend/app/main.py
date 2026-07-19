from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes import (
    committee_router,
    founders_router,
    health_router,
    nl_search_router,
    outreach_router,
    research_router,
)

app = FastAPI(title="VC Brain — AI Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://hack-nation-topaz.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health_router)
app.include_router(founders_router)
app.include_router(research_router)
app.include_router(committee_router)
app.include_router(outreach_router)
app.include_router(nl_search_router)


@app.get("/")
def read_root():
    return {"message": "VC Brain AI backend — see /health"}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)
