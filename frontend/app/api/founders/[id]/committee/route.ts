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

  const { ok, status, data } = await callAiBackend(`/founders/${id}/committee`, {});
  return NextResponse.json(data, { status: ok ? 200 : status });
}
