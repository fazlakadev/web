"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { BookOpen, Clock, Film, ListVideo } from "lucide-react";
import { api } from "@/lib/api";
import { Link } from "@/i18n/navigation";
import type {
  Episode,
  LikeHistoryItem,
  ProgressEntry,
  ViewHistoryItem,
} from "@/lib/types";
import { EpisodePosterCard } from "@/components/poster-card";
import { EmptyState } from "@/components/empty-state";
import { Spinner } from "@/components/ui/card";
import { formatDuration } from "@/lib/format";

type Mode = "favorites" | "history" | "progress";

const TYPE_META: Record<string, { href: (s: string) => string; icon: typeof Film }> = {
  article: { href: (s) => `/articles/${s}`, icon: BookOpen },
  season: { href: (s) => `/season/${s}`, icon: Film },
  playlist: { href: (s) => `/playlist/${s}`, icon: ListVideo },
};

function HistoryItemCard({ item }: { item: ViewHistoryItem }) {
  const meta = TYPE_META[item.contentType];
  const href = meta
    ? meta.href(item.slug ?? item.contentId)
    : `/browse`;
  const Icon = meta?.icon ?? Film;
  return (
    <Link href={href} className="group block">
      <div className="relative overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-all duration-300 group-hover:border-primary/50 group-hover:shadow-card">
        <div className="aspect-video w-full bg-secondary">
          {item.coverImage ? (
            <Image
              src={item.coverImage}
              alt={item.title ?? ""}
              width={640}
              height={360}
              className="size-full object-cover transition-transform duration-500 group-hover:scale-110"
              unoptimized
            />
          ) : (
            <div className="flex size-full items-center justify-center bg-brand-gradient opacity-50">
              <Icon className="size-8 text-white/70" />
            </div>
          )}
        </div>
        <span className="absolute bottom-2 end-2 rounded-md bg-black/70 px-1.5 py-0.5 text-[11px] font-semibold capitalize text-white backdrop-blur">
          {item.contentType}
        </span>
      </div>
      <div className="mt-2.5 space-y-1 px-0.5">
        <h3 className="line-clamp-2 text-sm font-bold transition-colors group-hover:text-primary">
          {item.title ?? "—"}
        </h3>
        {item.durationSec ? (
          <p className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Clock className="size-3" />
              {formatDuration(item.durationSec)}
            </span>
          </p>
        ) : null}
      </div>
    </Link>
  );
}

export function UserEpisodes({ mode, locale }: { mode: Mode; locale: string }) {
  const t = useTranslations();
  const [items, setItems] = useState<Episode[]>([]);
  const [history, setHistory] = useState<ViewHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      if (mode === "favorites") {
        const res = await api.get<LikeHistoryItem[]>("/likes/history", {
          locale,
          limit: 50,
        });
        setItems(
          (res.data ?? []).map((x) => x.episode).filter((e): e is Episode => !!e),
        );
      } else if (mode === "history") {
        const res = await api.get<ViewHistoryItem[]>("/views/history", {
          locale,
          limit: 50,
        });
        setHistory(res.data ?? []);
      } else {
        const res = await api.get<ProgressEntry[]>("/progress", { locale });
        setItems(
          (res.data ?? [])
            .filter((p) => p.episode && (p.percent ?? 0) < 100)
            .map((p) => p.episode as Episode),
        );
      }
    } catch {
      setItems([]);
      setHistory([]);
    } finally {
      setLoading(false);
    }
  }, [mode, locale]);

  useEffect(() => {
    void load();
  }, [load]);

  const emptyMsg =
    mode === "favorites"
      ? t("user.noFavorites")
      : mode === "history"
        ? t("user.noHistory")
        : t("user.noProgress");

  const title =
    mode === "favorites"
      ? t("user.favorites")
      : mode === "history"
        ? t("user.history")
        : t("user.continueWatching");

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Spinner className="size-6 text-primary" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <h1 className="mb-6 text-2xl font-bold">{title}</h1>
      {mode === "history" ? (
        history.length === 0 ? (
          <EmptyState message={emptyMsg} />
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {history.map((item) =>
              item.contentType === "episode" && item.episode ? (
                <EpisodePosterCard
                  key={item.id}
                  episode={item.episode}
                  locale={locale}
                />
              ) : (
                <HistoryItemCard key={item.id} item={item} />
              ),
            )}
          </div>
        )
      ) : items.length === 0 ? (
        <EmptyState message={emptyMsg} />
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {items.map((ep) => (
            <EpisodePosterCard key={ep.id} episode={ep} locale={locale} />
          ))}
        </div>
      )}
    </div>
  );
}
