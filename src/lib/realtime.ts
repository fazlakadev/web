"use client";

import { useEffect } from "react";
import Pusher from "pusher-js";
import { API_BASE, getAccessToken } from "@/lib/api";

let shared: Pusher | null = null;

export function getUserPusher(): Pusher | null {
  if (typeof window === "undefined") return null;
  const key = process.env.NEXT_PUBLIC_PUSHER_APP_KEY;
  const cluster = process.env.NEXT_PUBLIC_PUSHER_APP_CLUSTER || "eu";
  if (!key) return null;
  if (!shared) {
    shared = new Pusher(key, {
      cluster,
      enabledTransports: ["ws", "wss"],
      authorizer: (channel) => ({
        authorize: (socketId, callback) => {
          fetch(`${API_BASE}/realtime/pusher/auth`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...(getAccessToken()
                ? { Authorization: `Bearer ${getAccessToken()}` }
                : {}),
            },
            body: JSON.stringify({
              socket_id: socketId,
              channel_name: channel.name,
            }),
          })
            .then((res) => res.json())
            .then((json) => {
              if (json?.success && json?.data?.auth) {
                callback(null, json.data);
              } else {
                callback(new Error("Pusher auth failed"), null);
              }
            })
            .catch((err) => callback(err as Error, null));
        },
      }),
    });
  }
  return shared;
}

export function subscribeUser(
  userId: string,
  events: Record<string, (data: unknown) => void>,
): () => void {
  const pusher = getUserPusher();
  if (!pusher || !userId) return () => {};
  const channelName = `private-user-${userId}`;
  const channel = pusher.subscribe(channelName);
  const bindings: Array<[string, (data: unknown) => void]> = [];
  for (const [event, handler] of Object.entries(events)) {
    const wrapped = (data: unknown) => handler(data);
    channel.bind(event, wrapped);
    bindings.push([event, wrapped]);
  }
  return () => {
    for (const [event, handler] of bindings) {
      channel.unbind(event, handler);
    }
    pusher.unsubscribe(channelName);
  };
}

export function useUserRealtime(
  userId: string | null | undefined,
  events: Record<string, (data: unknown) => void>,
): void {
  useEffect(() => {
    if (!userId) return;
    const cleanup = subscribeUser(userId, events);
    return cleanup;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);
}
