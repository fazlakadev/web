import { getTranslations, setRequestLocale } from "next-intl/server";
import { UserPlus, Sparkles, Rocket } from "lucide-react";
import { AuthForm } from "@/components/auth-form";
import { RedirectIfAuthed } from "@/components/redirect-if-authed";

export default async function RegisterPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();

  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center px-4 py-12">
      {/* Background decoration */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -start-40 h-80 w-80 rounded-full bg-emerald-500/5 blur-3xl" />
        <div className="absolute -bottom-40 -end-40 h-80 w-80 rounded-full bg-emerald-500/5 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Hero header */}
        <div className="mb-8 flex flex-col items-center gap-4 text-center animate-in fade-in-0 slide-in-from-bottom-4 duration-700">
          <div className="relative">
            <div className="absolute inset-0 animate-pulse-ring rounded-3xl bg-emerald-500/20" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logoA.png"
              alt={t("common.appName")}
              className="relative size-16 rounded-3xl object-contain shadow-glow animate-in zoom-in-50 duration-500 delay-200"
              width={64}
              height={64}
            />
          </div>
          <div className="space-y-1.5">
            <h1 className="flex items-center justify-center gap-2 text-2xl font-black tracking-tight sm:text-3xl animate-in fade-in-0 slide-in-from-bottom-2 duration-500 delay-300">
              <UserPlus className="size-6 text-emerald-500" />
              {t("auth.joinUs")}
            </h1>
            <p className="text-sm text-muted-foreground animate-in fade-in-0 duration-500 delay-400">
              {t("common.appTagline")}
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground/60 animate-in fade-in duration-500 delay-500">
            <Rocket className="size-3" />
            <span>{locale === "ar" ? "ابدأ رحلتك مع فذلكة" : "Start your journey with Fazlaka"}</span>
          </div>
        </div>

        {/* Form card */}
        <div className="glass-card rounded-3xl border border-border/70 p-6 shadow-lifted sm:p-8 animate-in fade-in-0 zoom-in-95 duration-500 delay-300">
          <RedirectIfAuthed />
          <AuthForm mode="register" />
        </div>
      </div>
    </div>
  );
}
