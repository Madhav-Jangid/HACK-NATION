import { AppShellSkeleton } from "@/components/layout/app-shell-skeleton";
import { Card, CardContent, CardHeader } from "@/app/components/ui/card";
import { Skeleton } from "@/app/components/ui/skeleton";

export default function FoundersLoading() {
  return (
    <AppShellSkeleton>
      <Skeleton className="h-3 w-20" />
      <Skeleton className="mt-3 h-7 w-48" />
      <Skeleton className="mt-3 h-4 w-96" />

      <div className="mt-8 space-y-8">
        <Card>
          <CardHeader>
            <Skeleton className="h-4 w-40" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-9 w-full" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-4 w-48" />
          </CardHeader>
          <CardContent className="space-y-3">
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-full" />
          </CardContent>
        </Card>
      </div>
    </AppShellSkeleton>
  );
}
