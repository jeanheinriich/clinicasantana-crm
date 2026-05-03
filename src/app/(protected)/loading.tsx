export default function Loading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="space-y-1">
        <div className="h-7 w-40 bg-muted rounded" />
        <div className="h-4 w-64 bg-muted rounded" />
      </div>
      <div className="h-48 bg-muted rounded-lg" />
      <div className="h-32 bg-muted rounded-lg" />
      <div className="h-32 bg-muted rounded-lg" />
    </div>
  )
}
