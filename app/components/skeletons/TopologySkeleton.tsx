export function TopologySkeleton() {
  return (
    <div className="p-4 rounded-xl border border-white/10 mb-8">
      <div className="flex items-center justify-between mb-4">
        <div className="skeleton h-4 w-40" />
        <div className="skeleton h-4 w-12" />
      </div>

      <div className="skeleton h-[320px] w-full rounded-lg" />
    </div>
  );
}
