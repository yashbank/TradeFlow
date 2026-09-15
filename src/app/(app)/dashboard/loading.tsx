export default function DashboardLoading() {
  return (
    <div className="space-y-6 animate-pulse p-4 sm:p-6">
      {/* Header banner skeleton */}
      <div className="glass-panel-elevated rounded-3xl p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="h-7 w-48 rounded-xl bg-slate-200/80 dark:bg-zinc-700/80" />
            <div className="h-4 w-72 rounded-lg bg-slate-200/60 dark:bg-zinc-700/60" />
          </div>
          <div className="flex items-center gap-2">
            <div className="h-10 w-28 rounded-xl bg-slate-200/80 dark:bg-zinc-700/80" />
            <div className="h-10 w-32 rounded-xl bg-slate-200/80 dark:bg-zinc-700/80" />
          </div>
        </div>
        <div className="flex gap-2 pt-1">
          <div className="h-6 w-24 rounded-full bg-slate-200/70 dark:bg-zinc-700/70" />
          <div className="h-6 w-28 rounded-full bg-slate-200/70 dark:bg-zinc-700/70" />
          <div className="h-6 w-20 rounded-full bg-slate-200/70 dark:bg-zinc-700/70" />
        </div>
      </div>

      {/* KPI metric cards skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="glass-panel rounded-2xl p-5 flex flex-col justify-between h-32"
          >
            <div className="flex justify-between items-center">
              <div className="h-4 w-20 rounded-md bg-slate-200/80 dark:bg-zinc-700/80" />
              <div className="h-8 w-8 rounded-xl bg-slate-200/60 dark:bg-zinc-700/60" />
            </div>
            <div className="space-y-1.5">
              <div className="h-7 w-28 rounded-lg bg-slate-200/90 dark:bg-zinc-700/90" />
              <div className="h-3 w-16 rounded-md bg-slate-200/50 dark:bg-zinc-700/50" />
            </div>
          </div>
        ))}
      </div>

      {/* Chart + Radar row skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 glass-panel rounded-2xl p-6 space-y-4">
          <div className="flex justify-between items-center">
            <div className="h-5 w-44 rounded-md bg-slate-200/80 dark:bg-zinc-700/80" />
            <div className="h-8 w-24 rounded-lg bg-slate-200/60 dark:bg-zinc-700/60" />
          </div>
          <div className="h-52 rounded-xl bg-slate-100/60 dark:bg-zinc-800/40 flex items-end gap-3 p-4">
            {Array.from({ length: 7 }).map((_, j) => (
              <div
                key={j}
                className="flex-1 rounded-t-lg bg-slate-200/70 dark:bg-zinc-700/70"
                style={{ height: `${30 + ((j * 17) % 60)}%` }}
              />
            ))}
          </div>
        </div>
        <div className="glass-panel rounded-2xl p-6 space-y-4">
          <div className="h-5 w-36 rounded-md bg-slate-200/80 dark:bg-zinc-700/80" />
          <div className="h-52 rounded-xl bg-slate-100/60 dark:bg-zinc-800/40 flex items-center justify-center">
            <div className="h-32 w-32 rounded-full border-4 border-dashed border-slate-200/80 dark:border-zinc-700/80" />
          </div>
        </div>
      </div>

      {/* Job pipeline + activity skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {Array.from({ length: 2 }).map((_, i) => (
          <div
            key={i}
            className="glass-panel rounded-2xl p-6 space-y-4"
          >
            <div className="flex justify-between items-center">
              <div className="h-5 w-36 rounded-md bg-slate-200/80 dark:bg-zinc-700/80" />
              <div className="h-4 w-16 rounded-md bg-slate-200/60 dark:bg-zinc-700/60" />
            </div>
            <div className="space-y-3 pt-1">
              {Array.from({ length: 3 }).map((_, k) => (
                <div
                  key={k}
                  className="h-12 rounded-xl bg-slate-100/70 dark:bg-zinc-800/50 flex items-center justify-between px-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-5 w-5 rounded-full bg-slate-200/80 dark:bg-zinc-700/80" />
                    <div className="h-4 w-28 rounded-md bg-slate-200/70 dark:bg-zinc-700/70" />
                  </div>
                  <div className="h-4 w-16 rounded-md bg-slate-200/60 dark:bg-zinc-700/60" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
