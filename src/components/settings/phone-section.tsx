"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { api } from "@/lib/api";
import { useAuth } from "@/providers/auth-provider";
import { useUserRealtime } from "@/lib/realtime";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, Spinner } from "@/components/ui/card";
import {
  BadgeCheck,
  Copy,
  ExternalLink,
  MessageCircle,
  Phone,
  Trash2,
} from "lucide-react";

const POLL_INTERVAL_MS = 3000;
const POLL_MAX_MS = 3 * 60 * 1000;

export function PhoneSection() {
  const t = useTranslations();
  const { user, refreshUser } = useAuth();
  const [phone, setPhone] = useState("");
  const [pending, setPending] = useState<{
    code: string;
    botUrl: string;
    phone: string;
  } | null>(null);
  const [requesting, setRequesting] = useState(false);
  const [removing, setRemoving] = useState(false);
  const pollStartedAt = useRef<number>(0);
  const pollTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const phoneVerified = !!user?.phoneVerifiedAt;
  const userId = user?.id;

  useEffect(() => {
    return () => {
      if (pollTimer.current) clearInterval(pollTimer.current);
    };
  }, []);

  useUserRealtime(
    userId,
    {
      "phone:verified": () => {
        toast.success(t("settings.phoneVerifiedToast"));
        stopPolling();
        void refreshUser();
      },
    },
  );

  const stopPolling = () => {
    if (pollTimer.current) {
      clearInterval(pollTimer.current);
      pollTimer.current = null;
    }
  };

  const startPolling = () => {
    stopPolling();
    pollStartedAt.current = Date.now();
    pollTimer.current = setInterval(async () => {
      if (Date.now() - pollStartedAt.current > POLL_MAX_MS) {
        stopPolling();
        return;
      }
      await refreshUser();
      if (pollTimer.current === null) return;
    }, POLL_INTERVAL_MS);
  };

  if (!user) return null;

  const request = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = phone.replace(/\s/g, "");
    if (!/^\+?[0-9]{7,15}$/.test(value)) {
      toast.error(t("settings.phoneInvalid"));
      return;
    }
    setRequesting(true);
    try {
      const res = await api.post<{
        phone: string;
        code: string;
        botUsername: string;
        botUrl: string;
        expiresIn: number;
      }>("/phone/request", { phone: value });
      setPending(res.data);
      startPolling();
      toast.success(t("settings.phoneRequested"));
    } catch (err) {
      const msg = (err as { message?: string }).message;
      toast.error(msg || t("settings.phoneVerifyError"));
    } finally {
      setRequesting(false);
    }
  };

  const remove = async () => {
    setRemoving(true);
    try {
      await api.post("/phone/remove");
      setPhone("");
      setPending(null);
      stopPolling();
      toast.success(t("settings.phoneRemoved"));
      void refreshUser();
    } catch {
      toast.error(t("settings.phoneVerifyError"));
    } finally {
      setRemoving(false);
    }
  };

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(t("settings.phoneCopied"));
    } catch {
      /* clipboard unavailable */
    }
  };

  const command = pending
    ? `/verify ${pending.phone} ${pending.code}`
    : "";

  return (
    <Card className="p-6">
      <h2 className="flex items-center gap-2 text-base font-semibold">
        <Phone className="size-4 text-primary" />
        {t("settings.phoneSection")}
      </h2>

      <div className="mt-4 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm">
            {user.phone ? (
              <span dir="ltr">{user.phone}</span>
            ) : (
              <span className="text-muted-foreground">
                {t("settings.phoneNotSet")}
              </span>
            )}
            {phoneVerified ? (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                <BadgeCheck className="size-3.5" />
                {t("settings.phoneVerified")}
              </span>
            ) : (
              user.phone && (
                <span className="text-xs font-medium text-amber-600 dark:text-amber-400">
                  {t("settings.phoneNotVerified")}
                </span>
              )
            )}
          </div>
          {user.phone && phoneVerified && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={remove}
              disabled={removing}
            >
              {removing && <Spinner />}
              <Trash2 className="size-3.5" />
              {t("settings.removePhone")}
            </Button>
          )}
        </div>

        {phoneVerified && (
          <p className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-700 dark:text-emerald-300">
            <MessageCircle className="size-4 shrink-0" />
            {t("settings.phoneTelegramLinked", {
              username: user.telegramUsername || t("settings.phoneTelegramUnknown"),
            })}
          </p>
        )}

        {!phoneVerified && !pending && (
          <form onSubmit={request} className="grid gap-3 sm:grid-cols-[1fr_auto]">
            <div className="space-y-1.5">
              <Label htmlFor="phone">{t("settings.phoneLabel")}</Label>
              <Input
                id="phone"
                inputMode="tel"
                dir="ltr"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+201001234567"
                maxLength={24}
              />
            </div>
            <Button
              type="submit"
              className="self-end"
              disabled={requesting}
            >
              {requesting && <Spinner />}
              {t("settings.requestPhoneVerify")}
            </Button>
          </form>
        )}

        {!phoneVerified && pending && (
          <div className="space-y-3 rounded-xl border p-4">
            <p className="text-sm font-medium">
              {t("settings.phoneStepTitle")}
            </p>
            <ol className="list-decimal space-y-1 ps-5 text-sm text-muted-foreground">
              <li>{t("settings.phoneStepOpen")}</li>
              <li>
                {t("settings.phoneStepCommand")}
                <button
                  type="button"
                  onClick={() => copy(command)}
                  className="mx-1 inline-flex items-center gap-1 rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground hover:bg-muted/70"
                  dir="ltr"
                >
                  <Copy className="size-3" />
                  {command}
                </button>
              </li>
              <li>{t("settings.phoneStepDone")}</li>
            </ol>
            <a
              href={pending.botUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-sky-700"
            >
              <ExternalLink className="size-4" />
              {t("settings.openBot")}
            </a>
            <p className="flex items-center gap-2 text-xs text-muted-foreground">
              <Spinner />
              {t("settings.phoneWaitHint")}
            </p>
            <button
              type="button"
              onClick={() => {
                setPending(null);
                stopPolling();
              }}
              className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground"
            >
              {t("settings.phoneCancel")}
            </button>
          </div>
        )}
      </div>
    </Card>
  );
}
