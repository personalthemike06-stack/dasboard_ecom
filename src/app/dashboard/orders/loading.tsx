import { Skeleton, SkeletonTable } from '@/components/Skeleton'

export default function OrdersLoading() {
  return (
    <div className="space-y-4">
      <div>
        <Skeleton className="h-6 w-32" />
        <Skeleton className="mt-2 h-4 w-24" />
      </div>
      <div className="card flex gap-3 p-4">
        <Skeleton className="h-9 w-40" />
        <Skeleton className="h-9 w-36" />
        <Skeleton className="h-9 w-36" />
      </div>
      <SkeletonTable rows={7} cols={5} />
    </div>
  )
}
