import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/layout/app-shell";
import { FounderSourcing } from "@/components/founders/founder-sourcing";
import { NlSearch } from "@/components/founders/nl-search";

export default async function FoundersPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirectTo=/founders");
  }

  return (
    <AppShell userEmail={user.email ?? ""}>
      <p className="text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase">
        Founders
      </p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">
        Source founders
      </h1>
      <p className="mt-2 max-w-lg text-sm text-muted-foreground">
        Search a specific founder, or discover new candidates against your
        thesis. Both feed the same pipeline.
      </p>
      <div className="mt-8 space-y-8">
        <NlSearch />
        <FounderSourcing />
      </div>
    </AppShell>
  );
}
