import type { LucideIcon } from "lucide-react";

type Section = { h: string; p: string };
type FaqItem = { q: string; a: string };

export function InfoPage({
  icon: Icon,
  title,
  updated,
  intro,
  sections = [],
  faq = [],
}: {
  icon: LucideIcon;
  title: string;
  updated?: string;
  intro?: string;
  sections?: Section[];
  faq?: FaqItem[];
}) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <div className="mb-8 flex flex-col items-center gap-3 text-center">
        <span className="flex size-14 items-center justify-center rounded-2xl bg-brand-gradient text-primary-foreground shadow-glow">
          <Icon className="size-7" />
        </span>
        <h1 className="text-3xl font-black tracking-tight">{title}</h1>
        {updated && (
          <p className="text-xs font-medium text-muted-foreground">{updated}</p>
        )}
      </div>
      <div className="glass-card space-y-8 rounded-3xl border border-border p-6 shadow-lifted sm:p-10">
        {intro && (
          <p className="text-sm leading-7 text-muted-foreground">{intro}</p>
        )}
        {sections.map((s, i) => (
          <section key={i} className="space-y-2">
            <h2 className="text-lg font-extrabold">{s.h}</h2>
            <p className="text-sm leading-7 text-muted-foreground">{s.p}</p>
          </section>
        ))}
        {faq.map((f, i) => (
          <details
            key={i}
            className="rounded-2xl border border-border bg-background/40 p-4 open:bg-background/60"
          >
            <summary className="cursor-pointer list-none text-sm font-bold">
              {f.q}
            </summary>
            <p className="pt-3 text-sm leading-7 text-muted-foreground">
              {f.a}
            </p>
          </details>
        ))}
      </div>
    </div>
  );
}
