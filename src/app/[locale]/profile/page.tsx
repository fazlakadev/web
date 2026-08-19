import { setRequestLocale } from "next-intl/server";
import ProfilePage from "@/components/profile";

export const dynamic = "force-dynamic";

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <ProfilePage />;
}
