import Image from "next/image";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ArrowRight } from "lucide-react";
import { serverGet } from "@/lib/server";
import type { Season } from "@/lib/types";
import { Link } from "@/i18n/navigation";
import { EpisodeRow } from "@/components/episode-row";
import { EmptyState } from "@/components/empty-state";
import { ViewTracker } from "@/components/view-tracker";

export const dynamic = "force-dynamic";

export default async function SeasonPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();

  let season: Season | undefined;
  try {
    const res = await serverGet<Season>(`/seasons/${slug}`, { locale });
    season = res.data;
  } catch {
    season = undefined;
  }
  if (!season) notFound();

  const tr = season.translations.find((x) => x.locale === locale) ?? season.translations[0];
  const title = tr?.title ?? season.slug;
  const description = tr?.description ?? null;
  const episodes = season.episodes ?? [];

  const episodeIds = episodes.map((e) => e.id).filter(Boolean);
  let ratings: Record<string, { average: number | null; count: number }> = {};
  if (episodeIds.length > 0) {
    try {
      const res = await serverGet<Record<string, { average: number | null; count: number }>>(
        `/ratings/summaries`,
        { contentType: "episode", ids: episodeIds.join(",") },
      );
      ratings = res.data ?? {};
    } catch {
      ratings = {};
    }
  }

  return (
    <>
      <ViewTracker contentType="season" contentId={season.id} />
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-black/70" />
        {season.coverImage && (
          <Image
            src={season.coverImage}
            alt={title}
            fill
            unoptimized
            className="object-cover"
            sizes="100vw"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
        <div className="relative mx-auto flex max-w-7xl flex-col gap-6 px-4 pb-8 pt-20 sm:flex-row sm:items-end sm:px-6">
          <div className="w-full shrink-0 sm:w-72">
            <div className="relative aspect-video overflow-hidden rounded-lg border border-border shadow-lifted">
              {season.coverImage && (
                <Image
                  src={season.coverImage}
                  alt={title}
                  fill
                  unoptimized
                  sizes="288px"
                  className="object-cover"
                />
              )}
            </div>
          </div>
          <div className="flex-1 pb-4">
            <Link
              href="/seasons"
              className="mb-3 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
            >
              <ArrowRight className="size-4 rtl:rotate-180" />
              {t("season.backToSeasons")}
            </Link>
            <h1 className="text-3xl font-bold sm:text-4xl">{title}</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {t("season.episodeCount", { count: episodes.length })}
            </p>
            {description && (
              <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
                {description}
              </p>
            )}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <h2 className="mb-4 text-lg font-bold sm:text-xl">
          {t("season.allEpisodes")}
        </h2>
        {episodes.length === 0 ? (
          <EmptyState message={t("browse.noResults")} />
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {episodes.map((ep, i) => (
              <EpisodeRow
                key={ep.id}
                episode={ep}
                locale={locale}
                index={i}
                rating={ratings[ep.id]}
              />
            ))}
          </div>
        )}
      </section>
    </>
  );
}
