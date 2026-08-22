import { Skeleton } from "@/components/ui/skeleton";

export default function CourseLoading() {
  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Header Skeleton */}
      <div>
        <Skeleton className="h-4 w-32 mb-4" />
        <Skeleton className="h-10 w-3/4 mb-2" />
        <Skeleton className="h-6 w-full" />
      </div>

      {/* Progress Card Skeleton */}
      <div className="bg-white rounded-xl border p-6 flex flex-col md:flex-row justify-between gap-6">
        <div className="flex-1 space-y-4">
          <div className="flex justify-between">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-5 w-12" />
          </div>
          <Skeleton className="h-2 w-full" />
          <div className="flex justify-between">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-6 w-24 rounded-full" />
          </div>
        </div>
        <div className="flex gap-3">
          <Skeleton className="h-12 w-32" />
          <Skeleton className="h-12 w-40" />
        </div>
      </div>

      {/* Curriculum Accordion Skeleton */}
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="border rounded-lg bg-white overflow-hidden">
            <div className="p-4 flex items-center justify-between">
              <div className="flex flex-col gap-2 w-full max-w-sm">
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-4 w-48" />
              </div>
              <Skeleton className="h-6 w-6 rounded-full" />
            </div>
            {/* Expanded items representation */}
            {i === 1 && (
              <div className="border-t p-4 space-y-3 bg-slate-50">
                {[1, 2].map((j) => (
                  <div key={j} className="flex justify-between items-center bg-white p-3 rounded-lg border">
                    <div className="flex items-center gap-3 w-full">
                      <Skeleton className="h-6 w-6 rounded-full" />
                      <Skeleton className="h-5 w-2/3" />
                    </div>
                    <Skeleton className="h-5 w-16" />
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
