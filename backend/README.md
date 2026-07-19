# Backend

FastAPI service for VC Brain. Per the architecture decision in `../CLAUDE.md`
(2026-07-19), this backend is reserved **only for core AI tasks** — it does not own
auth, basic CRUD, or the dashboard. Those live in `frontend/` as Next.js Route
Handlers talking to Supabase directly.

## Scope

- Research pipeline execution (Tavily search + scraping/collection/normalization)
- Multi-agent Investment Committee reasoning (Technical/Founder/Market/Risk/Devil's
  Advocate/Managing Partner)
- Founder Score computation, including the cold-start fallback path
- Evidence/Trust Score verification logic
- Investment memo generation

Triggered by Next.js route handlers when AI processing is needed; reads/writes
results into the same Supabase Postgres (via `supabase-py`) that the frontend uses —
there is no separate Python-owned database.

## Structure

```
app/
  agents/       # individual committee agents (Technical, Founder, Market, Risk, Devil's Advocate, Managing Partner)
  orchestrator/ # runs agents, resolves outputs into a final recommendation
  routes/       # FastAPI endpoints Next.js calls for AI processing
  services/     # research pipeline, scoring, memo generation, Supabase read/write
  prompts/      # agent prompt templates
  memory/       # founder memory construction (dedupe, enrich, timestamp, tag by source)
  schemas/      # Pydantic request/response models
  models/       # (reserved — no local ORM; Supabase is the source of truth)
  database/     # Supabase client setup (supabase-py, service role key)
  tools/        # Tavily search, scraping helpers
  utils/
  config/       # env var loading (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, OPENAI_API_KEY, TAVILY_API_KEY)
  core/
  main.py
tests/
.env
pyproject.toml
uv.lock
```

## Env vars (`.env`)

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY` — service role, since this side writes AI-generated
  results without a user session
- `OPENAI_API_KEY`
- `TAVILY_API_KEY`
