"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { useAuth } from "@/providers/auth-provider";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/card";
import { ShieldCheck } from "lucide-react";
import { ApiError } from "@/lib/api";

export function TermsConsentModal() {
  const t = useTranslations();
  const { user, acceptTerms } = useAuth();
  const [username, setUsername] = useState(user?.username ?? "");
  const [agree, setAgree] = useState(false);
  const [saving, setSaving] = useState(false);

  if (!user || user.termsAcceptedAt) {
    return null;
  }

  const tryTranslate = (msg: string): string => {
    if (/^(errors|auth|common)\.[A-Za-z0-9.]+$/.test(msg)) {
      const translated = (t as unknown as (k: string) => string)(msg);
      return translated === msg ? msg : translated;
    }
    return msg;
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agree) {
      toast.error(t("auth.acceptTermsRequired"));
      return;
    }
    const u = username.trim();
    if (!/^[a-zA-Z0-9_.-]{3,30}$/.test(u)) {
      toast.error(t("auth.errorGeneric"));
      return;
    }
    setSaving(true);
    try {
      await acceptTerms(u);
      toast.success(t("auth.termsAccepted"));
    } catch (err) {
      const msg = err instanceof ApiError ? tryTranslate(err.message) : t("auth.errorGeneric");
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm animate-in fade-in-0 duration-200">
      <div className="w-full max-w-md animate-in fade-in-0 zoom-in-95 slide-in-from-bottom-2 duration-300 rounded-3xl border border-border bg-card p-6 shadow-xl">
        <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-brand-gradient text-primary-foreground shadow-sm">
          <ShieldCheck className="size-7" />
        </div>
        <h2 className="mt-4 text-center text-lg font-bold text-foreground">
          {t("terms.title")}
        </h2>
        <p className="mt-1 text-center text-sm text-muted-foreground">
          {t("terms.intro")}
        </p>

        <form onSubmit={submit} className="mt-5 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="terms-username">{t("auth.username")}</Label>
            <Input
              id="terms-username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              minLength={3}
              maxLength={30}
              pattern="[a-zA-Z0-9_.-]+"
              autoFocus
            />
            <p className="text-xs text-muted-foreground">
              {t("terms.usernameHint")}
            </p>
          </div>

          <div className="rounded-xl border border-border bg-secondary/40 p-3 text-xs leading-relaxed text-muted-foreground">
            {t("terms.summary")}{" "}
            <Link href="/terms" className="font-medium text-primary hover:underline">
              {t("footer.terms")}
            </Link>{" "}
            ·{" "}
            <Link href="/privacy" className="font-medium text-primary hover:underline">
              {t("footer.privacy")}
            </Link>
          </div>

          <label className="flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              checked={agree}
              onChange={(e) => setAgree(e.target.checked)}
              className="mt-0.5 size-4 shrink-0 accent-primary"
              required
            />
            <span>
              {t("auth.acceptTerms")}
              <Link href="/terms" className="font-medium text-primary hover:underline">
                {t("auth.termsAndPrivacy")}
              </Link>
            </span>
          </label>

          <Button type="submit" className="w-full" disabled={saving}>
            {saving && <Spinner />}
            {t("terms.accept")}
          </Button>
        </form>
      </div>
    </div>
  );
}
