"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { api } from "@/lib/api";
import { useAuth } from "@/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, Spinner } from "@/components/ui/card";
import {
  BadgeCheck,
  KeyRound,
  Mail,
  ScanLine,
  ShieldCheck,
  ShieldOff,
} from "lucide-react";
import { PhoneSection } from "./phone-section";

function OtpInput({
  value,
  onChange,
  label,
  id,
}: {
  value: string;
  onChange: (v: string) => void;
  label: string;
  id: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        inputMode="numeric"
        autoComplete="one-time-code"
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, "").slice(0, 6))}
        placeholder="••••••"
        className="tracking-widest"
      />
    </div>
  );
}

function Section({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="p-6">
      <h2 className="flex items-center gap-2 text-base font-semibold">
        {icon}
        {title}
      </h2>
      <div className="mt-4 space-y-4">{children}</div>
    </Card>
  );
}

export function SecurityForm() {
  const t = useTranslations();
  const { user, refreshUser } = useAuth();

  const [pw, setPw] = useState({ current: "", next: "", confirm: "" });
  const [pwLoading, setPwLoading] = useState(false);

  const [newEmail, setNewEmail] = useState("");
  const [emailOtp, setEmailOtp] = useState("");
  const [emailRequested, setEmailRequested] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const [twoFaStep, setTwoFaStep] = useState<"idle" | "pending">("idle");
  const [twoFaOtp, setTwoFaOtp] = useState("");
  const [twoFaLoading, setTwoFaLoading] = useState(false);

  const [appSetup, setAppSetup] = useState<{
    secret: string;
    otpauthUrl: string;
    qrDataUrl: string;
  } | null>(null);
  const [appCode, setAppCode] = useState("");
  const [appLoading, setAppLoading] = useState(false);

  if (!user) return null;

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pw.next.length < 8 || pw.next !== pw.confirm) {
      toast.error(t("auth.errorGeneric"));
      return;
    }
    setPwLoading(true);
    try {
      await api.post("/auth/change-password", {
        currentPassword: pw.current,
        newPassword: pw.next,
      });
      toast.success(t("security.passwordChanged"));
      setPw({ current: "", next: "", confirm: "" });
    } catch {
      toast.error(t("security.currentPasswordWrong"));
    } finally {
      setPwLoading(false);
    }
  };

  const requestEmailChange = async () => {
    if (!newEmail.includes("@")) {
      toast.error(t("auth.errorGeneric"));
      return;
    }
    setEmailLoading(true);
    try {
      await api.post("/auth/change-email/request", { newEmail });
      setEmailRequested(true);
      toast.success(t("security.otpSent"));
    } catch {
      toast.error(t("security.emailInUse"));
    } finally {
      setEmailLoading(false);
    }
  };

  const confirmEmailChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (emailOtp.length < 4) {
      toast.error(t("auth.errorGeneric"));
      return;
    }
    setEmailLoading(true);
    try {
      await api.post("/auth/change-email", { newEmail, otp: emailOtp });
      toast.success(t("security.emailChanged"));
      setEmailRequested(false);
      setNewEmail("");
      setEmailOtp("");
      void refreshUser();
    } catch {
      toast.error(t("security.otpInvalid"));
    } finally {
      setEmailLoading(false);
    }
  };

  const resendVerification = async () => {
    setResending(true);
    try {
      await api.post("/auth/resend-verification", { email: user.email });
      toast.success(t("auth.verificationSent"));
    } catch {
      toast.error(t("auth.errorGeneric"));
    } finally {
      setResending(false);
    }
  };

  const requestTwoFactor = async () => {
    setTwoFaLoading(true);
    try {
      if (user.twoFactorEnabled) {
        await api.post("/auth/2fa/disable/request");
      } else {
        await api.get("/auth/2fa/enable/request");
      }
      setTwoFaStep("pending");
      toast.success(t("security.otpSent"));
    } catch {
      toast.error(t("auth.errorGeneric"));
    } finally {
      setTwoFaLoading(false);
    }
  };

  const confirmTwoFactor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (twoFaOtp.length < 4) {
      toast.error(t("auth.errorGeneric"));
      return;
    }
    setTwoFaLoading(true);
    try {
      if (user.twoFactorEnabled) {
        await api.post("/auth/2fa/disable", { otp: twoFaOtp });
      } else {
        await api.post("/auth/2fa/enable", { otp: twoFaOtp });
      }
      toast.success(t("security.twoFactorUpdated"));
      setTwoFaStep("idle");
      setTwoFaOtp("");
      void refreshUser();
    } catch {
      toast.error(t("security.otpInvalid"));
    } finally {
      setTwoFaLoading(false);
    }
  };

  const emailVerified = !!user.emailVerified;

  const appEnabled = user.twoFactorEnabled && user.twoFactorMethod === "APP";

  const startAppSetup = async () => {
    setAppLoading(true);
    try {
      const res = await api.get<{
        secret: string;
        otpauthUrl: string;
        qrDataUrl: string;
      }>("/auth/2fa/totp/setup");
      setAppSetup(res.data);
      setAppCode("");
    } catch {
      toast.error(t("auth.errorGeneric"));
    } finally {
      setAppLoading(false);
    }
  };

  const confirmAppEnable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (appCode.length !== 6) {
      toast.error(t("auth.errorGeneric"));
      return;
    }
    setAppLoading(true);
    try {
      await api.post("/auth/2fa/totp/enable", { code: appCode });
      toast.success(t("security.appUpdated"));
      setAppSetup(null);
      setAppCode("");
      void refreshUser();
    } catch {
      toast.error(t("security.otpInvalid"));
    } finally {
      setAppLoading(false);
    }
  };

  const confirmAppDisable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (appCode.length !== 6) {
      toast.error(t("auth.errorGeneric"));
      return;
    }
    setAppLoading(true);
    try {
      await api.post("/auth/2fa/totp/disable", { code: appCode });
      toast.success(t("security.appUpdated"));
      setAppCode("");
      void refreshUser();
    } catch {
      toast.error(t("security.otpInvalid"));
    } finally {
      setAppLoading(false);
    }
  };

  const startAppDisable = () => {
    setAppCode("");
    setAppLoading(false);
  };

  return (
    <div className="space-y-6">
      <PhoneSection />

      <Section icon={<Mail className="size-4 text-primary" />} title={t("security.emailSection")}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">{user.email}</span>
            {emailVerified ? (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                <BadgeCheck className="size-3.5" />
                {t("security.verified")}
              </span>
            ) : (
              <span className="text-xs font-medium text-amber-600 dark:text-amber-400">
                {t("security.notVerified")}
              </span>
            )}
          </div>
          {!emailVerified && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={resendVerification}
              disabled={resending}
            >
              {resending && <Spinner />}
              {t("security.resendVerification")}
            </Button>
          )}
        </div>

        {!emailRequested ? (
          <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
            <div className="space-y-1.5">
              <Label htmlFor="new-email">{t("security.newEmail")}</Label>
              <Input
                id="new-email"
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder={t("security.newEmailPlaceholder")}
              />
            </div>
            <Button
              type="button"
              variant="outline"
              className="self-end"
              onClick={requestEmailChange}
              disabled={emailLoading}
            >
              {emailLoading && <Spinner />}
              {t("security.requestChange")}
            </Button>
          </div>
        ) : (
          <form onSubmit={confirmEmailChange} className="space-y-3">
            <OtpInput
              id="email-otp"
              value={emailOtp}
              onChange={setEmailOtp}
              label={t("security.emailOtp")}
            />
            <Button type="submit" disabled={emailLoading}>
              {emailLoading && <Spinner />}
              {t("security.confirmChange")}
            </Button>
          </form>
        )}
      </Section>

      <Section icon={<KeyRound className="size-4 text-primary" />} title={t("security.passwordSection")}>
        <form onSubmit={changePassword} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="current-pw">{t("security.currentPassword")}</Label>
            <Input
              id="current-pw"
              type="password"
              value={pw.current}
              onChange={(e) => setPw((p) => ({ ...p, current: e.target.value }))}
              required
              autoComplete="current-password"
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="new-pw">{t("auth.newPassword")}</Label>
              <Input
                id="new-pw"
                type="password"
                value={pw.next}
                onChange={(e) => setPw((p) => ({ ...p, next: e.target.value }))}
                required
                minLength={8}
                autoComplete="new-password"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="confirm-pw">{t("auth.confirmPassword")}</Label>
              <Input
                id="confirm-pw"
                type="password"
                value={pw.confirm}
                onChange={(e) => setPw((p) => ({ ...p, confirm: e.target.value }))}
                required
                minLength={8}
                autoComplete="new-password"
              />
            </div>
          </div>
          <Button type="submit" disabled={pwLoading}>
            {pwLoading && <Spinner />}
            {t("security.updatePassword")}
          </Button>
        </form>
      </Section>

      <Section
        icon={
          user.twoFactorEnabled ? (
            <ShieldCheck className="size-4 text-emerald-500" />
          ) : (
            <ShieldOff className="size-4 text-muted-foreground" />
          )
        }
        title={t("security.twoFactorSection")}
      >
        <p className="text-sm text-muted-foreground">
          {user.twoFactorEnabled
            ? t("security.twoFactorOn")
            : t("security.twoFactorOff")}
        </p>
        {twoFaStep === "idle" ? (
          <Button
            type="button"
            variant={user.twoFactorEnabled ? "destructive" : "default"}
            onClick={requestTwoFactor}
            disabled={twoFaLoading}
          >
            {twoFaLoading && <Spinner />}
            {user.twoFactorEnabled
              ? t("security.disableTwoFactor")
              : t("security.enableTwoFactor")}
          </Button>
        ) : (
          <form onSubmit={confirmTwoFactor} className="space-y-3">
            <OtpInput
              id="2fa-otp"
              value={twoFaOtp}
              onChange={setTwoFaOtp}
              label={t("security.twoFactorOtp")}
            />
            <div className="flex gap-2">
              <Button type="submit" disabled={twoFaLoading}>
                {twoFaLoading && <Spinner />}
                {t("security.confirm")}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setTwoFaStep("idle");
                  setTwoFaOtp("");
                }}
              >
                {t("security.cancel")}
              </Button>
            </div>
          </form>
        )}
      </Section>

      <Section
        icon={
          appEnabled ? (
            <ShieldCheck className="size-4 text-emerald-500" />
          ) : (
            <ScanLine className="size-4 text-primary" />
          )
        }
        title={t("security.appSection")}
      >
        <p className="text-sm text-muted-foreground">{t("security.appHint")}</p>

        {appEnabled ? (
          <form onSubmit={confirmAppDisable} className="space-y-3">
            <OtpInput
              id="app-otp"
              value={appCode}
              onChange={setAppCode}
              label={t("security.twoFactorOtp")}
            />
            <div className="flex gap-2">
              <Button type="submit" variant="destructive" disabled={appLoading}>
                {appLoading && <Spinner />}
                {t("security.disableApp")}
              </Button>
              <Button type="button" variant="outline" onClick={startAppDisable}>
                {t("security.cancel")}
              </Button>
            </div>
          </form>
        ) : appSetup ? (
          <form onSubmit={confirmAppEnable} className="space-y-4">
            <div className="flex flex-col items-center gap-3 rounded-xl border p-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={appSetup.qrDataUrl}
                alt={t("security.appQrAlt")}
                className="size-40 rounded-lg"
              />
              <div className="w-full space-y-1 text-center">
                <p className="text-xs text-muted-foreground">
                  {t("security.manualEntry")}
                </p>
                <code className="break-all rounded bg-muted px-2 py-1 text-xs font-mono">
                  {appSetup.secret}
                </code>
              </div>
            </div>
            <OtpInput
              id="app-code"
              value={appCode}
              onChange={setAppCode}
              label={t("security.twoFactorOtp")}
            />
            <div className="flex gap-2">
              <Button type="submit" disabled={appLoading}>
                {appLoading && <Spinner />}
                {t("security.enableApp")}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setAppSetup(null)}
              >
                {t("security.cancel")}
              </Button>
            </div>
          </form>
        ) : (
          <Button type="button" onClick={startAppSetup} disabled={appLoading}>
            {appLoading && <Spinner />}
            {t("security.setupApp")}
          </Button>
        )}
      </Section>
    </div>
  );
}
