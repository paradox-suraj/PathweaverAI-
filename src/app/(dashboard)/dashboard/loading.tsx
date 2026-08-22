import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Header Skeleton */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <Skeleton className="h-10 w-64 mb-2" />
          <Skeleton className="h-5 w-48" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>

      {/* Stats Grid Skeleton */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-xl border bg-card text-card-foreground shadow p-6 flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-16" />
            </div>
            <Skeleton className="h-8 w-8 rounded-full" />
          </div>
        ))}
      </div>

      {/* Main Content Area Skeleton */}
      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        {/* Timeline Skeleton */}
        <div className="lg:col-span-2 space-y-4">
          <Skeleton className="h-8 w-40 mb-4" />
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-4 items-start">
                <div className="flex flex-col items-center mt-1">
                  <Skeleton className="h-6 w-6 rounded-full" />
                  <Skeleton className="h-16 w-0.5" />
                </div>
                <div className="flex-1 bg-white border rounded-xl p-4 shadow-sm">
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2 mb-4" />
                  <Skeleton className="h-10 w-full rounded-md" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Active Courses Skeleton */}
        <div className="space-y-4">
          <Skeleton className="h-8 w-40 mb-4" />
          {[1, 2].map((i) => (
            <div key={i} className="bg-white border rounded-xl p-5 shadow-sm space-y-3">
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <div className="pt-2">
                <Skeleton className="h-2 w-full rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
