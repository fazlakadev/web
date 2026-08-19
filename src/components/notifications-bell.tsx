"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";
import { Bell, CheckCheck, Inbox } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { useAuth } from "@/providers/auth-provider";
import { api } from "@/lib/api";
import { useUserRealtime } from "@/lib/realtime";
import { timeAgo } from "@/lib/format";
import { cn } from "@/lib/format";
import type { AppNotification } from "@/lib/types";
import { Button } from "@/components/ui/button";

export function NotificationsBell() {
  const t = useTranslations();
  const locale = useLocale();
  const { user, token } = useAuth();
  const [open, setOpen] = React.useState(false);
  const [unread, setUnread] = React.useState(0);
  const [items, setItems] = React.useState<AppNotification[]>([]);
  const [loading, setLoading] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  useUserRealtime(user?.id, {
    "notification:new": (data) => {
      const payload = data as
        | { notification?: AppNotification }
        | AppNotification;
      const notification =
        (payload as { notification?: AppNotification }).notification ??
        (payload as AppNotification);
      if (!notification?.id) return;
      setUnread((prev) => prev + 1);
      setItems((prev) => [notification, ...prev].slice(0, 8));
    },
  });

  const loadUnread = React.useCallback(() => {
    if (!token) return;
    api
      .get<{ count: number }>("/notifications/unread-count")
      .then((res) => setUnread(res.data.count))
      .catch(() => undefined);
  }, [token]);

  React.useEffect(() => {
    loadUnread();
    const interval = window.setInterval(loadUnread, 60_000);
    return () => window.clearInterval(interval);
  }, [loadUnread]);

  React.useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const openPanel = async () => {
    const next = !open;
    setOpen(next);
    if (next && token) {
      setLoading(true);
      try {
        const res = await api.get<AppNotification[]>("/notifications", {
          page: 1,
          limit: 8,
        });
        setItems(res.data ?? []);
      } catch {
        setItems([]);
      } finally {
        setLoading(false);
      }
    }
  };

  const markAllRead = async () => {
    if (!token) return;
    try {
      await api.patch("/notifications/read", {});
      setUnread(0);
      setItems((prev) => prev.map((n) => ({ ...n, readAt: new Date().toISOString() })));
    } catch {
      /* ignore */
    }
  };

  return (
    <div ref={ref} className="relative">
      <Button
        variant="ghost"
        size="icon"
        aria-label={t("notifications.title")}
        onClick={() => void openPanel()}
        className="relative"
      >
        <Bell className="size-4" />
        {unread > 0 && (
          <span className="absolute end-0.5 top-0.5 flex min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold leading-4 text-destructive-foreground">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </Button>

      {open && (
        <div className="absolute end-0 top-full z-50 mt-2 w-[min(20rem,calc(100vw-2rem))] overflow-hidden rounded-md border border-border bg-popover text-popover-foreground shadow-lifted">
          <div className="flex items-center justify-between border-b border-border px-3 py-2.5">
            <span className="text-sm font-semibold">{t("notifications.title")}</span>
            {unread > 0 && (
              <button
                type="button"
                onClick={() => void markAllRead()}
                className="flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-primary"
              >
                <CheckCheck className="size-3.5" />
                {t("notifications.markAllRead")}
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <p className="p-4 text-center text-sm text-muted-foreground">
                {t("common.loading")}
              </p>
            ) : items.length === 0 ? (
              <div className="flex flex-col items-center gap-2 p-6 text-muted-foreground">
                <Inbox className="size-6" />
                <p className="text-sm">{t("notifications.empty")}</p>
              </div>
            ) : (
              items.map((n) => (
                <div
                  key={n.id}
                  className={cn(
                    "border-b border-border px-3 py-2.5 last:border-0",
                    !n.readAt && "bg-primary/5",
                  )}
                >
                  <p className="text-sm font-medium">{n.title}</p>
                  <p className="line-clamp-2 text-xs text-muted-foreground">
                    {n.body}
                  </p>
                  <p className="mt-0.5 text-[10px] text-muted-foreground/70">
                    {timeAgo(n.createdAt, locale)}
                  </p>
                </div>
              ))
            )}
          </div>

          <div className="border-t border-border p-2">
            <Link
              href="/notifications"
              onClick={() => setOpen(false)}
              className="block rounded-sm px-2.5 py-2 text-center text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              {t("notifications.viewAll")}
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
