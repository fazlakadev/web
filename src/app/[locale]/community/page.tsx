import { setRequestLocale } from "next-intl/server";
import { RequireAuth } from "@/components/require-auth";
import { CommunityPage } from "@/components/community/community-page";

export const dynamic = "force-dynamic";

export default async function CommunityRoute({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <RequireAuth>
      <CommunityPage />
    </RequireAuth>
  );
}
