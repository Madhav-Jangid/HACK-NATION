import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/layout/app-shell";
import { ThesisForm } from "@/components/thesis/thesis-form";

export default async function ThesisPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirectTo=/thesis");
  }

  return (
    <AppShell userEmail={user.email ?? ""}>
      <p className="text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase">
        Thesis
      </p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">
        Investment thesis
      </h1>
      <p className="mt-2 max-w-lg text-sm text-muted-foreground">
        Every recommendation is filtered and scored through this. Change it any
        time.
      </p>
      <div className="mt-8">
        <ThesisForm />
      </div>
    </AppShell>
  );
}
