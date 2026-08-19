import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ArrowRight, Calendar, User } from "lucide-react";
import Image from "next/image";
import { serverGet } from "@/lib/server";
import { formatDate } from "@/lib/format";
import type { Article } from "@/lib/types";
import { Link } from "@/i18n/navigation";
import { ViewTracker } from "@/components/view-tracker";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  try {
    const res = await serverGet<Article>(`/articles/${slug}`, { locale });
    const article = res.data;
    const tr = article.translations.find((x) => x.locale === locale);
    return {
      title: tr?.seoTitle ?? tr?.title ?? article.slug,
      description: tr?.seoDescription ?? tr?.excerpt ?? undefined,
    };
  } catch {
    return { title: "Article" };
  }
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();

  let article: Article;
  try {
    const res = await serverGet<Article>(`/articles/${slug}`, { locale });
    article = res.data;
  } catch {
    notFound();
  }

  const tr = article.translations.find((x) => x.locale === locale);
  const title = tr?.title ?? article.slug;
  const body = tr?.body ?? "";
  const authorName = article.author?.name ?? article.author?.username;
  const paragraphs = body.split(/\n+/).filter(Boolean);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <ViewTracker contentType="article" contentId={article.id} />
      <Link
        href="/articles"
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground transition-colors hover:text-primary"
      >
        <ArrowRight className="size-4 rtl:rotate-180" />
        {t("articles.title")}
      </Link>

      <article>
        <header className="space-y-4">
          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            {article.category ? (
              <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
                {article.category}
              </span>
            ) : null}
            <span className="inline-flex items-center gap-1.5">
              <Calendar className="size-4" />
              {t("articles.publishedOn")}: {formatDate(article.publishedAt)}
            </span>
            {authorName ? (
              <span className="inline-flex items-center gap-1.5">
                <User className="size-4" />
                {t("articles.by")} {authorName}
              </span>
            ) : null}
          </div>
          <h1 className="text-2xl font-black leading-tight tracking-tight sm:text-4xl">
            {title}
          </h1>
          {tr?.excerpt ? (
            <p className="text-lg leading-relaxed text-muted-foreground">
              {tr.excerpt}
            </p>
          ) : null}
        </header>

        {article.coverImage ? (
          <div className="relative mt-6 aspect-video overflow-hidden rounded-2xl border border-border">
            <Image
              src={article.coverImage}
              alt={title}
              fill
              unoptimized
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 768px"
            />
          </div>
        ) : null}

        <div className="prose mt-8 max-w-none space-y-4 text-foreground">
          {paragraphs.length > 0 ? (
            paragraphs.map((p, i) => (
              <p
                key={i}
                className="text-[15px] leading-relaxed text-muted-foreground sm:text-base"
              >
                {p}
              </p>
            ))
          ) : (
            <p className="text-muted-foreground">{title}</p>
          )}
        </div>

        {article.tags.length > 0 ? (
          <footer className="mt-10 flex flex-wrap gap-2 border-t border-border pt-6">
            {article.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-border bg-card px-3 py-1 text-xs font-semibold text-muted-foreground"
              >
                #{tag}
              </span>
            ))}
          </footer>
        ) : null}
      </article>
    </div>
  );
}
