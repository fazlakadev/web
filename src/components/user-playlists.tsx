"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";
import { ListVideo, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Link } from "@/i18n/navigation";
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

export function UserPlaylists() {
  const t = useTranslations();
  const locale = useLocale();
  const { token, user } = useAuth();
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [renameId, setRenameId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await api.get<Playlist[]>("/playlists", { limit: 100 });
      setPlaylists(
        (res.data ?? []).filter(
          (p) => p.kind === "user" && p.ownerId === user?.id,
        ),
      );
    } catch {
      setPlaylists([]);
    } finally {
      setLoading(false);
    }
  }, [token, user?.id]);

  useEffect(() => {
    void load();
  }, [load]);

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
      setPlaylists((prev) => [res.data, ...prev]);
      setNewName("");
      toast.success(t("watch.playlistCreated"));
    } catch {
      toast.error(t("common.error"));
    } finally {
      setCreating(false);
    }
  };

  const rename = async (id: string) => {
    const name = renameValue.trim();
    if (!name) return;
    setBusy(true);
    try {
      const res = await api.patch<Playlist>(`/playlists/${id}`, {
        translations: [{ locale, title: name }],
      });
      setPlaylists((prev) =>
        prev.map((p) => (p.id === id ? { ...p, ...res.data } : p)),
      );
      setRenameId(null);
      toast.success(t("watch.playlistUpdated"));
    } catch {
      toast.error(t("common.error"));
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: string) => {
    if (!window.confirm(t("watch.confirmDeletePlaylist"))) return;
    setBusy(true);
    try {
      await api.del(`/playlists/${id}`);
      setPlaylists((prev) => prev.filter((p) => p.id !== id));
      toast.success(t("watch.playlistDeleted"));
    } catch {
      toast.error(t("common.error"));
    } finally {
      setBusy(false);
    }
  };

  if (!token || !user) return null;

  return (
    <div className="mt-6 border-t border-border pt-6">
      <h2 className="mb-4 flex items-center gap-2 text-lg font-bold">
        <ListVideo className="size-5 text-primary" />
        {t("watch.myPlaylists")}
      </h2>

      <div className="flex gap-2">
        <Input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder={t("watch.playlistNamePlaceholder")}
          className="h-9 text-sm"
        />
        <Button
          size="sm"
          className="h-9 shrink-0 gap-1.5"
          onClick={() => void create()}
          disabled={!newName.trim() || creating}
        >
          <Plus className="size-4" />
          {t("watch.newPlaylist")}
        </Button>
      </div>

      {loading ? (
        <p className="mt-4 text-sm text-muted-foreground">{t("common.loading")}</p>
      ) : playlists.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">{t("watch.noPlaylists")}</p>
      ) : (
        <ul className="mt-4 space-y-2">
          {playlists.map((p) => {
            const tr =
              p.translations.find((x) => x.locale === locale) ??
              p.translations[0];
            const title = tr?.title ?? p.slug;
            return (
              <li key={p.id}>
                <Card className="flex items-center gap-3 p-3">
                  <Link
                    href={`/playlist/${p.slug}`}
                    className="min-w-0 flex-1 truncate text-sm font-semibold hover:text-primary"
                  >
                    {title}
                  </Link>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {p._count?.items ?? 0}
                  </span>
                  {renameId === p.id ? (
                    <div className="flex shrink-0 items-center gap-1.5">
                      <Input
                        value={renameValue}
                        onChange={(e) => setRenameValue(e.target.value)}
                        className="h-8 w-40 text-sm"
                        autoFocus
                      />
                      <Button
                        size="sm"
                        className="h-8"
                        onClick={() => void rename(p.id)}
                        disabled={!renameValue.trim() || busy}
                      >
                        {t("common.save")}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8"
                        onClick={() => setRenameId(null)}
                        disabled={busy}
                      >
                        {t("common.cancel")}
                      </Button>
                    </div>
                  ) : (
                    <>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8"
                        onClick={() => {
                          setRenameId(p.id);
                          setRenameValue(title);
                        }}
                        disabled={busy}
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 text-destructive"
                        onClick={() => void remove(p.id)}
                        disabled={busy}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </>
                  )}
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
