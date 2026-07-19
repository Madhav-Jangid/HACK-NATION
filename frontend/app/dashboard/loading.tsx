import { AppShellSkeleton } from "@/components/layout/app-shell-skeleton";
import { Card, CardContent, CardHeader } from "@/app/components/ui/card";
import { Skeleton } from "@/app/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <AppShellSkeleton>
      <Skeleton className="h-3 w-20" />
      <Skeleton className="mt-3 h-7 w-40" />
      <Skeleton className="mt-3 h-4 w-72" />

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-4 w-32" />
              <Skeleton className="mt-2 h-3 w-24" />
            </CardHeader>
            <CardContent className="space-y-2">
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-3/4" />
            </CardContent>
          </Card>
        ))}
      </div>
    </AppShellSkeleton>
  );
}
