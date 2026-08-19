"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import {
  Camera,
  Copy,
  Gift,
  Globe,
  History,
  ListVideo,
  LogOut,
  Mail,
  MessageSquare,
  Play,
  Settings,
  ShieldCheck,
  UserPlus,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "@/i18n/navigation";
import { useAuth } from "@/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, Skeleton } from "@/components/ui/card";
import { formatDate, initials } from "@/lib/format";
import { API_BASE, api, getAccessToken } from "@/lib/api";
import { RequireAuth } from "@/components/require-auth";
import { UserPlaylists } from "@/components/user-playlists";
import type { FriendUser, LikeHistoryItem, Playlist } from "@/lib/types";
import type { ViewHistoryItem } from "@/lib/types";

interface ReferralRow {
  id: string;
  name: string | null;
  username: string | null;
  avatarUrl: string | null;
  status: string;
  createdAt: string;
}

interface ReferralsResponse {
  referralCode: string | null;
  referrals: ReferralRow[];
  meta: { page: number; limit: number; total: number };
}

function ProfileInner() {
  const t = useTranslations();
  const { user, logout } = useAuth();
  const router = useRouter();

  const [stats, setStats] = useState<{
    favorites: number;
    history: number;
    playlists: number;
    friends: number;
  } | null>(null);

  const [referrals, setReferrals] = useState<ReferralsResponse | null>(null);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [banner, setBanner] = useState<string | null | undefined>(
    user?.bannerUrl,
  );
  const bannerInputRef = useRef<HTMLInputElement>(null);

  const uploadBanner = async (file: File | undefined) => {
    if (!file || uploadingBanner) return;
    setUploadingBanner(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const token = getAccessToken();
      const res = await fetch(`${API_BASE}/users/me/banner`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: form,
      });
      const json = await res.json();
      if (!res.ok || json?.success === false) throw new Error("upload_failed");
      setBanner(json.data.bannerUrl);
      toast.success(t("profile.bannerUpdated"));
    } catch {
      toast.error(t("common.error"));
    } finally {
      setUploadingBanner(false);
    }
  };

  const loadStats = useCallback(async () => {
    if (!user) return;
    try {
      const [fav, hist, pl, fr, ref] = await Promise.all([
        api.get<LikeHistoryItem[]>("/likes/history", { limit: 1 }),
        api.get<ViewHistoryItem[]>("/views/history", { limit: 1 }),
        api.get<Playlist[]>("/playlists", { limit: 100 }),
        api.get<FriendUser[]>("/friends", { limit: 1 }),
        api.get<ReferralsResponse>("/users/me/referrals", { limit: 50 }),
      ]);
      setStats({
        favorites: fav.meta?.total ?? (fav.data ?? []).length,
        history: hist.meta?.total ?? (hist.data ?? []).length,
        playlists:
          (pl.data ?? []).filter(
            (p) => p.kind === "user" && p.ownerId === user.id,
          ).length,
        friends: fr.meta?.total ?? (fr.data ?? []).length,
      });
      setReferrals(ref.data ?? null);
    } catch {
      setStats({ favorites: 0, history: 0, playlists: 0, friends: 0 });
    }
  }, [user]);

  useEffect(() => {
    void loadStats();
  }, [loadStats]);

  if (!user) return null;

  const statCards = [
    {
      label: t("user.favorites"),
      value: stats?.favorites,
      icon: Play,
    },
    {
      label: t("user.history"),
      value: stats?.history,
      icon: History,
    },
    {
      label: t("user.playlists"),
      value: stats?.playlists,
      icon: ListVideo,
    },
    {
      label: t("user.friends"),
      value: stats?.friends,
      icon: Users,
    },
  ];

  const links = [
    { href: "/favorites", icon: Play, label: t("user.favorites") },
    { href: "/history", icon: History, label: t("user.history") },
    {
      href: "/continue-watching",
      icon: ListVideo,
      label: t("user.continueWatching"),
    },
    { href: "/friends", icon: UserPlus, label: t("nav.friends") },
    { href: "/messages", icon: MessageSquare, label: t("nav.messages") },
    {
      href: `/u/${user.publicId ?? user.username}`,
      icon: Globe,
      label: t("profile.viewPublic"),
    },
    { href: "/settings", icon: Settings, label: t("user.settings") },
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <Card className="overflow-hidden">
        <div className="relative h-36">
          {banner ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={banner}
              alt=""
              className="size-full object-cover"
            />
          ) : (
            <div className="size-full bg-brand-gradient" />
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/30" />
          <input
            ref={bannerInputRef}
            type="file"
            accept="image/*"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0];
              e.target.value = "";
              void uploadBanner(f);
            }}
          />
          <Button
            variant="outline"
            size="sm"
            className="absolute end-4 top-4 gap-1.5 bg-background/70 backdrop-blur"
            onClick={() => bannerInputRef.current?.click()}
            disabled={uploadingBanner}
          >
            {uploadingBanner ? (
              <Skeleton className="size-4 rounded-full" />
            ) : (
              <Camera className="size-3.5" />
            )}
            {t("profile.changeBanner")}
          </Button>
          {!banner ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src="/logoA.png"
              alt=""
              className="absolute end-4 bottom-4 size-10 rounded-xl object-contain opacity-30"
            />
          ) : null}
        </div>

        <div className="px-5 pb-6 sm:px-8">
          <div className="-mt-12 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex items-end gap-4">
              <Avatar className="size-24 border-4 border-background shadow-lg">
                {user.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={user.avatarUrl}
                    alt=""
                    className="size-full object-cover"
                  />
                ) : (
                  <span className="flex size-full items-center justify-center bg-brand-gradient text-2xl font-bold text-primary-foreground">
                    {initials(user.name || user.username)}
                  </span>
                )}
              </Avatar>
              <div className="pb-1">
                <h1 className="text-xl font-bold sm:text-2xl">
                  {user.name || user.username}
                </h1>
                <p className="text-sm text-muted-foreground">@{user.username}</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 pb-1">
              <span className="inline-flex items-center gap-1 rounded-full border border-border bg-background/60 px-2.5 py-0.5 text-xs text-muted-foreground">
                <Mail className="size-3" />
                {user.email}
              </span>
              {user.twoFactorEnabled ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-600">
                  <ShieldCheck className="size-3" />
                  2FA
                </span>
              ) : null}
            </div>
          </div>

          {user.bio ? (
            <p className="mt-4 max-w-2xl text-sm text-muted-foreground">
              {user.bio}
            </p>
          ) : null}

          <p className="mt-2 text-xs text-muted-foreground">
            {t("user.memberSince")} {formatDate(user.createdAt)}
          </p>

          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {statCards.map((s) => (
              <div
                key={s.label}
                className="flex items-center gap-3 rounded-xl border border-border bg-background/60 p-3"
              >
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <s.icon className="size-4" />
                </span>
                <div className="min-w-0">
                  <p className="text-lg font-bold leading-none">
                    {s.value === undefined ? (
                      <Skeleton className="h-5 w-8" />
                    ) : (
                      s.value
                    )}
                  </p>
                  <p className="mt-1 truncate text-[11px] text-muted-foreground">
                    {s.label}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {user.referralCode ? (
            <div className="mt-6 flex flex-col gap-3 rounded-xl border border-border bg-background/60 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Gift className="size-4" />
                </span>
                <div>
                  <p className="text-sm font-bold">{t("user.referralTitle")}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {t("user.referralSubtitle")}
                  </p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {t("user.referralCodeLabel")}:{" "}
                    <span className="font-mono font-semibold text-foreground">
                      {user.referralCode}
                    </span>
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={async () => {
                  const url = `${window.location.origin}/register?ref=${encodeURIComponent(user.referralCode ?? "")}`;
                  try {
                    await navigator.clipboard.writeText(url);
                    toast.success(t("user.referralCopied"));
                  } catch {
                    toast.error(t("common.error"));
                  }
                }}
              >
                <Copy className="size-3.5" />
                {t("user.referralCopy")}
              </Button>
            </div>
          ) : null}

          {referrals && (referrals.referrals.length > 0 || referrals.referralCode) ? (
            <div className="mt-6 flex flex-col gap-3 rounded-xl border border-border bg-background/60 p-4">
              <div className="flex items-center gap-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <UserPlus className="size-4" />
                </span>
                <div>
                  <p className="text-sm font-bold">{t("user.referralsTitle")}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {t("user.referralsSubtitle", {
                      count: referrals.referrals.length,
                    })}
                  </p>
                </div>
              </div>
              {referrals.referrals.length === 0 ? (
                <p className="px-1 text-xs text-muted-foreground">
                  {t("user.referralsEmpty")}
                </p>
              ) : (
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {referrals.referrals.map((r) => (
                    <div
                      key={r.id}
                      className="flex items-center gap-3 rounded-lg border border-border bg-background/60 p-3"
                    >
                      {r.avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={r.avatarUrl}
                          alt={r.name || r.username || ""}
                          className="size-9 shrink-0 rounded-full object-cover"
                        />
                      ) : (
                        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                          {initials(r.name || r.username || "?")}
                        </span>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">
                          {r.name || r.username || "—"}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          {formatDate(r.createdAt)}
                        </p>
                      </div>
                      <span className="text-xs capitalize text-muted-foreground">
                        {r.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : null}

          <div className="mt-6 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {links.map((l) => (              <Button
                key={l.href}
                variant="outline"
                className="justify-start gap-2"
                onClick={() => router.push(l.href)}
              >
                <l.icon className="size-4" />
                {l.label}
              </Button>
            ))}
            <Button
              variant="destructive"
              className="justify-start gap-2 sm:col-span-2"
              onClick={() => void logout()}
            >
              <LogOut className="size-4" />
              {t("nav.logout")}
            </Button>
          </div>
        </div>
      </Card>

      <UserPlaylists />
    </div>
  );
}

export default function ProfilePage() {
  return (
    <RequireAuth>
      <ProfileInner />
    </RequireAuth>
  );
}
