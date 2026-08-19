import { Star } from "lucide-react";

export function RatingBadge({
  average,
  count,
  className = "",
}: {
  average: number | null;
  count: number;
  className?: string;
}) {
  if (!average || count === 0) return null;
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-medium ${className}`}
      title={`${average} · ${count} ratings`}
    >
      <Star className="size-3 fill-amber-400 text-amber-400" />
      {average.toFixed(1)}
      {count > 0 ? <span className="text-muted-foreground">({count})</span> : null}
    </span>
  );
}
