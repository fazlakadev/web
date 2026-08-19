import { ChevronLeft, Sparkles } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/format";

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
      <div className="mb-5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex size-8 items-center justify-center rounded-xl bg-brand-gradient text-primary-foreground shadow-glow">
            <Sparkles className="size-4" />
          </span>
          <h2 className="text-lg font-extrabold tracking-tight sm:text-2xl">
            {title}
          </h2>
          <span className="hidden h-5 w-px bg-border sm:block" />
          <span className="h-1.5 hidden w-16 rounded-full bg-brand-gradient sm:block" />
        </div>
        {viewAllHref && (
          <Link
            href={viewAllHref}
            className="group inline-flex shrink-0 items-center gap-1 rounded-full border border-border bg-card px-3.5 py-1.5 text-sm font-semibold text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary"
          >
            {viewAllLabel}
            <ChevronLeft className="size-4 transition-transform group-hover:-translate-x-0.5 rtl:rotate-180 rtl:group-hover:translate-x-0.5" />
          </Link>
        )}
      </div>
      {grid ? (
        <div className="scrollbar-hide -mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 md:grid-cols-3 lg:grid-cols-5">
          {children}
        </div>
      ) : (
        children
      )}
    </section>
  );
}
