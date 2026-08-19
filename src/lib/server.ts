import type { ApiEnvelope } from "./types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

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

export async function serverGet<T>(
  path: string,
  params?: Record<string, string | number | boolean | undefined>,
): Promise<ApiEnvelope<T>> {
  const res = await fetch(`${API_BASE}/api/v1${path}${qs(params)}`, {
    cache: "no-store",
  });
  const json = (await res.json().catch(() => undefined)) as
    | ApiEnvelope<T>
    | undefined;
  if (!res.ok || !json || json.success === false) {
    throw new Error(
      (json as { message?: string } | undefined)?.message || `GET ${path} failed`,
    );
  }
  return json;
}

export function pickTranslation<T extends { translations: { locale: string; title: string }[] }>(
  item: T,
  locale: string,
) {
  return (
    item.translations.find((t) => t.locale === locale) ??
    item.translations[0]
  );
}

export function episodeTitle(item: { translations: { locale: string; title: string }[] }, locale: string): string {
  return pickTranslation(item, locale)?.title ?? "Untitled";
}

export function seasonTitle(item: { translations: { locale: string; title: string }[] }, locale: string): string {
  return pickTranslation(item, locale)?.title ?? "Untitled";
}
