"use client";

import { useEffect, useState, useRef } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useAuth, consumeWelcomeFlag } from "@/providers/auth-provider";
import { cn } from "@/lib/format";
import { Sparkles, ArrowRight, Play } from "lucide-react";
import { Link } from "@/i18n/navigation";

export function WelcomeBanner() {
  const t = useTranslations();
  const locale = useLocale();
  const { user, token } = useAuth();
  const [visible, setVisible] = useState(false);
  const [phase, setPhase] = useState<"enter" | "exit">("enter");
  const [welcomeKind, setWelcomeKind] = useState<"new" | "back" | null>(null);
  const firedFor = useRef<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!token) return;
    if (firedFor.current === token) return;
    const kind = consumeWelcomeFlag();
    if (!kind) return;
    firedFor.current = token;
    setWelcomeKind(kind);

    const showTimer = setTimeout(() => {
      setVisible(true);
      setPhase("enter");

      const exitTimer = setTimeout(() => {
        setPhase("exit");
        setTimeout(() => setVisible(false), 600);
      }, 4000);

      timerRef.current = exitTimer;
    }, 400);

    return () => {
      clearTimeout(showTimer);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [token]);

  if (!visible) return null;

  const name = user?.name?.split(" ")[0]?.trim();
  const isNew = welcomeKind === "new";

  const dismiss = () => {
    setPhase("exit");
    setTimeout(() => setVisible(false), 600);
  };

  return (
    <div
      className={cn(
        "fixed inset-0 z-[100] flex items-center justify-center px-4",
        "bg-background/80 backdrop-blur-xl",
        "transition-all duration-600",
        phase === "enter" && "animate-in fade-in-0",
        phase === "exit" && "animate-out fade-out-0",
      )}
      onClick={dismiss}
    >
      <div
        className={cn(
          "relative w-full max-w-lg overflow-hidden rounded-[2.5rem] border border-border/50 bg-card shadow-2xl",
          "transition-all duration-700",
          phase === "enter" && "animate-in zoom-in-95 slide-in-from-bottom-8",
          phase === "exit" && "animate-out zoom-out-95 slide-out-to-top-8",
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-emerald-500/5 to-violet-500/10 opacity-80" />
        <div className="absolute -top-20 -end-20 h-56 w-56 rounded-full bg-primary/15 blur-3xl animate-float" />
        <div className="absolute -bottom-20 -start-20 h-56 w-56 rounded-full bg-emerald-500/10 blur-3xl animate-float" style={{ animationDelay: "2s" }} />

        <div className="relative px-8 py-12 text-center sm:px-12 sm:py-14">
          <div className="mx-auto mb-6 relative inline-block">
            <div className="absolute inset-0 animate-pulse-ring rounded-3xl bg-primary/25" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logoA.png"
              alt={t("common.appName")}
              className="relative size-20 rounded-3xl object-contain shadow-glow animate-in zoom-in-50 duration-700"
              width={80}
              height={80}
            />
          </div>

          <div className="space-y-3 animate-in fade-in-0 slide-in-from-bottom-4 duration-700 delay-200">
            <div className="flex items-center justify-center gap-2">
              <Sparkles className="size-5 text-primary animate-pulse" />
              <h1 className="font-heading text-3xl font-black tracking-tight sm:text-4xl text-gradient">
                {name
                  ? isNew
                    ? t("auth.welcomeNewName", { name })
                    : t("auth.welcomeBackName", { name })
                  : isNew
                    ? t("auth.welcomeNew")
                    : t("auth.welcomeBack")}
              </h1>
              <Sparkles className="size-5 text-primary animate-pulse" />
            </div>

            <p className="text-sm text-muted-foreground sm:text-base">
              {isNew
                ? (locale === "ar" ? "يسعدنا انضمامك لعائلة فذلكة! ابدأ رحلتك الآن." : "We're glad you joined the Fazlaka family! Start your journey now.")
                : (locale === "ar" ? "عدنا يسعدنا! كن جاهزاً لأحدث المسلسلات والحلقات." : "We missed you! Get ready for the latest series and episodes.")}
            </p>
          </div>

          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center animate-in fade-in-0 slide-in-from-bottom-3 duration-700 delay-500">
            <Link
              href="/browse"
              className="shine flex items-center gap-2.5 rounded-full bg-brand-gradient px-8 py-3.5 text-sm font-bold text-white shadow-glow transition-all hover:shadow-lifted hover:brightness-110 active:scale-[0.98]"
            >
              <Play className="size-4" />
              {locale === "ar" ? "ابدأ المشاهدة" : "Start Watching"}
              <ArrowRight className="size-4 rtl:rotate-180" />
            </Link>
            <button
              onClick={dismiss}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {locale === "ar" ? "لاحقاً" : "Later"}
            </button>
          </div>

          <p className="mt-6 text-[11px] text-muted-foreground/50">
            {locale === "ar" ? "اضغط في أي مكان للإغلاق" : "Click anywhere to dismiss"}
          </p>
        </div>
      </div>
    </div>
  );
}
