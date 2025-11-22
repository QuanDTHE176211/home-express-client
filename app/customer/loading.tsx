export default function Loading() {
  return (
    <div className="p-6">
      <div className="animate-pulse space-y-3">
        <div className="h-4 bg-muted rounded w-1/3" />
        <div className="h-24 bg-muted rounded" />
        <div className="h-4 bg-muted rounded w-1/2" />
      </div>
    </div>
  )
}
