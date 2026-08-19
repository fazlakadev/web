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

export function ForgotPasswordForm() {
  const t = useTranslations();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/auth/forgot-password", { email });
      setSent(true);
    } catch {
      toast.error(t("auth.errorGeneric"));
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="space-y-4 text-center">
        <CheckCircle2 className="mx-auto size-10 text-emerald-500" />
        <p className="text-sm text-muted-foreground">{t("auth.passwordResetSent")}</p>
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
      <p className="text-center text-sm text-muted-foreground">
        {t("auth.forgotPasswordHint")}
      </p>
      <div className="space-y-1.5">
        <Label htmlFor="email">{t("auth.email")}</Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
          autoFocus
        />
      </div>
      <Button type="submit" className="w-full" disabled={loading}>
        {loading && <Spinner />}
        {t("auth.sendResetLink")}
      </Button>
      <p className="text-center text-sm text-muted-foreground">
        {t("auth.remembered")}{" "}
        <Link href="/login" className="font-medium text-primary hover:underline">
          {t("auth.login")}
        </Link>
      </p>
    </form>
  );
}
