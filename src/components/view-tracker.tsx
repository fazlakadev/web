"use client";

import { useEffect, useRef } from "react";
import { api } from "@/lib/api";

export function ViewTracker({
  contentType,
  contentId,
  durationSec,
}: {
  contentType: string;
  contentId: string;
  durationSec?: number;
}) {
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    api
      .post("/views/track", {
        contentType,
        contentId,
        durationSec: durationSec ?? undefined,
        completed: false,
      })
      .catch(() => {});
  }, [contentType, contentId, durationSec]);

  return null;
}
