import { setRequestLocale } from "next-intl/server";
import { RequireAuth } from "@/components/require-auth";
import { UserEpisodes } from "@/components/user-episodes";

export const dynamic = "force-dynamic";

export default async function HistoryPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <RequireAuth>
      <UserEpisodes mode="history" locale={locale} />
    </RequireAuth>
  );
}
