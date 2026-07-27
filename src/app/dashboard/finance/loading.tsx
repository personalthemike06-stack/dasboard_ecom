import { Skeleton, SkeletonCard, SkeletonTable } from '@/components/Skeleton'

export default function FinanceLoading() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="mt-2 h-4 w-64" />
        </div>
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-40" />
          <Skeleton className="h-9 w-32 rounded-full" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="card p-6 lg:col-span-2">
          <Skeleton className="h-8 w-8 rounded-full" />
          <Skeleton className="mt-4 h-12 w-48" />
          <Skeleton className="mt-6 h-24 w-full" />
        </div>
        <div className="grid grid-cols-1 gap-4">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>

      <SkeletonTable rows={6} cols={1} />
    </div>
  )
}
