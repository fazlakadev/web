import { setRequestLocale } from "next-intl/server";
import { RequireAuth } from "@/components/require-auth";
import { ReportTicketPage } from "@/components/support/report-ticket-page";

export const dynamic = "force-dynamic";

export default async function ReportTicketRoute({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  return (
    <RequireAuth>
      <ReportTicketPage reportId={id} />
    </RequireAuth>
  );
}
