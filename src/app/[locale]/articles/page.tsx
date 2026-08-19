import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Newspaper } from "lucide-react";
import { serverGet } from "@/lib/server";
import type { Article } from "@/lib/types";
import { ArticleCard } from "@/components/article-card";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "articles" });
  return { title: t("title") };
}

export default async function ArticlesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();

  let articles: Article[] = [];
  let error = false;
  try {
    const res = await serverGet<Article[]>("/articles", {
      locale,
      limit: 50,
      platform: "WEB",
    });
    articles = res.data ?? [];
  } catch {
    error = true;
  }

  const [featured, ...rest] = articles;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="mb-8">
        <div className="mb-3 flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-xl bg-brand-gradient text-primary-foreground">
            <Newspaper className="size-5" />
          </span>
          <h1 className="text-2xl font-black tracking-tight sm:text-4xl">
            {t("articles.title")}
          </h1>
        </div>
        <p className="text-sm text-muted-foreground sm:text-base">
          {t("articles.latestArticles")}
        </p>
      </div>

      {error ? (
        <p className="text-sm text-muted-foreground">{t("common.error")}</p>
      ) : articles.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card/40 p-12 text-center">
          <Newspaper className="mx-auto mb-3 size-10 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">{t("articles.empty")}</p>
        </div>
      ) : (
        <>
          {featured && (
            <ArticleCard
              article={featured}
              locale={locale}
              featured
              publishedOnLabel={t("articles.publishedOn")}
            />
          )}
          {rest.length > 0 && (
            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {rest.map((a) => (
                <ArticleCard
                  key={a.id}
                  article={a}
                  locale={locale}
                  readMoreLabel={t("articles.readMore")}
                  publishedOnLabel={t("articles.publishedOn")}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
