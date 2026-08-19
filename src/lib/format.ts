import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDuration(seconds?: number | null): string {
  if (!seconds || seconds <= 0) return "";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function formatViews(value?: number | null): string {
  if (!value) return "0";
  return new Intl.NumberFormat().format(value);
}

export function formatDate(value?: string | Date | null): string {
  if (!value) return "";
  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

export function timeAgo(value?: string | Date | null, locale = "ar"): string {
  if (!value) return "";
  const date = new Date(value);
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  const units: Array<[Intl.RelativeTimeFormatUnit, number]> = [
    ["year", 31536000],
    ["month", 2592000],
    ["week", 604800],
    ["day", 86400],
    ["hour", 3600],
    ["minute", 60],
  ];
  for (const [unit, secs] of units) {
    const val = Math.floor(seconds / secs);
    if (val >= 1) {
      return new Intl.RelativeTimeFormat(locale, { numeric: "auto" }).format(
        -val,
        unit,
      );
    }
  }
  return new Intl.RelativeTimeFormat(locale, { numeric: "auto" }).format(
    -seconds,
    "second",
  );
}

export function initials(name?: string | null): string {
  if (!name) return "؟";
  return name.trim().slice(0, 2).toUpperCase();
}
