"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { BellOff, BellRing, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useAuth } from "@/providers/auth-provider";
import { Button } from "@/components/ui/button";

function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const base64Url = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64Url);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) {
    output[i] = raw.charCodeAt(i);
  }
  return output;
}

export function PushManager() {
  const t = useTranslations();
  const { user } = useAuth();
  const [status, setStatus] = useState<
    "checking" | "unsupported" | "denied" | "disabled" | "enabled"
  >("checking");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setStatus("unsupported");
      return;
    }
    navigator.serviceWorker
      .getRegistration("/sw.js")
      .then((reg) => {
        if (reg) {
          reg.pushManager
            .getSubscription()
            .then((sub) => setStatus(sub ? "enabled" : "disabled"))
            .catch(() => setStatus("disabled"));
        } else {
          setStatus("disabled");
        }
      })
      .catch(() => setStatus("unsupported"));
  }, []);

  const enable = async () => {
    setBusy(true);
    try {
      const reg = await navigator.serviceWorker.register("/sw.js");
      const keyRes = await api.get<{ publicKey: string | null }>("/push/vapid-key");
      const publicKey = keyRes.data?.publicKey;
      if (!publicKey) {
        toast.error(t("notifications.pushUnavailable"));
        setStatus("unsupported");
        return;
      }
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey) as BufferSource,
      });
      await api.post("/push/subscriptions", {
        endpoint: sub.endpoint,
        p256dh: btoa(String.fromCharCode(...new Uint8Array(sub.getKey("p256dh")!))),
        auth: btoa(String.fromCharCode(...new Uint8Array(sub.getKey("auth")!))),
        userAgent: navigator.userAgent,
      });
      setStatus("enabled");
      toast.success(t("notifications.pushEnabled"));
    } catch {
      const permission = Notification.permission;
      if (permission === "denied") {
        setStatus("denied");
        toast.error(t("notifications.pushDenied"));
      } else {
        toast.error(t("common.error"));
      }
    } finally {
      setBusy(false);
    }
  };

  const disable = async () => {
    setBusy(true);
    try {
      const reg = await navigator.serviceWorker.getRegistration("/sw.js");
      const sub = await reg?.pushManager.getSubscription();
      if (sub) {
        await api.del("/push/subscriptions", { endpoint: sub.endpoint });
        await sub.unsubscribe();
      }
      setStatus("disabled");
      toast.success(t("notifications.pushDisabled"));
    } catch {
      toast.error(t("common.error"));
    } finally {
      setBusy(false);
    }
  };

  if (!user) return null;

  if (status === "checking") {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" />
        {t("common.loading")}
      </div>
    );
  }

  if (status === "unsupported") {
    return (
      <p className="flex items-center gap-2 text-sm text-muted-foreground">
        <BellOff className="size-4" />
        {t("notifications.pushUnsupported")}
      </p>
    );
  }

  if (status === "denied") {
    return (
      <p className="flex items-center gap-2 text-sm text-muted-foreground">
        <BellOff className="size-4" />
        {t("notifications.pushDenied")}
      </p>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <Button
        type="button"
        variant={status === "enabled" ? "outline" : "default"}
        onClick={() => void (status === "enabled" ? disable() : enable())}
        disabled={busy}
      >
        {busy ? (
          <Loader2 className="size-4 animate-spin" />
        ) : status === "enabled" ? (
          <BellRing className="size-4" />
        ) : (
          <BellOff className="size-4" />
        )}
        {status === "enabled"
          ? t("notifications.pushDisable")
          : t("notifications.pushEnable")}
      </Button>
      {status === "enabled" && (
        <span className="text-xs text-muted-foreground">
          {t("notifications.pushActive")}
        </span>
      )}
    </div>
  );
}
