"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useAuth } from "@/providers/auth-provider";
import { api } from "@/lib/api";
import type { Episode, LikeHistoryItem, Playlist } from "@/lib/types";
import { EpisodePosterCard, PlaylistPosterCard } from "@/components/poster-card";
import { Section } from "@/components/section";

export function PersonalizedRows({ locale }: { locale: string }) {
  const t = useTranslations();
  const { token, user } = useAuth();
  const [favorites, setFavorites] = useState<Episode[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) {
      setFavorites([]);
      setPlaylists([]);
      return;
    }
    setLoading(true);
    Promise.allSettled([
      api.get<LikeHistoryItem[]>("/likes/history", { locale, limit: 12 }),
      api.get<Playlist[]>("/playlists", { locale, limit: 30 }),
    ])
      .then(([favRes, plRes]) => {
        if (favRes.status === "fulfilled") {
          setFavorites(
            (favRes.value.data ?? [])
              .map((x) => x.episode)
              .filter((e): e is Episode => !!e)
              .slice(0, 12),
          );
        }
        if (plRes.status === "fulfilled" && user) {
          setPlaylists(
            (plRes.value.data ?? []).filter((p) => p.ownerId === user.id),
          );
        }
      })
      .finally(() => setLoading(false));
  }, [token, locale, user]);

  if (!token || loading || (favorites.length === 0 && playlists.length === 0)) {
    return null;
  }

  return (
    <>
      {favorites.length > 0 && (
        <Section
          title={t("home.myFavorites")}
          viewAllHref="/favorites"
          viewAllLabel={t("common.viewAll")}
        >
          {favorites.map((ep) => (
            <EpisodePosterCard key={ep.id} episode={ep} locale={locale} />
          ))}
        </Section>
      )}
      {playlists.length > 0 && (
        <Section
          title={t("home.myPlaylists")}
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
    </>
  );
}
