"use client";

import { useEffect, useState } from "react";
import {
  Download,
  Smartphone,
  Monitor,
  Apple,
  Shield,
  Zap,
  Globe,
  Users,
  AlertTriangle,
  Loader2,
  Check,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/format";

interface VersionInfo {
  version: string;
  browserDownloadUrl: string;
  releaseNotes: string | null;
  publishedAt: string | null;
}

interface DownloadLabels {
  title: string;
  tagline: string;
  subtitle: string;
  downloadButton: string;
  downloadButtonFallback: string;
  latestVersion: string;
  releasedOn: string;
  android: string;
  androidDesc: string;
  windows: string;
  windowsDesc: string;
  mac: string;
  macDesc: string;
  comingSoon: string;
  features: string;
  feature1Title: string;
  feature1Desc: string;
  feature2Title: string;
  feature2Desc: string;
  feature3Title: string;
  feature3Desc: string;
  feature4Title: string;
  feature4Desc: string;
  loading: string;
  error: string;
  retry: string;
  systemRequirements: string;
  requirementAndroid: string;
}

export function DownloadClient({
  locale,
  version: initialVersion,
  browserDownloadUrl: initialUrl,
  releaseNotes: initialNotes,
  publishedAt: initialDate,
  labels: t,
}: {
  locale: string;
  version: string | null;
  browserDownloadUrl: string;
  releaseNotes: string | null;
  publishedAt: string | null;
  labels: DownloadLabels;
}) {
  const [versionInfo, setVersionInfo] = useState<VersionInfo | null>(
    initialVersion
      ? {
          version: initialVersion,
          browserDownloadUrl: initialUrl,
          releaseNotes: initialNotes,
          publishedAt: initialDate,
        }
      : null,
  );
  const [loading, setLoading] = useState(!initialVersion);
  const [error, setError] = useState(!initialVersion);

  const fetchVersion = async () => {
    setLoading(true);
    setError(false);
    try {
      const apiBase =
        process.env.NEXT_PUBLIC_API_URL || "https://api.fazlaka.com";
      const res = await fetch(`${apiBase}/api/v1/app-version/latest`);
      if (!res.ok) throw new Error("Failed");
      const json = await res.json();
      const data = json.data;
      setVersionInfo({
        version: data.version,
        browserDownloadUrl: data.browser_download_url,
        releaseNotes: data.release_notes ?? null,
        publishedAt: data.published_at ?? null,
      });
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!initialVersion) {
      fetchVersion();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const displayVersion = versionInfo?.version ?? "1.0.0";
  const downloadUrl = versionInfo?.browserDownloadUrl ?? "#";
  const isRTL = locale === "ar";
  const dir = isRTL ? "rtl" : "ltr";

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString(locale, {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  const features = [
    {
      icon: Zap,
      title: t.feature1Title,
      desc: t.feature1Desc,
      gradient: "from-indigo-500/10 via-violet-500/10 to-fuchsia-500/10",
      iconBg: "bg-gradient-to-br from-indigo-500 to-violet-500",
      iconColor: "text-indigo-600 dark:text-indigo-400",
    },
    {
      icon: Shield,
      title: t.feature2Title,
      desc: t.feature2Desc,
      gradient: "from-emerald-500/10 via-teal-500/10 to-cyan-500/10",
      iconBg: "bg-gradient-to-br from-emerald-500 to-teal-500",
      iconColor: "text-emerald-600 dark:text-emerald-400",
    },
    {
      icon: Globe,
      title: t.feature3Title,
      desc: t.feature3Desc,
      gradient: "from-amber-500/10 via-orange-500/10 to-rose-500/10",
      iconBg: "bg-gradient-to-br from-amber-500 to-orange-500",
      iconColor: "text-amber-600 dark:text-amber-400",
    },
    {
      icon: Users,
      title: t.feature4Title,
      desc: t.feature4Desc,
      gradient: "from-fuchsia-500/10 via-pink-500/10 to-rose-500/10",
      iconBg: "bg-gradient-to-br from-fuchsia-500 to-pink-500",
      iconColor: "text-fuchsia-600 dark:text-fuchsia-400",
    },
  ];

  return (
    <div dir={dir} className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-20">
      {/* Hero */}
      <div className="relative mb-16 overflow-hidden rounded-[2rem] bg-brand-gradient p-10 text-white shadow-glow sm:p-14">
        <div className="absolute -end-20 -top-20 h-56 w-56 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-24 -start-14 h-60 w-60 rounded-full bg-white/8 blur-3xl" />
        <div className="relative flex flex-col items-center text-center">
          <span className="mb-5 flex size-20 items-center justify-center rounded-[1.25rem] bg-white/15 shadow-glow backdrop-blur-sm">
            <Download className="size-10" />
          </span>
          <h1 className="font-heading text-3xl font-black tracking-tight sm:text-5xl">
            {t.title}
          </h1>
          <p className="mt-4 max-w-md text-base text-white/80 sm:text-lg">
            {t.tagline}
          </p>
        </div>
      </div>

      {/* Download Card */}
      <div className="glass-card mb-16 overflow-hidden rounded-3xl border border-border p-8 shadow-lifted sm:p-12">
        {loading ? (
          <div className="flex flex-col items-center gap-4 py-10">
            <Loader2 className="size-8 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">{t.loading}</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center gap-5 py-10">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-rose-500/10">
              <AlertTriangle className="size-7 text-rose-500" />
            </div>
            <p className="text-sm text-muted-foreground">{t.error}</p>
            <button
              onClick={fetchVersion}
              className="rounded-xl bg-brand-gradient px-6 py-2.5 text-sm font-semibold text-white shadow-glow transition-all hover:opacity-90"
            >
              {t.retry}
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-8">
            {/* Version info */}
            <div className="flex flex-col items-center gap-2">
              <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                {t.latestVersion}
              </span>
              <p className="font-heading text-5xl font-black tracking-tight">
                v{displayVersion}
              </p>
              {versionInfo?.publishedAt && (
                <p className="text-sm text-muted-foreground">
                  {t.releasedOn} {formatDate(versionInfo.publishedAt)}
                </p>
              )}
            </div>

            {/* Download button */}
            <a
              href={downloadUrl}
              download
              className="group flex items-center gap-3 rounded-2xl bg-brand-gradient px-10 py-4 text-lg font-bold text-white shadow-glow transition-all hover:opacity-95 hover:shadow-lifted hover:brightness-110"
            >
              <Download className="size-5 transition-transform group-hover:-translate-y-0.5" />
              {versionInfo?.version
                ? `${t.downloadButton} v${versionInfo.version}`
                : t.downloadButtonFallback}
              <ArrowRight className="size-4 opacity-60 transition-transform group-hover:translate-x-0.5 rtl:rotate-180" />
            </a>

            {/* System requirements */}
            <div className="flex items-center gap-6 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Check className="size-3.5 text-emerald-500" />
                {t.requirementAndroid}
              </span>
              <span className="h-3 w-px bg-border" />
              <span className="flex items-center gap-1.5">
                <Check className="size-3.5 text-emerald-500" />
                {t.systemRequirements}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Platform Badges */}
      <div className="mb-16">
        <h2 className="mb-8 text-center font-heading text-2xl font-black tracking-tight">
          {t.subtitle}
        </h2>
        <div className="grid gap-5 sm:grid-cols-3">
          {/* Android */}
          <div className="group relative overflow-hidden rounded-2xl border border-emerald-500/30 bg-card p-6 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-lifted">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            <div className="relative">
              <div className="flex items-start justify-between">
                <div className="flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-glow">
                  <Smartphone className="size-6" />
                </div>
                <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                  {t.downloadButton.split(" ")[0]}
                </span>
              </div>
              <h3 className="mt-5 font-heading text-xl font-bold">{t.android}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                {t.androidDesc}
              </p>
            </div>
          </div>

          {/* Windows */}
          <div className="group relative overflow-hidden rounded-2xl border bg-card p-6 opacity-50 shadow-soft transition-all duration-300">
            <div className="relative">
              <div className="flex items-start justify-between">
                <div className="flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500/40 to-indigo-500/40 text-white/60">
                  <Monitor className="size-6" />
                </div>
                <span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">
                  {t.comingSoon}
                </span>
              </div>
              <h3 className="mt-5 font-heading text-xl font-bold">{t.windows}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                {t.windowsDesc}
              </p>
            </div>
          </div>

          {/* Mac */}
          <div className="group relative overflow-hidden rounded-2xl border bg-card p-6 opacity-50 shadow-soft transition-all duration-300">
            <div className="relative">
              <div className="flex items-start justify-between">
                <div className="flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-500/40 to-zinc-500/40 text-white/60">
                  <Apple className="size-6" />
                </div>
                <span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">
                  {t.comingSoon}
                </span>
              </div>
              <h3 className="mt-5 font-heading text-xl font-bold">{t.mac}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                {t.macDesc}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Features */}
      <div>
        <h2 className="mb-8 text-center font-heading text-2xl font-black tracking-tight">
          {t.features}
        </h2>
        <div className="grid gap-5 sm:grid-cols-2">
          {features.map((f) => {
            const Icon = f.icon;
            return (
              <div
                key={f.title}
                className="group relative overflow-hidden rounded-2xl border bg-card p-6 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-lifted"
              >
                <div
                  className={cn(
                    "absolute inset-0 opacity-0 bg-gradient-to-br transition-opacity duration-300 group-hover:opacity-100",
                    f.gradient,
                  )}
                />
                <div className="relative">
                  <div
                    className={cn(
                      "flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-glow",
                      f.iconBg,
                    )}
                  >
                    <Icon className="size-6" />
                  </div>
                  <h3 className="mt-5 font-heading text-lg font-bold">
                    {f.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {f.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
