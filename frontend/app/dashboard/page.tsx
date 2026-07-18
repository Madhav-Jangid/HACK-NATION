import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SignOutButton } from "@/components/dashboard/sign-out-button";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-6 text-center">
      <p className="text-sm text-muted-foreground">Signed in as</p>
      <h1 className="text-xl font-semibold">{user.email}</h1>
      <p className="max-w-sm text-sm text-muted-foreground">
        This is a placeholder — the full investor dashboard (thesis config,
        discoveries, watchlist) lands in a later phase.
      </p>
      <SignOutButton />
    </div>
  );
}
