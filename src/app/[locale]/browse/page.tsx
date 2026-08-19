import { getTranslations, setRequestLocale } from "next-intl/server";
import { serverGet } from "@/lib/server";
import type { Episode, Meta } from "@/lib/types";
import { EpisodePosterCard } from "@/components/poster-card";
import { Section } from "@/components/section";
import { Pagination } from "@/components/pagination";
import { EmptyState } from "@/components/empty-state";

export const dynamic = "force-dynamic";

export default async function BrowsePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { locale } = await params;
  const sp = await searchParams;
  setRequestLocale(locale);
  const t = await getTranslations();
  const page = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);

  let items: Episode[] = [];
  let meta: Meta | undefined;

  try {
    const res = await serverGet<Episode[]>("/episodes", {
      locale,
      page,
      limit: 20,
      platform: "WEB",
    });
    items = res.data ?? [];
    meta = res.meta;
  } catch {
    items = [];
  }

  return (
    <>
      <Section title={t("browse.title")}>
        {items.length === 0 ? (
          <EmptyState message={t("browse.noResults")} />
        ) : (
          items.map((ep) => (
            <EpisodePosterCard key={ep.id} episode={ep} locale={locale} />
          ))
        )}
      </Section>
      <Pagination
        page={page}
        totalPages={meta?.totalPages ?? 1}
        basePath="/browse"
      />
    </>
  );
}
