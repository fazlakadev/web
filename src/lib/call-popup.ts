"use client";

let pendingJoin: string | null = null;

export function setPendingJoin(ticketId: string | null) {
  pendingJoin = ticketId;
}

export function consumePendingJoin(): string | null {
  const value = pendingJoin;
  pendingJoin = null;
  return value;
}
