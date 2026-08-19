"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/card";
import { CheckCircle2, Mail, MousePointerClick, RotateCw } from "lucide-react";
import { useAuth } from "@/providers/auth-provider";

export function VerifyEmailForm({ token }: { token?: string | null }) {
  const t = useTranslations();
  const { user } = useAuth();
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!email && user?.email) setEmail(user.email);
  }, [user?.email, email]);

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    api
      .post("/auth/verify-email", { token })
      .then(() => setDone(true))
      .catch(() => toast.error(t("auth.errorInvalid")))
      .finally(() => setLoading(false));
  }, [token, t]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || otp.length < 4) {
      toast.error(t("auth.errorGeneric"));
      return;
    }
    setLoading(true);
    try {
      await api.post("/auth/verify-email", { email, otp });
      setDone(true);
    } catch {
      toast.error(t("auth.errorInvalid"));
    } finally {
      setLoading(false);
    }
  };

  const resend = async () => {
    if (!email) {
      toast.error(t("auth.errorGeneric"));
      return;
    }
    setResending(true);
    try {
      await api.post("/auth/resend-verification", { email });
      toast.success(t("auth.verificationSent"));
    } catch {
      toast.error(t("auth.errorGeneric"));
    } finally {
      setResending(false);
    }
  };

  if (done) {
    return (
      <div className="space-y-4 text-center">
        <CheckCircle2 className="mx-auto size-10 text-emerald-500" />
        <p className="text-sm text-muted-foreground">{t("auth.emailVerified")}</p>
        <Link
          href="/login"
          className="inline-block text-sm font-medium text-primary hover:underline"
        >
          {t("auth.backToLogin")}
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {loading && token ? (
        <div className="flex flex-col items-center gap-3 py-8">
          <Spinner />
          <p className="text-sm text-muted-foreground">{t("auth.signingIn")}</p>
        </div>
      ) : (
        <>
          <div className="space-y-1.5">
            <Label htmlFor="email">{t("auth.email")}</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={user?.email ?? ""}
              autoComplete="email"
              className={user?.email ? "bg-secondary/40" : undefined}
            />
          </div>

          <div className="rounded-xl border border-dashed border-primary/40 bg-secondary/40 p-4 text-center text-sm text-muted-foreground">
            <MousePointerClick className="mx-auto mb-2 size-5 text-primary" />
            <p>{t("auth.linkSentHint")}</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={resend}
              disabled={resending}
            >
              {resending ? (
                <Spinner className="size-3.5" />
              ) : (
                <RotateCw className="size-3.5" />
              )}
              {t("auth.resendLink")}
            </Button>
          </div>

          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="h-px flex-1 bg-border" />
            {t("auth.orEnterCode")}
            <span className="h-px flex-1 bg-border" />
          </div>

          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="otp">{t("auth.otpLabel")}</Label>
              <Input
                id="otp"
                inputMode="numeric"
                autoComplete="one-time-code"
                value={otp}
                onChange={(e) =>
                  setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                }
                placeholder="••••••"
                required
              />
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Mail className="size-3.5" />
                {t("auth.verifyCodeHint")}
              </p>
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Spinner />}
              {t("auth.verifyEmail")}
            </Button>
          </form>

          <button
            type="button"
            onClick={resend}
            disabled={resending}
            className="w-full text-center text-sm text-muted-foreground hover:text-primary disabled:opacity-50"
          >
            {resending ? t("auth.resending") : t("auth.resendEmail")}
          </button>
        </>
      )}
    </div>
  );
}
