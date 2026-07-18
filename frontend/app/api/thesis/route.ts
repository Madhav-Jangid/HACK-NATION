import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { InvestmentThesis } from "@/lib/thesis/types";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("investment_thesis")
    .select(
      "sectors, stage, geography, check_size_min, check_size_max, ownership_target, risk_appetite, preferred_founder_type, minimum_traction, excluded_industries",
    )
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ thesis: data });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const body = (await request.json()) as InvestmentThesis;

  const { data, error } = await supabase
    .from("investment_thesis")
    .upsert(
      { ...body, user_id: user.id },
      { onConflict: "user_id" },
    )
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ thesis: data });
}
