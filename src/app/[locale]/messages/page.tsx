import { setRequestLocale } from "next-intl/server";
import { RequireAuth } from "@/components/require-auth";
import { MessagesPage } from "@/components/messages";

export const dynamic = "force-dynamic";

export default async function MessagesRoute({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <RequireAuth>
      <MessagesPage />
    </RequireAuth>
  );
}
