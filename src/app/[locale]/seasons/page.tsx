import { getTranslations, setRequestLocale } from "next-intl/server";
import { serverGet } from "@/lib/server";
import type { Season, Meta } from "@/lib/types";
import { SeasonPosterCard } from "@/components/poster-card";
import { Section } from "@/components/section";
import { Pagination } from "@/components/pagination";
import { EmptyState } from "@/components/empty-state";

export const dynamic = "force-dynamic";

export default async function SeasonsPage({
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

  let items: Season[] = [];
  let meta: Meta | undefined;

  try {
    const res = await serverGet<Season[]>("/seasons", {
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

  const episodesLabel = t("common.episodes");

  return (
    <>
      <Section title={t("nav.seasons")}>
        {items.length === 0 ? (
          <EmptyState message={t("browse.noResults")} />
        ) : (
          items.map((s) => (
            <SeasonPosterCard
              key={s.id}
              season={s}
              locale={locale}
              episodesLabel={episodesLabel}
            />
          ))
        )}
      </Section>
      <Pagination
        page={page}
        totalPages={meta?.totalPages ?? 1}
        basePath="/seasons"
      />
    </>
  );
}
