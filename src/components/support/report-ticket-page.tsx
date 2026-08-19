"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";
import { ArrowLeft, CircleHelp, Loader2, Send } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { api } from "@/lib/api";
import { cn, timeAgo } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/providers/auth-provider";

type ReportStatus = "pending" | "reviewing" | "resolved" | "dismissed";

interface ReportMessage {
  id: string;
  senderType: "admin" | "user";
  body: string;
  createdAt: string;
}

interface ReportDetail {
  id: string;
  contentType: string;
  contentId: string;
  reason: string;
  note?: string | null;
  status: ReportStatus;
  platform?: "WEB" | "MOBILE" | "DESKTOP" | null;
  createdAt: string;
  handledBy?: { username: string; displayName?: string | null } | null;
  messages: ReportMessage[];
}

const STATUS_KEY: Record<ReportStatus, string> = {
  pending: "support.reportStatusPending",
  reviewing: "support.reportStatusReviewing",
  resolved: "support.reportStatusResolved",
  dismissed: "support.reportStatusDismissed",
};

const REASON_KEY: Record<string, string> = {
  spam: "support.reasonSpam",
  abuse: "support.reasonAbuse",
  copyright: "support.reasonCopyright",
  other: "support.reasonOther",
};

export function ReportTicketPage({ reportId }: { reportId: string }) {
  const t = useTranslations();
  const locale = useLocale();
  const { user } = useAuth();

  const [report, setReport] = useState<ReportDetail | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const threadRef = useRef<HTMLDivElement>(null);

  const load = useCallback(() => {
    setError(null);
    api
      .get<ReportDetail>(`/reports/${reportId}`)
      .then((res) => setReport(res.data))
      .catch(() => setNotFound(true));
  }, [reportId]);

  useEffect(() => {
    load();
  }, [load]);

  const messageCount = report?.messages.length ?? 0;

  useEffect(() => {
    if (!messageCount) return;
    threadRef.current?.scrollTo({ top: threadRef.current.scrollHeight });
  }, [messageCount, report?.id]);

  const sendReply = async () => {
    if (!body.trim()) return;
    setSending(true);
    setError(null);
    try {
      await api.post(`/reports/${reportId}/messages`, { body: body.trim() });
      setBody("");
      load();
    } catch {
      setError("support.replyFailed");
    } finally {
      setSending(false);
    }
  };

  if (notFound) {
    return (
      <div className="mx-auto max-w-xl px-4 py-20 text-center">
        <CircleHelp className="mx-auto size-10 text-muted-foreground" />
        <h1 className="mt-4 text-xl font-bold">{t("support.reportNotFound")}</h1>
        <Link
          href="/reports"
          className="mt-2 inline-block text-sm text-primary hover:underline"
        >
          {t("support.backToTickets")}
        </Link>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20">
        <div className="space-y-3">
          <div className="h-6 w-1/3 animate-pulse rounded bg-secondary" />
          <div className="h-40 animate-pulse rounded-2xl bg-secondary" />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <Link
        href="/reports"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-primary"
      >
        <ArrowLeft className="size-4 rtl:rotate-180" />
        {t("support.backToTickets")}
      </Link>

      <div className="mb-6">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-xl font-bold capitalize">
            {t(REASON_KEY[report.reason] ?? "support.reasonOther")}
          </h1>
          <Badge
            variant={
              report.status === "resolved" || report.status === "dismissed"
                ? "outline"
                : "default"
            }
          >
            {t(STATUS_KEY[report.status])}
          </Badge>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("support.reportedAt", { date: timeAgo(report.createdAt, locale) })}
          {report.handledBy
            ? ` • ${t("support.handledBy")}: ${report.handledBy.username}`
            : ""}
        </p>

        <div className="mt-4 grid gap-3 rounded-2xl border border-border bg-card p-4 text-sm sm:grid-cols-2">
          <div>
            <p className="text-xs text-muted-foreground">
              {t("support.reportContentType")}
            </p>
            <p className="mt-0.5 font-medium">{report.contentType}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">
              {t("support.reportContentId")}
            </p>
            <p className="mt-0.5 truncate font-medium">{report.contentId}</p>
          </div>
          {report.note ? (
            <div className="sm:col-span-2">
              <p className="text-xs text-muted-foreground">
                {t("support.reportReason")}
              </p>
              <p className="mt-0.5 whitespace-pre-wrap">{report.note}</p>
            </div>
          ) : null}
        </div>
      </div>

      <div
        ref={threadRef}
        className="flex max-h-[60vh] min-h-52 flex-col gap-3 overflow-y-auto rounded-2xl border border-border bg-card p-4"
      >
        {report.messages.length === 0 ? (
          <div className="m-auto text-center text-sm text-muted-foreground">
            <CircleHelp className="mx-auto mb-2 size-6" />
            {t("support.noMessages")}
          </div>
        ) : (
          report.messages.map((message) => {
            const mine = message.senderType === "user";
            return (
              <div
                key={message.id}
                className={cn("flex", mine ? "justify-end" : "justify-start")}
              >
                <div
                  className={cn(
                    "max-w-[85%] rounded-2xl border px-4 py-3",
                    mine
                      ? "border-primary/20 bg-primary text-primary-foreground"
                      : "border-border bg-secondary/70",
                  )}
                >
                  <div className="mb-1 text-xs font-semibold">
                    {mine
                      ? user?.name || user?.username || t("support.you")
                      : t("support.supportTeam")}
                  </div>
                  <p className="whitespace-pre-wrap text-sm">{message.body}</p>
                  <p
                    className={cn(
                      "mt-1.5 text-xs",
                      mine ? "text-primary-foreground/70" : "text-muted-foreground",
                    )}
                  >
                    {timeAgo(message.createdAt, locale)}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="mt-6 rounded-2xl border border-border bg-card p-4">
        <Textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={4}
          maxLength={2000}
          placeholder={t("support.replyPlaceholder")}
        />
        <div className="mt-3 flex flex-wrap items-center justify-end gap-3">
          {error && (
            <p className="text-sm font-medium text-destructive">{t(error)}</p>
          )}
          <Button onClick={sendReply} disabled={sending || !body.trim()}>
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
  );
}
