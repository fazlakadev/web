"use client";

import type { ApiEnvelope } from "./types";

function buildApiBase(raw?: string): string {
  if (!raw) return "/api/v1";
  const trimmed = raw.replace(/\/$/, "");
  return trimmed.endsWith("/api/v1") ? trimmed : `${trimmed}/api/v1`;
}

export const API_BASE = buildApiBase(process.env.NEXT_PUBLIC_API_URL);

export const TOKEN_KEY = "fazlaka_user_access";
export const REFRESH_KEY = "fazlaka_user_refresh";

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setTokens(access: string, refresh: string) {
  localStorage.setItem(TOKEN_KEY, access);
  localStorage.setItem(REFRESH_KEY, refresh);
}

export function clearTokens() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
}

export class ApiError extends Error {
  status: number;
  details?: Record<string, unknown>;
  constructor(status: number, message: string, details?: Record<string, unknown>) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

let refreshing: Promise<boolean> | null = null;

async function refreshToken(): Promise<boolean> {
  const refresh = localStorage.getItem(REFRESH_KEY);
  if (!refresh) return false;
  try {
    const res = await fetch(`${API_BASE}/auth/refresh`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken: refresh }),
    });
    const json = await res.json();
    if (!res.ok || !json.data?.accessToken) return false;
    setTokens(json.data.accessToken, json.data.refreshToken);
    return true;
  } catch {
    return false;
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  retry = true,
): Promise<ApiEnvelope<T>> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (typeof document !== "undefined" && document.documentElement.lang) {
    headers["Accept-Language"] = document.documentElement.lang;
  }
  const token = getAccessToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      ...options,
      credentials: "include",
      headers,
    });
  } catch {
    throw new ApiError(0, "network_error");
  }

  if (res.status === 401 && retry) {
    if (!refreshing) {
      refreshing = refreshToken().finally(() => {
        refreshing = null;
      });
    }
    const ok = await refreshing;
    if (ok) return request<T>(path, options, false);
    clearTokens();
    throw new ApiError(401, "unauthorized");
  }

  let json: ApiEnvelope<T> | undefined;
  try {
    json = await res.json();
  } catch {
    json = undefined;
  }

  if (!res.ok) {
    const errJson = (json as { message?: string | string[]; attemptsLeft?: number } | undefined) ?? {};
    const rawMsg = Array.isArray(errJson.message)
      ? (errJson.message[0] ?? "")
      : (errJson.message ?? "");
    const msg = rawMsg || res.statusText || "error";
    throw new ApiError(res.status, msg, errJson as Record<string, unknown>);
  }

  if (!json || json.success === false) {
    const errJson = (json as { message?: string | string[]; attemptsLeft?: number } | undefined) ?? {};
    const rawMsg = Array.isArray(errJson.message)
      ? (errJson.message[0] ?? "")
      : (errJson.message ?? "");
    throw new ApiError(res.status, rawMsg || "error", errJson as Record<string, unknown>);
  }

  return json;
}

function qs(params?: Record<string, string | number | boolean | undefined>) {
  if (!params) return "";
  const entries = Object.entries(params).filter(
    ([, v]) => v !== undefined && v !== null && v !== "",
  );
  if (!entries.length) return "";
  return (
    "?" +
    entries
      .map(
        ([k, v]) =>
          `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`,
      )
      .join("&")
  );
}

export const api = {
  get<T>(path: string, params?: Record<string, string | number | boolean | undefined>) {
    return request<T>(`${path}${qs(params)}`);
  },
  post<T>(path: string, body?: unknown) {
    return request<T>(path, {
      method: "POST",
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  },
  patch<T>(path: string, body?: unknown) {
    return request<T>(path, {
      method: "PATCH",
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  },
  del<T>(path: string, body?: unknown) {
    return request<T>(path, {
      method: "DELETE",
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  },
};

export function localized<T extends { translations: { locale: string }[] }>(
  item: T | null | undefined,
  locale: string,
) {
  if (!item) return item;
  const tr = item.translations.find((t) => t.locale === locale);
  const fallback = item.translations[0];
  return { ...item, _localized: tr ?? fallback };
}
