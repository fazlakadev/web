import { getTranslations, setRequestLocale } from "next-intl/server";
import { Suspense } from "react";
import { BadgeCheck } from "lucide-react";
import { VerifyEmailClient } from "@/components/auth/verify-email-client";

export default async function VerifyEmailPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();

  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md animate-in fade-in-0 zoom-in-95 duration-300">
        <div className="mb-6 flex flex-col items-center gap-3 text-center">
          <span className="flex size-14 items-center justify-center rounded-2xl bg-brand-gradient text-primary-foreground shadow-glow">
            <BadgeCheck className="size-7" />
          </span>
          <div>
            <h1 className="text-2xl font-black tracking-tight">
              {t("auth.verifyEmail")}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">{t("common.appTagline")}</p>
          </div>
        </div>
        <div className="glass-card rounded-3xl border border-border p-6 shadow-lifted sm:p-8">
          <Suspense fallback={null}>
            <VerifyEmailClient />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
