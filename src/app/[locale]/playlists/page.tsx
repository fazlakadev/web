import { getTranslations, setRequestLocale } from "next-intl/server";
import { serverGet } from "@/lib/server";
import type { Playlist, Meta } from "@/lib/types";
import { PlaylistPosterCard } from "@/components/poster-card";
import { Section } from "@/components/section";
import { Pagination } from "@/components/pagination";
import { EmptyState } from "@/components/empty-state";

export const dynamic = "force-dynamic";

export default async function PlaylistsPage({
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

  let items: Playlist[] = [];
  let meta: Meta | undefined;

  try {
    const res = await serverGet<Playlist[]>("/playlists", {
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
      <Section title={t("nav.playlists")}>
        {items.length === 0 ? (
          <EmptyState message={t("browse.noResults")} />
        ) : (
          items.map((p) => (
            <PlaylistPosterCard
              key={p.id}
              playlist={p}
              locale={locale}
              itemsLabel={t("common.episodes")}
            />
          ))
        )}
      </Section>
      <Pagination
        page={page}
        totalPages={meta?.totalPages ?? 1}
        basePath="/playlists"
      />
    </>
  );
}
