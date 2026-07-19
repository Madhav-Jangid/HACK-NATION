import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { callAiBackend } from "@/lib/ai-backend";

// Manual trigger for the same thesis-driven pass the in-process scheduler
// (backend/app/services/scheduler.py) already runs on an interval --
// backend/app/routes/founders.py's POST /founders/discover/run-due: scans
// every outbound channel (GitHub/ProductHunt/HackerNews) for every configured
// investment thesis, skips anything already tracked, and queues research for
// new hits. Lets an investor demo/force a sourcing pass on demand instead of
// waiting for the next scheduled tick.
export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const { ok, status, data } = await callAiBackend("/founders/discover/run-due", {});
  return NextResponse.json(data, { status: ok ? 200 : status });
}
