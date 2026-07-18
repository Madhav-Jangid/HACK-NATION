import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { callAiBackend } from "@/lib/ai-backend";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const { channel = "github", max_results = 5 } = await request.json();

  const { data: thesis } = await supabase
    .from("investment_thesis")
    .select("sectors, geography")
    .eq("user_id", user.id)
    .maybeSingle();

  const { ok, status, data } = await callAiBackend("/founders/discover", {
    channel,
    max_results,
    sectors: thesis?.sectors ?? [],
    geography: thesis?.geography ?? [],
  });

  return NextResponse.json(data, { status: ok ? 200 : status });
}
