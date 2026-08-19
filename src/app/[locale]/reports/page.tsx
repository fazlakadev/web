import { setRequestLocale } from "next-intl/server";
import { RequireAuth } from "@/components/require-auth";
import { ReportsPage } from "@/components/support/reports-page";

export const dynamic = "force-dynamic";

export default async function ReportsRoute({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <RequireAuth>
      <ReportsPage />
    </RequireAuth>
  );
}
