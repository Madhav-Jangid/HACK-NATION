"""Phase 14: Natural Language Search.

Resolves a compound natural-language query ("technical founder, Berlin, AI
infra, enterprise traction, no prior VC funding") against the *already-tracked*
founder database in one pass — not a manual filter UI. Per the brief's own
pipeline: Natural Language -> Structured Query -> Search Founder Database ->
Rank Results -> Display. This searches founders VC Brain has already sourced,
not the open web (that's founder_search.py's job).
"""

import json

MODEL = "gpt-4o-mini"

_SYSTEM_PROMPT = (
    "You rank founders in a VC's existing pipeline against a natural-language "
    "query. You are given a compact listing of every founder with what's known "
    "about them. Only include founders that genuinely match — do not include a "
    "founder just to fill out the list, and do not invent facts about a founder "
    "beyond what's given. Respond with strict JSON only."
)


def _founder_summary(founder: dict, memory_items: list[dict]) -> str:
    lines = [
        f"id: {founder['id']}",
        f"name: {founder.get('name')}",
        f"company: {founder.get('company_name') or 'Not disclosed'}",
        f"cold_start: {founder.get('is_cold_start')}",
        f"source: {founder.get('source')}",
    ]
    for item in memory_items[:8]:
        payload = item.get("payload") or {}
        lines.append(f"  - [{item['category']}] {payload.get('title', '')}")
    return "\n".join(lines)


def run_nl_search(client, query: str, founders_with_memory: list[tuple[dict, list[dict]]]) -> list[dict]:
    corpus = "\n\n".join(
        _founder_summary(founder, memory_items) for founder, memory_items in founders_with_memory
    )
    user_prompt = (
        f'Query: "{query}"\n\nFounders in the pipeline:\n{corpus}\n\n'
        'Respond with JSON: {"results": [{"founder_id": string, "relevance": '
        'number between 0 and 1, "reason": string}, ...]}, ordered by relevance '
        "descending. Omit founders that don't match at all."
    )
    response = client.chat.completions.create(
        model=MODEL,
        messages=[
            {"role": "system", "content": _SYSTEM_PROMPT},
            {"role": "user", "content": user_prompt},
        ],
        response_format={"type": "json_object"},
        temperature=0.1,
    )
    parsed = json.loads(response.choices[0].message.content)
    return parsed.get("results", [])
