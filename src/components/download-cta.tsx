"use client";

import { Download, ArrowRight } from "lucide-react";
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
      <div className="relative overflow-hidden rounded-[2rem] bg-brand-gradient p-8 text-white shadow-glow sm:p-10">
        <div className="absolute -end-14 -top-14 h-44 w-44 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-16 -start-10 h-48 w-48 rounded-full bg-white/8 blur-3xl" />
        <div className="relative flex flex-col items-center gap-5 text-center sm:flex-row sm:text-start">
          <div className="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm">
            <Download className="size-8" />
          </div>
          <div className="flex-1">
            <h2 className="font-heading text-2xl font-black tracking-tight sm:text-3xl">
              {title}
            </h2>
            <p className="mt-2 max-w-lg text-sm text-white/75 sm:text-base">
              {description}
            </p>
          </div>
          <Link
            href="/download"
            className="group flex shrink-0 items-center gap-2 rounded-2xl bg-white px-7 py-3.5 text-sm font-bold text-primary shadow-lg transition-all hover:shadow-xl hover:brightness-110"
          >
            {buttonText}
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5 rtl:rotate-180" />
          </Link>
        </div>
      </div>
    </section>
  );
}
