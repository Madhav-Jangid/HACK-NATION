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
    <div className="flex min-h-screen gap-6 bg-background bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-[#fff8f6] via-[#faf5f3] to-[#fbf8f7] p-6 font-sans">
      <aside className="relative z-10 flex w-[280px] shrink-0 flex-col justify-between rounded-xl border border-white/40 bg-white/40 p-6 shadow-[0_20px_50px_rgba(4,16,49,0.03)] backdrop-blur-2xl transition-all duration-300">
        <div className="absolute -inset-0.5 rounded-xl bg-gradient-to-b from-white/60 to-white/10 opacity-50 pointer-events-none -z-10" />

        <div>
          <div className="flex items-center gap-3 px-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-foreground text-background shadow-[0_8px_16px_rgba(4,16,49,0.2)] transition-transform hover:scale-105">
              <span className="font-elsie text-xl font-black tracking-tighter">B</span>
            </div>
            <Link
              href="/dashboard"
              className="font-elsie text-2xl font-bold tracking-tight text-foreground transition-all hover:opacity-80"
            >
              VC Brain
            </Link>
          </div>
          <div className="mt-12 px-1">
            <NavLinks />
          </div>
        </div>

        <div className="space-y-3 rounded-xl bg-white/60 border border-white/50 p-5 shadow-sm backdrop-blur-md transition-all hover:bg-white/80">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse" />
            <p className="truncate text-xs font-bold text-foreground/80">{userEmail}</p>
          </div>
          <SignOutButton />
        </div>
      </aside>

      <main className="relative z-10 min-w-0 flex-1 rounded-xl border border-white/60 bg-white/70 p-8 md:p-14 shadow-[0_30px_60px_rgba(4,16,49,0.05)] backdrop-blur-xl overflow-y-auto">
        <div className="max-w-6xl mx-auto space-y-8">{children}</div>
      </main>
    </div>
  );
}
