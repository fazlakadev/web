import Image from "next/image";
import { ArrowLeft, Calendar, User } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { cn, formatDate } from "@/lib/format";
import type { Article } from "@/lib/types";

export function ArticleCard({
  article,
  locale,
  readMoreLabel,
  publishedOnLabel,
  className,
  featured = false,
}: {
  article: Article;
  locale: string;
  readMoreLabel?: string;
  publishedOnLabel?: string;
  className?: string;
  featured?: boolean;
}) {
  const tr =
    article.translations.find((x) => x.locale === locale) ??
    article.translations[0];
  const title = tr?.title ?? article.slug;
  const excerpt = tr?.excerpt ?? tr?.body ?? null;
  const authorName = article.author?.name ?? article.author?.username;

  if (featured) {
    return (
      <Link
        href={`/articles/${article.slug}`}
        className={cn("group block", className)}
      >
        <div className="relative overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all duration-300 group-hover:border-primary/50 group-hover:shadow-card">
          <div className="aspect-[16/9] w-full bg-secondary sm:aspect-[21/9]">
            {article.coverImage ? (
              <Image
                src={article.coverImage}
                alt={title}
                fill
                unoptimized
                className="object-cover transition-transform duration-500 group-hover:scale-105"
                sizes="100vw"
              />
            ) : (
              <div className="flex size-full items-center justify-center bg-brand-gradient opacity-40" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          </div>
          <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8">
            {article.category ? (
              <span className="mb-3 inline-block rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-bold text-white backdrop-blur">
                {article.category}
              </span>
            ) : null}
            <h3 className="text-xl font-black leading-tight text-white sm:text-3xl">
              {title}
            </h3>
            <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-white/70">
              {authorName ? (
                <span className="inline-flex items-center gap-1.5">
                  <User className="size-3.5" />
                  {authorName}
                </span>
              ) : null}
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="size-3.5" />
                {publishedOnLabel ? `${publishedOnLabel}: ` : ""}
                {formatDate(article.publishedAt)}
              </span>
            </div>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link href={`/articles/${article.slug}`} className={cn("group block", className)}>
      <div className="relative overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-all duration-300 group-hover:border-primary/50 group-hover:shadow-card">
        <div className="aspect-video w-full bg-secondary">
          {article.coverImage ? (
            <Image
              src={article.coverImage}
              alt={title}
              width={640}
              height={360}
              unoptimized
              className="size-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
          ) : (
            <div className="flex size-full items-center justify-center bg-brand-gradient opacity-50" />
          )}
        </div>
        <div className="p-4">
          <div className="flex items-center gap-2 text-[11px] font-semibold text-muted-foreground">
            {article.category ? (
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-primary">
                {article.category}
              </span>
            ) : null}
            <span className="inline-flex items-center gap-1">
              <Calendar className="size-3" />
              {formatDate(article.publishedAt)}
            </span>
          </div>
          <h3 className="mt-2 line-clamp-2 text-base font-bold leading-snug transition-colors group-hover:text-primary">
            {title}
          </h3>
          {excerpt ? (
            <p className="mt-1.5 line-clamp-2 text-sm text-muted-foreground">
              {excerpt}
            </p>
          ) : null}
          <div className="mt-3 flex items-center justify-between">
            {authorName ? (
              <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                <User className="size-3.5" />
                {authorName}
              </span>
            ) : (
              <span />
            )}
            {readMoreLabel ? (
              <span className="inline-flex items-center gap-1 text-xs font-bold text-primary">
                {readMoreLabel}
                <ArrowLeft className="size-3.5 transition-transform group-hover:-translate-x-0.5 rtl:rotate-180 rtl:group-hover:translate-x-0.5" />
              </span>
            ) : null}
          </div>
        </div>
      </div>
    </Link>
  );
}
