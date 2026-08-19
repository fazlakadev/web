import Image from "next/image";
import { Play } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { formatDuration } from "@/lib/format";
import { episodeTitle } from "@/lib/server";
import type { Episode } from "@/lib/types";
import { RatingBadge } from "@/components/rating-badge";

export function EpisodeRow({
  episode,
  locale,
  index,
  active = false,
  rating,
}: {
  episode: Episode;
  locale: string;
  index: number;
  active?: boolean;
  rating?: { average: number | null; count: number };
}) {
  return (
    <Link
      href={`/watch/${episode.slug}`}
      className={`group flex items-center gap-3 rounded-xl border p-2 transition-all duration-200 ${
        active
          ? "border-primary bg-primary/10 shadow-sm"
          : "border-border hover:border-primary/40 hover:bg-accent"
      }`}
    >
      <span className="w-6 shrink-0 text-center text-sm font-bold text-muted-foreground">
        {episode.episodeNumber ?? index + 1}
      </span>
      <div className="relative aspect-video w-24 shrink-0 overflow-hidden rounded-lg bg-secondary shadow-sm sm:w-32">
        {episode.coverImage && (
          <Image
            src={episode.coverImage}
            alt={episodeTitle(episode, locale)}
            fill
            unoptimized
            sizes="128px"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        )}
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
          <span className="flex size-7 items-center justify-center rounded-full bg-brand-gradient text-white">
            <Play className="size-3.5" fill="currentColor" />
          </span>
        </div>
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="truncate text-sm font-semibold group-hover:text-primary">
          {episodeTitle(episode, locale)}
        </h3>
        <p className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
          {episode.duration ? (
            <span>{formatDuration(episode.duration)}</span>
          ) : null}
          {episode.viewsCount ? <span>{episode.viewsCount} views</span> : null}
          {rating ? <RatingBadge {...rating} /> : null}
        </p>
      </div>
    </Link>
  );
}
