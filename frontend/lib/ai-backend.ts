const BASE_URL = process.env.AI_BACKEND_URL ?? "http://localhost:8000";

export async function callAiBackend(path: string, body: unknown) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  return { ok: res.ok, status: res.status, data };
}

export async function callAiBackendGet(path: string) {
  const res = await fetch(`${BASE_URL}${path}`, { cache: "no-store" });
  const data = await res.json();
  return { ok: res.ok, status: res.status, data };
}
