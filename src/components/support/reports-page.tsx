"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";
import { Flag, Inbox, MessageSquareText } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { api } from "@/lib/api";
import { timeAgo } from "@/lib/format";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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

export function ReportsPage() {
  const t = useTranslations();
  const locale = useLocale();

  const [reports, setReports] = useState<ReportRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setError(null);
    api
      .get<ReportRow[]>("/reports/mine", { limit: 50 })
      .then((res) => setReports(res.data))
      .catch(() => setError("support.loadFailed"));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <div className="mb-8 flex items-center gap-3">
        <span className="flex size-11 items-center justify-center rounded-2xl bg-brand-gradient text-primary-foreground shadow-glow">
          <Flag className="size-5" />
        </span>
        <div>
          <h1 className="text-xl font-bold">{t("support.reportsTitle")}</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {t("support.reportsSubtitle")}
          </p>
        </div>
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
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
            <Inbox className="size-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              {t("support.reportsEmpty")}
            </p>
            <p className="text-xs text-muted-foreground">
              {t("support.reportsHint")}
            </p>
          </CardContent>
        </Card>
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
                      {t(STATUS_KEY[report.status])}
                    </Badge>
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
