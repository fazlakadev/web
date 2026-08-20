import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { DownloadClient } from "./client";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "download" });
  return {
    title: t("title"),
    description: t("description"),
    openGraph: {
      title: t("ogTitle"),
      description: t("ogDescription"),
      type: "website",
    },
  };
}

type VersionInfo = {
  version: string;
  downloadUrl: string;
  publishedAt?: string;
  htmlUrl?: string;
  forceUpdate?: boolean;
  minVersion?: string | null;
  forceUpdateMessage?: string | null;
} | null;

async function fetchPlatformVersion(platform: string): Promise<VersionInfo> {
  try {
    const apiBase =
      process.env.NEXT_PUBLIC_API_URL || "https://api.fazlaka.com";
    const res = await fetch(`${apiBase}/api/v1/app-version/latest`, {
      headers: { "x-app-platform": platform },
      cache: "no-store",
    });
    if (!res.ok) return null;
    const json = await res.json();
    const data = json.data ?? json;
    if (!data?.version) return null;
    return {
      version: data.version,
      downloadUrl: data.downloadUrl,
      publishedAt: data.publishedAt,
      htmlUrl: data.htmlUrl,
      forceUpdate: data.forceUpdate,
      minVersion: data.minVersion,
      forceUpdateMessage: data.forceUpdateMessage,
    };
  } catch {
    return null;
  }
}

export default async function DownloadPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("download");
  const [androidVersion, windowsVersion] = await Promise.all([
    fetchPlatformVersion("MOBILE"),
    fetchPlatformVersion("WINDOWS"),
  ]);

  return (
    <DownloadClient
      locale={locale}
      version={androidVersion?.version ?? null}
      downloadUrl={androidVersion?.downloadUrl ?? null}
      publishedAt={androidVersion?.publishedAt ?? null}
      htmlUrl={androidVersion?.htmlUrl ?? null}
      forceUpdate={androidVersion?.forceUpdate ?? false}
      minVersion={androidVersion?.minVersion ?? null}
      forceUpdateMessage={androidVersion?.forceUpdateMessage ?? null}
      windowsVersion={windowsVersion?.version ?? null}
      windowsDownloadUrl={windowsVersion?.downloadUrl ?? null}
      windowsPublishedAt={windowsVersion?.publishedAt ?? null}
      windowsHtmlUrl={windowsVersion?.htmlUrl ?? null}
      labels={{
        title: t("title"),
        tagline: t("tagline"),
        subtitle: t("subtitle"),
        downloadButton: t("downloadButton"),
        downloadButtonFallback: t("downloadButtonFallback"),
        latestVersion: t("latestVersion"),
        releasedOn: t("releasedOn"),
        android: t("android"),
        androidDesc: t("androidDesc"),
        windows: t("windows"),
        windowsDesc: t("windowsDesc"),
        mac: t("mac"),
        macDesc: t("macDesc"),
        comingSoon: t("comingSoon"),
        features: t("features"),
        feature1Title: t("feature1Title"),
        feature1Desc: t("feature1Desc"),
        feature2Title: t("feature2Title"),
        feature2Desc: t("feature2Desc"),
        feature3Title: t("feature3Title"),
        feature3Desc: t("feature3Desc"),
        feature4Title: t("feature4Title"),
        feature4Desc: t("feature4Desc"),
        loading: t("loading"),
        error: t("error"),
        retry: t("retry"),
        systemRequirements: t("systemRequirements"),
        requirementAndroid: t("requirementAndroid"),
      }}
    />
  );
}
