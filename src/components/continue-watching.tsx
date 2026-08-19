"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useAuth } from "@/providers/auth-provider";
import { api } from "@/lib/api";
import type { ProgressEntry } from "@/lib/types";
import { EpisodePosterCard } from "@/components/poster-card";
import { Section } from "@/components/section";

export function ContinueWatchingRow({ locale }: { locale: string }) {
  const t = useTranslations();
  const { token } = useAuth();
  const [items, setItems] = useState<ProgressEntry[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) {
      setItems([]);
      return;
    }
    setLoading(true);
    api
      .get<ProgressEntry[]>("/progress", { locale })
      .then((res) => {
        const list = (res.data || []).filter(
          (p) => p.episode && (p.percent ?? 0) < 100,
        );
        setItems(list.slice(0, 10));
      })
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [token, locale]);

  if (!token || loading || items.length === 0) return null;

  return (
    <Section title={t("nav.continueWatching")} viewAllHref="/continue-watching" viewAllLabel={t("common.viewAll")}>
      {items.map((p) =>
        p.episode ? (
          <EpisodePosterCard
            key={p.episode.id}
            episode={p.episode}
            locale={locale}
          />
        ) : null,
      )}
    </Section>
  );
}
