import { Skeleton, SkeletonTable } from '@/components/Skeleton'

export default function ProductsLoading() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-6 w-40" />
        <Skeleton className="mt-2 h-4 w-56" />
      </div>
      <SkeletonTable rows={5} cols={6} />
      <Skeleton className="h-5 w-32" />
      <SkeletonTable rows={3} cols={5} />
    </div>
  )
}
