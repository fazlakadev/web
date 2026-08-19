import Image from "next/image";
import { Clock, Eye, Film, ListVideo, Play } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { formatDuration, formatViews, cn } from "@/lib/format";
import { episodeTitle, seasonTitle } from "@/lib/server";
import type { Episode, Season, Playlist } from "@/lib/types";

interface BaseCardProps {
  locale: string;
  className?: string;
}

function PlayBadge() {
  return (
    <span className="flex size-11 items-center justify-center rounded-full bg-brand-gradient text-white shadow-glow transition-transform duration-300 group-hover:scale-110">
      <Play className="size-5 translate-x-px" fill="currentColor" />
    </span>
  );
}

export function EpisodePosterCard({
  episode,
  locale,
  className,
  showSeason = true,
  viewsLabel = "views",
}: BaseCardProps & {
  episode: Episode;
  showSeason?: boolean;
  viewsLabel?: string;
}) {
  const title = episodeTitle(episode, locale);
  const seasonName = episode.season
    ? seasonTitle(episode.season, locale)
    : null;

  return (
    <Link href={`/watch/${episode.slug}`} className={cn("group block", className)}>
      <div className="relative overflow-hidden rounded-2xl border border-border glass-card shadow-sm transition-all duration-300 group-hover:border-primary/50 group-hover:shadow-card">
        <div className="aspect-video w-full bg-secondary">
          {episode.coverImage ? (
            <Image
              src={episode.coverImage}
              alt={title}
              width={640}
              height={360}
              className="size-full object-cover transition-transform duration-500 group-hover:scale-110"
              unoptimized
            />
          ) : (
            <div className="flex size-full items-center justify-center bg-brand-gradient opacity-50">
              <Film className="size-8 text-white/70" />
            </div>
          )}
        </div>
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-t from-black/70 via-black/10 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <PlayBadge />
        </div>
        <span className="absolute bottom-2 end-2 inline-flex items-center gap-1 rounded-full bg-black/70 px-2 py-0.5 text-[11px] font-semibold text-white backdrop-blur">
          <Clock className="size-3" />
          {formatDuration(episode.duration)}
        </span>
      </div>
      <div className="mt-2.5 space-y-1 px-0.5">
        <h3 className="truncate text-sm font-bold transition-colors group-hover:text-primary">
          {title}
        </h3>
        <p className="flex items-center gap-2 truncate text-xs text-muted-foreground">
          {showSeason && seasonName ? (
            <span className="truncate">{seasonName}</span>
          ) : null}
          <span className="inline-flex items-center gap-1">
            <Eye className="size-3" />
            {formatViews(episode.viewsCount)} {viewsLabel}
          </span>
        </p>
      </div>
    </Link>
  );
}

export function SeasonPosterCard({
  season,
  locale,
  className,
  episodesLabel = "EP",
}: BaseCardProps & { season: Season; episodesLabel?: string }) {
  const title = seasonTitle(season, locale);
  const count = season._count?.episodes ?? season.episodes?.length ?? 0;

  return (
    <Link href={`/season/${season.slug}`} className={cn("group block", className)}>
      <div className="relative overflow-hidden rounded-2xl border border-border glass-card shadow-sm transition-all duration-300 group-hover:border-primary/50 group-hover:shadow-card">
        <div className="aspect-video w-full bg-secondary">
          {season.coverImage ? (
            <Image
              src={season.coverImage}
              alt={title}
              width={640}
              height={360}
              className="size-full object-cover transition-transform duration-500 group-hover:scale-110"
              unoptimized
            />
          ) : (
            <div className="flex size-full items-center justify-center bg-brand-gradient opacity-50">
              <Film className="size-8 text-white/70" />
            </div>
          )}
        </div>
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-t from-black/70 via-black/10 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <PlayBadge />
        </div>
        <span className="absolute bottom-2 end-2 rounded-full bg-black/70 px-2 py-0.5 text-[11px] font-semibold text-white backdrop-blur">
          {count} {episodesLabel}
        </span>
      </div>
      <div className="mt-2.5 space-y-1 px-0.5">
        <h3 className="truncate text-sm font-bold transition-colors group-hover:text-primary">
          {title}
        </h3>
      </div>
    </Link>
  );
}

export function PlaylistPosterCard({
  playlist,
  locale,
  className,
  itemsLabel = "items",
}: BaseCardProps & { playlist: Playlist; itemsLabel?: string }) {
  const tr =
    playlist.translations.find((x) => x.locale === locale) ??
    playlist.translations[0];
  const title = tr?.title ?? playlist.slug;
  const description = tr?.description ?? null;
  const count = playlist._count?.items ?? playlist.items?.length ?? 0;

  return (
    <Link
      href={`/playlist/${playlist.slug}`}
      className={cn("group block", className)}
    >
      <div className="relative overflow-hidden rounded-2xl border border-border glass-card shadow-sm transition-all duration-300 group-hover:border-primary/50 group-hover:shadow-card">
        <div className="aspect-video w-full bg-secondary">
          {playlist.coverImage ? (
            <Image
              src={playlist.coverImage}
              alt={title}
              width={640}
              height={360}
              className="size-full object-cover transition-transform duration-500 group-hover:scale-110"
              unoptimized
            />
          ) : (
            <div className="flex size-full items-center justify-center bg-brand-gradient opacity-50">
              <ListVideo className="size-8 text-white/70" />
            </div>
          )}
        </div>
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-t from-black/70 via-black/10 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <PlayBadge />
        </div>
        <span className="absolute bottom-2 end-2 rounded-full bg-black/70 px-2 py-0.5 text-[11px] font-semibold text-white backdrop-blur">
          {count} {itemsLabel}
        </span>
      </div>
      <div className="mt-2.5 space-y-1 px-0.5">
        <h3 className="truncate text-sm font-bold transition-colors group-hover:text-primary">
          {title}
        </h3>
        {description ? (
          <p className="line-clamp-1 text-xs text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>
    </Link>
  );
}
