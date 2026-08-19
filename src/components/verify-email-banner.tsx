"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { MailWarning, X } from "lucide-react";
import { useAuth } from "@/providers/auth-provider";
import { api } from "@/lib/api";
import { Link } from "@/i18n/navigation";

export function VerifyEmailBanner() {
  const t = useTranslations();
  const { user, token } = useAuth();
  const [dismissed, setDismissed] = useState(false);
  const [sending, setSending] = useState(false);

  if (!token || !user || user.emailVerified || dismissed) {
    return null;
  }

  const resend = async () => {
    setSending(true);
    try {
      await api.post("/auth/resend-verification", { email: user.email });
      toast.success(t("auth.verificationSent"));
    } catch {
      toast.error(t("common.error"));
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex items-center gap-3 border-b border-amber-500/30 bg-amber-500/10 px-4 py-2.5">
      <MailWarning className="size-4 shrink-0 text-amber-500" />
      <p className="min-w-0 flex-1 truncate text-xs font-medium text-amber-600 dark:text-amber-400 sm:text-sm">
        {t("auth.verifyBanner")}
      </p>
      <button
        type="button"
        onClick={() => void resend()}
        disabled={sending}
        className="shrink-0 text-xs font-semibold text-primary underline-offset-2 hover:underline disabled:cursor-wait disabled:opacity-60"
      >
        {sending ? t("auth.resending") : t("auth.resendEmail")}
      </button>
      <Link
        href="/verify-email"
        className="shrink-0 rounded-md bg-primary px-2.5 py-1 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
      >
        {t("auth.verifyNow")}
      </Link>
      <button
        type="button"
        aria-label="Dismiss"
        onClick={() => setDismissed(true)}
        className="shrink-0 text-muted-foreground transition-colors hover:text-foreground"
      >
        <X className="size-4" />
      </button>
    </div>
  );
}
