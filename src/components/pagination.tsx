import { ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/format";

export function Pagination({
  page,
  totalPages,
  basePath,
  searchParams,
}: {
  page: number;
  totalPages: number;
  basePath: string;
  searchParams?: Record<string, string>;
}) {
  if (totalPages <= 1) return null;

  const pages: number[] = [];
  const start = Math.max(1, page - 2);
  const end = Math.min(totalPages, page + 2);
  for (let i = start; i <= end; i++) pages.push(i);

  const hrefFor = (p: number) => {
    const sp = new URLSearchParams(searchParams ?? {});
    sp.set("page", String(p));
    const qs = sp.toString();
    return `${basePath}${qs ? `?${qs}` : ""}`;
  };

  return (
    <nav className="mx-auto flex max-w-7xl items-center justify-center gap-1 px-4 py-8 sm:px-6">
      {page > 1 ? (
        <Link
          href={hrefFor(page - 1)}
          className="inline-flex size-9 items-center justify-center rounded-md border border-border text-muted-foreground hover:bg-accent"
          aria-label="Previous"
        >
          <ChevronLeft className="size-4 rtl:rotate-180" />
        </Link>
      ) : null}
      {pages.map((p) => (
        <Link
          key={p}
          href={hrefFor(p)}
          className={cn(
            "inline-flex size-9 items-center justify-center rounded-md border text-sm",
            p === page
              ? "border-primary bg-primary font-semibold text-primary-foreground"
              : "border-border text-muted-foreground hover:bg-accent",
          )}
        >
          {p}
        </Link>
      ))}
      {page < totalPages ? (
        <Link
          href={hrefFor(page + 1)}
          className="inline-flex size-9 items-center justify-center rounded-md border border-border text-muted-foreground hover:bg-accent"
          aria-label="Next"
        >
          <ChevronRight className="size-4 rtl:rotate-180" />
        </Link>
      ) : null}
    </nav>
  );
}
