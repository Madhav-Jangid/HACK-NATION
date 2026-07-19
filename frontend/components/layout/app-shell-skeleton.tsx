import { AppShell } from "@/components/layout/app-shell";

export function AppShellSkeleton({ children }: { children: React.ReactNode }) {
  return <AppShell userEmail="">{children}</AppShell>;
}
