"use client";

import { Download, ArrowRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Reveal } from "@/components/reveal";

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
      <Reveal>
        <div className="relative overflow-hidden rounded-[2rem] bg-brand-gradient-animated p-8 text-white shadow-glow sm:p-10">
          <div className="animate-float absolute -end-14 -top-14 h-44 w-44 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -bottom-16 -start-10 h-48 w-48 rounded-full bg-white/8 blur-3xl" />
          <div className="animate-float absolute bottom-6 end-10 hidden size-24 rounded-full border border-white/15 sm:block" />
          <div className="absolute -top-8 start-1/3 hidden size-16 rounded-2xl border border-white/10 rotate-12 sm:block" />
          <div className="relative flex flex-col items-center gap-5 text-center sm:flex-row sm:text-start">
            <div className="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-white/15 shadow-inner backdrop-blur-sm transition-transform duration-300 hover:scale-110 hover:-rotate-6">
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
              className="shine group flex shrink-0 items-center gap-2 rounded-2xl bg-white px-7 py-3.5 text-sm font-bold text-primary shadow-lg transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:brightness-110 active:scale-[0.98]"
            >
              {buttonText}
              <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1" />
            </Link>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
