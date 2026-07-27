import { Skeleton, SkeletonCard } from '@/components/Skeleton'

export default function ProductsLoading() {
  return (
    <div className="space-y-8">
      <div>
        <Skeleton className="h-6 w-40" />
        <Skeleton className="mt-2 h-4 w-56" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
      <Skeleton className="h-5 w-32" />
      <div className="flex flex-wrap gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-32 w-44 rounded-xl" />
        ))}
      </div>
    </div>
  )
}
