"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";
import { Check, ListPlus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/providers/auth-provider";
import { api } from "@/lib/api";
import type { Playlist } from "@/lib/types";

function slugify(value: string) {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "playlist"
  );
}

export function AddToPlaylist({
  episodeId,
}: {
  episodeId: string;
}) {
  const t = useTranslations();
  const locale = useLocale();
  const { token, user } = useAuth();
  const [open, setOpen] = useState(false);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [membership, setMembership] = useState<Record<string, boolean>>({});

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await api.get<Playlist[]>("/playlists", { limit: 100 });
      const mine = (res.data ?? []).filter(
        (p) => p.kind === "user" && p.ownerId === user?.id,
      );
      setPlaylists(mine);
      const membershipMap: Record<string, boolean> = {};
      await Promise.all(
        mine.map(async (p) => {
          try {
            const detail = await api.get<Playlist>(`/playlists/${p.id}`, {
              locale,
            });
            membershipMap[p.id] = !!(
              detail.data.items ?? []
            ).some((it) => it.episodeId === episodeId);
          } catch {
            membershipMap[p.id] = false;
          }
        }),
      );
      setMembership(membershipMap);
    } catch {
      setPlaylists([]);
    } finally {
      setLoading(false);
    }
  }, [token, user?.id, locale, episodeId]);

  useEffect(() => {
    if (open) void load();
  }, [open, load]);

  const toggle = async (playlist: Playlist) => {
    const contains = membership[playlist.id];
    setLoading(true);
    try {
      if (contains) {
        await api.del(`/playlists/${playlist.id}/items/${episodeId}`);
        toast.success(t("watch.removedFromPlaylist"));
      } else {
        await api.post(`/playlists/${playlist.id}/items`, { episodeId });
        toast.success(t("watch.addedToPlaylist"));
      }
      setMembership((m) => ({ ...m, [playlist.id]: !contains }));
    } catch {
      toast.error(t("common.error"));
    } finally {
      setLoading(false);
    }
  };

  const create = async () => {
    const name = newName.trim();
    if (!name) return;
    setCreating(true);
    try {
      const res = await api.post<Playlist>(`/playlists`, {
        slug: slugify(name),
        isPublic: true,
        translations: [{ locale, title: name }],
      });
      await api.post(`/playlists/${res.data.id}/items`, { episodeId });
      toast.success(t("watch.playlistCreated"));
      setNewName("");
      setMembership((m) => ({ ...m, [res.data.id]: true }));
      setPlaylists((prev) => [res.data, ...prev]);
    } catch {
      toast.error(t("common.error"));
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="relative">
      <Button
        variant="outline"
        size="sm"
        className="gap-2"
        onClick={() => {
          if (!token) {
            toast.info(t("watch.loginToComment"));
            return;
          }
          setOpen((o) => !o);
        }}
      >
        <ListPlus className="size-4" />
        {t("watch.addToPlaylist")}
      </Button>

      {open ? (
        <div className="absolute start-0 top-full z-40 mt-2 w-72 overflow-hidden rounded-md border border-border bg-popover text-popover-foreground shadow-lifted">
          <div className="border-b border-border px-3 py-2">
            <span className="text-sm font-semibold">{t("watch.myPlaylists")}</span>
          </div>
          <div className="max-h-64 overflow-y-auto p-1.5">
            {loading && playlists.length === 0 ? (
              <p className="p-3 text-center text-xs text-muted-foreground">
                {t("common.loading")}
              </p>
            ) : playlists.length === 0 ? (
              <p className="p-3 text-center text-xs text-muted-foreground">
                {t("watch.noPlaylists")}
              </p>
            ) : (
              playlists.map((p) => {
                const tr =
                  p.translations.find((x) => x.locale === locale) ??
                  p.translations[0];
                const contains = membership[p.id];
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => void toggle(p)}
                    disabled={loading}
                    className="flex w-full items-center gap-2 rounded-sm px-2.5 py-2 text-left text-sm transition-colors hover:bg-accent"
                  >
                    {contains ? (
                      <Check className="size-4 shrink-0 text-primary" />
                    ) : (
                      <Plus className="size-4 shrink-0 text-muted-foreground" />
                    )}
                    <span className="min-w-0 flex-1 truncate">
                      {tr?.title ?? p.slug}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {p._count?.items ?? 0}
                    </span>
                  </button>
                );
              })
            )}
          </div>
          <div className="flex gap-2 border-t border-border p-2">
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder={t("watch.newPlaylistName")}
              className="h-8 text-sm"
            />
            <Button
              size="sm"
              className="h-8"
              onClick={() => void create()}
              disabled={!newName.trim() || creating}
            >
              <Plus className="size-3.5" />
              {t("watch.newPlaylist")}
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
