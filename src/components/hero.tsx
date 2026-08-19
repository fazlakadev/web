import Image from "next/image";
import { Clock, Eye, Flame, Info, Play, Sparkles } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { formatDuration, formatViews } from "@/lib/format";
import { episodeTitle, seasonTitle } from "@/lib/server";
import type { Episode } from "@/lib/types";

export function Hero({
  episodes,
  locale,
  episodesLabel,
  watchLabel,
  moreDetailsLabel,
  viewsLabel,
}: {
  episodes: Episode[];
  locale: string;
  episodesLabel: string;
  watchLabel: string;
  moreDetailsLabel: string;
  viewsLabel: string;
}) {
  if (!episodes.length) return null;
  const hero = episodes[0];
  const title = episodeTitle(hero, locale);
  const seasonName = hero.season ? seasonTitle(hero.season, locale) : null;
  const description =
    hero.translations.find((t) => t.locale === locale)?.description ??
    hero.translations[0]?.description;
  const rest = episodes.slice(1, 5);

  return (
    <section className="relative">
      <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6">
        <div className="pointer-events-none absolute inset-x-0 -top-10 h-80 overflow-hidden">
          <div className="orb-a absolute left-1/4 top-0 size-72 rounded-full bg-primary/30 blur-3xl" />
          <div className="orb-b absolute right-1/4 top-4 size-64 rounded-full bg-indigo-500/25 blur-3xl" />
          <div className="absolute left-1/2 top-10 size-56 rounded-full bg-fuchsia-500/20 blur-3xl" />
          <div className="absolute inset-x-10 -top-16 mx-auto h-72 max-w-4xl rounded-b-[100%] bg-brand-gradient opacity-20 blur-3xl" />
        </div>

        <div className="relative rounded-[2.5rem] p-px shadow-lifted">
          <div
            aria-hidden
            className="conic-border absolute inset-0 overflow-hidden rounded-[2.5rem]"
          />
          <div className="relative overflow-hidden rounded-[2.49rem] border border-transparent bg-card">
          <div className="absolute inset-0">
            {hero.coverImage ? (
              <Image
                src={hero.coverImage}
                alt={title}
                fill
                priority
                unoptimized
                className="object-cover"
                sizes="100vw"
              />
            ) : (
              <div className="size-full bg-brand-gradient opacity-30" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-background/10" />
            <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/50 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-background to-transparent" />
          </div>

          <div className="relative flex min-h-[420px] flex-col justify-end p-6 sm:min-h-[480px] sm:p-10">
            <div className="max-w-2xl animate-hero-in">
              <div className="stagger-in mb-4 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs font-bold text-primary backdrop-blur">
                  <Sparkles className="size-3.5" />
                  {episodesLabel}
                </span>
                {hero.viewsCount >= 1000 ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/40 bg-amber-500/10 px-3 py-1 text-xs font-bold text-amber-500 backdrop-blur">
                    <Flame className="size-3.5" />
                    Trending
                  </span>
                ) : null}
                {seasonName && (
                  <span className="rounded-full border border-border bg-background/60 px-3 py-1 text-xs font-semibold text-muted-foreground backdrop-blur">
                    {seasonName}
                    {hero.episodeNumber ? ` • #${hero.episodeNumber}` : ""}
                  </span>
                )}
                {hero.duration ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background/60 px-3 py-1 text-xs font-semibold text-muted-foreground backdrop-blur">
                    <Clock className="size-3.5" />
                    {formatDuration(hero.duration)}
                  </span>
                ) : null}
                <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background/60 px-3 py-1 text-xs font-semibold text-muted-foreground backdrop-blur">
                  <Eye className="size-3.5" />
                  {formatViews(hero.viewsCount)} {viewsLabel}
                </span>
              </div>

              <h1 className="text-3xl font-black leading-tight tracking-tight text-shimmer sm:text-5xl">
                {title}
              </h1>

              {description && (
                <p className="mt-4 line-clamp-3 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
                  {description}
                </p>
              )}

              <div className="mt-7 flex flex-wrap items-center gap-3">
                <Link
                  href={`/watch/${hero.slug}`}
                  className="shine inline-flex items-center gap-2.5 rounded-full bg-brand-gradient px-8 py-3.5 text-sm font-bold text-primary-foreground shadow-glow transition-all duration-200 hover:scale-[1.03] hover:brightness-110 active:scale-[0.98] animate-pulse-ring"
                >
                  <Play className="size-4" fill="currentColor" />
                  {watchLabel}
                </Link>
                <Link
                  href={`/watch/${hero.slug}`}
                  className="inline-flex items-center gap-2 rounded-full border border-border bg-background/50 px-6 py-3.5 text-sm font-semibold text-foreground backdrop-blur transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/50 hover:bg-accent"
                >
                  <Info className="size-4" />
                  {moreDetailsLabel}
                </Link>
              </div>
            </div>
          </div>
        </div>
        </div>

        {rest.length > 0 && (
          <div className="stagger-in mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {rest.map((ep, i) => (
              <Link
                key={ep.id}
                href={`/watch/${ep.slug}`}
                className="group relative overflow-hidden rounded-xl border border-border bg-card card-hover"
              >
                <div className="aspect-video w-full bg-secondary">
                  {ep.coverImage ? (
                    <Image
                      src={ep.coverImage}
                      alt={episodeTitle(ep, locale)}
                      width={320}
                      height={180}
                      unoptimized
                      className="size-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                  ) : (
                    <div className="flex size-full items-center justify-center bg-brand-gradient opacity-40" />
                  )}
                </div>
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/10" />
                <span className="absolute start-2 top-2 flex size-6 items-center justify-center rounded-md bg-brand-gradient text-[11px] font-bold text-white shadow-glow">
                  {i + 2}
                </span>
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                  <span className="flex size-10 scale-50 items-center justify-center rounded-full bg-brand-gradient text-white shadow-glow transition-transform duration-300 group-hover:scale-110">
                    <Play className="size-4" fill="currentColor" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
