import { Skeleton, SkeletonCard, SkeletonTable } from '@/components/Skeleton'

export default function DashboardLoading() {
  return (
    <div className="space-y-8">
      <div>
        <Skeleton className="h-6 w-40" />
        <Skeleton className="mt-2 h-4 w-56" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <SkeletonCard className="max-w-md" />
        <SkeletonCard />
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-6 w-44" />
            <Skeleton className="mt-2 h-4 w-64" />
          </div>
          <Skeleton className="h-9 w-64" />
        </div>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[240px_1fr]">
          <SkeletonCard />
          <div className="card p-4">
            <Skeleton className="h-[240px] w-full" />
          </div>
        </div>
        <SkeletonTable rows={5} cols={2} />
      </div>
    </div>
  )
}
