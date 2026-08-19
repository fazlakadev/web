"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Heart } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/providers/auth-provider";
import { api } from "@/lib/api";

export function LikeButton({
  contentType,
  contentId,
  initialCount = 0,
}: {
  contentType: string;
  contentId: string;
  initialCount?: number;
}) {
  const t = useTranslations();
  const { token } = useAuth();
  const [liked, setLiked] = useState(false);
  const [count, setCount] = useState(initialCount);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) return;
    api
      .get<{ liked: boolean }>(`/likes/${contentType}/${contentId}/status`)
      .then((res) => {
        if (res.data && "liked" in res.data) setLiked(!!res.data.liked);
      })
      .catch(() => {});
  }, [token, contentType, contentId]);

  const toggle = useCallback(async () => {
    if (!token) {
      toast.info(t("watch.loginToLike"));
      return;
    }
    setLoading(true);
    try {
      const res = await api.post<{ liked: boolean; likesCount: number }>(
        `/likes/${contentType}/${contentId}`,
        { type: "like" },
      );
      setLiked(!!res.data.liked);
      if (typeof res.data.likesCount === "number") {
        setCount(res.data.likesCount);
      } else {
        setCount((c) => c + (res.data.liked ? 1 : -1));
      }
    } catch {
      toast.error(t("common.error"));
    } finally {
      setLoading(false);
    }
  }, [token, contentType, contentId, t]);

  return (
    <Button
      variant={liked ? "default" : "outline"}
      size="sm"
      onClick={toggle}
      disabled={loading}
      className="gap-2"
    >
      <Heart
        className={liked ? "size-4 fill-current" : "size-4"}
      />
      {count > 0 ? count : null}
      {t("watch.like")}
    </Button>
  );
}
