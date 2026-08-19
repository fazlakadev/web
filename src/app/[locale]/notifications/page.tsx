"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";
import { Bell, CheckCheck, Inbox, Trash2 } from "lucide-react";
import { useAuth } from "@/providers/auth-provider";
import { RequireAuth } from "@/components/require-auth";
import { api } from "@/lib/api";
import { timeAgo } from "@/lib/format";
import { cn } from "@/lib/format";
import type { AppNotification } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { PushManager } from "@/components/push-manager";

function NotificationsInner() {
  const t = useTranslations();
  const locale = useLocale();
  const { token } = useAuth();
  const [items, setItems] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    if (!token) return;
    api
      .get<AppNotification[]>("/notifications", {
        page: 1,
        limit: 50,
      })
      .then((res) => setItems(res.data ?? []))
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  const markAllRead = async () => {
    try {
      await api.patch("/notifications/read", {});
      setItems((prev) => prev.map((n) => ({ ...n, readAt: new Date().toISOString() })));
    } catch {
      /* ignore */
    }
  };

  const removeOne = async (id: string) => {
    try {
      await api.del(`/notifications/${id}`);
      setItems((prev) => prev.filter((n) => n.id !== id));
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">{t("notifications.title")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("notifications.subtitle")}
          </p>
        </div>
        {items.length > 0 && (
          <Button variant="outline" size="sm" onClick={() => void markAllRead()}>
            <CheckCheck className="size-4" />
            {t("notifications.markAllRead")}
          </Button>
        )}
      </div>

      <div className="mb-8 rounded-lg border border-border bg-card p-4">
        <h2 className="mb-1 flex items-center gap-2 text-sm font-bold">
          <Bell className="size-4" />
          {t("notifications.browserTitle")}
        </h2>
        <p className="mb-3 text-sm text-muted-foreground">
          {t("notifications.browserHint")}
        </p>
        <PushManager />
      </div>

      {loading ? (
        <p className="text-center text-sm text-muted-foreground">
          {t("common.loading")}
        </p>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border py-16 text-center">
          <Inbox className="size-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            {t("notifications.empty")}
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {items.map((n) => (
            <li
              key={n.id}
              className={cn(
                "flex items-start gap-3 rounded-lg border border-border bg-card p-3.5 transition-colors",
                !n.readAt && "border-primary/30 bg-primary/5",
              )}
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold">{n.title}</p>
                  {!n.readAt && (
                    <span className="size-2 shrink-0 rounded-full bg-primary" />
                  )}
                </div>
                <p className="mt-0.5 text-sm text-muted-foreground">{n.body}</p>
                <p className="mt-1 text-xs text-muted-foreground/70">
                  {timeAgo(n.createdAt, locale)}
                </p>
              </div>
              <button
                type="button"
                aria-label={t("notifications.remove")}
                onClick={() => void removeOne(n.id)}
                className="text-muted-foreground transition-colors hover:text-destructive"
              >
                <Trash2 className="size-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function NotificationsPage() {
  return (
    <RequireAuth>
      <NotificationsInner />
    </RequireAuth>
  );
}
