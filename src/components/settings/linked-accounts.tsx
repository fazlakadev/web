"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import {
  BadgeCheck,
  KeyRound,
  Link2,
  Phone,
  Plus,
  ShieldAlert,
} from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, Spinner } from "@/components/ui/card";

type LinkStatus = {
  password: boolean;
  phone: boolean;
  google: boolean;
  github: boolean;
  facebook: boolean;
};

type OauthProvider = "google" | "github" | "facebook";

const GOOGLE_ICON = (
  <svg className="size-5" viewBox="0 0 24 24" aria-hidden="true">
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18A10.96 10.96 0 0 0 1 12c0 1.77.43 3.45 1.18 4.94l2.66-2.84z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
    />
  </svg>
);

const GITHUB_ICON = (
  <svg className="size-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.56 0-.27-.01-1.13-.02-2.05-3.2.7-3.88-1.36-3.88-1.36-.52-1.33-1.28-1.68-1.28-1.68-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.19 1.76 1.19 1.03 1.76 2.69 1.25 3.35.96.1-.75.4-1.25.72-1.54-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.28 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11.05 11.05 0 0 1 5.79 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.83 1.19 3.09 0 4.42-2.69 5.39-5.26 5.68.41.35.78 1.05.78 2.12 0 1.53-.01 2.76-.01 3.14 0 .31.21.67.8.56A11.52 11.52 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5z" />
  </svg>
);

const FACEBOOK_ICON = (
  <svg className="size-5" viewBox="0 0 24 24" fill="#1877F2" aria-hidden="true">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
  </svg>
);

const PROVIDER_META: Record<
  OauthProvider,
  { icon: React.ReactNode; name: string }
> = {
  google: { icon: GOOGLE_ICON, name: "Google" },
  github: { icon: GITHUB_ICON, name: "GitHub" },
  facebook: { icon: FACEBOOK_ICON, name: "Facebook" },
};

function Row({
  icon,
  label,
  status,
  action,
}: {
  icon: React.ReactNode;
  label: string;
  status: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3">
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-secondary/60">
          {icon}
        </span>
        <span className="truncate text-sm font-medium text-foreground">
          {label}
        </span>
      </div>
      <div className="flex items-center gap-3">
        {status}
        {action}
      </div>
    </div>
  );
}

