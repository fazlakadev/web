import { setRequestLocale } from "next-intl/server";
import { RequireAuth } from "@/components/require-auth";
import { HelpPage } from "@/components/support/help-page";

export const dynamic = "force-dynamic";

export default async function HelpRoute({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <RequireAuth>
      <HelpPage />
    </RequireAuth>
  );
}
