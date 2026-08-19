"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import {
  ChevronDown,
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
  Download,
  X,
  Film,
  BookOpen,
  List,
  Info,
  HelpCircle,
  Languages,
  Moon,
  Sun,
  Check,
} from "lucide-react";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { useAuth } from "@/providers/auth-provider";
import { useThemeMode } from "@/providers/theme-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dropdown, DropdownItem } from "@/components/ui/dropdown";
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

const LOCALES = [
  { code: "ar", label: "العربية" },
  { code: "en", label: "English" },
  { code: "fr", label: "Français" },
];

export function Header() {
  const t = useTranslations();
  const locale = useLocale();
  const { user, logout } = useAuth();
  const { resolvedTheme, setTheme } = useThemeMode();
  const router = useRouter();
  const pathname = usePathname();
  const [q, setQ] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  const submitSearch = (query: string) => {
    const trimmed = query.trim();
    if (trimmed) router.push(`/search?q=${encodeURIComponent(trimmed)}`);
    setShowSuggestions(false);
    setMobileOpen(false);
    setSearchOpen(false);
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
    if (searchOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 150);
    }
  }, [searchOpen]);

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

  useEffect(() => {
    if (!searchOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSearchOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [searchOpen]);

  const userInitial = (user?.name || user?.username || "?")
    .slice(0, 1)
    .toUpperCase();

  const isDark = resolvedTheme === "dark";

  const renderSearchSuggestions = () => (
    showSuggestions && suggestions.length > 0 && (
      <div className="absolute top-full z-50 mt-2 w-full overflow-hidden rounded-xl border border-border bg-popover p-1 text-popover-foreground shadow-lifted animate-in fade-in slide-in-from-top-2 duration-150">
        {suggestions.map((s) => {
          const Icon = TYPE_ICON[s.type] ?? Play;
          return (
            <button
              key={`${s.type}-${s.slug}`}
              type="button"
              onClick={() => router.push(suggestionHref(s))}
              className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-start text-sm transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-secondary text-muted-foreground">
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
          className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-start text-sm font-medium text-primary transition-colors hover:bg-accent"
        >
          <Search className="size-3.5" />
          {t("browse.searchAll", { query: q.trim() })}
        </button>
      </div>
    )
  );

  return (
    <header className="sticky top-3 z-40 px-3 sm:top-4 sm:px-6">
      <div className="relative mx-auto max-w-6xl">
        <div
          className={cn(
            "glass flex h-14 items-center gap-1.5 rounded-full border border-border/70 px-2.5 shadow-soft transition-all duration-300 animate-in fade-in slide-in-from-top-3 duration-500 sm:px-4",
            scrolled && "glass-strong shadow-lifted",
          )}
        >
          {/* Logo — text removed */}
          <Link href="/" className="group flex shrink-0 items-center gap-2 pe-1">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logoA.png"
              alt={t("common.appName")}
              className="size-9 rounded-xl object-contain shadow-glow transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6"
              width={36}
              height={36}
            />
          </Link>

          {/* Mobile hamburger */}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            aria-label={t("nav.menu")}
            onClick={() => setMobileOpen((v) => !v)}
          >
            {mobileOpen ? <X className="size-4" /> : <Menu className="size-4" />}
          </Button>

          {/* Desktop nav */}
          <nav className="ms-1 hidden items-center gap-0.5 lg:flex">
            <Link
              href="/"
              className={cn(
                "relative rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-200",
                isActive("/")
                  ? "text-primary"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground",
              )}
            >
              {t("nav.home")}
              <span
                className={cn(
                  "absolute inset-x-3 -bottom-px h-0.5 origin-center rounded-full bg-brand-gradient transition-transform duration-300",
                  isActive("/") ? "scale-x-100" : "scale-x-0",
                )}
              />
            </Link>

            {/* Content dropdown */}
            <Dropdown
              align="start"
              trigger={(open) => (
                <button
                  type="button"
                  className={cn(
                    "flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-200",
                    ["/browse", "/seasons", "/articles", "/playlists"].some((p) => isActive(p))
                      ? "text-primary"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground",
                  )}
                >
                  {t("nav.content")}
                  <ChevronDown
                    className={cn(
                      "size-3.5 opacity-50 transition-transform duration-300",
                      open && "rotate-180",
                    )}
                  />
                </button>
              )}
            >
              {(close) => (
                <div className="min-w-52 py-1.5">
                  {[
                    { href: "/browse", label: t("nav.browse"), icon: Play, desc: t("nav.browse") },
                    { href: "/seasons", label: t("nav.seasons"), icon: Film, desc: t("nav.seasons") },
                    { href: "/articles", label: t("nav.articles"), icon: BookOpen, desc: t("nav.articles") },
                    { href: "/playlists", label: t("nav.playlists"), icon: List, desc: t("nav.playlists") },
                  ].map((item) => (
                    <DropdownItem
                      key={item.href}
                      onClick={() => { router.push(item.href); close(); }}
                    >
                      <div className="flex items-center gap-3">
                        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                          <item.icon className="size-4" />
                        </span>
                        <span className="text-sm font-medium">{item.label}</span>
                      </div>
                    </DropdownItem>
                  ))}
                </div>
              )}
            </Dropdown>

            {/* Company dropdown */}
            <Dropdown
              align="start"
              trigger={(open) => (
                <button
                  type="button"
                  className={cn(
                    "flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-200",
                    ["/about", "/faq", "/support", "/download"].some((p) => isActive(p))
                      ? "text-primary"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground",
                  )}
                >
                  {t("nav.company")}
                  <ChevronDown
                    className={cn(
                      "size-3.5 opacity-50 transition-transform duration-300",
                      open && "rotate-180",
                    )}
                  />
                </button>
              )}
            >
              {(close) => (
                <div className="min-w-52 py-1.5">
                  {[
                    { href: "/about", label: t("nav.about"), icon: Info },
                    { href: "/faq", label: t("footer.faq"), icon: HelpCircle },
                    { href: "/support", label: t("nav.support"), icon: CircleHelp },
                  ].map((item) => (
                    <DropdownItem
                      key={item.href}
                      onClick={() => { router.push(item.href); close(); }}
                    >
                      <div className="flex items-center gap-3">
                        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                          <item.icon className="size-4" />
                        </span>
                        <span className="text-sm font-medium">{item.label}</span>
                      </div>
                    </DropdownItem>
                  ))}
                  <div className="my-1.5 h-px bg-border" />
                  <DropdownItem
                    onClick={() => { router.push("/download"); close(); }}
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 text-white">
                        <Download className="size-4" />
                      </span>
                      <span className="text-sm font-semibold">{t("nav.download")}</span>
                    </div>
                  </DropdownItem>
                </div>
              )}
            </Dropdown>
          </nav>

          {/* Right side */}
          <div className="ms-auto flex items-center gap-1.5">
            {/* Desktop search — expandable */}
            <div className="hidden md:block" ref={searchRef}>
              <div
                className={cn(
                  "relative flex items-center overflow-hidden rounded-full transition-all duration-300 ease-out",
                  searchOpen
                    ? "w-64 border border-primary/30 bg-background shadow-glow"
                    : "w-9 border border-transparent bg-transparent hover:bg-accent",
                )}
              >
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-9 shrink-0 rounded-full"
                  onClick={() => setSearchOpen((v) => !v)}
                >
                  {searchOpen ? (
                    <X className="size-4" />
                  ) : (
                    <Search className="size-4" />
                  )}
                </Button>
                {searchOpen && (
                  <div className="relative flex-1 pe-2">
                    <input
                      ref={searchInputRef}
                      autoFocus
                      value={q}
                      onChange={(e) => setQ(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          submitSearch(q);
                        }
                      }}
                      placeholder={t("common.searchPlaceholder")}
                      className="w-full bg-transparent py-2 text-sm outline-none placeholder:text-muted-foreground"
                    />
                    {renderSearchSuggestions()}
                  </div>
                )}
              </div>
            </div>

            {/* Mobile search */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              aria-label={t("common.search")}
              onClick={() => setSearchOpen((v) => !v)}
            >
              <Search className="size-4" />
            </Button>

            {user && <NotificationsBell />}

            {/* Settings dropdown — language + theme */}
            <Dropdown
              align="end"
              trigger={
                <Button variant="ghost" size="icon" aria-label={t("nav.settings")}>
                  <Settings className="size-4" />
                </Button>
              }
            >
              {(close) => (
                <div className="min-w-44 py-1">
                  {/* Theme toggle */}
                  <DropdownItem
                    onClick={() => {
                      setTheme(isDark ? "light" : "dark");
                      close();
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
                      </span>
                      <span className="text-sm font-medium">
                        {isDark ? "Light Mode" : "Dark Mode"}
                      </span>
                    </div>
                  </DropdownItem>

                  <div className="my-1.5 h-px bg-border" />

                  {/* Language options */}
                  <div className="px-2 py-1">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60 mb-1 px-2">
                      <Languages className="inline size-3 me-1" />
                      Language
                    </p>
                  </div>
                  {LOCALES.map((l) => (
                    <DropdownItem
                      key={l.code}
                      onClick={() => {
                        router.replace(pathname, { locale: l.code as never });
                        close();
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{l.label}</span>
                        {locale === l.code && <Check className="size-4 text-primary" />}
                      </div>
                    </DropdownItem>
                  ))}
                </div>
              )}
            </Dropdown>

            {user ? (
              <Dropdown
                align="end"
                trigger={
                  <Button
                    variant="outline"
                    className="gap-2 rounded-full px-2 transition-all duration-300 hover:border-primary/50 hover:shadow-glow"
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
                      onClick={() => { router.push("/favorites"); close(); }}
                    >
                      <Play className="size-4" />
                      {t("nav.favorites")}
                    </DropdownItem>
                    <DropdownItem
                      onClick={() => { router.push("/history"); close(); }}
                    >
                      <History className="size-4" />
                      {t("nav.history")}
                    </DropdownItem>
                    <DropdownItem
                      onClick={() => { router.push("/continue-watching"); close(); }}
                    >
                      <ListVideo className="size-4" />
                      {t("nav.continueWatching")}
                    </DropdownItem>
                    <DropdownItem
                      onClick={() => { router.push("/friends"); close(); }}
                    >
                      <UserPlus className="size-4" />
                      {t("nav.friends")}
                    </DropdownItem>
                    <DropdownItem
                      onClick={() => { router.push("/messages"); close(); }}
                    >
                      <MessageSquare className="size-4" />
                      {t("nav.messages")}
                    </DropdownItem>
                    <div className="my-1 h-px bg-border" />
                    <DropdownItem
                      onClick={() => { router.push("/support"); close(); }}
                    >
                      <CircleHelp className="size-4" />
                      {t("nav.support")}
                    </DropdownItem>
                    <DropdownItem
                      onClick={() => { router.push("/reports"); close(); }}
                    >
                      <Flag className="size-4" />
                      {t("support.reportsTitle")}
                    </DropdownItem>
                    <DropdownItem
                      onClick={() => { router.push("/profile"); close(); }}
                    >
                      <UserIcon className="size-4" />
                      {t("nav.profile")}
                    </DropdownItem>
                    <DropdownItem
                      onClick={() => { router.push("/settings"); close(); }}
                    >
                      <Settings className="size-4" />
                      {t("nav.settings")}
                    </DropdownItem>
                    <div className="my-1 h-px bg-border" />
                    <DropdownItem
                      onClick={() => { void logout(); close(); }}
                    >
                      <LogOut className="size-4" />
                      {t("nav.logout")}
                    </DropdownItem>
                  </div>
                )}
              </Dropdown>
            ) : (
              <div className="hidden items-center gap-2 sm:flex">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push("/login")}
                >
                  {t("nav.login")}
                </Button>
                <Button
                  size="sm"
                  className="shine rounded-full"
                  onClick={() => router.push("/register")}
                >
                  {t("nav.register")}
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Mobile search overlay */}
        {searchOpen && (
          <div className="absolute inset-x-0 top-full mt-2 overflow-hidden rounded-2xl border border-border glass p-3 shadow-lifted md:hidden animate-in fade-in slide-in-from-top-1 duration-150">
            <div ref={searchRef} className="relative">
              <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                autoFocus
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    submitSearch(q);
                  }
                }}
                placeholder={t("common.searchPlaceholder")}
                className="rounded-full border-transparent bg-secondary/70 ps-9 focus:border-primary/50 focus:bg-background"
              />
              {renderSearchSuggestions()}
            </div>
          </div>
        )}

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="absolute inset-x-0 top-full mt-2 overflow-hidden rounded-2xl border border-border glass shadow-lifted lg:hidden animate-in fade-in slide-in-from-top-1 duration-200">
            <nav className="stagger-in p-2">
              <Link
                href="/"
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "rounded-xl px-3 py-2.5 text-sm font-medium",
                  isActive("/")
                    ? "bg-accent text-primary"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground",
                )}
              >
                {t("nav.home")}
              </Link>

              <div className="px-3 pt-2 pb-1">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">{t("nav.content")}</p>
              </div>
              {[
                { href: "/browse", label: t("nav.browse"), icon: Play },
                { href: "/seasons", label: t("nav.seasons"), icon: Film },
                { href: "/articles", label: t("nav.articles"), icon: BookOpen },
                { href: "/playlists", label: t("nav.playlists"), icon: List },
              ].map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium",
                    isActive(l.href)
                      ? "bg-accent text-primary"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground",
                  )}
                >
                  <l.icon className="size-4" />
                  {l.label}
                </Link>
              ))}

              <div className="px-3 pt-3 pb-1">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">{t("nav.company")}</p>
              </div>
              {[
                { href: "/about", label: t("nav.about"), icon: Info },
                { href: "/faq", label: t("footer.faq"), icon: HelpCircle },
                { href: "/support", label: t("nav.support"), icon: CircleHelp },
                { href: "/download", label: t("nav.download"), icon: Download },
              ].map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium",
                    isActive(l.href)
                      ? "bg-accent text-primary"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground",
                  )}
                >
                  <l.icon className="size-4" />
                  {l.label}
                </Link>
              ))}

              {!user && (
                <div className="flex gap-2 px-3 pt-4 pb-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => { router.push("/login"); setMobileOpen(false); }}
                  >
                    {t("nav.login")}
                  </Button>
                  <Button
                    size="sm"
                    className="shine flex-1 rounded-full"
                    onClick={() => { router.push("/register"); setMobileOpen(false); }}
                  >
                    {t("nav.register")}
                  </Button>
                </div>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
