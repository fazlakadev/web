"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";
import {
  History,
  ListVideo,
  LogOut,
  Menu,
  MessageSquare,
  Play,
  Search,
  Settings,
  CircleHelp,
  Flag,
  User as UserIcon,
  UserPlus,
  X,
} from "lucide-react";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { useAuth } from "@/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dropdown, DropdownItem } from "@/components/ui/dropdown";
import { LanguageSwitcher } from "@/components/language-switcher";
import { ThemeToggle } from "@/components/theme-toggle";
import { NotificationsBell } from "@/components/notifications-bell";
import { cn } from "@/lib/format";
import { api } from "@/lib/api";
import type { Suggestion } from "@/lib/types";

const TYPE_ICON: Record<Suggestion["type"], typeof Play> = {
  episode: Play,
  season: Play,
  playlist: ListVideo,
  article: Search,
};

export function Header() {
  const t = useTranslations();
  const locale = useLocale();
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [q, setQ] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileSearch, setMobileSearch] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const navLinks = useMemo(
    () => [
      { href: "/", label: t("nav.home") },
      { href: "/browse", label: t("nav.browse") },
      { href: "/seasons", label: t("nav.seasons") },
      { href: "/articles", label: t("nav.articles") },
      { href: "/playlists", label: t("nav.playlists") },
    ],
    [t],
  );

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  const submitSearch = (query: string) => {
    const trimmed = query.trim();
    if (trimmed) router.push(`/search?q=${encodeURIComponent(trimmed)}`);
    setShowSuggestions(false);
    setMobileOpen(false);
    setMobileSearch(false);
  };

  const suggestionHref = (s: Suggestion) =>
    s.type === "season"
      ? `/season/${s.slug}`
      : s.type === "playlist"
        ? `/playlist/${s.slug}`
        : s.type === "article"
          ? `/articles/${s.slug}`
          : `/watch/${s.slug}`;

  useEffect(() => {
    const trimmed = q.trim();
    if (trimmed.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    const timer = window.setTimeout(() => {
      api
        .get<{ results: Suggestion[] }>("/search/suggestions", {
          q: trimmed,
          locale,
          limit: 6,
        })
        .then((res) => {
          setSuggestions(res.data.results);
          setShowSuggestions(true);
        })
        .catch(() => undefined);
    }, 250);
    return () => window.clearTimeout(timer);
  }, [q, locale]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!showSuggestions) return;
    const onClick = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [showSuggestions]);

  const userInitial = (user?.name || user?.username || "?")
    .slice(0, 1)
    .toUpperCase();

  const renderSearchBox = (autoFocus = false) => (
    <div ref={searchRef} className="relative w-full">
      <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        autoFocus={autoFocus}
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            submitSearch(q);
          }
        }}
        placeholder={t("common.searchPlaceholder")}
        className={cn(
          "rounded-full border-transparent bg-secondary/70 ps-9 focus:border-primary/50 focus:bg-background",
          autoFocus && "w-full",
        )}
      />
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute top-full z-50 mt-2 w-full overflow-hidden rounded-md border border-border bg-popover p-1 text-popover-foreground shadow-lifted animate-in fade-in slide-in-from-top-2 duration-150">
          {suggestions.map((s) => {
            const Icon = TYPE_ICON[s.type] ?? Play;
            return (
              <button
                key={`${s.type}-${s.slug}`}
                type="button"
                onClick={() => router.push(suggestionHref(s))}
                className="flex w-full items-center gap-2.5 rounded-sm px-2.5 py-2 text-start text-sm transition-colors hover:bg-accent hover:text-accent-foreground"
              >
                <span className="flex size-7 shrink-0 items-center justify-center rounded bg-secondary text-muted-foreground">
                  <Icon className="size-3.5" />
                </span>
                <span className="min-w-0 flex-1 truncate">{s.title}</span>
                <span className="shrink-0 text-[10px] uppercase tracking-wide text-muted-foreground">
                  {s.type === "episode"
                    ? t("common.episodes")
                    : s.type === "season"
                      ? t("common.season")
                      : s.type === "article"
                        ? t("nav.articles")
                        : t("nav.playlists")}
                </span>
              </button>
            );
          })}
          <div className="my-1 h-px bg-border" />
          <button
            type="button"
            onClick={() => submitSearch(q)}
            className="flex w-full items-center gap-2.5 rounded-sm px-2.5 py-2 text-start text-sm font-medium text-primary transition-colors hover:bg-accent"
          >
            <Search className="size-3.5" />
            {t("browse.searchAll", { query: q.trim() })}
          </button>
        </div>
      )}
    </div>
  );

  return (
    <header className="sticky top-3 z-40 px-3 sm:top-4 sm:px-6">
      <div className="relative mx-auto max-w-6xl">
        <div
          className={cn(
            "glass flex h-14 items-center gap-2 rounded-full border border-border/70 px-2.5 shadow-soft transition-all duration-300 sm:px-4",
            scrolled && "glass-strong shadow-lifted",
          )}
        >
          <Link href="/" className="flex shrink-0 items-center gap-2.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logoA.png"
              alt={t("common.appName")}
              className="size-9 rounded-xl object-contain shadow-glow"
              width={36}
              height={36}
            />
            <span className="hidden text-lg font-extrabold tracking-tight min-[420px]:inline">
              <span className="text-gradient">{t("common.appName")}</span>
            </span>
          </Link>

        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          aria-label={t("nav.menu")}
          onClick={() => setMobileOpen((v) => !v)}
        >
          {mobileOpen ? <X className="size-4" /> : <Menu className="size-4" />}
        </Button>

        <nav className="ms-2 hidden items-center gap-1 lg:flex">
          {navLinks.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={cn(
                "relative rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive(l.href)
                  ? "text-primary"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground",
              )}
            >
              {isActive(l.href) && (
                <span className="absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-brand-gradient" />
              )}
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="ms-auto flex items-center gap-1.5">
          <div className="hidden w-56 md:block">{renderSearchBox()}</div>

          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            aria-label={t("common.search")}
            onClick={() => setMobileSearch((v) => !v)}
          >
            <Search className="size-4" />
          </Button>

          {user && <NotificationsBell />}
          {user && (
            <Button
              variant="ghost"
              size="icon"
              aria-label={t("nav.support")}
              onClick={() => router.push("/support")}
            >
              <CircleHelp className="size-4" />
            </Button>
          )}
          <LanguageSwitcher />
          <ThemeToggle />

          {user ? (
            <Dropdown
              align="end"
              trigger={
                <Button
                  variant="outline"
                  className="gap-2 rounded-full px-2"
                >
                  {user.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={user.avatarUrl}
                      alt={user.name || user.username}
                      width={28}
                      height={28}
                      className="size-7 rounded-full object-cover"
                    />
                  ) : (
                    <span className="flex size-7 items-center justify-center rounded-full bg-brand-gradient text-xs font-bold text-primary-foreground">
                      {userInitial}
                    </span>
                  )}
                  <span className="hidden max-w-24 truncate text-sm sm:inline">
                    {user.name || user.username}
                  </span>
                </Button>
              }
            >
              {(close) => (
                <div className="py-1">
                  <DropdownItem
                    onClick={() => {
                      router.push("/favorites");
                      close();
                    }}
                  >
                    <Play className="size-4" />
                    {t("nav.favorites")}
                  </DropdownItem>
                  <DropdownItem
                    onClick={() => {
                      router.push("/history");
                      close();
                    }}
                  >
                    <History className="size-4" />
                    {t("nav.history")}
                  </DropdownItem>
                  <DropdownItem
                    onClick={() => {
                      router.push("/continue-watching");
                      close();
                    }}
                  >
                    <ListVideo className="size-4" />
                    {t("nav.continueWatching")}
                  </DropdownItem>
                  <DropdownItem
                    onClick={() => {
                      router.push("/friends");
                      close();
                    }}
                  >
                    <UserPlus className="size-4" />
                    {t("nav.friends")}
                  </DropdownItem>
                  <DropdownItem
                    onClick={() => {
                      router.push("/messages");
                      close();
                    }}
                  >
                    <MessageSquare className="size-4" />
                    {t("nav.messages")}
                  </DropdownItem>
                  <DropdownItem
                    onClick={() => {
                      router.push("/support");
                      close();
                    }}
                  >
                    <CircleHelp className="size-4" />
                    {t("nav.support")}
                  </DropdownItem>
                  <DropdownItem
                    onClick={() => {
                      router.push("/reports");
                      close();
                    }}
                  >
                    <Flag className="size-4" />
                    {t("support.reportsTitle")}
                  </DropdownItem>
                  <DropdownItem
                    onClick={() => {
                      router.push("/profile");
                      close();
                    }}
                  >
                    <UserIcon className="size-4" />
                    {t("nav.profile")}
                  </DropdownItem>
                  <DropdownItem
                    onClick={() => {
                      router.push("/settings");
                      close();
                    }}
                  >
                    <Settings className="size-4" />
                    {t("nav.settings")}
                  </DropdownItem>
                  <div className="my-1 h-px bg-border" />
                  <DropdownItem
                    onClick={() => {
                      void logout();
                      close();
                    }}
                  >
                    <LogOut className="size-4" />
                    {t("nav.logout")}
                  </DropdownItem>
                </div>
              )}
            </Dropdown>
          ) : (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/login")}
                className="hidden sm:inline-flex"
              >
                {t("nav.login")}
              </Button>
              <Button size="sm" onClick={() => router.push("/register")}>
                {t("nav.register")}
              </Button>
            </>
          )}
          </div>
        </div>

        {mobileSearch && (
          <div className="absolute inset-x-0 top-full mt-2 overflow-hidden rounded-2xl border border-border glass p-3 shadow-lifted md:hidden animate-in fade-in slide-in-from-top-1 duration-150">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                submitSearch(q);
              }}
            >
              {renderSearchBox(true)}
            </form>
          </div>
        )}

        {mobileOpen && (
          <nav className="absolute inset-x-0 top-full mt-2 overflow-hidden rounded-2xl border border-border glass p-2 shadow-lifted lg:hidden animate-in fade-in slide-in-from-top-1 duration-150">
            {navLinks.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "rounded-lg px-3 py-2 text-sm font-medium",
                  isActive(l.href)
                    ? "bg-accent text-primary"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground",
                )}
              >
                {l.label}
              </Link>
            ))}
            {!user && (
              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => router.push("/login")}
                >
                  {t("nav.login")}
                </Button>
                <Button
                  size="sm"
                  className="flex-1"
                  onClick={() => router.push("/register")}
                >
                  {t("nav.register")}
                </Button>
              </div>
            )}
          </nav>
        )}
      </div>
    </header>
  );
}
