import Image from "next/image";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Clapperboard, FileText, Play, Search, Video } from "lucide-react";
import { serverGet } from "@/lib/server";
import { Link } from "@/i18n/navigation";
import { Section } from "@/components/section";
import { EmptyState } from "@/components/empty-state";
import { SearchFilters } from "@/components/search-filters";
import type { SearchResult } from "@/lib/types";

export const dynamic = "force-dynamic";

type Sort = "latest" | "popular";
type TypeFilter = "episode" | "article" | "season" | "playlist";

const TYPE_LABEL: Record<SearchResult["type"], "episodes" | "season" | "articles" | "playlists"> = {
  episode: "episodes",
  season: "season",
  article: "articles",
  playlist: "playlists",
};

export default async function SearchPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    q?: string;
    type?: string;
    category?: string;
    platform?: string;
    sort?: string;
  }>;
}) {
  const { locale } = await params;
  const sp = await searchParams;
  setRequestLocale(locale);
  const t = await getTranslations();
  const q = (sp.q ?? "").trim();
  const sort: Sort = sp.sort === "popular" ? "popular" : "latest";
  const type = (sp.type ?? "") as TypeFilter | "";
  const category = sp.category ?? "";
  const platform = sp.platform ?? "";

  let results: SearchResult[] = [];
  let total = 0;

  if (q) {
    try {
      const res = await serverGet<{ results: SearchResult[]; total: number }>(
        "/search",
        {
          q,
          locale,
          limit: 60,
          sort,
          type: type || undefined,
          category: category || undefined,
          platform: platform || undefined,
        },
      );
      results = res.data?.results ?? [];
      total = res.data?.total ?? results.length;
    } catch {
      results = [];
    }
  }

  const hrefFor = (r: SearchResult) =>
    r.type === "season"
      ? `/season/${r.slug}`
      : r.type === "playlist"
        ? `/playlist/${r.slug}`
        : r.type === "article"
          ? `/articles/${r.slug}`
          : `/watch/${r.slug}`;

  return (
    <Section title={q ? t("browse.searchResults", { query: q }) : t("common.search")}>
      <div className="col-span-full flex flex-wrap items-center justify-between gap-3">
        <SearchFilters
          q={q}
          sort={sort}
          type={type}
          category={category}
          platform={platform}
        />
        {q ? (
          <p className="text-sm text-muted-foreground">
            {t("browse.resultsCount", { count: total })}
          </p>
        ) : null}
      </div>

      {!q ? (
        <EmptyState message={t("common.searchPlaceholder")} icon={Search} />
      ) : results.length === 0 ? (
        <EmptyState message={t("browse.noResults")} />
      ) : (
        results.map((r) => {
          const Icon =
            r.type === "article"
              ? FileText
              : r.type === "episode"
                ? Video
                : r.type === "season"
                  ? Clapperboard
                  : Play;
          return (
            <Link
              key={`${r.type}-${r.id}`}
              href={hrefFor(r)}
              className="group flex items-center gap-4 rounded-lg border border-border bg-card p-3 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lifted"
            >
              <div className="relative aspect-video w-32 shrink-0 overflow-hidden rounded bg-secondary sm:w-40">
                {r.coverImage ? (
                  <Image
                    src={r.coverImage}
                    alt={r.title}
                    fill
                    unoptimized
                    sizes="160px"
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                ) : null}
                <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 transition-opacity group-hover:opacity-100">
                  <Play className="size-5 text-white" fill="currentColor" />
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="flex items-center gap-1 rounded-full border border-border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                    <Icon className="size-3" />
                    {t(`common.${TYPE_LABEL[r.type]}`)}
                  </span>
                  {r.type === "episode" && typeof r.viewsCount === "number" && (
                    <span className="text-[11px] text-muted-foreground">
                      {t("browse.popularity", { views: r.viewsCount })}
                    </span>
                  )}
                </div>
                <h3 className="mt-1 truncate font-semibold group-hover:text-primary">
                  {r.title}
                </h3>
                {r.description ? (
                  <p className="line-clamp-2 mt-0.5 text-sm text-muted-foreground">
                    {r.description}
                  </p>
                ) : null}
              </div>
            </Link>
          );
        })
      )}
    </Section>
  );
}
