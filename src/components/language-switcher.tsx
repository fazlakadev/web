"use client";

import { Languages, Check } from "lucide-react";
import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Dropdown, DropdownItem } from "@/components/ui/dropdown";

const LOCALES = [
  { code: "ar", label: "العربية" },
  { code: "en", label: "English" },
  { code: "fr", label: "Français" },
];

export function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  return (
    <Dropdown
      align="end"
      trigger={
        <Button variant="ghost" size="icon" aria-label="Language">
          <Languages className="size-4" />
        </Button>
      }
    >
      {(close) => (
        <div className="py-1">
          {LOCALES.map((l) => (
            <DropdownItem
              key={l.code}
              onClick={() => {
                router.replace(pathname, { locale: l.code as never });
                close();
              }}
            >
              <span className="flex-1 text-start">{l.label}</span>
              {locale === l.code && <Check className="size-4 text-primary" />}
            </DropdownItem>
          ))}
        </div>
      )}
    </Dropdown>
  );
}
