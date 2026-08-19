import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ArrowRight, Clock, Eye } from "lucide-react";
import { serverGet } from "@/lib/server";
import type { Episode } from "@/lib/types";
import { Link } from "@/i18n/navigation";
import { WatchClient } from "@/components/watch-client";
import { ViewTracker } from "@/components/view-tracker";
import { LikeButton } from "@/components/like-button";
import { AddToPlaylist } from "@/components/add-to-playlist";
import { ReportButton } from "@/components/report-button";
import { RatingStars } from "@/components/rating-stars";
import { CommentSection } from "@/components/comment-section";
import { EpisodePosterCard } from "@/components/poster-card";
import { formatDuration, formatViews } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function WatchPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();

  let episode: Episode | undefined;
  try {
    const res = await serverGet<Episode>(`/episodes/${slug}`, { locale });
    episode = res.data;
  } catch {
    episode = undefined;
  }
  if (!episode) notFound();

  const tr = episode.translations.find((x) => x.locale === locale) ?? episode.translations[0];
  const title = tr?.title ?? episode.slug;
  const description = tr?.description ?? null;

  let related: Episode[] = [];
  try {
    if (episode.season?.id) {
      const res = await serverGet<Episode[]>(`/episodes`, {
        locale,
        seasonId: episode.season.id,
        limit: 8,
        platform: "WEB",
      });
      related = (res.data ?? []).filter((e) => e.id !== episode.id);
    }
    if (related.length < 4) {
      const res = await serverGet<Episode[]>("/episodes", {
        locale,
        limit: 8,
        platform: "WEB",
      });
      const seen = new Set(related.map((e) => e.id));
      for (const e of res.data ?? []) {
        if (e.id !== episode.id && !seen.has(e.id)) related.push(e);
        if (related.length >= 8) break;
      }
    }
  } catch {
    related = [];
  }

  const seasonName =
    episode.season?.translations.find((x) => x.locale === locale)?.title ??
    episode.season?.translations[0]?.title;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <Link
        href={episode.season?.slug ? `/season/${episode.season.slug}` : "/browse"}
        className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
      >
        <ArrowRight className="size-4 rtl:rotate-180" />
        {episode.season ? seasonName ?? t("nav.seasons") : t("nav.browse")}
      </Link>

      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="min-w-0">
          <WatchClient episode={episode} />
          <ViewTracker
            contentType="episode"
            contentId={episode.id}
            durationSec={episode.duration ?? undefined}
          />

          <div className="mt-4">
            <h1 className="text-2xl font-bold sm:text-3xl">{title}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              {episode.season && episode.episodeNumber ? (
                <span className="rounded-full border border-border px-2.5 py-0.5 text-xs font-semibold text-foreground">
                  {seasonName ? `${seasonName} • ` : ""}
                  {t("watch.seasonEpisode", {
                    season: 1,
                    episode: episode.episodeNumber,
                  })}
                </span>
              ) : null}
              {episode.duration ? (
                <span className="flex items-center gap-1">
                  <Clock className="size-4" />
                  {formatDuration(episode.duration)}
                </span>
              ) : null}
              <span className="flex items-center gap-1">
                <Eye className="size-4" />
                {formatViews(episode.viewsCount)} {t("watch.views")}
              </span>
            </div>

            <div className="mt-4 flex items-center gap-3">
              <LikeButton
                contentType="episode"
                contentId={episode.id}
                initialCount={episode.likesCount}
              />
              <AddToPlaylist episodeId={episode.id} />
              <ReportButton contentType="episode" contentId={episode.id} />
            </div>

            <div className="mt-4">
              <RatingStars contentType="episode" contentId={episode.id} />
            </div>

            {description && (
              <p className="mt-5 max-w-3xl text-sm leading-relaxed text-muted-foreground sm:text-base">
                {description}
              </p>
            )}
          </div>

          <div className="mt-8">
            <CommentSection
              contentType="episode"
              contentId={episode.id}
              locale={locale}
            />
          </div>
        </div>

        {related.length > 0 && (
          <aside className="min-w-0">
            <h2 className="mb-4 text-lg font-bold">{t("watch.related")}</h2>
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-1">
              {related.slice(0, 6).map((ep) => (
                <EpisodePosterCard
                  key={ep.id}
                  episode={ep}
                  locale={locale}
                />
              ))}
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
