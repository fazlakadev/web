"use client";

import { Download } from "lucide-react";
import { Link } from "@/i18n/navigation";

export function DownloadCta({
  title,
  description,
  buttonText,
}: {
  title: string;
  description: string;
  buttonText: string;
}) {
  return (
    <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      <div className="relative overflow-hidden rounded-[2rem] bg-brand-gradient p-6 text-white shadow-glow sm:p-8">
        <div className="absolute -end-12 -top-12 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-16 -start-8 h-44 w-44 rounded-full bg-white/8 blur-3xl" />
        <div className="relative flex flex-col items-center gap-4 text-center sm:flex-row sm:text-start">
          <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-white/15">
            <Download className="size-7" />
          </div>
          <div className="flex-1">
            <h2 className="font-heading text-xl font-black tracking-tight sm:text-2xl">
              {title}
            </h2>
            <p className="mt-1 max-w-lg text-sm text-white/80">
              {description}
            </p>
          </div>
          <Link
            href="/download"
            className="shrink-0 rounded-2xl bg-white px-6 py-3 text-sm font-bold text-primary shadow-lg transition-all hover:shadow-xl hover:brightness-110"
          >
            {buttonText}
          </Link>
        </div>
      </div>
    </section>
  );
}
