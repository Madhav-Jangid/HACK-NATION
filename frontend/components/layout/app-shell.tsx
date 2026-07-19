import Link from "next/link";
import { NavLinks } from "@/components/layout/nav-links";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { SignOutButton } from "@/components/dashboard/sign-out-button";

export function AppShell({
  userEmail,
  children,
}: {
  userEmail: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-background">
      <aside className="flex w-56 shrink-0 flex-col justify-between border-r border-border px-4 py-6">
        <div>
          <Link href="/dashboard" className="text-sm font-semibold tracking-tight">
            VC Brain
          </Link>
          <div className="mt-8">
            <NavLinks />
          </div>
        </div>
        <div className="space-y-3 border-t border-border pt-4">
          <p className="truncate text-xs text-muted-foreground">{userEmail}</p>
          <ThemeToggle />
          <SignOutButton />
        </div>
      </aside>
      <main className="min-w-0 flex-1">
        <div className="mx-auto max-w-4xl px-8 py-10">{children}</div>
      </main>
    </div>
  );
}
