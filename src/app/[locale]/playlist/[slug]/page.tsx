import Image from "next/image";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ArrowRight, ListVideo } from "lucide-react";
import { serverGet } from "@/lib/server";
import type { Playlist } from "@/lib/types";
import { Link } from "@/i18n/navigation";
import { ViewTracker } from "@/components/view-tracker";
import { PlaylistManage } from "@/components/playlist-manage";

export const dynamic = "force-dynamic";

export default async function PlaylistDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();

  let playlist: Playlist | undefined;
  try {
    const res = await serverGet<Playlist>(`/playlists/${slug}`, { locale });
    playlist = res.data;
  } catch {
    playlist = undefined;
  }
  if (!playlist) notFound();

  const tr = playlist.translations.find((x) => x.locale === locale) ?? playlist.translations[0];
  const title = tr?.title ?? playlist.slug;
  const description = tr?.description ?? null;
  const items = playlist.items ?? [];
  const episodes = items
    .map((it) => it.episode)
    .filter((e): e is NonNullable<typeof e> => !!e);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <ViewTracker contentType="playlist" contentId={playlist.id} />
      <Link
        href="/playlists"
        className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
      >
        <ArrowRight className="size-4 rtl:rotate-180" />
        {t("nav.playlists")}
      </Link>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative aspect-video w-full shrink-0 overflow-hidden rounded-lg border border-border sm:w-64">
          {playlist.coverImage ? (
            <Image
              src={playlist.coverImage}
              alt={title}
              fill
              unoptimized
              sizes="256px"
              className="object-cover"
            />
          ) : (
            <div className="flex size-full items-center justify-center text-muted-foreground">
              <ListVideo className="size-10" />
            </div>
          )}
        </div>
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">{title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("season.episodeCount", { count: episodes.length })}
          </p>
          {description ? (
            <p className="mt-3 max-w-xl text-sm text-muted-foreground">
              {description}
            </p>
          ) : null}
        </div>
      </div>

      <PlaylistManage playlist={playlist} locale={locale} />
    </div>
  );
}
