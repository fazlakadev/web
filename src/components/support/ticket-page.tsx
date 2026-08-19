"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";
import {
  ArrowLeft,
  CircleHelp,
  ImagePlus,
  Loader2,
  Lock,
  Mic,
  PhoneCall,
  PhoneOff,
  Send,
  Square,
  Video,
} from "lucide-react";
import { Link } from "@/i18n/navigation";
import { API_BASE, api, getAccessToken } from "@/lib/api";
import { useUserRealtime } from "@/lib/realtime";
import { cn, formatDuration, timeAgo } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/providers/auth-provider";
import { AudioCall } from "./audio-call";

type TicketStatus = "open" | "pending" | "resolved" | "closed";
type TicketPriority = "low" | "medium" | "high" | "urgent";

interface SupportMessage {
  id: string;
  body: string;
  isAdminReply: boolean;
  isSystem?: boolean;
  senderId?: string | null;
  createdAt: string;
  attachments?: string[];
}

interface SupportTicketDetail {
  id: string;
  subject: string;
  status: TicketStatus;
  priority: TicketPriority;
  platform?: "WEB" | "MOBILE" | "DESKTOP" | null;
  createdAt: string;
  updatedAt: string;
  messages: SupportMessage[];
  calls?: CallSession[];
}

interface CallSession {
  id: string;
  status: "active" | "ended";
  startedAt: string;
  endedAt: string | null;
  durationSec: number | null;
}

const STATUS_KEY: Record<TicketStatus, string> = {
  open: "support.statusOpen",
  pending: "support.statusPending",
  resolved: "support.statusResolved",
  closed: "support.statusClosed",
};

const PRIORITY_KEY: Record<TicketPriority, string> = {
  low: "support.priorityLow",
  medium: "support.priorityMedium",
  high: "support.priorityHigh",
  urgent: "support.priorityUrgent",
};

