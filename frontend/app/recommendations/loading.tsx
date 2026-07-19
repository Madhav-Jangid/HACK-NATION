import { AppShellSkeleton } from "@/components/layout/app-shell-skeleton";
import { Card, CardContent, CardHeader } from "@/app/components/ui/card";
import { Skeleton } from "@/app/components/ui/skeleton";

export default function RecommendationsLoading() {
  return (
    <AppShellSkeleton>
      <Skeleton className="h-3 w-28" />
      <Skeleton className="mt-3 h-7 w-40" />
      <Skeleton className="mt-3 h-4 w-96" />

      <div className="mt-8 space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-4 w-40" />
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
