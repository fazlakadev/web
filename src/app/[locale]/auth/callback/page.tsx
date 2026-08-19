"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { useAuth } from "@/providers/auth-provider";
import { Spinner } from "@/components/ui/card";

function CallbackInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations();
  const { completeOAuth } = useAuth();

  useEffect(() => {
    const accessToken = searchParams.get("accessToken");
    const refreshToken = searchParams.get("refreshToken");

    if (!accessToken || !refreshToken) {
      toast.error(t("auth.oauthFailed"));
      router.replace("/login");
      return;
    }

    completeOAuth(accessToken, refreshToken)
      .then(() => {
        toast.success(t("auth.oauthSuccess"));
        router.replace("/");
      })
      .catch(() => {
        toast.error(t("auth.oauthFailed"));
        router.replace("/login");
      });
  }, [searchParams, router, completeOAuth, t]);

  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center px-4">
      <div className="flex flex-col items-center gap-4 text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logoA.png"
          alt={t("common.appName")}
          className="size-14 rounded-2xl object-contain shadow-glow"
          width={56}
          height={56}
        />
        <Spinner className="size-6 text-primary" />
        <p className="text-sm text-muted-foreground">{t("auth.signingIn")}</p>
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={null}>
      <CallbackInner />
    </Suspense>
  );
}