export function TicketPage({ ticketId }: { ticketId: string }) {
  const t = useTranslations();
  const locale = useLocale();
  const { user } = useAuth();

  const [ticket, setTicket] = useState<SupportTicketDetail | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [closing, setClosing] = useState(false);
  const [recording, setRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [ringing, setRinging] = useState(false);

  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const videoInputRef = useRef<HTMLInputElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingStartRef = useRef(0);
  const recordingTimerRef = useRef<number | null>(null);

  const load = useCallback(() => {
    setError(null);
    api
      .get<SupportTicketDetail>(`/support/tickets/${ticketId}`)
      .then((res) => setTicket(res.data))
      .catch(() => setNotFound(true));
  }, [ticketId]);

  useEffect(() => {
    load();
  }, [load]);

  useUserRealtime(user?.id, {
    "support:update": (data) => {
      const payload = data as { ticketId?: string };
      if (!payload?.ticketId || payload.ticketId === ticketId) load();
    },
    "calls:incoming": (data) => {
      const payload = data as { ticketId?: string };
      if (payload?.ticketId && payload.ticketId === ticketId) setRinging(true);
    },
    "calls:ringStopped": (data) => {
      const payload = data as { ticketId?: string };
      if (!payload?.ticketId || payload.ticketId === ticketId) setRinging(false);
    },
  });

  const sendReply = async (attachments?: string[]) => {
    if (!body.trim() && !attachments?.length) return;
    setSending(true);
    setError(null);
    try {
      await api.post(`/support/tickets/${ticketId}/messages`, {
        message: body.trim(),
        ...(attachments?.length ? { attachments } : {}),
      });
      setBody("");
      load();
    } catch {
      setError("support.replyFailed");
    } finally {
      setSending(false);
    }
  };

  const uploadChatFile = async (
    file: File,
    kind: "image" | "video" | "audio",
    durationSec?: number,
  ) => {
    const form = new FormData();
    form.append("file", file);
    const params = new URLSearchParams({ kind });
    if (durationSec) params.set("durationSec", String(durationSec));
    const token = getAccessToken();
    const res = await fetch(`${API_BASE}/upload/chat?${params.toString()}`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: form,
    });
    const json = await res.json();
    if (!res.ok || json?.success === false) {
      throw new Error(json?.message || "upload_failed");
    }
    return json.data as {
      url: string;
      kind: "image" | "video" | "audio";
      mimeType: string;
      size: number;
      durationSec?: number | null;
    };
  };

  const onFilePicked = async (
    file: File | undefined,
    kind: "image" | "video",
  ) => {
    if (!file || sending) return;
    setSending(true);
    setError(null);
    try {
      const data = await uploadChatFile(file, kind);
      await sendReply([data.url]);
    } catch {
      setError("support.uploadFailed");
    } finally {
      setSending(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      audioChunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        stream.getTracks().forEach((tr) => tr.stop());
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const durationSec = Math.max(
          1,
          Math.round((Date.now() - recordingStartRef.current) / 1000),
        );
        void (async () => {
          try {
            const data = await uploadChatFile(blob as File, "audio", durationSec);
            await sendReply([data.url]);
          } catch {
            setError("support.uploadFailed");
          }
        })();
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
      recordingStartRef.current = Date.now();
      setRecordingSeconds(0);
      setRecording(true);
      recordingTimerRef.current = window.setInterval(() => {
        setRecordingSeconds(
          Math.round((Date.now() - recordingStartRef.current) / 1000),
        );
      }, 250);
    } catch {
      setError("support.micDenied");
    }
  };

  const stopRecording = () => {
    if (!mediaRecorderRef.current) return;
    if (recordingTimerRef.current) {
      window.clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    setRecording(false);
    try {
      mediaRecorderRef.current.stop();
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) {
        window.clearInterval(recordingTimerRef.current);
      }
      if (mediaRecorderRef.current?.state === "recording") {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  const renderAttachments = (attachments: string[]) =>
    attachments?.length ? (
      <div className="mt-2 flex flex-wrap gap-2">
        {attachments.map((url) => {
          const isImage = /\.(jpe?g|png|webp|gif|avif)(\?|$)/i.test(url);
          const isAudio = /\.(mp3|wav|ogg|webm|m4a|mp4)(\?|$)/i.test(url);
          if (isImage) {
            return (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={url}
                src={url}
                alt=""
                className="max-h-48 w-full rounded-lg object-cover"
              />
            );
          }
          if (isAudio) {
            return (
              <audio
                key={url}
                src={url}
                controls
                className="w-52 max-w-full"
              />
            );
          }
          return (
            <video
              key={url}
              src={url}
              controls
              playsInline
              className="max-h-48 w-full rounded-lg"
            />
          );
        })}
      </div>
    ) : null;

  const closeTicket = async () => {
    if (!window.confirm(t("support.closeConfirm"))) return;
    setClosing(true);
    setError(null);
    try {
      await api.patch(`/support/tickets/${ticketId}/status`, {
        status: "closed",
      });
      load();
    } catch {
      setError("support.ticketClosedFailed");
    } finally {
      setClosing(false);
    }
  };

  if (notFound) {
    return (
      <div className="mx-auto max-w-xl px-4 py-20 text-center">
        <CircleHelp className="mx-auto size-10 text-muted-foreground" />
        <h1 className="mt-4 text-xl font-bold">{t("support.ticketNotFound")}</h1>
        <Link
          href="/support"
          className="mt-2 inline-block text-sm text-primary hover:underline"
        >
          {t("support.backToTickets")}
        </Link>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20">
        <div className="space-y-3">
          <div className="h-6 w-1/3 animate-pulse rounded bg-secondary" />
          <div className="h-40 animate-pulse rounded-2xl bg-secondary" />
        </div>
      </div>
    );
  }

  const closed = ticket.status === "closed";

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <Link
        href="/support"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-primary"
      >
        <ArrowLeft className="size-4 rtl:rotate-180" />
        {t("support.backToTickets")}
      </Link>

      <div className="mb-6">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-xl font-bold">{ticket.subject}</h1>
          <Badge variant="secondary">{t(PRIORITY_KEY[ticket.priority])}</Badge>
          <Badge
            variant={
              ticket.status === "resolved" || ticket.status === "closed"
                ? "outline"
                : "default"
            }
          >
            {t(STATUS_KEY[ticket.status])}
          </Badge>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("support.createdAt", { date: timeAgo(ticket.createdAt, locale) })}
          {" • "}
          {t("support.updatedAt", { date: timeAgo(ticket.updatedAt, locale) })}
          {ticket.platform ? (
            <>
              {" • "}
              {t("support.platformLabel")}: {ticket.platform}
            </>
          ) : null}
        </p>
      </div>

      {!closed && (
        <div className="mb-6">
          <AudioCall
            ticketId={ticketId}
            role="user"
            ringing={ringing}
            onAnswer={() => setRinging(false)}
            onDecline={() => setRinging(false)}
            onActivity={() => {
              setTimeout(load, 800);
            }}
          />
        </div>
      )}

      {ticket.calls?.length ? (
        <div className="mb-6 rounded-2xl border border-border bg-card p-4">
          <h2 className="text-sm font-semibold">{t("calls.historyTitle")}</h2>
          <ul className="mt-3 space-y-2">
            {ticket.calls.map((call) => (
              <li
                key={call.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border/60 px-3 py-2"
              >
                <span className="flex items-center gap-2 text-sm">
                  {call.status === "active" ? (
                    <PhoneCall className="size-4 animate-pulse text-primary" />
                  ) : (
                    <PhoneOff className="size-4 text-muted-foreground" />
                  )}
                  {call.status === "active"
                    ? t("calls.historyActive")
                    : t("calls.historyEnded")}
                </span>
                <span className="text-xs text-muted-foreground">
                  {t("calls.historyStarted", {
                    date: timeAgo(call.startedAt, locale),
                  })}
                  {call.durationSec != null
                    ? ` • ${String(Math.floor(call.durationSec / 60)).padStart(2, "0")}:${String(call.durationSec % 60).padStart(2, "0")}`
                    : ""}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="space-y-4">
        {ticket.messages.map((message) => {
          if (message.isSystem) {
            return (
              <div key={message.id} className="flex justify-center">
                <p className="rounded-full border border-border bg-muted/50 px-4 py-1.5 text-center text-xs text-muted-foreground">
                  {t(`calls.${message.body}`, { defaultValue: message.body })}
                </p>
              </div>
            );
          }
          const mine = !message.isAdminReply;
          return (
            <div
              key={message.id}
              className={cn("flex", mine ? "justify-start" : "justify-end")}
            >
              <div
                className={cn(
                  "max-w-[85%] rounded-2xl border px-4 py-3",
                  mine
                    ? "border-border bg-card"
                    : "border-primary/20 bg-primary text-primary-foreground",
                )}
              >
                <div className="mb-1 flex items-center gap-2">
                  <span className="text-xs font-semibold">
                    {mine
                      ? user?.name || user?.username || "You"
                      : t("support.newTicket")}
                  </span>
                  {message.isAdminReply && (
                    <Badge
                      variant="outline"
                      className="border-primary/30 bg-transparent px-1.5 py-0 text-[10px] text-primary"
                    >
                      Staff
                    </Badge>
                  )}
                </div>
                <p
                  className={cn(
                    "whitespace-pre-wrap text-sm",
                    mine ? "" : "text-primary-foreground",
                  )}
                >
                  {message.body}
                </p>
                {renderAttachments(message.attachments ?? [])}
                <p
                  className={cn(
                    "mt-1.5 text-xs",
                    mine
                      ? "text-muted-foreground"
                      : "text-primary-foreground/70",
                  )}
                >
                  {timeAgo(message.createdAt, locale)}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {closed ? (
        <div className="mt-6 flex items-center gap-2 rounded-xl border border-border bg-muted/40 p-4 text-sm text-muted-foreground">
          <Lock className="size-4" />
          {t("support.closedNotice")}
        </div>
      ) : (
        <div className="mt-6 rounded-2xl border border-border bg-card p-4">
          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={4}
            maxLength={4000}
            placeholder={t("support.replyPlaceholder")}
          />
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0];
              e.target.value = "";
              void onFilePicked(f, "image");
            }}
          />
          <input
            ref={videoInputRef}
            type="file"
            accept="video/mp4,video/webm,video/ogg"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0];
              e.target.value = "";
              void onFilePicked(f, "video");
            }}
          />
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                type="button"
                disabled={sending || recording}
                onClick={() => imageInputRef.current?.click()}
                aria-label={t("messages.sendImage")}
                title={t("messages.sendImage")}
              >
                <ImagePlus className="size-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                type="button"
                disabled={sending || recording}
                onClick={() => videoInputRef.current?.click()}
                aria-label={t("messages.sendVideo")}
                title={t("messages.sendVideo")}
              >
                <Video className="size-5" />
              </Button>
              {recording ? (
                <Button
                  variant="ghost"
                  size="sm"
                  type="button"
                  className="gap-2 text-destructive"
                  onClick={stopRecording}
                >
                  <span className="size-2 animate-pulse rounded-full bg-destructive" />
                  {formatDuration(recordingSeconds)}
                  <Square className="size-3.5 fill-current" />
                  {t("messages.stopRecording")}
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  size="icon"
                  type="button"
                  disabled={sending}
                  onClick={() => void startRecording()}
                  aria-label={t("messages.recordVoice")}
                  title={t("messages.recordVoice")}
                >
                  <Mic className="size-5" />
                </Button>
              )}
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                type="button"
                onClick={closeTicket}
                disabled={closing}
                className="text-muted-foreground"
              >
                {closing ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Lock className="size-4" />
                )}
                {t("support.closeTicket")}
              </Button>
              {error && (
                <p className="text-sm font-medium text-destructive">
                  {t(error)}
                </p>
              )}
              <Button
                onClick={() => void sendReply()}
                disabled={sending || (!body.trim() && !recording)}
              >
                {sending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Send className="size-4" />
                )}
                {t(sending ? "support.sendingReply" : "support.sendReply")}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
