"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { Flag, Loader2, Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/providers/auth-provider";
import { api } from "@/lib/api";
import { useRouter } from "@/i18n/navigation";

const REASONS = [
  "spam",
  "harassment",
  "inappropriate",
  "copyright",
  "impersonation",
  "other",
] as const;

export function ReportButton({
  contentType,
  contentId,
}: {
  contentType: string;
  contentId: string;
}) {
  const t = useTranslations();
  const { token } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<string>("spam");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    setSubmitting(true);
    try {
      await api.post("/reports", {
        contentType,
        contentId,
        reason,
        note: note.trim() || undefined,
      });
      toast.success(t("support.reportSubmitted"), {
          action: {
            label: t("support.reportSubmittedLink"),
            onClick: () => {
              void router.push("/reports");
            },
          },
      });
      setOpen(false);
      setNote("");
    } catch (e) {
      const msg = (e as { message?: string })?.message ?? "";
      if (
        msg.includes("already") ||
        msg.includes("مكرر") ||
        msg.includes("déjà")
      ) {
        toast.error(t("support.reportDuplicate"));
      } else if (msg.toLowerCase().includes("verify")) {
        toast.info(t("auth.verifyEmailNotice"), {
          action: {
            label: t("auth.verifyNow"),
            onClick: () => {
              void router.push("/verify-email");
            },
          },
        });
      } else {
        toast.error(t("common.error"));
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        className="gap-2"
        onClick={() => {
          if (!token) {
            toast.info(t("support.reportLogin"));
            return;
          }
          setOpen(true);
        }}
      >
        <Flag className="size-4" />
        {t("support.reportButton")}
      </Button>

      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-md overflow-hidden rounded-2xl border border-border bg-background shadow-lifted"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
              <div className="flex items-center gap-2">
                <Flag className="size-4 text-destructive" />
                <h2 className="text-sm font-bold">{t("support.reportTitle")}</h2>
              </div>
              <button
                type="button"
                aria-label="Close"
                onClick={() => setOpen(false)}
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="space-y-4 p-5">
              <p className="text-sm text-muted-foreground">
                {t("support.reportSubtitle")}
              </p>

              <div className="space-y-2">
                <Label className="text-xs font-semibold">
                  {t("support.reportReasonLabel")}
                </Label>
                <div className="grid gap-2">
                  {REASONS.map((r) => (
                    <label
                      key={r}
                      className={`flex cursor-pointer items-center gap-2.5 rounded-lg border px-3 py-2 text-sm transition-colors ${
                        reason === r
                          ? "border-primary bg-primary/10"
                          : "border-border hover:bg-accent"
                      }`}
                    >
                      <input
                        type="radio"
                        name="report-reason"
                        value={r}
                        checked={reason === r}
                        onChange={() => setReason(r)}
                        className="size-3.5 accent-primary"
                      />
                      {t(`support.reason${r.charAt(0).toUpperCase()}${r.slice(1)}`)}
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-semibold">
                  {t("support.reportNote")}
                </Label>
                <Textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder={t("support.reportNotePlaceholder")}
                  rows={3}
                  maxLength={500}
                />
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setOpen(false)}
                >
                  {t("common.cancel")}
                </Button>
                <Button
                  size="sm"
                  className="gap-1.5"
                  onClick={() => void submit()}
                  disabled={submitting}
                >
                  {submitting ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <Send className="size-3.5" />
                  )}
                  {submitting
                    ? t("support.reportSubmitting")
                    : t("support.reportSubmit")}
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
