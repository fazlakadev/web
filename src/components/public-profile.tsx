"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import {
  BadgeCheck,
  Calendar,
  FileText,
  ListVideo,
  Loader2,
  MessageSquare,
  Star,
  UserPlus,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "@/i18n/navigation";
import { useAuth } from "@/providers/auth-provider";
import { Avatar, Card, Spinner } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/empty-state";
import { api } from "@/lib/api";
import { formatDate, initials } from "@/lib/format";
import type { ConversationDetail, FriendRelation, PublicProfile } from "@/lib/types";

export function PublicProfilePage({ username }: { username: string }) {
  const t = useTranslations();
  const router = useRouter();
  const { user } = useAuth();

  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [relation, setRelation] = useState<FriendRelation | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<PublicProfile>(`/users/profile/${username}`);
      const data = res.data ?? null;
      setProfile(data);
      if (data?.publicId && data.publicId !== username) {
        router.replace(`/u/${data.publicId}`);
      }
    } catch {
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, [username, router]);

  const loadRelation = useCallback(async (userId: string) => {
    try {
      const res = await api.get<FriendRelation>(`/friends/relationship/${userId}`);
      setRelation(res.data ?? null);
    } catch {
      setRelation(null);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (profile && user && profile.id !== user.id) {
      void loadRelation(profile.id);
    } else {
      setRelation(null);
    }
  }, [profile, user, loadRelation]);

  const addFriend = async () => {
    if (!profile || busy) return;
    setBusy(true);
    try {
      await api.post(`/friends/request/${profile.id}`);
      toast.success(t("friends.requestSent"));
      setRelation({ status: "pending", incoming: false });
    } catch {
      toast.error(t("friends.requestError"));
    } finally {
      setBusy(false);
    }
  };

  const startChat = async () => {
    if (!profile || busy) return;
    setBusy(true);
    try {
      const res = await api.post<ConversationDetail>("/messages/conversations", {
        userId: profile.id,
      });
      router.push(`/messages/${res.data.conversation.id}`);
    } catch {
      toast.error(t("common.error"));
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Spinner className="size-6 text-primary" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <EmptyState
          message={t("profile.notFound")}
          icon={Loader2}
        />
      </div>
    );
  }

  const isSelf = user?.id === profile.id;
  const isFriend = relation?.status === "accepted";
  const isPending = relation?.status === "pending";

  const statCards = [
    { label: t("profile.statsFriends"), value: profile.stats.friendsCount, icon: Users },
    { label: t("profile.statsRatings"), value: profile.stats.ratingsCount, icon: Star },
    { label: t("profile.statsArticles"), value: profile.stats.articlesCount, icon: FileText },
    { label: t("profile.statsPlaylists"), value: profile.stats.playlistsCount, icon: ListVideo },
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <Card className="overflow-hidden">
        {profile.bannerUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={profile.bannerUrl}
            alt=""
            className="h-36 w-full object-cover"
          />
        ) : (
          <div className="relative h-36 bg-brand-gradient">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/30" />
          </div>
        )}

        <div className="px-5 pb-6 sm:px-8">
          <div className="-mt-12 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex items-end gap-4">
              <Avatar className="size-24 border-4 border-background shadow-lg">
                {profile.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={profile.avatarUrl}
                    alt=""
                    className="size-full object-cover"
                  />
                ) : (
                  <span className="flex size-full items-center justify-center bg-brand-gradient text-2xl font-bold text-primary-foreground">
                    {initials(profile.name || profile.username)}
                  </span>
                )}
              </Avatar>
              <div className="pb-1">
                <h1 className="flex items-center gap-2 text-xl font-bold sm:text-2xl">
                  {profile.name || profile.username}
                  {profile.verified ? (
                    <BadgeCheck className="size-5 shrink-0 text-sky-500" />
                  ) : null}
                </h1>
                <p className="text-sm text-muted-foreground">
                  @{profile.username}
                </p>
              </div>
            </div>

            {!isSelf ? (
              <div className="flex flex-wrap items-center gap-2 pb-1">
                {isFriend ? (
                  <Button className="gap-1.5" onClick={() => void startChat()} disabled={busy}>
                    <MessageSquare className="size-4" />
                    {t("profile.message")}
                  </Button>
                ) : isPending ? (
                  <Button variant="outline" disabled>
                    <UserPlus className="size-4" />
                    {t("profile.requestPending")}
                  </Button>
                ) : (
                  <Button className="gap-1.5" onClick={() => void addFriend()} disabled={busy}>
                    <UserPlus className="size-4" />
                    {t("profile.addFriend")}
                  </Button>
                )}
              </div>
            ) : null}
          </div>

          {profile.bio ? (
            <p className="mt-4 max-w-2xl text-sm text-muted-foreground">
              {profile.bio}
            </p>
          ) : null}

          <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
            <Calendar className="size-3.5" />
            {t("user.memberSince")} {formatDate(profile.createdAt)}
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
                  <p className="text-lg font-bold leading-none">{s.value}</p>
                  <p className="mt-1 truncate text-[11px] text-muted-foreground">
                    {s.label}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}
