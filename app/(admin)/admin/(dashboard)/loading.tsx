export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="h-8 w-48 animate-pulse rounded-xl bg-white/5" />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-28 animate-pulse rounded-3xl bg-white/5" />
        ))}
      </div>
      <div className="h-72 animate-pulse rounded-3xl bg-white/5" />
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="h-64 animate-pulse rounded-3xl bg-white/5" />
        <div className="h-64 animate-pulse rounded-3xl bg-white/5" />
      </div>
    </div>
  );
}
