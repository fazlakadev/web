"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { consumeWelcomeFlag } from "@/providers/auth-provider";
import { useAuth } from "@/providers/auth-provider";

export function WelcomeToast() {
  const t = useTranslations();
  const { user, token } = useAuth();
  const firedFor = useRef<string | null>(null);

  useEffect(() => {
    if (!token) return;
    if (firedFor.current === token) return;
    const kind = consumeWelcomeFlag();
    if (!kind) return;
    firedFor.current = token;
    const timer = window.setTimeout(() => {
      const name = user?.name?.trim();
      if (kind === "new") {
        toast.success(
          name ? t("auth.welcomeNewName", { name }) : t("auth.welcomeNew"),
        );
      } else {
        toast.success(
          name ? t("auth.welcomeBackName", { name }) : t("auth.welcomeBack"),
        );
      }
    }, 600);
    return () => window.clearTimeout(timer);
  }, [token, user?.name, t]);

  return null;
}
