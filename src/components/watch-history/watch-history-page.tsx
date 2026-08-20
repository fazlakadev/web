"use client";

import { useCallback, useEffect, useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { BookOpen, Clock, Film, History, ListVideo, Play } from "lucide-react";
import { api } from "@/lib/api";
import { cn, formatDuration } from "@/lib/format";
import { Link } from "@/i18n/navigation";
import type {
  Episode,
  ProgressEntry,
  ViewHistoryItem,
} from "@/lib/types";
import { EpisodePosterCard } from "@/components/poster-card";
import { EmptyState } from "@/components/empty-state";
import { RequireAuth } from "@/components/require-auth";
import { Spinner } from "@/components/ui/card";

type Tab = "history" | "continue";

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
          {item.title ?? "\u2014"}
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

const NAV_ITEMS: { key: Tab; icon: typeof History }[] = [
  { key: "history", icon: History },
  { key: "continue", icon: Play },
];

export function WatchHistoryPage({ locale }: { locale: string }) {
  const t = useTranslations("user");
  const [activeTab, setActiveTab] = useState<Tab>("history");
  const [historyItems, setHistoryItems] = useState<ViewHistoryItem[]>([]);
  const [continueItems, setContinueItems] = useState<Episode[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [loadingContinue, setLoadingContinue] = useState(true);

  const loadHistory = useCallback(async () => {
    setLoadingHistory(true);
    try {
      const res = await api.get<ViewHistoryItem[]>("/views/history", {
        locale,
        limit: 50,
      });
      setHistoryItems(res.data ?? []);
    } catch {
      setHistoryItems([]);
    } finally {
      setLoadingHistory(false);
    }
  }, [locale]);

  const loadContinue = useCallback(async () => {
    setLoadingContinue(true);
    try {
      const res = await api.get<ProgressEntry[]>("/progress", { locale });
      setContinueItems(
        (res.data ?? [])
          .filter((p) => p.episode && (p.percent ?? 0) < 100)
          .map((p) => p.episode as Episode),
      );
    } catch {
      setContinueItems([]);
    } finally {
      setLoadingContinue(false);
    }
  }, [locale]);

  useEffect(() => {
    if (activeTab === "history") {
      void loadHistory();
    } else {
      void loadContinue();
    }
  }, [activeTab, loadHistory, loadContinue]);

  const tabLabels = useMemo(
    () => ({
      history: t("history"),
      continue: t("continueWatching"),
    }),
    [t],
  );

  return (
    <RequireAuth>
      <div className="mx-auto flex min-h-[80vh] max-w-7xl flex-col gap-6 px-4 py-8 sm:px-6 lg:flex-row">
        <aside className="shrink-0 lg:w-56">
          <div className="flex gap-2 lg:hidden">
            {NAV_ITEMS.map(({ key, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={cn(
                  "flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition-all",
                  activeTab === key
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "border border-border bg-card text-muted-foreground hover:bg-secondary",
                )}
              >
                <Icon className="size-4" />
                {tabLabels[key]}
              </button>
            ))}
          </div>
          <nav className="hidden flex-col gap-1 lg:flex">
            <div className="glass-card rounded-2xl border border-border p-2">
              {NAV_ITEMS.map(({ key, icon: Icon }) => {
                const isActive = activeTab === key;
                return (
                  <button
                    key={key}
                    onClick={() => setActiveTab(key)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-all",
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                    )}
                  >
                    <span
                      className={cn(
                        "relative flex size-8 shrink-0 items-center justify-center rounded-lg transition-colors",
                        isActive ? "bg-primary/20" : "bg-secondary",
                      )}
                    >
                      {isActive && (
                        <span className="absolute -start-2 top-1/2 size-1 -translate-y-1/2 rounded-full bg-primary" />
                      )}
                      <Icon className="size-4" />
                    </span>
                    {tabLabels[key]}
                  </button>
                );
              })}
            </div>
          </nav>
        </aside>

        <main className="min-w-0 flex-1">
          <h1 className="mb-6 text-2xl font-bold">{tabLabels[activeTab]}</h1>
          {activeTab === "history" ? (
            loadingHistory ? (
              <div className="flex min-h-[40vh] items-center justify-center">
                <Spinner className="size-6 text-primary" />
              </div>
            ) : historyItems.length === 0 ? (
              <EmptyState message={t("noHistory")} />
            ) : (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
                {historyItems.map((item) =>
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
          ) : loadingContinue ? (
            <div className="flex min-h-[40vh] items-center justify-center">
              <Spinner className="size-6 text-primary" />
            </div>
          ) : continueItems.length === 0 ? (
            <EmptyState message={t("noProgress")} />
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
              {continueItems.map((ep) => (
                <EpisodePosterCard key={ep.id} episode={ep} locale={locale} />
              ))}
            </div>
          )}
        </main>
      </div>
    </RequireAuth>
  );
}
