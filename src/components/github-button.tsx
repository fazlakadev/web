"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Spinner } from "@/components/ui/card";
import { API_BASE } from "@/lib/api";

const GITHUB_ICON = (
  <svg className="size-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.56 0-.27-.01-1.13-.02-2.05-3.2.7-3.88-1.36-3.88-1.36-.52-1.33-1.28-1.68-1.28-1.68-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.19 1.76 1.19 1.03 1.76 2.69 1.25 3.35.96.1-.75.4-1.25.72-1.54-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.28 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11.05 11.05 0 0 1 5.79 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.83 1.19 3.09 0 4.42-2.69 5.39-5.26 5.68.41.35.78 1.05.78 2.12 0 1.53-.01 2.76-.01 3.14 0 .31.21.67.8.56A11.52 11.52 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5z" />
  </svg>
);

export function GithubButton({ variant = "login" }: { variant?: "login" | "register" }) {
  const t = useTranslations();
  const [loading, setLoading] = useState(false);

  const handleClick = () => {
    setLoading(true);
    const url = new URL(API_BASE, window.location.origin);
    url.pathname = url.pathname.replace(/\/$/, "") + "/auth/github";
    window.location.assign(url.toString());
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className="flex w-full items-center justify-center gap-3 rounded-xl border border-border bg-card px-5 py-3 text-sm font-semibold text-foreground shadow-sm transition-all hover:border-primary/40 hover:bg-accent active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
    >
      {loading ? <Spinner /> : GITHUB_ICON}
      {variant === "login" ? t("auth.loginWithGithub") : t("auth.registerWithGithub")}
    </button>
  );
}
