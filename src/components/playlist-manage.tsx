"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Pencil, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/providers/auth-provider";
import { api } from "@/lib/api";
import type { Playlist } from "@/lib/types";
import { EpisodeRow } from "@/components/episode-row";

export function PlaylistManage({
  playlist,
  locale,
}: {
  playlist: Playlist;
  locale: string;
}) {
  const t = useTranslations();
  const router = useRouter();
  const { user } = useAuth();
  const [renaming, setRenaming] = useState(false);
  const [name, setName] = useState(
    playlist.translations.find((x) => x.locale === locale)?.title ??
      playlist.slug,
  );
  const [busy, setBusy] = useState(false);

  const isOwner = !!user && playlist.ownerId === user.id;

  const episodes = (playlist.items ?? [])
    .map((it) => it.episode)
    .filter((e): e is NonNullable<typeof e> => !!e);

  const save = async () => {
    const value = name.trim();
    if (!value) return;
    setBusy(true);
    try {
      await api.patch(`/playlists/${playlist.id}`, {
        translations: [{ locale, title: value }],
      });
      setRenaming(false);
      toast.success(t("watch.playlistUpdated"));
      router.refresh();
    } catch {
      toast.error(t("common.error"));
    } finally {
      setBusy(false);
    }
  };

  const removeItem = async (episodeId: string) => {
    setBusy(true);
    try {
      await api.del(`/playlists/${playlist.id}/items/${episodeId}`);
      toast.success(t("watch.removedFromPlaylist"));
      router.refresh();
    } catch {
      toast.error(t("common.error"));
    } finally {
      setBusy(false);
    }
  };

  const removePlaylist = async () => {
    if (!window.confirm(t("watch.confirmDeletePlaylist"))) return;
    setBusy(true);
    try {
      await api.del(`/playlists/${playlist.id}`);
      toast.success(t("watch.playlistDeleted"));
      router.push("/playlists");
    } catch {
      toast.error(t("common.error"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mt-8">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-bold">{t("common.episodes")}</h2>
        {isOwner ? (
          <div className="flex items-center gap-2">
            {renaming ? (
              <>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-8 w-48 text-sm"
                  autoFocus
                />
                <Button size="sm" className="h-8" onClick={() => void save()} disabled={busy}>
                  {t("common.save")}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8"
                  onClick={() => {
                    setRenaming(false);
                    setName(
                      playlist.translations.find((x) => x.locale === locale)
                        ?.title ?? playlist.slug,
                    );
                  }}
                  disabled={busy}
                >
                  {t("common.cancel")}
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  onClick={() => setRenaming(true)}
                  disabled={busy}
                >
                  <Pencil className="size-3.5" />
                  {t("watch.renamePlaylist")}
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  className="gap-1.5"
                  onClick={() => void removePlaylist()}
                  disabled={busy}
                >
                  <Trash2 className="size-3.5" />
                  {t("watch.delete")}
                </Button>
              </>
            )}
          </div>
        ) : null}
      </div>

      {episodes.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">
          {t("watch.emptyPlaylist")}
        </p>
      ) : (
        <div className="grid gap-3">
          {episodes.map((ep, i) => (
            <div key={ep.id} className="relative">
              <EpisodeRow episode={ep} locale={locale} index={i} />
              {isOwner ? (
                <button
                  type="button"
                  aria-label={t("watch.removeFromPlaylist")}
                  onClick={() => void removeItem(ep.id)}
                  disabled={busy}
                  className="absolute end-2 top-2 z-10 flex size-7 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur transition-colors hover:bg-destructive"
                >
                  <X className="size-4" />
                </button>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
