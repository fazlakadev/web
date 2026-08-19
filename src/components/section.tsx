import { ChevronLeft, Sparkles } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/format";
import { Reveal } from "@/components/reveal";

export function Section({
  title,
  viewAllHref,
  viewAllLabel,
  children,
  className,
  grid = true,
}: {
  title: string;
  viewAllHref?: string;
  viewAllLabel?: string;
  children: React.ReactNode;
  className?: string;
  grid?: boolean;
}) {
  return (
    <section className={cn("mx-auto w-full max-w-7xl px-4 py-7 sm:px-6", className)}>
      <Reveal>
        <div className="group mb-5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex size-8 items-center justify-center rounded-xl bg-brand-gradient text-primary-foreground shadow-glow transition-transform duration-300 group-hover:scale-110 group-hover:rotate-12">
              <Sparkles className="size-4" />
            </span>
            <h2 className="text-lg font-extrabold tracking-tight transition-transform duration-300 group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5 sm:text-2xl">
              {title}
            </h2>
            <span className="hidden h-5 w-px bg-border sm:block" />
            <span className="hidden h-1.5 w-16 rounded-full bg-brand-gradient transition-all duration-500 group-hover:w-24 sm:block" />
          </div>
          {viewAllHref && (
            <Link
              href={viewAllHref}
              className="group/btn inline-flex shrink-0 items-center gap-1 rounded-full border border-border bg-card px-3.5 py-1.5 text-sm font-semibold text-muted-foreground transition-all duration-300 hover:border-primary/50 hover:bg-primary/10 hover:text-primary hover:shadow-glow"
            >
              {viewAllLabel}
              <ChevronLeft className="size-4 transition-transform duration-300 group-hover/btn:-translate-x-1 rtl:rotate-180 rtl:group-hover/btn:translate-x-1" />
            </Link>
          )}
        </div>
        {grid ? (
          <div className="scrollbar-hide stagger-in -mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 md:grid-cols-3 lg:grid-cols-5">
            {children}
          </div>
        ) : (
          <div className="stagger-in">{children}</div>
        )}
      </Reveal>
    </section>
  );
}
