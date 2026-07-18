import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { callAiBackend } from "@/lib/ai-backend";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const { data: job } = await supabase
    .from("research_jobs")
    .select("id")
    .eq("founder_id", id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!job) {
    return NextResponse.json(
      { error: "No research job found for this founder yet." },
      { status: 404 },
    );
  }

  const { ok, status, data } = await callAiBackend(`/research/jobs/${job.id}/run`, {});
  return NextResponse.json(data, { status: ok ? 200 : status });
}
