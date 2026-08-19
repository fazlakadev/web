"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";
import { Loader2, Mail, Send, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function NewsletterForm({ compact = false }: { compact?: boolean }) {
  const t = useTranslations();
  const locale = useLocale();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [alreadySubscribed, setAlreadySubscribed] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = email.trim();
    if (!value) return;
    setBusy(true);
    try {
      const res = await api.post<{ message: string }>("/newsletter/subscribe", {
        email: value,
        locale,
      });
      const msg = res.data.message;
      if (msg === "newsletter.alreadySubscribed") {
        setAlreadySubscribed(true);
        toast.info(t("newsletter.alreadySubscribed"));
      } else {
        toast.success(t("newsletter.subscribed"));
        setEmail("");
      }
    } catch (err) {
      toast.error(
        (err as { message?: string })?.message || t("common.error"),
      );
    } finally {
      setBusy(false);
    }
  };

  if (alreadySubscribed) {
    return (
      <div className="flex items-center gap-2 rounded-full bg-emerald-500/10 px-4 py-2.5 text-sm font-medium text-emerald-600 dark:text-emerald-400">
        <CheckCircle2 className="size-4 shrink-0" />
        {t("newsletter.alreadySubscribed")}
      </div>
    );
  }

  return (
    <form onSubmit={(e) => void submit(e)} className="w-full space-y-2">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Mail className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t("newsletter.placeholder")}
            className="rounded-full bg-secondary/70 ps-9"
          />
        </div>
        <Button type="submit" size={compact ? "sm" : "default"} disabled={busy}>
          {busy ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Send className="size-4" />
          )}
          {!compact && t("newsletter.subscribe")}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        {t("newsletter.privacyNote")}
      </p>
    </form>
  );
}
