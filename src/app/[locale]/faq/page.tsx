import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { HelpCircle } from "lucide-react";
import { InfoPage } from "@/components/info-page";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "legal.faq" });
  return { title: t("title") };
}

export default async function FaqPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("legal");
  const items = t.raw("faq.items") as Record<string, { q: string; a: string }>;

  return (
    <InfoPage
      icon={HelpCircle}
      title={t("faq.title")}
      intro={t("faq.intro")}
      faq={Object.values(items)}
    />
  );
}
