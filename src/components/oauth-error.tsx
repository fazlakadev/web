"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

export function OAuthError() {
  const searchParams = useSearchParams();
  const t = useTranslations();

  useEffect(() => {
    const error = searchParams.get("error");
    if (error) {
      toast.error(t("auth.oauthFailed"));
    }
  }, [searchParams, t]);

  return null;
}
