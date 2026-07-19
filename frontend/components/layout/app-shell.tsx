import Link from "next/link";
import { NavLinks } from "@/components/layout/nav-links";
import { SignOutButton } from "@/components/dashboard/sign-out-button";

export function AppShell({
  userEmail,
  children,
}: {
  userEmail: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen gap-5 bg-background p-5 font-sans">
      <aside className="flex w-64 shrink-0 flex-col justify-between rounded-[2rem] border border-border bg-card/75 p-6 shadow-[0_10px_30px_-10px_rgba(156,90,60,0.05)] backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2 px-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-[0_4px_12px_rgba(156,90,60,0.25)]">
              <span className="font-elsie text-lg font-black tracking-tighter">B</span>
            </div>
            <Link
              href="/dashboard"
              className="font-elsie text-xl font-bold tracking-tight text-foreground transition-all hover:opacity-90"
            >
              VC Brain
            </Link>
          </div>
          <div className="mt-10">
            <NavLinks />
          </div>
        </div>
        <div className="space-y-3 rounded-2xl bg-[#fcf9f7] border border-border/60 p-4 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <p className="truncate text-xs font-semibold text-foreground/80">{userEmail}</p>
          </div>
          <SignOutButton />
        </div>
      </aside>
      <main className="min-w-0 flex-1 rounded-[2.25rem] border border-border bg-card p-8 md:p-12 shadow-[0_15px_40px_-15px_rgba(156,90,60,0.03)] overflow-y-auto">
        <div className="max-w-5xl mx-auto space-y-6">{children}</div>
      </main>
    </div>
  );
}
