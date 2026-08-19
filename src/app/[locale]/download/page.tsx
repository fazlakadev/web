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

async function fetchLatestVersion(): Promise<{
  version: string;
  browser_download_url: string;
  release_notes?: string;
  published_at?: string;
} | null> {
  try {
    const apiBase =
      process.env.NEXT_PUBLIC_API_URL || "https://api.fazlaka.com";
    const res = await fetch(`${apiBase}/api/v1/app-version/latest`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.data ?? null;
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
  const version = await fetchLatestVersion();

  return (
    <DownloadClient
      locale={locale}
      version={version?.version ?? null}
      browserDownloadUrl={version?.browser_download_url ?? "#"}
      releaseNotes={version?.release_notes ?? null}
      publishedAt={version?.published_at ?? null}
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
