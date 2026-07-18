import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/layout/app-shell";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <AppShell userEmail={user.email ?? ""}>
      <p className="text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase">
        Dashboard
      </p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">
        Welcome back
      </h1>
      <p className="mt-2 max-w-lg text-sm text-muted-foreground">
        The full deal-flow view (today&apos;s discoveries, high-conviction
        founders, active research) lands in a later phase. For now, set your
        thesis and start sourcing.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <Link href="/thesis">
          <Card className="h-full transition-colors hover:border-foreground/25">
            <CardHeader>
              <CardTitle>Investment thesis</CardTitle>
              <CardDescription>
                Sectors, stage, geography, check size — every recommendation is
                filtered and scored through this.
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>
        <Link href="/founders">
          <Card className="h-full transition-colors hover:border-foreground/25">
            <CardHeader>
              <CardTitle>Founders</CardTitle>
              <CardDescription>
                Search inbound, discover outbound, and track candidates into
                the research pipeline.
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>
      </div>
    </AppShell>
  );
}
