"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link2, MonitorSmartphone, ShieldCheck, UserRound } from "lucide-react";
import { RequireAuth } from "@/components/require-auth";
import { SecurityForm } from "@/components/settings/security-form";
import { ProfileForm } from "@/components/settings/profile-form";
import { SessionsSection } from "@/components/settings/sessions-section";
import { LinkedAccountsSection } from "@/components/settings/linked-accounts";
import { cn } from "@/lib/format";

type Tab = "profile" | "security" | "sessions" | "linked";

const TABS: { id: Tab; icon: typeof UserRound; label: string }[] = [
  { id: "profile", icon: UserRound, label: "settings.profile" },
  { id: "security", icon: ShieldCheck, label: "settings.security" },
  { id: "linked", icon: Link2, label: "settings.linkedAccounts" },
  { id: "sessions", icon: MonitorSmartphone, label: "settings.sessions" },
];

function SettingsInner() {
  const t = useTranslations();
  const [tab, setTab] = useState<Tab>("profile");

  return (
    <div className="mx-auto max-w-xl px-4 py-10 sm:px-6">
      <div className="mb-6">
        <h1 className="text-xl font-bold">{t("settings.title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("settings.subtitle")}
        </p>
      </div>

      <div className="mb-6 flex gap-1 rounded-xl border border-border bg-muted/40 p-1">
        {TABS.map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={cn(
              "flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              tab === id
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Icon className="size-4" />
            {t(label)}
          </button>
        ))}
      </div>

      {tab === "profile" ? (
        <ProfileForm />
      ) : tab === "security" ? (
        <SecurityForm />
      ) : tab === "linked" ? (
        <LinkedAccountsSection onGoToSecurity={() => setTab("security")} />
      ) : (
        <SessionsSection />
      )}
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
