import { AppShellSkeleton } from "@/components/layout/app-shell-skeleton";
import { Card, CardContent, CardHeader } from "@/app/components/ui/card";
import { Skeleton } from "@/app/components/ui/skeleton";

export default function FounderDetailLoading() {
  return (
    <AppShellSkeleton>
      <Skeleton className="h-4 w-20" />
      <div className="mt-6 space-y-4">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-56" />
            <Skeleton className="mt-2 h-4 w-40" />
          </CardHeader>
          <CardContent className="space-y-2">
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-2/3" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="space-y-2 pt-6">
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-5/6" />
            <Skeleton className="h-3 w-4/6" />
          </CardContent>
        </Card>
      </div>
    </AppShellSkeleton>
  );
}
