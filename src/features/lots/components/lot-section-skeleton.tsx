import { Skeleton } from '@/components/ui/skeleton'

export function LotSectionSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-7 w-40" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }, (_, index) => (
          <Skeleton key={index} className="aspect-4/5 w-full rounded-xl" />
        ))}
      </div>
    </div>
  )
}
