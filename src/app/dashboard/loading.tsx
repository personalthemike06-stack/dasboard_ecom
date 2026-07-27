import { Skeleton, SkeletonCard } from '@/components/Skeleton'

export default function DashboardLoading() {
  return (
    <div className="space-y-8">
      <div>
        <Skeleton className="h-6 w-40" />
        <Skeleton className="mt-2 h-4 w-56" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Skeleton className="h-[220px] w-full rounded-[18px]" />
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
        <div className="card p-6">
          <Skeleton className="h-9 w-40" />
          <Skeleton className="mt-6 h-32 w-full" />
        </div>
      </div>
    </div>
  )
}
