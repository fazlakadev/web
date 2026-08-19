import { setRequestLocale } from "next-intl/server";
import { RequireAuth } from "@/components/require-auth";
import { FriendsPage } from "@/components/friends";

export const dynamic = "force-dynamic";

export default async function FriendsRoute({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <RequireAuth>
      <FriendsPage />
    </RequireAuth>
  );
}
