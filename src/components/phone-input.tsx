"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { ChevronDown, Search, SearchX } from "lucide-react";
import { cn } from "@/lib/format";

export interface Country {
  code: string;
  name: string;
  flag: string;
}

export const COUNTRIES: Country[] = [
  { code: "20", name: "Egypt", flag: "🇪🇬" },
  { code: "966", name: "Saudi Arabia", flag: "🇸🇦" },
  { code: "971", name: "UAE", flag: "🇦🇪" },
  { code: "965", name: "Kuwait", flag: "🇰🇼" },
  { code: "974", name: "Qatar", flag: "🇶🇦" },
  { code: "973", name: "Bahrain", flag: "🇧🇭" },
  { code: "968", name: "Oman", flag: "🇴🇲" },
  { code: "962", name: "Jordan", flag: "🇯🇴" },
  { code: "961", name: "Lebanon", flag: "🇱🇧" },
  { code: "963", name: "Syria", flag: "🇸🇾" },
  { code: "964", name: "Iraq", flag: "🇮🇶" },
  { code: "967", name: "Yemen", flag: "🇾🇪" },
  { code: "970", name: "Palestine", flag: "🇵🇸" },
  { code: "249", name: "Sudan", flag: "🇸🇩" },
  { code: "212", name: "Morocco", flag: "🇲🇦" },
  { code: "213", name: "Algeria", flag: "🇩🇿" },
  { code: "216", name: "Tunisia", flag: "🇹🇳" },
  { code: "218", name: "Libya", flag: "🇱🇾" },
  { code: "90", name: "Turkey", flag: "🇹🇷" },
  { code: "1", name: "United States", flag: "🇺🇸" },
  { code: "44", name: "United Kingdom", flag: "🇬🇧" },
  { code: "33", name: "France", flag: "🇫🇷" },
  { code: "49", name: "Germany", flag: "🇩🇪" },
  { code: "7", name: "Russia", flag: "🇷🇺" },
  { code: "91", name: "India", flag: "🇮🇳" },
];

const DEFAULT_COUNTRY = "20";

function parseCountryCode(e164: string): string {
  const digits = e164.replace(/\D/g, "");
  if (!digits) return DEFAULT_COUNTRY;
  const sorted = [...COUNTRIES].sort(
    (a, b) => b.code.length - a.code.length,
  );
  const match = sorted.find((c) => digits.startsWith(c.code));
  return match ? match.code : DEFAULT_COUNTRY;
}

function parseNational(digits: string, countryCode: string): string {
  let rest = digits;
  if (rest.startsWith(countryCode)) rest = rest.slice(countryCode.length);
  rest = rest.replace(/^0+/, "");
  return rest;
}

interface PhoneInputProps {
  id?: string;
  value?: string;
  onChange: (e164: string) => void;
  autoFocus?: boolean;
  placeholder?: string;
}

export function PhoneInput({
  id,
  value = "",
  onChange,
  autoFocus,
  placeholder,
}: PhoneInputProps) {
  const t = useTranslations();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [country, setCountry] = useState<string>(() =>
    value ? parseCountryCode(value) : DEFAULT_COUNTRY,
  );
  const [national, setNational] = useState<string>(() =>
    value ? parseNational(value.replace(/\D/g, ""), country) : "",
  );
  const firstRender = useRef(true);
  const searchRef = useRef<HTMLInputElement>(null);

  const current = COUNTRIES.find((c) => c.code === country) || COUNTRIES[0];

  const filtered = COUNTRIES.filter((c) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (
      c.name.toLowerCase().includes(q) ||
      c.code.includes(q) ||
      c.flag.includes(q)
    );
  });

  useEffect(() => {
    if (open) {
      setQuery("");
      const t = window.setTimeout(() => searchRef.current?.focus(), 50);
      return () => window.clearTimeout(t);
    }
  }, [open]);

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    const expected = `+${country}${national.replace(/\D/g, "")}`;
    if (value !== expected) {
      const digits = value.replace(/\D/g, "");
      if (!digits) {
        setCountry(DEFAULT_COUNTRY);
        setNational("");
      } else {
        setCountry(parseCountryCode(value));
        setNational(parseNational(digits, parseCountryCode(value)));
      }
    }
  }, [value, country, national]);

  const update = (c: string, n: string) => {
    setCountry(c);
    setNational(n);
    onChange(`+${c}${n.replace(/\D/g, "")}`);
  };

  const handleNational = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, "");
    const cleaned = digits.startsWith("0") ? digits.replace(/^0+/, "") : digits;
    update(country, cleaned.slice(0, 15));
  };

  const selectCountry = (c: string) => {
    update(c, national);
    setOpen(false);
    setQuery("");
  };

  return (
    <div className="flex gap-2">
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="flex h-10 items-center gap-1.5 rounded-xl border border-border bg-background px-3 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          aria-haspopup="listbox"
          aria-expanded={open}
        >
          <span className="text-base leading-none">{current.flag}</span>
          <span className="font-mono">+{country}</span>
          <ChevronDown className="size-3.5 text-muted-foreground" />
        </button>
        {open && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setOpen(false)}
              aria-hidden="true"
            />
            <ul
              className="absolute z-50 mt-1 max-h-64 w-72 overflow-hidden rounded-xl border border-border bg-card p-1 shadow-lg"
              role="listbox"
            >
              <li className="p-1">
                <div className="relative">
                  <Search className="pointer-events-none absolute start-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                  <input
                    ref={searchRef}
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={t("auth.searchCountry")}
                    className="h-9 w-full rounded-lg border border-border bg-background pe-3 ps-8 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </li>
              <div className="max-h-52 overflow-y-auto">
                {filtered.length === 0 ? (
                  <li className="flex items-center gap-2 px-3 py-4 text-sm text-muted-foreground">
                    <SearchX className="size-4" />
                    {t("auth.noCountries")}
                  </li>
                ) : (
                  filtered.map((c) => (
                    <li key={c.code}>
                      <button
                        type="button"
                        role="option"
                        aria-selected={c.code === country}
                        onClick={() => selectCountry(c.code)}
                        className={cn(
                          "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-start text-sm transition-colors hover:bg-accent",
                          c.code === country && "bg-accent text-foreground",
                        )}
                      >
                        <span className="text-base leading-none">{c.flag}</span>
                        <span className="flex-1 truncate text-foreground">
                          {c.name}
                        </span>
                        <span className="font-mono text-xs text-muted-foreground">
                          +{c.code}
                        </span>
                      </button>
                    </li>
                  ))
                )}
              </div>
            </ul>
          </>
        )}
      </div>
      <div className="relative flex-1">
        <input
          id={id}
          type="tel"
          inputMode="tel"
          autoComplete="tel-national"
          autoFocus={autoFocus}
          value={national}
          onChange={handleNational}
          placeholder={placeholder}
          dir="ltr"
          className="h-10 w-full rounded-xl border border-border bg-background px-3 text-left text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
        />
      </div>
    </div>
  );
}
