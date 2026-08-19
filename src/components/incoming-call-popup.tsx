"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Loader2, PhoneCall, PhoneOff } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { useAuth } from "@/providers/auth-provider";
import { useUserRealtime } from "@/lib/realtime";
import { callSounds } from "@/lib/call-sounds";
import { setPendingJoin } from "@/lib/call-popup";
import { Button } from "@/components/ui/button";

interface IncomingPayload {
  ticketId?: string;
  role?: string;
  name?: string;
}

export function IncomingCallPopup() {
  const t = useTranslations();
  const router = useRouter();
  const { user } = useAuth();
  const [incoming, setIncoming] = useState<IncomingPayload | null>(null);
  const [leaving, setLeaving] = useState(false);
  const notifiedRef = useRef<string | null>(null);

  useUserRealtime(user?.id, {
    "calls:incoming": (data) => {
      const payload = data as IncomingPayload;
      if (!payload?.ticketId) return;
      const onTicketPage =
        typeof window !== "undefined" &&
        window.location.pathname.endsWith(`/support/${payload.ticketId}`);
      if (onTicketPage) return;
      setIncoming((prev) => {
        if (prev?.ticketId === payload.ticketId) return prev;
        return payload;
      });
      if (notifiedRef.current !== payload.ticketId) {
        notifiedRef.current = payload.ticketId;
        try {
          if ("Notification" in window && Notification.permission === "granted") {
            new Notification(t("calls.incoming"), {
              body: t("calls.incomingSubtitle"),
              icon: "/favicon.ico",
              tag: `call-${payload.ticketId}`,
            });
          }
        } catch {
          /* ignore */
        }
      }
    },
    "calls:ringStopped": (data) => {
      const payload = data as IncomingPayload;
      if (!payload?.ticketId) return;
      setIncoming(null);
      callSounds.stopRing();
    },
  });

  useEffect(() => {
    if (incoming) callSounds.startRing();
    else callSounds.stopRing();
    return () => callSounds.stopRing();
  }, [incoming]);

  if (!incoming) return null;

  const answer = () => {
    callSounds.chime(true);
    callSounds.stopRing();
    setPendingJoin(incoming.ticketId ?? null);
    setIncoming(null);
    router.push(`/support/${incoming.ticketId}`);
  };

  const decline = () => {
    setLeaving(true);
    callSounds.chime(false);
    callSounds.stopRing();
    setIncoming(null);
    setLeaving(false);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/95 p-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-3xl border border-primary/30 bg-card p-6 text-center shadow-2xl">
        <div className="mx-auto flex size-16 animate-pulse items-center justify-center rounded-full bg-primary/15 text-primary">
          <PhoneCall className="size-8" />
        </div>
        <h2 className="mt-4 text-xl font-bold">{t("calls.incoming")}</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("calls.incomingFromSupport")}
        </p>
        <div className="mt-6 grid grid-cols-2 gap-3">
          <Button
            variant="destructive"
            size="lg"
            disabled={leaving}
            onClick={decline}
          >
            <PhoneOff className="size-5" />
            {t("calls.decline")}
          </Button>
          <Button
            variant="default"
            size="lg"
            disabled={leaving}
            onClick={answer}
          >
            {leaving ? (
              <Loader2 className="size-5 animate-spin" />
            ) : (
              <PhoneCall className="size-5" />
            )}
            {t("calls.answer")}
          </Button>
        </div>
      </div>
    </div>
  );
}
