export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-md bg-gray-200 ${className}`}
    />
  );
}

export function ProjectCardSkeleton() {
  return (
    <div className="rounded-lg border border-gray-200 p-5">
      <Skeleton className="mb-2 h-5 w-3/4" />
      <div className="space-y-2">
        <div className="flex justify-between">
          <Skeleton className="h-3 w-1/4" />
          <Skeleton className="h-3 w-1/3" />
        </div>
        <div className="flex justify-between">
          <Skeleton className="h-3 w-1/4" />
          <Skeleton className="h-3 w-1/4" />
        </div>
        <div className="flex justify-between">
          <Skeleton className="h-3 w-1/4" />
          <Skeleton className="h-3 w-1/3" />
        </div>
      </div>
    </div>
  );
}

export function ProjectDetailSkeleton() {
  return (
    <div className="space-y-8">
      <div>
        <Skeleton className="mb-1 h-7 w-1/2" />
        <Skeleton className="h-4 w-2/3" />
      </div>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="rounded-lg border border-gray-200 p-6">
          <Skeleton className="mb-4 h-5 w-1/3" />
          <div className="space-y-3">
            <div className="flex justify-between">
              <Skeleton className="h-3 w-1/4" />
              <Skeleton className="h-3 w-1/3" />
            </div>
            <div className="flex justify-between">
              <Skeleton className="h-3 w-1/4" />
              <Skeleton className="h-3 w-1/3" />
            </div>
          </div>
        </div>
        <div className="rounded-lg border border-gray-200 p-6">
          <Skeleton className="mb-4 h-5 w-1/3" />
          <div className="space-y-3">
            <div className="flex justify-between">
              <Skeleton className="h-3 w-1/4" />
              <Skeleton className="h-3 w-1/3" />
            </div>
            <div className="flex justify-between">
              <Skeleton className="h-3 w-1/4" />
              <Skeleton className="h-3 w-1/3" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
