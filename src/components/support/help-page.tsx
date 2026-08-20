"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";
import {
  CircleHelp,
  Flag,
  Inbox,
  LifeBuoy,
  Loader2,
  MessageSquareText,
  Plus,
  Send,
} from "lucide-react";
import { Link, useRouter } from "@/i18n/navigation";
import { api } from "@/lib/api";
import { cn, timeAgo } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

type Tab = "tickets" | "reports";

type TicketStatus = "open" | "pending" | "resolved" | "closed";
type TicketPriority = "low" | "medium" | "high" | "urgent";

interface SupportTicket {
  id: string;
  subject: string;
  status: TicketStatus;
  priority: TicketPriority;
  platform?: "WEB" | "MOBILE" | "DESKTOP" | null;
  createdAt: string;
  updatedAt: string;
  _count?: { messages: number };
}

type ReportStatus = "pending" | "reviewing" | "resolved" | "dismissed";

interface ReportRow {
  id: string;
  contentType: string;
  contentId: string;
  reason: string;
  note?: string | null;
  status: ReportStatus;
  platform?: "WEB" | "MOBILE" | "DESKTOP" | null;
  createdAt: string;
  _count?: { messages: number };
}

const TICKET_STATUS_KEY: Record<TicketStatus, string> = {
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

const REPORT_STATUS_KEY: Record<ReportStatus, string> = {
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

const TABS: { key: Tab; icon: typeof LifeBuoy; labelKey: string }[] = [
  { key: "tickets", icon: LifeBuoy, labelKey: "help.tabTickets" },
  { key: "reports", icon: Flag, labelKey: "help.tabReports" },
];

export function HelpPage() {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<Tab>("tickets");

  const [tickets, setTickets] = useState<SupportTicket[] | null>(null);
  const [ticketsError, setTicketsError] = useState<string | null>(null);

  const [reports, setReports] = useState<ReportRow[] | null>(null);
  const [reportsError, setReportsError] = useState<string | null>(null);

  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [priority, setPriority] = useState<TicketPriority>("medium");
  const [sending, setSending] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const loadTickets = useCallback(() => {
    setTicketsError(null);
    api
      .get<SupportTicket[]>("/support/tickets", { limit: 50 })
      .then((res) => setTickets(res.data))
      .catch(() => setTicketsError("support.loadFailed"));
  }, []);

  const loadReports = useCallback(() => {
    setReportsError(null);
    api
      .get<ReportRow[]>("/reports/mine", { limit: 50 })
      .then((res) => setReports(res.data))
      .catch(() => setReportsError("support.loadFailed"));
  }, []);

  useEffect(() => {
    if (activeTab === "tickets" && tickets === null) {
      loadTickets();
    } else if (activeTab === "reports" && reports === null) {
      loadReports();
    }
  }, [activeTab, tickets, reports, loadTickets, loadReports]);

  const submit = async () => {
    if (!subject.trim() || !message.trim()) {
      setFormError("support.required");
      return;
    }
    setFormError(null);
    setSending(true);
    try {
      const res = await api.post<{ id: string }>("/support/tickets", {
        subject: subject.trim(),
        message: message.trim(),
        priority,
        deviceInfo: navigator.userAgent,
      });
      router.push(`/support/${res.data.id}`);
    } catch {
      setFormError("support.submitFailed");
      setSending(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="mb-8 flex items-center gap-3">
        <span className="flex size-11 items-center justify-center rounded-2xl bg-brand-gradient text-primary-foreground shadow-glow">
          <CircleHelp className="size-5" />
        </span>
        <div>
          <h1 className="text-xl font-bold">{t("help.title")}</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {t("help.subtitle")}
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-6 md:flex-row">
        <nav className="flex gap-2 md:w-56 md:flex-col">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  "glass-card flex items-center gap-3 rounded-xl border px-4 py-3 text-sm font-medium transition-colors",
                  active
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon className="size-4 shrink-0" />
                <span className="hidden sm:inline">{t(tab.labelKey)}</span>
              </button>
            );
          })}
        </nav>

        <div className="min-w-0 flex-1">
          {activeTab === "tickets" ? (
            <TicketsSection
              t={t}
              locale={locale}
              tickets={tickets}
              error={ticketsError}
              subject={subject}
              setSubject={setSubject}
              message={message}
              setMessage={setMessage}
              priority={priority}
              setPriority={setPriority}
              sending={sending}
              formError={formError}
              onSubmit={submit}
            />
          ) : (
            <ReportsSection
              t={t}
              locale={locale}
              reports={reports}
              error={reportsError}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function TicketsSection({
  t,
  locale,
  tickets,
  error,
  subject,
  setSubject,
  message,
  setMessage,
  priority,
  setPriority,
  sending,
  formError,
  onSubmit,
}: {
  t: ReturnType<typeof useTranslations>;
  locale: string;
  tickets: SupportTicket[] | null;
  error: string | null;
  subject: string;
  setSubject: (v: string) => void;
  message: string;
  setMessage: (v: string) => void;
  priority: TicketPriority;
  setPriority: (v: TicketPriority) => void;
  sending: boolean;
  formError: string | null;
  onSubmit: () => void;
}) {
  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-6">
          <div className="mb-5 flex items-center gap-2">
            <Plus className="size-4 text-primary" />
            <h2 className="font-semibold">{t("support.newTicketTitle")}</h2>
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="help-subject">{t("support.subject")}</Label>
              <Input
                id="help-subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                maxLength={200}
                placeholder={t("support.subjectPlaceholder")}
              />
            </div>

            <div className="space-y-1.5">
              <Label>{t("support.priority")}</Label>
              <div className="flex flex-wrap gap-2">
                {(["low", "medium", "high", "urgent"] as TicketPriority[]).map(
                  (p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPriority(p)}
                      className={cn(
                        "rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
                        priority === p
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border text-muted-foreground hover:text-foreground",
                      )}
                    >
                      {t(PRIORITY_KEY[p])}
                    </button>
                  ),
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="help-message">{t("support.message")}</Label>
              <Textarea
                id="help-message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={5}
                maxLength={4000}
                placeholder={t("support.messagePlaceholder")}
              />
            </div>

            {(formError || error) && (
              <p className="text-sm font-medium text-destructive">
                {t(formError ?? error!)}
              </p>
            )}

            <Button
              onClick={onSubmit}
              disabled={sending}
              className="w-full gap-2"
            >
              {sending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Send className="size-4" />
              )}
              {t(sending ? "support.submitting" : "support.submit")}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="mb-5 flex items-center gap-2">
            <Inbox className="size-4 text-primary" />
            <h2 className="font-semibold">{t("support.myTickets")}</h2>
          </div>

          {tickets === null ? (
            <div className="space-y-3">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="h-20 animate-pulse rounded-xl bg-secondary"
                />
              ))}
            </div>
          ) : tickets.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-10 text-center">
              <Inbox className="size-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                {t("support.empty")}
              </p>
              <p className="text-xs text-muted-foreground">
                {t("support.openTickets")}
              </p>
            </div>
          ) : (
            <ul className="space-y-2.5">
              {tickets.map((ticket) => (
                <li key={ticket.id}>
                  <Link
                    href={`/support/${ticket.id}`}
                    className="group block rounded-xl border border-border p-4 transition-colors hover:border-primary/40 hover:bg-muted/40"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-start gap-2.5">
                        <MessageSquareText className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold">
                            {ticket.subject}
                          </p>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {t("support.updatedAt", {
                              date: timeAgo(ticket.updatedAt, locale),
                            })}
                            {" • "}
                            {ticket._count
                              ? t("support.messagesCount", {
                                  count: ticket._count.messages,
                                })
                              : ""}
                          </p>
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <Badge variant="secondary">
                          {t(PRIORITY_KEY[ticket.priority])}
                        </Badge>
                        <Badge
                          variant={
                            ticket.status === "resolved" ||
                            ticket.status === "closed"
                              ? "outline"
                              : "default"
                          }
                        >
                          {t(TICKET_STATUS_KEY[ticket.status])}
                        </Badge>
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function ReportsSection({
  t,
  locale,
  reports,
  error,
}: {
  t: ReturnType<typeof useTranslations>;
  locale: string;
  reports: ReportRow[] | null;
  error: string | null;
}) {
  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-6">
          <div className="mb-5 flex items-center gap-2">
            <Flag className="size-4 text-primary" />
            <h2 className="font-semibold">{t("support.reportsTitle")}</h2>
          </div>

          {error ? (
            <p className="text-sm font-medium text-destructive">{t(error)}</p>
          ) : reports === null ? (
            <div className="space-y-3">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="h-20 animate-pulse rounded-xl bg-secondary"
                />
              ))}
            </div>
          ) : reports.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-10 text-center">
              <Inbox className="size-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                {t("support.reportsEmpty")}
              </p>
              <p className="text-xs text-muted-foreground">
                {t("support.reportsHint")}
              </p>
            </div>
          ) : (
            <ul className="space-y-2.5">
              {reports.map((report) => (
                <li key={report.id}>
                  <Link
                    href={`/reports/${report.id}`}
                    className="group block rounded-xl border border-border p-4 transition-colors hover:border-primary/40 hover:bg-muted/40"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-start gap-2.5">
                        <MessageSquareText className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold capitalize">
                            {t(REASON_KEY[report.reason] ?? "support.reasonOther")}
                          </p>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {t("support.reportContentType")}: {report.contentType}
                            {" • "}
                            {t("support.reportedAt", {
                              date: timeAgo(report.createdAt, locale),
                            })}
                            {report._count
                              ? ` • ${t("support.messagesCount", {
                                  count: report._count.messages,
                                })}`
                              : ""}
                          </p>
                          {report.note ? (
                            <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                              {report.note}
                            </p>
                          ) : null}
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <Badge
                          variant={
                            report.status === "resolved" ||
                            report.status === "dismissed"
                              ? "outline"
                              : "default"
                          }
                        >
                          {t(REPORT_STATUS_KEY[report.status])}
                        </Badge>
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
