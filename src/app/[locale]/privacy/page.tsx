import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ShieldCheck } from "lucide-react";
import { InfoPage } from "@/components/info-page";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "legal.privacy" });
  return { title: t("title") };
}

export default async function PrivacyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("legal");
  const sections = t.raw("privacy.sections") as Record<
    string,
    { h: string; p: string }
  >;

  return (
    <InfoPage
      icon={ShieldCheck}
      title={t("privacy.title")}
      updated={t("privacy.updated")}
      intro={t("privacy.intro")}
      sections={Object.values(sections)}
    />
  );
}
