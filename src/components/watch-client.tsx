"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/providers/auth-provider";
import { api } from "@/lib/api";
import type { Episode } from "@/lib/types";
import { Player } from "@/components/player";

export function WatchClient({
  episode,
}: {
  episode: Episode;
}) {
  const { token } = useAuth();
  const [position, setPosition] = useState<number | undefined>(undefined);

  useEffect(() => {
    if (!token) return;
    api
      .get<{ positionSeconds?: number }>(`/progress/${episode.id}`)
      .then((res) => {
        const pos = res.data?.positionSeconds ?? 0;
        if (pos > 0) setPosition(pos);
      })
      .catch(() => {});
  }, [token, episode.id]);

  return (
    <Player
      key={episode.id}
      episode={episode}
      initialPosition={position}
    />
  );
}
