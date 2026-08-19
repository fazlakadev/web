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

  const displayVersion = versionInfo?.version ?? "1.2.0";
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
      gradient: "from-indigo-500/15 via-violet-500/15 to-fuchsia-500/15",
      hoverGradient: "from-indigo-500 via-violet-500 to-fuchsia-500",
      text: "text-indigo-600 dark:text-indigo-400",
    },
    {
      icon: Shield,
      title: t.feature2Title,
      desc: t.feature2Desc,
      gradient: "from-emerald-500/15 via-teal-500/15 to-cyan-500/15",
      hoverGradient: "from-emerald-500 via-teal-500 to-cyan-500",
      text: "text-emerald-600 dark:text-emerald-400",
    },
    {
      icon: Globe,
      title: t.feature3Title,
      desc: t.feature3Desc,
      gradient: "from-amber-500/15 via-orange-500/15 to-rose-500/15",
      hoverGradient: "from-amber-500 via-orange-500 to-rose-500",
      text: "text-amber-600 dark:text-amber-400",
    },
    {
      icon: Users,
      title: t.feature4Title,
      desc: t.feature4Desc,
      gradient: "from-fuchsia-500/15 via-pink-500/15 to-rose-500/15",
      hoverGradient: "from-fuchsia-500 via-pink-500 to-rose-500",
      text: "text-fuchsia-600 dark:text-fuchsia-400",
    },
  ];

  return (
    <div dir={dir} className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      {/* Hero */}
      <div className="relative mb-12 overflow-hidden rounded-[2rem] bg-brand-gradient p-8 text-white shadow-glow sm:p-12">
        <div className="absolute -end-16 -top-16 h-48 w-48 rounded-full bg-white/15 blur-3xl" />
        <div className="absolute -start-10 -bottom-20 h-56 w-56 rounded-full bg-white/10 blur-3xl" />
        <div className="relative flex flex-col items-center text-center">
          <span className="mb-4 flex size-16 items-center justify-center rounded-2xl bg-white/15 shadow-glow">
            <Download className="size-8" />
          </span>
          <h1 className="font-heading text-3xl font-black tracking-tight sm:text-4xl">
            {t.title}
          </h1>
          <p className="mt-3 max-w-lg text-sm text-white/85 sm:text-base">
            {t.tagline}
          </p>
        </div>
      </div>

      {/* Download Card */}
      <div className="glass-card mb-12 overflow-hidden rounded-3xl border border-border p-6 shadow-lifted sm:p-10">
        {loading ? (
          <div className="flex flex-col items-center gap-4 py-8">
            <Loader2 className="size-8 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">{t.loading}</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center gap-4 py-8">
            <div className="flex size-12 items-center justify-center rounded-full bg-rose-500/10">
              <AlertTriangle className="size-6 text-rose-500" />
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
          <div className="flex flex-col items-center gap-6">
            <div className="flex flex-col items-center gap-2">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {t.latestVersion}
              </p>
              <p className="font-heading text-4xl font-black tracking-tight">
                v{displayVersion}
              </p>
              {versionInfo?.publishedAt && (
                <p className="text-xs text-muted-foreground">
                  {t.releasedOn} {formatDate(versionInfo.publishedAt)}
                </p>
              )}
            </div>

            <a
              href={downloadUrl}
              download
              className="group flex items-center gap-3 rounded-2xl bg-brand-gradient px-8 py-4 text-lg font-bold text-white shadow-glow transition-all hover:opacity-90 hover:shadow-lifted"
            >
              <Download className="size-5 transition-transform group-hover:-translate-y-0.5" />
              {versionInfo?.version
                ? `${t.downloadButton} v${versionInfo.version}`
                : t.downloadButtonFallback}
            </a>

            <p className="text-xs text-muted-foreground">
              {t.systemRequirements}: {t.requirementAndroid}
            </p>
          </div>
        )}
      </div>

      {/* Platform Badges */}
      <div className="mb-12">
        <h2 className="mb-6 text-center font-heading text-xl font-bold tracking-tight">
          {t.subtitle}
        </h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {/* Android */}
          <div className="relative overflow-hidden rounded-2xl border border-emerald-500/30 bg-card p-5 shadow-soft transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lifted">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 transition-opacity duration-300 hover:opacity-100" />
            <div className="relative">
              <div className="flex items-start justify-between">
                <div className="flex size-11 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-glow">
                  <Smartphone className="size-5" />
                </div>
                <span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                  {t.downloadButton.split(" ")[0]}
                </span>
              </div>
              <h3 className="mt-4 font-heading text-lg font-bold">{t.android}</h3>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {t.androidDesc}
              </p>
            </div>
          </div>

          {/* Windows */}
          <div className="relative overflow-hidden rounded-2xl border bg-card p-5 opacity-60 shadow-soft transition-all duration-300">
            <div className="relative">
              <div className="flex items-start justify-between">
                <div className="flex size-11 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500/50 to-indigo-500/50 text-white/70">
                  <Monitor className="size-5" />
                </div>
                <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-semibold text-muted-foreground">
                  {t.comingSoon}
                </span>
              </div>
              <h3 className="mt-4 font-heading text-lg font-bold">{t.windows}</h3>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {t.windowsDesc}
              </p>
            </div>
          </div>

          {/* Mac */}
          <div className="relative overflow-hidden rounded-2xl border bg-card p-5 opacity-60 shadow-soft transition-all duration-300">
            <div className="relative">
              <div className="flex items-start justify-between">
                <div className="flex size-11 items-center justify-center rounded-xl bg-gradient-to-br from-slate-500/50 to-zinc-500/50 text-white/70">
                  <Apple className="size-5" />
                </div>
                <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-semibold text-muted-foreground">
                  {t.comingSoon}
                </span>
              </div>
              <h3 className="mt-4 font-heading text-lg font-bold">{t.mac}</h3>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {t.macDesc}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Features */}
      <div>
        <h2 className="mb-6 text-center font-heading text-xl font-bold tracking-tight">
          {t.features}
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {features.map((f) => {
            const Icon = f.icon;
            return (
              <div
                key={f.title}
                className="group relative overflow-hidden rounded-2xl border bg-card p-5 shadow-soft transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lifted"
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
                      "flex size-11 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-glow transition-colors",
                      f.hoverGradient,
                    )}
                  >
                    <Icon className="size-5" />
                  </div>
                  <h3 className="mt-4 font-heading text-lg font-bold">
                    {f.title}
                  </h3>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
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
