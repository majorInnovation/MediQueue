export function LoadingSkeleton() {
  return (
    <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      {Array.from({ length: 5 }).map((_, index) => (
        <div key={index} className="flex items-center gap-3">
          <div className="h-10 w-10 animate-pulse rounded-full bg-slate-200" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-3/4 animate-pulse rounded bg-slate-200" />
            <div className="h-3 w-1/2 animate-pulse rounded bg-slate-100" />
          </div>
        </div>
      ))}
    </div>
  )
}
