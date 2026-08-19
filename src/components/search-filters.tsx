"use client";

import { useTranslations } from "next-intl";
import { ListFilter, X } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { cn } from "@/lib/format";

type Sort = "latest" | "popular";
type TypeFilter = "" | "episode" | "article" | "season" | "playlist";

const TYPES: TypeFilter[] = ["", "episode", "article", "season", "playlist"];
const PLATFORMS = ["", "WEB", "MOBILE", "DESKTOP"];

export function SearchFilters({
  q,
  sort,
  type,
  category,
  platform,
}: {
  q: string;
  sort: Sort;
  type: TypeFilter;
  category: string;
  platform: string;
}) {
  const t = useTranslations();
  const router = useRouter();

  const apply = (patch: {
    sort?: Sort;
    type?: TypeFilter;
    category?: string;
    platform?: string;
  }) => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    const nextSort = patch.sort ?? sort;
    const nextType = patch.type ?? type;
    const nextCategory = patch.category ?? category;
    const nextPlatform = patch.platform ?? platform;
    if (nextSort && nextSort !== "latest") params.set("sort", nextSort);
    if (nextType) params.set("type", nextType);
    if (nextCategory) params.set("category", nextCategory);
    if (nextPlatform) params.set("platform", nextPlatform);
    router.push(`/search?${params.toString()}`);
  };

  const hasFilters = Boolean(type || category || platform || sort === "popular");

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex items-center gap-1 rounded-lg border border-border bg-muted/40 p-1">
        <ListFilter className="ms-1.5 size-4 text-muted-foreground" />
        {TYPES.map((tp) => (
          <button
            key={tp || "all"}
            type="button"
            onClick={() => apply({ type: tp })}
            className={cn(
              "rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors",
              type === tp
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {tp ? t(`search.type.${tp}`) : t("search.type.all")}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-1 rounded-lg border border-border bg-muted/40 p-1">
        {(["latest", "popular"] as Sort[]).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => apply({ sort: s })}
            className={cn(
              "rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors",
              sort === s
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {t(`search.sort.${s}`)}
          </button>
        ))}
      </div>

      <select
        value={platform}
        onChange={(e) => apply({ platform: e.target.value })}
        className="h-8 rounded-lg border border-border bg-background px-2 text-xs"
        aria-label={t("search.platform")}
      >
        {PLATFORMS.map((p) => (
          <option key={p} value={p}>
            {p ? p : t("search.platform")}
          </option>
        ))}
      </select>

      <input
        type="text"
        defaultValue={category}
        placeholder={t("search.category")}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            apply({ category: (e.target as HTMLInputElement).value.trim() });
          }
        }}
        className="h-8 w-28 rounded-lg border border-border bg-background px-2 text-xs"
      />

      {hasFilters && (
        <button
          type="button"
          onClick={() =>
            router.push(q ? `/search?q=${encodeURIComponent(q)}` : "/search")
          }
          className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs text-muted-foreground transition-colors hover:text-primary"
        >
          <X className="size-3.5" />
          {t("search.clear")}
        </button>
      )}
    </div>
  );
}
