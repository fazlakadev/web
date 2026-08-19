"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";
import {
  CircleHelp,
  Inbox,
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

export function SupportPage() {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();

  const [tickets, setTickets] = useState<SupportTicket[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [priority, setPriority] = useState<TicketPriority>("medium");
  const [sending, setSending] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const load = useCallback(() => {
    setError(null);
    api
      .get<SupportTicket[]>("/support/tickets", { limit: 50 })
      .then((res) => setTickets(res.data))
      .catch(() => setError("support.loadFailed"));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

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
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <div className="mb-8 flex items-center gap-3">
        <span className="flex size-11 items-center justify-center rounded-2xl bg-brand-gradient text-primary-foreground shadow-glow">
          <CircleHelp className="size-5" />
        </span>
        <div>
          <h1 className="text-xl font-bold">{t("support.title")}</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {t("support.subtitle")}
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardContent className="p-6">
            <div className="mb-5 flex items-center gap-2">
              <Plus className="size-4 text-primary" />
              <h2 className="font-semibold">{t("support.newTicketTitle")}</h2>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="support-subject">{t("support.subject")}</Label>
                <Input
                  id="support-subject"
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
                <Label htmlFor="support-message">{t("support.message")}</Label>
                <Textarea
                  id="support-message"
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
                onClick={submit}
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
                            {t(STATUS_KEY[ticket.status])}
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
    </div>
  );
}
