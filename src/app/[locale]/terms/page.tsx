import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ScrollText } from "lucide-react";
import { InfoPage } from "@/components/info-page";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "legal.terms" });
  return { title: t("title") };
}

export default async function TermsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("legal");
  const sections = t.raw("terms.sections") as Record<
    string,
    { h: string; p: string }
  >;

  return (
    <InfoPage
      icon={ScrollText}
      title={t("terms.title")}
      updated={t("terms.updated")}
      intro={t("terms.intro")}
      sections={Object.values(sections)}
    />
  );
}
