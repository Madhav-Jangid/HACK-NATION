import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { callAiBackendGet } from "@/lib/ai-backend";

// Surfaces the in-process outbound-sourcing scheduler's own live status
// (backend/app/services/scheduler.py, exposed on /health) so the dashboard
// can show "this actually runs continuously" as a checkable fact, not just a
// claim -- rather than only exposing the manual "run now" trigger.
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const { ok, status, data } = await callAiBackendGet("/health");
  return NextResponse.json(data, { status: ok ? 200 : status });
}
