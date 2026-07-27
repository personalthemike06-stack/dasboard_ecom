import { Skeleton, SkeletonCard, SkeletonTable } from '@/components/Skeleton'

export default function FinanceLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="mt-2 h-4 w-64" />
        </div>
        <Skeleton className="h-9 w-40" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>

      <div className="card p-4">
        <Skeleton className="h-[300px] w-full" />
      </div>

      <SkeletonTable rows={6} cols={4} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[320px_1fr]">
        <SkeletonTable rows={4} cols={1} />
        <SkeletonTable rows={4} cols={4} />
      </div>
    </div>
  )
}
