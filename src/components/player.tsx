"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@/providers/auth-provider";
import { api } from "@/lib/api";
import type { Episode } from "@/lib/types";

export function Player({
  episode,
  initialPosition,
}: {
  episode: Episode;
  initialPosition?: number;
}) {
  const { token } = useAuth();
  const videoRef = useRef<HTMLVideoElement>(null);
  const viewedRef = useRef(false);
  const [progress, setProgress] = useState(initialPosition ?? 0);
  const [showResume, setShowResume] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const videoUrl =
    episode.videoUrl || episode.audioUrl || null;
  const isAudioOnly = !episode.videoUrl && !!episode.audioUrl;

  const trackView = useCallback(() => {
    if (viewedRef.current) return;
    viewedRef.current = true;
    api
      .post("/views/track", {
        contentType: "episode",
        contentId: episode.id,
        durationSec: episode.duration ?? undefined,
        completed: false,
      })
      .catch(() => {});
  }, [episode.id, episode.duration]);

  const saveProgress = useCallback(
    (position: number, duration: number) => {
      if (!token || duration <= 0) return;
      api
        .patch(`/progress/${episode.id}`, {
          positionSeconds: Math.floor(position),
          durationSeconds: Math.floor(duration),
        })
        .catch(() => {});
    },
    [token, episode.id],
  );

  const handleLoadedMetadata = useCallback(() => {
    if (initialPosition && initialPosition > 0 && videoRef.current) {
      videoRef.current.currentTime = initialPosition;
      setShowResume(true);
      setTimeout(() => setShowResume(false), 4000);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleTimeUpdate = useCallback(
    (e: React.SyntheticEvent<HTMLVideoElement>) => {
      const v = e.currentTarget;
      const pos = v.currentTime;
      setProgress(pos);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(
        () => saveProgress(pos, v.duration || episode.duration || 0),
        2000,
      );
    },
    [saveProgress, episode.duration],
  );

  useEffect(() => {
    if (initialPosition && initialPosition > 0 && videoRef.current) {
      videoRef.current.currentTime = initialPosition;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const progressLabel = `${Math.floor(progress / 60)}:${String(Math.floor(progress % 60)).padStart(2, "0")}`;

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-lg border border-border bg-black">
      {videoUrl ? (
        isAudioOnly ? (
          <div className="flex h-full flex-col items-center justify-center gap-4 p-6">
            {episode.coverImage && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={episode.coverImage}
                alt=""
                className="h-40 w-40 rounded-lg object-cover"
              />
            )}
            <audio
              ref={videoRef}
              controls
              autoPlay
              className="w-full max-w-lg"
              src={videoUrl}
              onPlay={trackView}
              onLoadedMetadata={handleLoadedMetadata}
              onTimeUpdate={handleTimeUpdate}
            />
          </div>
        ) : (
          <video
            ref={videoRef}
            src={videoUrl}
            poster={episode.coverImage || undefined}
            controls
            autoPlay
            className="size-full object-contain"
            onPlay={trackView}
            onLoadedMetadata={handleLoadedMetadata}
            onTimeUpdate={handleTimeUpdate}
          />
        )
      ) : (
        <div className="flex h-full items-center justify-center text-muted-foreground">
          No stream available
        </div>
      )}
      {showResume ? (
        <span className="pointer-events-none absolute end-2 top-2 animate-hero-in rounded-full bg-black/70 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
          Resume from {progressLabel}
        </span>
      ) : null}
      <span className="pointer-events-none absolute bottom-2 start-2 rounded bg-black/60 px-2 py-0.5 text-xs text-white/80">
        {progressLabel}
      </span>
    </div>
  );
}
