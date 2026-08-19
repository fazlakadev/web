"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { api, REFRESH_KEY } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, Spinner } from "@/components/ui/card";
import { formatDate } from "@/lib/format";
import type { UserSession } from "@/lib/types";
import {
  Laptop,
  LogOut,
  MonitorSmartphone,
  Smartphone,
  Globe,
} from "lucide-react";

function PlatformIcon({ platform }: { platform: string | null }) {
  const p = (platform || "WEB").toUpperCase();
  if (p === "MOBILE") return <Smartphone className="size-4" />;
  if (p === "DESKTOP") return <MonitorSmartphone className="size-4" />;
  return <Laptop className="size-4" />;
}

export function SessionsSection() {
  const t = useTranslations();
  const [sessions, setSessions] = useState<UserSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [revokingAll, setRevokingAll] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<UserSession[]>("/auth/sessions");
      setSessions(res.data);
    } catch {
      toast.error(t("sessions.loadFailed"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void load();
  }, [load]);

  const revoke = async (id: string) => {
    setBusy(id);
    try {
      await api.del(`/auth/sessions/${id}`);
      toast.success(t("sessions.revoked"));
      void load();
    } catch {
      toast.error(t("sessions.revokeFailed"));
    } finally {
      setBusy(null);
    }
  };

  const revokeAll = async () => {
    const refresh = localStorage.getItem(REFRESH_KEY);
    setRevokingAll(true);
    try {
      await api.del("/auth/sessions", { refreshToken: refresh });
      toast.success(t("sessions.revokedOthers"));
      void load();
    } catch {
      toast.error(t("sessions.revokeFailed"));
    } finally {
      setRevokingAll(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <Spinner className="size-6 text-primary" />
      </div>
    );
  }

  const sorted = [...sessions].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">{t("sessions.subtitle")}</p>

      {sorted.length === 0 ? (
        <Card className="p-6 text-center text-sm text-muted-foreground">
          {t("sessions.empty")}
        </Card>
      ) : (
        sorted.map((s, i) => (
          <Card key={s.id} className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 flex size-9 items-center justify-center rounded-full bg-muted text-muted-foreground">
                  <PlatformIcon platform={s.platform} />
                </span>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-medium">
                      {s.deviceName ||
                        s.browser ||
                        s.os ||
                        s.platform ||
                        "Device"}
                    </p>
                    {i === 0 ? (
                      <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                        {t("sessions.current")}
                      </span>
                    ) : null}
                  </div>
                  <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                    {s.os && s.browser ? (
                      <span>
                        {s.os} · {s.browser}
                      </span>
                    ) : s.userAgent ? (
                      <span className="max-w-[260px] truncate">
                        {s.userAgent}
                      </span>
                    ) : null}
                    {s.ip ? (
                      <span className="inline-flex items-center gap-1">
                        <Globe className="size-3" />
                        {s.ip}
                        {s.country ? ` · ${s.country}` : ""}
                      </span>
                    ) : null}
                    <span>
                      {t("sessions.lastActive")}{" "}
                      {formatDate(s.lastUsedAt ?? s.createdAt)}
                    </span>
                  </div>
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="shrink-0 text-destructive hover:text-destructive"
                onClick={() => void revoke(s.id)}
                disabled={busy === s.id}
              >
                {busy === s.id && <Spinner />}
                <LogOut className="size-4" />
                <span className="sr-only">{t("sessions.revoke")}</span>
              </Button>
            </div>
          </Card>
        ))
      )}

      {sorted.length > 1 ? (
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={() => void revokeAll()}
          disabled={revokingAll}
        >
          {revokingAll && <Spinner />}
          {t("sessions.revokeOthers")}
        </Button>
      ) : null}
    </div>
  );
}
