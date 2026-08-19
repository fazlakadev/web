import { setRequestLocale } from "next-intl/server";
import { PublicProfilePage } from "@/components/public-profile";

export const dynamic = "force-dynamic";

export default async function PublicProfileRoute({
  params,
}: {
  params: Promise<{ locale: string; username: string }>;
}) {
  const { locale, username } = await params;
  setRequestLocale(locale);
  return <PublicProfilePage username={decodeURIComponent(username)} />;
}
