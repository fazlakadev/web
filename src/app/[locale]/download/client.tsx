"use client";

import { useEffect, useState, useRef, useCallback } from "react";
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
  ExternalLink,
  RefreshCw,
  Check,
  Package,
  Calendar,
} from "lucide-react";
import { cn } from "@/lib/format";

interface VersionInfo {
  version: string;
  downloadUrl: string | null;
  releaseNotes: string | null;
  publishedAt: string | null;
  htmlUrl: string | null;
  forceUpdate: boolean;
  minVersion: string | null;
  forceUpdateMessage: string | null;
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
  downloadUrl: initialUrl,
  publishedAt: initialDate,
  htmlUrl: initialHtmlUrl,
  forceUpdate: initialForceUpdate = false,
  minVersion: initialMinVersion = null,
  forceUpdateMessage: initialForceMessage = null,
  labels: t,
}: {
  locale: string;
  version: string | null;
  downloadUrl: string | null;
  publishedAt: string | null;
  htmlUrl: string | null;
  forceUpdate?: boolean;
  minVersion?: string | null;
  forceUpdateMessage?: string | null;
  labels: DownloadLabels;
}) {
  const [versionInfo, setVersionInfo] = useState<VersionInfo | null>(
    initialVersion
      ? {
          version: initialVersion,
          downloadUrl: initialUrl,
          releaseNotes: null,
          publishedAt: initialDate,
          htmlUrl: initialHtmlUrl,
          forceUpdate: initialForceUpdate,
          minVersion: initialMinVersion,
          forceUpdateMessage: initialForceMessage,
        }
      : null,
  );
  const [loading, setLoading] = useState(!initialVersion);
  const [error, setError] = useState(!initialVersion);
  const [newVersionAvailable, setNewVersionAvailable] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const currentVersionRef = useRef<string | null>(initialVersion);

  const fetchVersion = useCallback(async (isPoll = false) => {
    if (!isPoll) setLoading(true);
    if (isPoll) setIsRefreshing(true);
    setError(false);
    try {
      const apiBase =
        process.env.NEXT_PUBLIC_API_URL || "https://api.fazlaka.com";
      const res = await fetch(`${apiBase}/api/v1/app-version/latest`);
      if (!res.ok) throw new Error("Failed");
      const json = await res.json();
      const data = json.data ?? json;
      if (!data?.version) throw new Error("No data");
      const incoming: VersionInfo = {
        version: data.version,
        downloadUrl: data.downloadUrl ?? null,
        releaseNotes: data.releaseNotes ?? null,
        publishedAt: data.publishedAt ?? null,
        htmlUrl: data.htmlUrl ?? null,
        forceUpdate: data.forceUpdate ?? false,
        minVersion: data.minVersion ?? null,
        forceUpdateMessage: data.forceUpdateMessage ?? null,
      };
      if (isPoll && currentVersionRef.current && incoming.version !== currentVersionRef.current) {
        setNewVersionAvailable(true);
      }
      setVersionInfo(incoming);
      currentVersionRef.current = incoming.version;
    } catch {
      if (!isPoll) setError(true);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (!initialVersion) fetchVersion();
    pollTimerRef.current = setInterval(() => fetchVersion(true), 60000);
    return () => { if (pollTimerRef.current) clearInterval(pollTimerRef.current); };
  }, [initialVersion, fetchVersion]);

  const displayVersion = versionInfo?.version ?? "1.0.0";
  const downloadUrl = versionInfo?.downloadUrl;
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
    },
    {
      icon: Shield,
      title: t.feature2Title,
      desc: t.feature2Desc,
      gradient: "from-emerald-500/10 via-teal-500/10 to-cyan-500/10",
      iconBg: "bg-gradient-to-br from-emerald-500 to-teal-500",
    },
    {
      icon: Globe,
      title: t.feature3Title,
      desc: t.feature3Desc,
      gradient: "from-amber-500/10 via-orange-500/10 to-rose-500/10",
      iconBg: "bg-gradient-to-br from-amber-500 to-orange-500",
    },
    {
      icon: Users,
      title: t.feature4Title,
      desc: t.feature4Desc,
      gradient: "from-fuchsia-500/10 via-pink-500/10 to-rose-500/10",
      iconBg: "bg-gradient-to-br from-fuchsia-500 to-pink-500",
    },
  ];

  return (
    <div dir={dir} className="mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-20">
      {/* New Version Banner */}
      {newVersionAvailable && downloadUrl && (
        <div className="mb-8 animate-in fade-in slide-in-from-top-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-center backdrop-blur-sm">
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center sm:gap-4">
            <span className="flex items-center gap-2 text-sm font-semibold text-amber-700 dark:text-amber-300">
              <RefreshCw className="size-4" />
              {locale === "ar" ? `إصدار جديد v${displayVersion} متاح` : `New version v${displayVersion} is available`}
            </span>
            <a
              href={downloadUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl bg-brand-gradient px-5 py-2 text-sm font-bold text-white shadow-glow transition-all hover:opacity-95"
            >
              <Download className="size-4" />
              {t.downloadButton}
            </a>
          </div>
        </div>
      )}

      {/* Force Update Notice */}
      {versionInfo?.forceUpdate && versionInfo.forceUpdateMessage && (
        <div className="mb-8 animate-in fade-in slide-in-from-top-3 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-center backdrop-blur-sm">
          <div className="flex flex-col items-center gap-2">
            <span className="flex items-center gap-2 text-sm font-semibold text-rose-700 dark:text-rose-300">
              <AlertTriangle className="size-4" />
              {versionInfo.forceUpdateMessage}
            </span>
            {versionInfo.minVersion && (
              <span className="text-xs text-rose-500/80">
                {locale === "ar" ? `الإصدار الأدنى المطلوب: v${versionInfo.minVersion}` : `Minimum required version: v${versionInfo.minVersion}`}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Hero */}
      <div className="relative mb-16 overflow-hidden rounded-[2rem] bg-brand-gradient p-10 text-white shadow-glow sm:p-14">
        <div className="absolute -end-20 -top-20 h-56 w-56 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-24 -start-14 h-60 w-60 rounded-full bg-white/8 blur-3xl" />
        <div className="relative flex flex-col items-center text-center">
          <span className="mb-5 flex size-20 items-center justify-center rounded-[1.25rem] bg-white/15 shadow-glow backdrop-blur-sm animate-in zoom-in-95 duration-500">
            <Download className="size-10" />
          </span>
          <h1 className="font-heading text-3xl font-black tracking-tight sm:text-5xl animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150">
            {t.title}
          </h1>
          <p className="mt-4 max-w-lg text-base text-white/80 sm:text-lg animate-in fade-in slide-in-from-bottom-3 duration-700 delay-300">
            {t.tagline}
          </p>
          {versionInfo?.publishedAt && (
            <div className="mt-4 flex items-center gap-4 text-sm text-white/60 animate-in fade-in duration-700 delay-500">
              <span className="flex items-center gap-1.5">
                <Package className="size-3.5" />
                v{displayVersion}
              </span>
              <span className="h-3 w-px bg-white/20" />
              <span className="flex items-center gap-1.5">
                <Calendar className="size-3.5" />
                {formatDate(versionInfo.publishedAt)}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Platform Cards */}
      <div className="mb-16">
        <h2 className="mb-8 text-center font-heading text-2xl font-black tracking-tight sm:text-3xl animate-in fade-in duration-500">
          {t.subtitle}
        </h2>

        {loading ? (
          <div className="flex flex-col items-center gap-4 py-16">
            <Loader2 className="size-8 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">{t.loading}</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center gap-5 py-16">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-rose-500/10">
              <AlertTriangle className="size-7 text-rose-500" />
            </div>
            <p className="text-sm text-muted-foreground">{t.error}</p>
            <button
              onClick={() => fetchVersion()}
              className="rounded-xl bg-brand-gradient px-6 py-2.5 text-sm font-semibold text-white shadow-glow transition-all hover:opacity-90"
            >
              {t.retry}
            </button>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-3">
            {/* Android — Available */}
            <div className="group relative overflow-hidden rounded-2xl border border-emerald-500/30 bg-card p-6 shadow-soft transition-all duration-300 hover:-translate-y-1.5 hover:shadow-lifted hover:border-emerald-500/50 sm:p-7 animate-in fade-in slide-in-from-bottom-3 duration-500 delay-100">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              <div className="relative flex h-full flex-col">
                <div className="flex items-start justify-between">
                  <div className="flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-glow transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
                    <Smartphone className="size-7" />
                  </div>
                  <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    {t.latestVersion}
                  </span>
                </div>
                <h3 className="mt-5 font-heading text-xl font-bold">
                  {t.android}
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                  {t.androidDesc}
                </p>

                <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 font-semibold text-primary">
                    <Package className="size-3" />
                    v{displayVersion}
                  </span>
                  {versionInfo?.forceUpdate && (
                    <span className="flex items-center gap-1 rounded-full bg-rose-500/10 px-2.5 py-0.5 font-semibold text-rose-500">
                      <AlertTriangle className="size-3" />
                      Required
                    </span>
                  )}
                </div>

                <div className="mt-auto pt-5">
                  {downloadUrl ? (
                    <a
                      href={downloadUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cn(
                        "flex w-full items-center justify-center gap-2.5 rounded-xl px-5 py-3 text-sm font-bold text-white shadow-glow transition-all duration-300 hover:opacity-95 hover:shadow-lifted hover:brightness-110 active:scale-[0.98]",
                        versionInfo?.forceUpdate
                          ? "bg-gradient-to-r from-rose-500 to-orange-500"
                          : "bg-brand-gradient",
                      )}
                    >
                      <Download className="size-4" />
                      {t.downloadButton}
                      <ExternalLink className="size-3.5 opacity-60" />
                    </a>
                  ) : (
                    <div className="flex w-full items-center justify-center gap-2.5 rounded-xl bg-muted px-5 py-3 text-sm font-semibold text-muted-foreground">
                      <AlertTriangle className="size-4" />
                      {t.downloadButtonFallback}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Windows — Coming Soon */}
            <div className="group relative overflow-hidden rounded-2xl border border-border/50 bg-card p-6 sm:p-7 animate-in fade-in slide-in-from-bottom-3 duration-500 delay-200">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              <div className="relative flex h-full flex-col">
                <div className="flex items-start justify-between">
                  <div className="flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500/30 to-indigo-500/30 text-blue-500/70 transition-transform duration-300 group-hover:scale-110">
                    <Monitor className="size-7" />
                  </div>
                  <span className="rounded-full bg-muted px-3 py-1 text-xs font-bold text-muted-foreground">
                    {t.comingSoon}
                  </span>
                </div>
                <h3 className="mt-5 font-heading text-xl font-bold">
                  {t.windows}
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                  {t.windowsDesc}
                </p>
                <div className="mt-auto pt-5">
                  <div className="flex w-full items-center justify-center gap-2.5 rounded-xl border border-dashed border-border px-5 py-3 text-sm font-semibold text-muted-foreground">
                    <Monitor className="size-4 opacity-50" />
                    {t.comingSoon}
                  </div>
                </div>
              </div>
            </div>

            {/* Mac — Coming Soon */}
            <div className="group relative overflow-hidden rounded-2xl border border-border/50 bg-card p-6 sm:p-7 animate-in fade-in slide-in-from-bottom-3 duration-500 delay-300">
              <div className="absolute inset-0 bg-gradient-to-br from-slate-500/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              <div className="relative flex h-full flex-col">
                <div className="flex items-start justify-between">
                  <div className="flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-500/30 to-zinc-500/30 text-slate-500/70 transition-transform duration-300 group-hover:scale-110">
                    <Apple className="size-7" />
                  </div>
                  <span className="rounded-full bg-muted px-3 py-1 text-xs font-bold text-muted-foreground">
                    {t.comingSoon}
                  </span>
                </div>
                <h3 className="mt-5 font-heading text-xl font-bold">
                  {t.mac}
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                  {t.macDesc}
                </p>
                <div className="mt-auto pt-5">
                  <div className="flex w-full items-center justify-center gap-2.5 rounded-xl border border-dashed border-border px-5 py-3 text-sm font-semibold text-muted-foreground">
                    <Apple className="size-4 opacity-50" />
                    {t.comingSoon}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* What's New — sanitized summary instead of raw release notes */}
        {!loading && !error && versionInfo?.htmlUrl && (
          <div className="mt-8 rounded-2xl border border-border bg-card p-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-foreground mb-3">
              <RefreshCw className="size-4 text-primary" />
              {locale === "ar" ? "الإصدار الأخير" : "Latest Release"}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              {locale === "ar"
                ? `الإصدار v${displayVersion} متاح للتحميل. اضغط على الزر لعرض التفاصيل.`
                : `Version v${displayVersion} is available for download. Click the button for details.`}
            </p>
            <a
              href={versionInfo.htmlUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl bg-secondary/70 px-4 py-2 text-sm font-medium text-foreground transition-all hover:bg-secondary hover:shadow-sm"
            >
              <ExternalLink className="size-3.5" />
              {locale === "ar" ? "عرض على GitHub" : "View on GitHub"}
            </a>
          </div>
        )}
      </div>

      {/* Features */}
      <div>
        <h2 className="mb-8 text-center font-heading text-2xl font-black tracking-tight sm:text-3xl animate-in fade-in duration-500">
          {t.features}
        </h2>
        <div className="grid gap-5 sm:grid-cols-2">
          {features.map((f, i) => {
            const Icon = f.icon;
            return (
              <div
                key={f.title}
                className={cn(
                  "group relative overflow-hidden rounded-2xl border bg-card p-6 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-lifted animate-in fade-in slide-in-from-bottom-3 duration-500",
                  `delay-[${i * 100}ms]`,
                )}
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
                      "flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-glow transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3",
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
