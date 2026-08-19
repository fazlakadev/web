"use client";

import { useEffect, useState } from "react";
import { AtSign, Camera, Music2, Play } from "lucide-react";
import { api } from "@/lib/api";

type SocialDef = {
  key: string;
  label: string;
  icon: typeof AtSign;
  buildUrl: (handle: string) => string;
};

const SOCIAL_DEFS: SocialDef[] = [
  {
    key: "socialX",
    label: "X",
    icon: AtSign,
    buildUrl: (h) => (h.startsWith("http") ? h : `https://x.com/${h}`),
  },
  {
    key: "socialInstagram",
    label: "Instagram",
    icon: Camera,
    buildUrl: (h) => (h.startsWith("http") ? h : `https://instagram.com/${h}`),
  },
  {
    key: "socialTiktok",
    label: "TikTok",
    icon: Music2,
    buildUrl: (h) => (h.startsWith("http") ? h : `https://tiktok.com/@${h.replace(/^@/, "")}`),
  },
  {
    key: "socialYoutube",
    label: "YouTube",
    icon: Play,
    buildUrl: (h) => (h.startsWith("http") ? h : `https://youtube.com/${h.replace(/^@/, "")}`),
  },
];

export function FooterSocials() {
  const [links, setLinks] = useState<{ label: string; icon: typeof AtSign; href: string }[]>([]);

  useEffect(() => {
    api
      .get<Record<string, string>>("/settings/public")
      .then((res) => {
        const settings = res.data ?? {};
        const next = SOCIAL_DEFS.filter((d) => settings[d.key]?.trim())
          .map((d) => ({
            label: d.label,
            icon: d.icon,
            href: d.buildUrl(settings[d.key].trim()),
          }));
        setLinks(next);
      })
      .catch(() => {
        setLinks([]);
      });
  }, []);

  if (!links.length) return null;

  return (
    <div className="flex gap-2 pt-1">
      {links.map(({ label, icon: Icon, href }) => (
        <a
          key={label}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={label}
          className="flex size-9 items-center justify-center rounded-full border border-border bg-background/50 text-muted-foreground transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/50 hover:text-primary hover:shadow-glow"
        >
          <Icon className="size-4" />
        </a>
      ))}
    </div>
  );
}