export function LinkedAccountsSection({
  onGoToSecurity,
}: {
  onGoToSecurity?: () => void;
}) {
  const t = useTranslations();
  const searchParams = useSearchParams();

  const [status, setStatus] = useState<LinkStatus | null>(null);
  const [loading, setLoading] = useState(true);

  const [pendingOtp, setPendingOtp] = useState<OauthProvider | null>(null);
  const [otp, setOtp] = useState("");
  const [busy, setBusy] = useState<OauthProvider | "otp" | null>(null);

  const tryTranslate = (msg: string): string => {
    if (/^(errors|auth|common)\.[A-Za-z0-9.]+$/.test(msg)) {
      const translated = (t as unknown as (k: string) => string)(msg);
      return translated === msg ? msg : translated;
    }
    return msg;
  };

  const load = useCallback(async () => {
    try {
      const res = await api.get<LinkStatus>("/auth/link/status");
      setStatus(res.data);
    } catch {
      /* status unavailable */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const result = searchParams.get("link");
    const provider = searchParams.get("provider");
    if (!result || !provider) return;
    if (result === "success") {
      toast.success(t("settings.linkSuccess", { provider }));
    } else {
      toast.error(t("settings.linkFailed", { provider }));
    }
    const url = new URL(window.location.href);
    url.searchParams.delete("link");
    url.searchParams.delete("provider");
    window.history.replaceState(null, "", url.toString());
  }, [searchParams, t]);

  const linkProvider = async (provider: OauthProvider) => {
    setBusy(provider);
    try {
      const res = await api.post<{
        redirectUrl?: string;
        requiresOtp?: boolean;
        expiresAt?: string;
      }>("/auth/link/start", { provider });
      if (res.data.redirectUrl) {
        window.location.assign(res.data.redirectUrl);
        return;
      }
      if (res.data.requiresOtp) {
        setPendingOtp(provider);
        setOtp("");
      }
    } catch (err) {
      const msg =
        err instanceof ApiError ? tryTranslate(err.message) : t("auth.errorGeneric");
      toast.error(msg);
    } finally {
      setBusy(null);
    }
  };

  const confirmLinkOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingOtp || otp.length < 4) return;
    setBusy("otp");
    try {
      const res = await api.post<{ redirectUrl?: string }>(
        "/auth/link/otp",
        { provider: pendingOtp, otp },
      );
      if (res.data.redirectUrl) {
        window.location.assign(res.data.redirectUrl);
        return;
      }
    } catch (err) {
      const msg =
        err instanceof ApiError ? tryTranslate(err.message) : t("auth.errorGeneric");
      toast.error(msg);
    } finally {
      setBusy(null);
    }
  };

  const unlinkProvider = async (provider: OauthProvider) => {
    if (!window.confirm(t("settings.unlinkConfirm", { provider }))) return;
    setBusy(provider);
    try {
      await api.post("/auth/link/unlink", { provider });
      toast.success(t("settings.unlinkSuccess", { provider }));
      void load();
    } catch (err) {
      const msg =
        err instanceof ApiError ? tryTranslate(err.message) : t("auth.errorGeneric");
      toast.error(msg);
    } finally {
      setBusy(null);
    }
  };

  if (loading) {
    return (
      <Card className="flex items-center justify-center gap-3 p-10 text-sm text-muted-foreground">
        <Spinner />
        {t("auth.signingIn")}
      </Card>
    );
  }

  const badge = (linked: boolean) =>
    linked ? (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
        <BadgeCheck className="size-3.5" />
        {t("settings.linked")}
      </span>
    ) : (
      <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground">
        {t("settings.notLinked")}
      </span>
    );

  const oauthRow = (provider: OauthProvider, linked: boolean) => {
    const meta = PROVIDER_META[provider];
    return (
      <div key={provider}>
        {pendingOtp === provider ? (
          <form
            onSubmit={confirmLinkOtp}
            className="space-y-3 rounded-xl border border-border bg-card p-4"
          >
            <div className="flex items-center gap-2 text-sm font-medium">
              <ShieldAlert className="size-4 text-primary" />
              {t("settings.linkOtpTitle")}
            </div>
            <p className="text-xs text-muted-foreground">{t("settings.linkOtpHint")}</p>
            <div className="space-y-1.5">
              <Label htmlFor={`link-otp-${provider}`}>{t("settings.linkOtpLabel")}</Label>
              <Input
                id={`link-otp-${provider}`}
                inputMode="numeric"
                autoComplete="one-time-code"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="••••••"
                autoFocus
              />
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={busy === "otp" || otp.length < 4}>
                {busy === "otp" && <Spinner />}
                {t("settings.linkConfirm")}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setPendingOtp(null);
                  setOtp("");
                }}
              >
                {t("security.cancel")}
              </Button>
            </div>
          </form>
        ) : (
          <Row
            icon={meta.icon}
            label={meta.name}
            status={badge(linked)}
            action={
              linked ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => void unlinkProvider(provider)}
                  disabled={busy === provider}
                >
                  {busy === provider && <Spinner />}
                  {t("settings.unlinkAccount")}
                </Button>
              ) : (
                <Button
                  type="button"
                  size="sm"
                  onClick={() => void linkProvider(provider)}
                  disabled={busy === provider}
                >
                  {busy === provider ? (
                    <Spinner />
                  ) : (
                    <Plus className="size-3.5" />
                  )}
                  {t("settings.linkAccount")}
                </Button>
              )
            }
          />
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">{t("settings.linkedAccountsHint")}</p>

      <Row
        icon={<KeyRound className="size-4 text-primary" />}
        label={t("settings.methodPassword")}
        status={badge(status?.password ?? false)}
      />

      <Row
        icon={<Phone className="size-4 text-primary" />}
        label={t("settings.methodPhone")}
        status={badge(status?.phone ?? false)}
        action={
          <Button type="button" variant="outline" size="sm" onClick={onGoToSecurity}>
            <Link2 className="size-3.5" />
            {t("settings.security")}
          </Button>
        }
      />

      {oauthRow("google", status?.google ?? false)}
      {oauthRow("github", status?.github ?? false)}
      {oauthRow("facebook", status?.facebook ?? false)}
    </div>
  );
}
