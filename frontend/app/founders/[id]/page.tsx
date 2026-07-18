import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/layout/app-shell";
import { FounderProfile } from "@/components/founders/founder-profile";

export default async function FounderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?redirectTo=/founders/${id}`);
  }

  const { data: founder } = await supabase
    .from("founders")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!founder) {
    notFound();
  }

  const { data: memory } = await supabase
    .from("founder_memory")
    .select("*")
    .eq("founder_id", id)
    .order("collected_at", { ascending: false });

  const { data: scores } = await supabase
    .from("founder_scores")
    .select("*")
    .eq("founder_id", id)
    .order("computed_at", { ascending: false })
    .limit(10);

  return (
    <AppShell userEmail={user.email ?? ""}>
      <Link
        href="/founders"
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        ← Founders
      </Link>
      <div className="mt-6">
        <FounderProfile founder={founder} memory={memory ?? []} scores={scores ?? []} />
      </div>
    </AppShell>
  );
}
