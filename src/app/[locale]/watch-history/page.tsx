import { setRequestLocale } from "next-intl/server";
import { WatchHistoryPage } from "@/components/watch-history/watch-history-page";

export const dynamic = "force-dynamic";

export default async function WatchHistory({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <WatchHistoryPage locale={locale} />;
}