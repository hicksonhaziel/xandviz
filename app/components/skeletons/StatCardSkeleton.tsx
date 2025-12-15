export default function StatCardSkeleton() {
  return (
    <div className="p-3 rounded-lg border border-white/10">
      
      <div className="flex items-center justify-between mb-1">
        <div className="skeleton h-3 w-24" />
        <div className="skeleton h-4 w-4 rounded" />
      </div>

      <div className="skeleton h-7 w-20 mb-1" />

      <div className="skeleton h-3 w-28" />
    </div>
  );
}
