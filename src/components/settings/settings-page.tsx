"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  Link2,
  MonitorSmartphone,
  ShieldCheck,
  UserRound,
  Palette,
  Globe,
  Bell,
  ChevronRight,
} from "lucide-react";
import { RequireAuth } from "@/components/require-auth";
import { SecurityForm } from "@/components/settings/security-form";
import { ProfileForm } from "@/components/settings/profile-form";
import { SessionsSection } from "@/components/settings/sessions-section";
import { LinkedAccountsSection } from "@/components/settings/linked-accounts";
import { cn } from "@/lib/format";

type AccountTab = "profile" | "security" | "linked" | "sessions";
type SettingsSection = "account" | "appearance" | "language" | "notifications";

interface SidebarItem {
  id: SettingsSection;
  icon: typeof UserRound;
  label: string;
  description: string;
}

interface AccountSubTab {
  id: AccountTab;
  icon: typeof UserRound;
  label: string;
}

const SIDEBAR_ITEMS: SidebarItem[] = [
  { id: "account", icon: UserRound, label: "settings.profile", description: "settings.subtitle" },
  { id: "appearance", icon: Palette, label: "settings.appearance", description: "settings.appearanceDesc" },
  { id: "language", icon: Globe, label: "settings.language", description: "settings.languageDesc" },
  { id: "notifications", icon: Bell, label: "settings.notifications", description: "settings.notificationsDesc" },
];

const ACCOUNT_TABS: AccountSubTab[] = [
  { id: "profile", icon: UserRound, label: "settings.profile" },
  { id: "security", icon: ShieldCheck, label: "settings.security" },
  { id: "linked", icon: Link2, label: "settings.linkedAccounts" },
  { id: "sessions", icon: MonitorSmartphone, label: "settings.sessions" },
];

function AppearanceSection() {
  const t = useTranslations();
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold">{t("settings.appearance")}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{t("settings.appearanceDesc")}</p>
      </div>
      <div className="rounded-2xl border border-border bg-card p-6">
        <p className="text-sm text-muted-foreground">
          {t("settings.appearanceHint")}
        </p>
      </div>
    </div>
  );
}

function LanguageSection() {
  const t = useTranslations();
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold">{t("settings.language")}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{t("settings.languageDesc")}</p>
      </div>
      <div className="rounded-2xl border border-border bg-card p-6">
        <p className="text-sm text-muted-foreground">
          {t("settings.languageHint")}
        </p>
      </div>
    </div>
  );
}

function NotificationsSection() {
  const t = useTranslations();
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold">{t("settings.notifications")}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{t("settings.notificationsDesc")}</p>
      </div>
      <div className="rounded-2xl border border-border bg-card p-6">
        <p className="text-sm text-muted-foreground">
          {t("settings.notificationsHint")}
        </p>
      </div>
    </div>
  );
}

function SettingsInner() {
  const t = useTranslations();
  const [section, setSection] = useState<SettingsSection>("account");
  const [accountTab, setAccountTab] = useState<AccountTab>("profile");

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <div className="mb-8">
        <h1 className="text-2xl font-black tracking-tight">{t("settings.title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("settings.subtitle")}
        </p>
      </div>

      <div className="flex flex-col gap-6 lg:flex-row">
        {/* Sidebar */}
        <nav className="w-full shrink-0 lg:w-64">
          <div className="flex flex-col gap-1 lg:sticky lg:top-24">
            {SIDEBAR_ITEMS.map(({ id, icon: Icon, label, description }) => (
              <button
                key={id}
                type="button"
                onClick={() => setSection(id)}
                className={cn(
                  "group flex w-full items-center gap-3 rounded-xl px-3 py-3 text-start transition-all duration-200",
                  section === id
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground",
                )}
              >
                <span
                  className={cn(
                    "flex size-9 shrink-0 items-center justify-center rounded-lg transition-colors",
                    section === id
                      ? "bg-primary/15 text-primary"
                      : "bg-secondary text-muted-foreground group-hover:text-foreground",
                  )}
                >
                  <Icon className="size-4.5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium">{t(label)}</span>
                  <span className="block text-xs text-muted-foreground">{t(description)}</span>
                </span>
                <ChevronRight
                  className={cn(
                    "size-4 shrink-0 transition-all",
                    section === id
                      ? "text-primary opacity-100"
                      : "opacity-0 group-hover:opacity-100",
                  )}
                />
              </button>
            ))}
          </div>
        </nav>

        {/* Content */}
        <div className="min-w-0 flex-1">
          {section === "account" && (
            <div className="space-y-6">
              {/* Account sub-tabs */}
              <div className="flex gap-1 rounded-xl border border-border bg-muted/40 p-1 overflow-x-auto">
                {ACCOUNT_TABS.map(({ id, icon: Icon, label }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setAccountTab(id)}
                    className={cn(
                      "flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors whitespace-nowrap",
                      accountTab === id
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    <Icon className="size-4" />
                    {t(label)}
                  </button>
                ))}
              </div>

              {accountTab === "profile" ? (
                <ProfileForm />
              ) : accountTab === "security" ? (
                <SecurityForm />
              ) : accountTab === "linked" ? (
                <LinkedAccountsSection onGoToSecurity={() => setAccountTab("security")} />
              ) : (
                <SessionsSection />
              )}
            </div>
          )}

          {section === "appearance" && <AppearanceSection />}
          {section === "language" && <LanguageSection />}
          {section === "notifications" && <NotificationsSection />}
        </div>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <RequireAuth>
      <SettingsInner />
    </RequireAuth>
  );
}
