import { setRequestLocale } from "next-intl/server";
import { RequireAuth } from "@/components/require-auth";
import { ChatPage } from "@/components/chat";

export const dynamic = "force-dynamic";

export default async function ChatRoute({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  return (
    <RequireAuth>
      <ChatPage conversationId={id} />
    </RequireAuth>
  );
}
