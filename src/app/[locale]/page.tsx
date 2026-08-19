import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { serverGet } from "@/lib/server";
import type { Article, Episode, Season, Playlist } from "@/lib/types";
import { Hero } from "@/components/hero";
import { Section } from "@/components/section";
import { EpisodePosterCard, SeasonPosterCard, PlaylistPosterCard } from "@/components/poster-card";
import { ArticleCard } from "@/components/article-card";
import { ContinueWatchingRow } from "@/components/continue-watching";
import { PersonalizedRows } from "@/components/personalized-rows";
import { AlertTriangle } from "lucide-react";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "common" });
  return { title: t("appName"), description: t("appTagline") };
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();

  let episodes: Episode[] = [];
  let seasons: Season[] = [];
  let playlists: Playlist[] = [];
  let recommended: Episode[] = [];
  let articles: Article[] = [];
  let error = false;

  try {
    const [epRes, seRes, plRes, recRes, arRes] = await Promise.all([
      serverGet<Episode[]>("/episodes", { locale, limit: 12, platform: "WEB" }),
      serverGet<Season[]>("/seasons", { locale, limit: 10, platform: "WEB" }),
      serverGet<Playlist[]>("/playlists", { locale, limit: 6, platform: "WEB" }),
      serverGet<Episode[]>("/search/recommendations", { locale, limit: 10 }),
      serverGet<Article[]>("/articles", { locale, limit: 4, platform: "WEB" }),
    ]);
    episodes = epRes.data ?? [];
    seasons = seRes.data ?? [];
    playlists = plRes.data ?? [];
    recommended = recRes.data ?? [];
    articles = arRes.data ?? [];
  } catch {
    error = true;
  }

  const episodesLabel = t("common.episodes");

  return (
    <>
      {error ? (
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-6 sm:px-6">
          <AlertTriangle className="size-5 text-amber-500" />
          <p className="text-sm text-muted-foreground">{t("common.error")}</p>
        </div>
      ) : null}

      <Hero
        episodes={episodes}
        locale={locale}
        episodesLabel={episodesLabel}
        watchLabel={t("common.watchNow")}
        moreDetailsLabel={t("common.moreDetails")}
        viewsLabel={t("watch.views")}
      />

      <ContinueWatchingRow locale={locale} />

      <PersonalizedRows locale={locale} />

      {episodes.length > 0 && (
        <Section
          title={t("home.latestEpisodes")}
          viewAllHref="/browse"
          viewAllLabel={t("common.viewAll")}
        >
          {episodes.slice(0, 10).map((ep) => (
            <EpisodePosterCard key={ep.id} episode={ep} locale={locale} />
          ))}
        </Section>
      )}

      {seasons.length > 0 && (
        <Section
          title={t("home.latestSeasons")}
          viewAllHref="/seasons"
          viewAllLabel={t("common.viewAll")}
        >
          {seasons.map((s) => (
            <SeasonPosterCard
              key={s.id}
              season={s}
              locale={locale}
              episodesLabel={episodesLabel}
            />
          ))}
        </Section>
      )}

      {recommended.length > 0 && (
        <Section
          title={t("home.recommended")}
          viewAllHref="/browse"
          viewAllLabel={t("common.viewAll")}
        >
          {recommended.slice(0, 10).map((ep) => (
            <EpisodePosterCard key={ep.id} episode={ep} locale={locale} />
          ))}
        </Section>
      )}

      {playlists.length > 0 && (
        <Section
          title={t("home.playlists")}
          viewAllHref="/playlists"
          viewAllLabel={t("common.viewAll")}
        >
          {playlists.map((p) => (
            <PlaylistPosterCard
              key={p.id}
              playlist={p}
              locale={locale}
              itemsLabel={t("common.episodes")}
            />
          ))}
        </Section>
      )}

      {articles.length > 0 && (
        <Section
          title={t("articles.latestArticles")}
          viewAllHref="/articles"
          viewAllLabel={t("common.viewAll")}
          grid={false}
        >
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {articles.map((a) => (
              <ArticleCard
                key={a.id}
                article={a}
                locale={locale}
                readMoreLabel={t("articles.readMore")}
              />
            ))}
          </div>
        </Section>
      )}
    </>
  );
}
