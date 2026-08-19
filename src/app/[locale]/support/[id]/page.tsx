import { setRequestLocale } from "next-intl/server";
import { RequireAuth } from "@/components/require-auth";
import { TicketPage } from "@/components/support/ticket-page";

export const dynamic = "force-dynamic";

export default async function TicketRoute({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  return (
    <RequireAuth>
      <TicketPage ticketId={id} />
    </RequireAuth>
  );
}
