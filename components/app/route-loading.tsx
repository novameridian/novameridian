import { Skeleton } from "@/components/ui/skeleton"

/** Skeleton used by route-level loading.tsx files. */
export function RouteLoading({ label = "Loading" }: { label?: string }) {
  return (
    <div aria-busy="true" aria-live="polite">
      <span className="sr-only">{label}</span>
      <Skeleton className="h-9 w-52" />
      <Skeleton className="mt-3 h-4 w-80 max-w-full" />
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24 rounded-2xl" />
        ))}
      </div>
      <Skeleton className="mt-6 h-80 rounded-3xl" />
    </div>
  )
}
