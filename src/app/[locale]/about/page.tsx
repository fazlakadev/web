import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Sparkles } from "lucide-react";
import { InfoPage } from "@/components/info-page";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "legal.about" });
  return { title: t("title") };
}

export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("legal");
  const sections = t.raw("about.sections") as Record<
    string,
    { h: string; p: string }
  >;

  return (
    <InfoPage
      icon={Sparkles}
      title={t("about.title")}
      intro={t("about.intro")}
      sections={Object.values(sections)}
    />
  );
}
