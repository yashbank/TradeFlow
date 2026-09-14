export default function DashboardLoading() {
  return (
    <div className="space-y-6 animate-pulse p-4 sm:p-6">
      {/* Header banner skeleton */}
      <div className="h-28 rounded-3xl bg-white/60 dark:bg-zinc-800/60 border border-slate-200/60 dark:border-zinc-700/60 shadow-md" />

      {/* KPI metric cards skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-28 rounded-2xl bg-white/60 dark:bg-zinc-800/60 border border-slate-200/60 dark:border-zinc-700/60"
          />
        ))}
      </div>

      {/* Chart + Radar row skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 h-56 rounded-2xl bg-white/60 dark:bg-zinc-800/60 border border-slate-200/60 dark:border-zinc-700/60" />
        <div className="h-56 rounded-2xl bg-white/60 dark:bg-zinc-800/60 border border-slate-200/60 dark:border-zinc-700/60" />
      </div>

      {/* Job pipeline + activity skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {Array.from({ length: 2 }).map((_, i) => (
          <div
            key={i}
            className="h-48 rounded-2xl bg-white/60 dark:bg-zinc-800/60 border border-slate-200/60 dark:border-zinc-700/60"
          />
        ))}
      </div>
    </div>
  );
}
