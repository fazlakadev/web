import { setRequestLocale } from "next-intl/server";
import { RequireAuth } from "@/components/require-auth";
import { SupportPage } from "@/components/support/support-page";

export const dynamic = "force-dynamic";

export default async function SupportRoute({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <RequireAuth>
      <SupportPage />
    </RequireAuth>
  );
}
