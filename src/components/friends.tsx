"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import {
  MessageSquare,
  Search,
  UserCheck,
  UserPlus,
  UserX,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { useRouter, Link } from "@/i18n/navigation";
import { useAuth } from "@/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, Spinner } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/empty-state";
import { api } from "@/lib/api";
import { useUserRealtime } from "@/lib/realtime";
import { initials } from "@/lib/format";
import { cn } from "@/lib/format";
import type {
  ConversationDetail,
  FriendRelation,
  FriendRequestItem,
  FriendUser,
} from "@/lib/types";

type Tab = "friends" | "requests" | "suggestions" | "search";

interface SearchUser extends FriendUser {
  relation: FriendRelation;
}

function FriendAvatar({
  user,
  className,
}: {
  user: FriendUser;
  className?: string;
}) {
  return (
    <Avatar className={cn("size-12", className)}>
      {user.avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={user.avatarUrl} alt="" className="size-full object-cover" />
      ) : (
        <span className="flex size-full items-center justify-center bg-brand-gradient text-sm font-bold text-primary-foreground">
          {initials(user.name || user.username)}
        </span>
      )}
    </Avatar>
  );
}

export function FriendsPage() {
  const t = useTranslations();
  const router = useRouter();
  const { user } = useAuth();

  const [tab, setTab] = useState<Tab>("friends");
  const [friends, setFriends] = useState<FriendUser[]>([]);
  const [requests, setRequests] = useState<FriendRequestItem[]>([]);
  const [suggestions, setSuggestions] = useState<FriendUser[]>([]);
  const [searchQ, setSearchQ] = useState("");
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [searching, setSearching] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  const loadFriends = useCallback(async () => {
    try {
      const res = await api.get<FriendUser[]>("/friends", { limit: 50 });
      setFriends(res.data ?? []);
    } catch {
      setFriends([]);
    }
  }, []);

  const loadRequests = useCallback(async () => {
    try {
      const res = await api.get<FriendRequestItem[]>("/friends/requests/incoming", {
        limit: 50,
      });
      setRequests(res.data ?? []);
    } catch {
      setRequests([]);
    }
  }, []);

  const loadSuggestions = useCallback(async () => {
    try {
      const res = await api.get<FriendUser[]>("/friends/suggestions", {
        limit: 12,
      });
      setSuggestions(res.data ?? []);
    } catch {
      setSuggestions([]);
    }
  }, []);

  const loadAll = useCallback(async () => {
    setLoading(true);
    await Promise.all([loadFriends(), loadRequests(), loadSuggestions()]);
    setLoading(false);
  }, [loadFriends, loadRequests, loadSuggestions]);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  useUserRealtime(user?.id, {
    "friend:request": () => {
      void loadRequests();
      toast.info(t("friends.newRequest"));
    },
    "friend:accepted": () => {
      void loadFriends();
      void loadSuggestions();
      toast.success(t("friends.friendAccepted"));
    },
  });

  const runSearch = useCallback(async (q: string) => {
    const query = q.trim();
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    try {
      const res = await api.get<SearchUser[]>("/friends/search", { q: query });
      setSearchResults(res.data ?? []);
    } catch {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void runSearch(searchQ), 300);
    return () => window.clearTimeout(timer);
  }, [searchQ, runSearch]);

  const addFriend = async (userId: string) => {
    setBusy(userId);
    try {
      await api.post(`/friends/request/${userId}`);
      toast.success(t("friends.requestSent"));
      await Promise.all([loadSuggestions(), runSearch(searchQ)]);
    } catch {
      toast.error(t("friends.requestError"));
    } finally {
      setBusy(null);
    }
  };

  const accept = async (requestId: string) => {
    setBusy(requestId);
    try {
      await api.post(`/friends/requests/${requestId}/accept`);
      toast.success(t("friends.requestAccepted"));
      await Promise.all([loadFriends(), loadRequests(), loadSuggestions()]);
    } catch {
      toast.error(t("common.error"));
    } finally {
      setBusy(null);
    }
  };

  const reject = async (requestId: string) => {
    setBusy(requestId);
    try {
      await api.post(`/friends/requests/${requestId}/reject`);
      toast.success(t("friends.requestRejected"));
      await loadRequests();
    } catch {
      toast.error(t("common.error"));
    } finally {
      setBusy(null);
    }
  };

  const removeFriend = async (friendId: string) => {
    if (!window.confirm(t("friends.confirmRemove"))) return;
    setBusy(friendId);
    try {
      await api.del(`/friends/${friendId}`);
      toast.success(t("friends.friendRemoved"));
      await Promise.all([loadFriends(), loadSuggestions()]);
    } catch {
      toast.error(t("common.error"));
    } finally {
      setBusy(null);
    }
  };

  const startChat = async (friendId: string) => {
    setBusy(friendId);
    try {
      const res = await api.post<ConversationDetail>("/messages/conversations", {
        userId: friendId,
      });
      router.push(`/messages/${res.data.conversation.id}`);
    } catch {
      toast.error(t("common.error"));
      setBusy(null);
    }
  };

  const tabs: Array<{ key: Tab; label: string; icon: typeof Users; badge?: number }> = [
    { key: "friends", label: t("friends.friendsTab"), icon: Users, badge: friends.length },
    { key: "requests", label: t("friends.requestsTab"), icon: UserPlus, badge: requests.length },
    { key: "suggestions", label: t("friends.suggestionsTab"), icon: UserCheck },
    { key: "search", label: t("friends.searchTab"), icon: Search },
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <div className="mb-6">
        <h1 className="flex items-center gap-2.5 text-2xl font-bold">
          <Users className="size-6 text-primary" />
          {t("friends.title")}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("friends.subtitle")}
        </p>
      </div>

      <div className="mb-6 flex gap-1.5 overflow-x-auto rounded-xl border border-border bg-card p-1">
        {tabs.map((tb) => (
          <button
            key={tb.key}
            type="button"
            onClick={() => setTab(tb.key)}
            className={cn(
              "flex shrink-0 items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors",
              tab === tb.key
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-foreground",
            )}
          >
            <tb.icon className="size-4" />
            {tb.label}
            {typeof tb.badge === "number" && tb.badge > 0 ? (
              <span
                className={cn(
                  "flex size-5 items-center justify-center rounded-full text-[11px] font-bold",
                  tab === tb.key
                    ? "bg-primary-foreground text-primary"
                    : "bg-primary text-primary-foreground",
                )}
              >
                {tb.badge}
              </span>
            ) : null}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex min-h-[40vh] items-center justify-center">
          <Spinner className="size-6 text-primary" />
        </div>
      ) : tab === "friends" ? (
        friends.length === 0 ? (
          <EmptyState message={t("friends.emptyFriends")} icon={Users} />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {friends.map((f) => (
              <Card key={f.id} className="flex items-center gap-3 p-4">
                <FriendAvatar user={f} />
                <div className="min-w-0 flex-1">
                  <Link href={`/u/${f.publicId ?? f.username}`} className="block">
                    <p className="truncate text-sm font-bold hover:underline">
                      {f.name || f.username}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      @{f.username}
                    </p>
                  </Link>
                  {f.bio ? (
                    <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                      {f.bio}
                    </p>
                  ) : null}
                </div>
                <div className="flex shrink-0 flex-col gap-1.5">
                  <Button
                    size="sm"
                    className="gap-1.5"
                    onClick={() => void startChat(f.id)}
                    disabled={busy === f.id}
                  >
                    <MessageSquare className="size-3.5" />
                    {t("friends.message")}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="gap-1.5 text-destructive"
                    onClick={() => void removeFriend(f.id)}
                    disabled={busy === f.id}
                  >
                    <UserX className="size-3.5" />
                    {t("friends.remove")}
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )
      ) : tab === "requests" ? (
        requests.length === 0 ? (
          <EmptyState message={t("friends.emptyRequests")} icon={UserPlus} />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {requests.map((r) => (
              <Card key={r.id} className="flex items-center gap-3 p-4">
                <FriendAvatar user={r.sender} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold">
                    {r.sender.name || r.sender.username}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    @{r.sender.username}
                  </p>
                  {r.sender.bio ? (
                    <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                      {r.sender.bio}
                    </p>
                  ) : null}
                </div>
                <div className="flex shrink-0 flex-col gap-1.5">
                  <Button
                    size="sm"
                    className="gap-1.5"
                    onClick={() => void accept(r.id)}
                    disabled={busy === r.id}
                  >
                    <UserCheck className="size-3.5" />
                    {t("friends.accept")}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => void reject(r.id)}
                    disabled={busy === r.id}
                  >
                    {t("friends.reject")}
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )
      ) : tab === "suggestions" ? (
        suggestions.length === 0 ? (
          <EmptyState message={t("friends.emptySuggestions")} icon={UserCheck} />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {suggestions.map((s) => (
              <Card key={s.id} className="flex items-center gap-3 p-4">
                <FriendAvatar user={s} />
                <div className="min-w-0 flex-1">
                  <Link href={`/u/${s.username}`} className="block">
                    <p className="truncate text-sm font-bold hover:underline">
                      {s.name || s.username}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      @{s.username}
                    </p>
                  </Link>
                  {s.bio ? (
                    <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                      {s.bio}
                    </p>
                  ) : null}
                </div>
                <Button
                  size="sm"
                  className="shrink-0 gap-1.5"
                  onClick={() => void addFriend(s.id)}
                  disabled={busy === s.id}
                >
                  <UserPlus className="size-3.5" />
                  {t("friends.addFriend")}
                </Button>
              </Card>
            ))}
          </div>
        )
      ) : (
        <div className="space-y-4">
          <div className="relative">
            <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchQ}
              onChange={(e) => setSearchQ(e.target.value)}
              placeholder={t("friends.searchPlaceholder")}
              className="ps-9"
            />
          </div>
          {searching ? (
            <div className="flex justify-center py-10">
              <Spinner className="size-5 text-primary" />
            </div>
          ) : searchResults.length === 0 ? (
            <EmptyState message={t("friends.emptySearch")} icon={Search} />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {searchResults.map((u) => (
                <Card key={u.id} className="flex items-center gap-3 p-4">
                  <FriendAvatar user={u} />
                  <div className="min-w-0 flex-1">
                    <Link href={`/u/${u.publicId ?? u.username}`} className="block">
                      <p className="truncate text-sm font-bold hover:underline">
                        {u.name || u.username}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        @{u.username}
                      </p>
                    </Link>
                  </div>
                  {u.relation?.status === "pending" ? (
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {u.relation.incoming
                        ? t("friends.pendingIncoming")
                        : t("friends.pendingOutgoing")}
                    </span>
                  ) : (
                    <Button
                      size="sm"
                      className="shrink-0 gap-1.5"
                      onClick={() => void addFriend(u.id)}
                      disabled={busy === u.id}
                    >
                      <UserPlus className="size-3.5" />
                      {t("friends.addFriend")}
                    </Button>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
