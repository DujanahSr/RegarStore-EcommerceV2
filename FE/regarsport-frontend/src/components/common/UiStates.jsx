export function ScreenLoader({ label = "Memuat halaman..." }) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-6">
      <div className="text-center">
        <div className="mx-auto h-12 w-12 rounded-full border-4 border-emerald-400/20 border-t-emerald-400 animate-spin" />
        <p className="mt-4 text-sm font-medium text-slate-500">{label}</p>
      </div>
    </div>
  );
}

export function SectionSkeletonGrid({ count = 8 }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="bg-white rounded-xl shadow overflow-hidden animate-pulse"
        >
          <div className="h-56 bg-slate-200" />
          <div className="p-4 space-y-3">
            <div className="h-4 w-3/4 bg-slate-200 rounded" />
            <div className="h-4 w-1/2 bg-slate-200 rounded" />
            <div className="h-10 w-full bg-slate-200 rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function CardSkeletonList({ count = 3 }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="bg-white rounded-xl shadow p-4 animate-pulse"
        >
          <div className="flex gap-4">
            <div className="h-24 w-24 rounded bg-slate-200" />
            <div className="flex-1 space-y-3">
              <div className="h-4 w-2/3 bg-slate-200 rounded" />
              <div className="h-4 w-1/3 bg-slate-200 rounded" />
              <div className="h-4 w-1/4 bg-slate-200 rounded" />
              <div className="h-10 w-32 bg-slate-200 rounded-lg" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
}) {
  return (
    <div className="bg-white rounded-xl shadow p-10 text-center">
      <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
      <p className="text-slate-500 mt-2">{description}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}