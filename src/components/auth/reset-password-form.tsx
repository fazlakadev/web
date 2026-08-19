"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/card";
import { CheckCircle2 } from "lucide-react";

export function ResetPasswordForm({ token }: { token?: string | null }) {
  const t = useTranslations();
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8 || password !== confirm) {
      toast.error(t("auth.errorGeneric"));
      return;
    }
    setLoading(true);
    try {
      await api.post("/auth/reset-password", {
        token: token || undefined,
        email: token ? undefined : email,
        otp: token ? undefined : otp,
        password,
      });
      setDone(true);
    } catch {
      toast.error(t("auth.errorGeneric"));
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="space-y-4 text-center">
        <CheckCircle2 className="mx-auto size-10 text-emerald-500" />
        <p className="text-sm text-muted-foreground">{t("auth.passwordResetDone")}</p>
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
    <form onSubmit={submit} className="space-y-4">
      {!token && (
        <>
          <div className="space-y-1.5">
            <Label htmlFor="email">{t("auth.email")}</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="otp">{t("auth.otpLabel")}</Label>
            <Input
              id="otp"
              inputMode="numeric"
              autoComplete="one-time-code"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="••••••"
              required
            />
          </div>
        </>
      )}
      <div className="space-y-1.5">
        <Label htmlFor="password">{t("auth.newPassword")}</Label>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
          autoComplete="new-password"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="confirm">{t("auth.confirmPassword")}</Label>
        <Input
          id="confirm"
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          required
          minLength={8}
          autoComplete="new-password"
        />
      </div>
      <Button type="submit" className="w-full" disabled={loading}>
        {loading && <Spinner />}
        {t("auth.resetPassword")}
      </Button>
    </form>
  );
}
