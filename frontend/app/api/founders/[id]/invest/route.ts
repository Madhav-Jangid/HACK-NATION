import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Basic CRUD (mark a founder as invested), not AI reasoning -- per the
// project's architecture split, this lives in Next.js talking to Supabase
// directly, not the Python backend. Backs the brief's Investment Decision
// "portfolio check": the Managing Partner reads status='invested' founders'
// sector/stage to flag concentration risk on future recommendations.
export async function PATCH(
  request: Request,
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

  const { sector, stage, geography, check_amount } = await request.json();

  const { data, error } = await supabase
    .from("founders")
    .update({
      status: "invested",
      sector: sector || null,
      stage: stage || null,
      geography: geography || null,
      check_amount: check_amount ?? null,
      invested_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ founder: data });
}
