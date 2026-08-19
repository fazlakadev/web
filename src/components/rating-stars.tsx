"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { Star } from "lucide-react";
import { useAuth } from "@/providers/auth-provider";
import { api } from "@/lib/api";
import { useRouter } from "@/i18n/navigation";

type Summary = {
  average: number | null;
  count: number;
  distribution: { value: number; count: number }[];
};

export function RatingStars({
  contentType,
  contentId,
}: {
  contentType: string;
  contentId: string;
}) {
  const t = useTranslations();
  const { token } = useAuth();
  const router = useRouter();
  const [summary, setSummary] = useState<Summary | null>(null);
  const [myValue, setMyValue] = useState<number | null>(null);
  const [hover, setHover] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await api.get<Summary>(
        `/ratings/content/${contentType}/${contentId}/summary`,
      );
      setSummary(res.data ?? { average: null, count: 0, distribution: [] });
    } catch {
      setSummary({ average: null, count: 0, distribution: [] });
    }
    if (!token) return;
    try {
      const mine = await api.get<{ value: number; contentType: string; contentId: string }[]>(
        "/ratings/mine",
        { limit: 100 },
      );
      const found = (mine.data ?? []).find(
        (r) => r.contentType === contentType && r.contentId === contentId,
      );
      setMyValue(found?.value ?? null);
    } catch {
      setMyValue(null);
    }
  }, [contentType, contentId, token]);

  useEffect(() => {
    void load();
  }, [load]);

  const rate = async (value: number) => {
    if (!token) {
      toast.info(t("watch.loginToRate"));
      return;
    }
    setSaving(true);
    try {
      await api.post("/ratings", { contentType, contentId, value });
      setMyValue(value);
      toast.success(t("watch.rated"));
      await load();
    } catch (e) {
      const msg = (e as { message?: string })?.message ?? "";
      if (msg.toLowerCase().includes("verify")) {
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
      setSaving(false);
    }
  };

  if (!summary) return null;
  if (summary.count === 0 && myValue === null) return null;

  const displayValue = hover ?? myValue ?? summary.average ?? 0;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div
        className="flex items-center gap-0.5"
        onMouseLeave={() => setHover(null)}
      >
        {[1, 2, 3, 4, 5].map((v) => {
          const filled = v <= Math.round(displayValue);
          return (
            <button
              key={v}
              type="button"
              aria-label={`${v} star`}
              disabled={saving}
              onMouseEnter={() => setHover(v)}
              onClick={() => void rate(v)}
              className={`transition-transform hover:scale-110 disabled:cursor-wait ${
                filled
                  ? "text-amber-400"
                  : "text-muted-foreground/40 hover:text-amber-400/70"
              }`}
            >
              <Star
                className="size-4"
                fill={filled ? "currentColor" : "none"}
              />
            </button>
          );
        })}
      </div>
      {summary.count > 0 ? (
        <>
          <span className="text-sm font-semibold">
            {summary.average?.toFixed(1)}
          </span>
          <span className="text-xs text-muted-foreground">
            {t("watch.ratingsCount", { count: summary.count })}
          </span>
        </>
      ) : null}
    </div>
  );
}
