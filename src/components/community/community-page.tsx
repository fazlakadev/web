"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";
import {
  MessageSquare,
  PenSquare,
  Search,
  UserCheck,
  UserPlus,
  UserX,
  Users,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { useRouter, Link } from "@/i18n/navigation";
import { useAuth } from "@/providers/auth-provider";
import { Avatar, Spinner } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/empty-state";
import { api } from "@/lib/api";
import { useUserRealtime } from "@/lib/realtime";
import { cn, initials, timeAgo } from "@/lib/format";
import type {
  ConversationDetail,
  ConversationSummary,
  FriendRelation,
  FriendRequestItem,
  FriendUser,
} from "@/lib/types";

type SidebarTab = "messages" | "friends";

type FriendTab = "friends" | "requests" | "suggestions" | "search";

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

export function CommunityPage() {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<SidebarTab>("messages");

  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [conversationsLoading, setConversationsLoading] = useState(true);

  const [showNewGroup, setShowNewGroup] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [friendsForGroup, setFriendsForGroup] = useState<FriendUser[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);

  const [showNewMessage, setShowNewMessage] = useState(false);
  const [dmFriends, setDmFriends] = useState<FriendUser[]>([]);
  const [dmSelected, setDmSelected] = useState("");
  const [creatingDm, setCreatingDm] = useState(false);

  const [friendTab, setFriendTab] = useState<FriendTab>("friends");
  const [friends, setFriends] = useState<FriendUser[]>([]);
  const [requests, setRequests] = useState<FriendRequestItem[]>([]);
  const [suggestions, setSuggestions] = useState<FriendUser[]>([]);
  const [searchQ, setSearchQ] = useState("");
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [searching, setSearching] = useState(false);
  const [friendsLoading, setFriendsLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  // ── Messages ──

  const loadConversations = useCallback(async () => {
    setConversationsLoading(true);
    try {
      const res = await api.get<ConversationSummary[]>("/messages/conversations", {
        limit: 50,
      });
      setConversations(res.data ?? []);
    } catch {
      setConversations([]);
    } finally {
      setConversationsLoading(false);
    }
  }, []);

  const refreshConversations = useCallback(async () => {
    try {
      const res = await api.get<ConversationSummary[]>("/messages/conversations", {
        limit: 50,
      });
      setConversations(res.data ?? []);
    } catch {
      // ignore
    }
  }, []);

  useUserRealtime(user?.id, {
    "message:new": () => void refreshConversations(),
    "group:invite": () => void refreshConversations(),
  });

  const openNewMessage = async () => {
    setShowNewMessage(true);
    setDmSelected("");
    try {
      const res = await api.get<FriendUser[]>("/friends", { limit: 100 });
      setDmFriends(res.data ?? []);
    } catch {
      setDmFriends([]);
    }
  };

  const startDirectChat = async () => {
    if (!dmSelected || creatingDm) return;
    setCreatingDm(true);
    try {
      const res = await api.post<ConversationDetail>("/messages/conversations", {
        userId: dmSelected,
      });
      router.push(`/messages/${res.data.conversation.id}`);
    } catch {
      toast.error(t("messages.sendFailed"));
      setCreatingDm(false);
    }
  };

  const openNewGroup = async () => {
    setShowNewGroup(true);
    setSelected([]);
    setGroupName("");
    try {
      const res = await api.get<FriendUser[]>("/friends", { limit: 50 });
      setFriendsForGroup(res.data ?? []);
    } catch {
      setFriendsForGroup([]);
    }
  };

  const createGroup = async () => {
    const name = groupName.trim();
    if (!name || creating) return;
    if (selected.length === 0) {
      toast.error(t("messages.groupNoMembers"));
      return;
    }
    setCreating(true);
    try {
      const res = await api.post<ConversationDetail>("/messages/groups", {
        name,
        memberIds: selected,
      });
      router.push(`/messages/${res.data.conversation.id}`);
    } catch {
      toast.error(t("messages.groupCreateFailed"));
      setCreating(false);
    }
  };

  const toggleMember = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  // ── Friends ──

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

  const loadFriendsAll = useCallback(async () => {
    setFriendsLoading(true);
    await Promise.all([loadFriends(), loadRequests(), loadSuggestions()]);
    setFriendsLoading(false);
  }, [loadFriends, loadRequests, loadSuggestions]);

  useEffect(() => {
    void loadConversations();
  }, [loadConversations]);

  useEffect(() => {
    void loadFriendsAll();
  }, [loadFriendsAll]);

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

  const friendTabs: Array<{ key: FriendTab; label: string; icon: typeof Users; badge?: number }> = [
    { key: "friends", label: t("friends.friendsTab"), icon: Users, badge: friends.length },
    { key: "requests", label: t("friends.requestsTab"), icon: UserPlus, badge: requests.length },
    { key: "suggestions", label: t("friends.suggestionsTab"), icon: UserCheck },
    { key: "search", label: t("friends.searchTab"), icon: Search },
  ];

  const sidebarItems: Array<{ key: SidebarTab; label: string; icon: typeof MessageSquare }> = [
    { key: "messages", label: t("messages.title"), icon: MessageSquare },
    { key: "friends", label: t("friends.title"), icon: UserPlus },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="mb-6">
        <h1 className="flex items-center gap-2.5 text-2xl font-bold">
          <Users className="size-6 text-primary" />
          {t("messages.community") ?? "Community"}
        </h1>
      </div>

      <div className="flex flex-col gap-6 md:flex-row">
        {/* Mobile tabs */}
        <div className="flex gap-1.5 overflow-x-auto rounded-xl border border-border bg-card p-1 md:hidden">
          {sidebarItems.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setActiveTab(item.key)}
              className={cn(
                "flex shrink-0 items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors",
                activeTab === item.key
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground",
              )}
            >
              <item.icon className="size-4" />
              {item.label}
            </button>
          ))}
        </div>

        {/* Sidebar */}
        <div className="hidden w-56 shrink-0 md:block">
          <nav className="sticky top-24 space-y-1">
            {sidebarItems.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => setActiveTab(item.key)}
                className={cn(
                  "relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                  activeTab === item.key
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground",
                )}
              >
                {activeTab === item.key && (
                  <span className="absolute inset-y-0 left-0 w-1 rounded-r-full bg-primary" />
                )}
                <item.icon className="size-5" />
                {item.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <div className="glass-card rounded-2xl border border-border p-4 sm:p-6">
            {activeTab === "messages" ? (
              <MessagesSection
                t={t}
                locale={locale}
                router={router}
                conversations={conversations}
                loading={conversationsLoading}
                showNewMessage={showNewMessage}
                setShowNewMessage={setShowNewMessage}
                dmFriends={dmFriends}
                dmSelected={dmSelected}
                setDmSelected={setDmSelected}
                creatingDm={creatingDm}
                openNewMessage={() => void openNewMessage()}
                startDirectChat={() => void startDirectChat()}
                showNewGroup={showNewGroup}
                setShowNewGroup={setShowNewGroup}
                groupName={groupName}
                setGroupName={setGroupName}
                friendsForGroup={friendsForGroup}
                selected={selected}
                toggleMember={toggleMember}
                creating={creating}
                openNewGroup={() => void openNewGroup()}
                createGroup={() => void createGroup()}
                onSwitchTab={() => setActiveTab("friends")}
              />
            ) : (
              <FriendsSection
                t={t}
                friendTab={friendTab}
                setFriendTab={setFriendTab}
                friendTabs={friendTabs}
                friends={friends}
                requests={requests}
                suggestions={suggestions}
                searchQ={searchQ}
                setSearchQ={setSearchQ}
                searchResults={searchResults}
                searching={searching}
                loading={friendsLoading}
                busy={busy}
                addFriend={(id) => void addFriend(id)}
                accept={(id) => void accept(id)}
                reject={(id) => void reject(id)}
                removeFriend={(id) => void removeFriend(id)}
                startChat={(id) => void startChat(id)}
                router={router}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Messages Section ──

function MessagesSection({
  t,
  locale,
  router,
  conversations,
  loading,
  showNewMessage,
  setShowNewMessage,
  dmFriends,
  dmSelected,
  setDmSelected,
  creatingDm,
  openNewMessage,
  startDirectChat,
  showNewGroup,
  setShowNewGroup,
  groupName,
  setGroupName,
  friendsForGroup,
  selected,
  toggleMember,
  creating,
  openNewGroup,
  createGroup,
  onSwitchTab,
}: {
  t: ReturnType<typeof useTranslations>;
  locale: string;
  router: ReturnType<typeof useRouter>;
  conversations: ConversationSummary[];
  loading: boolean;
  showNewMessage: boolean;
  setShowNewMessage: (v: boolean) => void;
  dmFriends: FriendUser[];
  dmSelected: string;
  setDmSelected: (v: string) => void;
  creatingDm: boolean;
  openNewMessage: () => void;
  startDirectChat: () => void;
  showNewGroup: boolean;
  setShowNewGroup: (v: boolean) => void;
  groupName: string;
  setGroupName: (v: string) => void;
  friendsForGroup: FriendUser[];
  selected: string[];
  toggleMember: (id: string) => void;
  creating: boolean;
  openNewGroup: () => void;
  createGroup: () => void;
  onSwitchTab: () => void;
}) {
  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-lg font-bold">
          <MessageSquare className="size-5 text-primary" />
          {t("messages.title")}
        </h2>
        <div className="flex shrink-0 gap-2">
          <Button variant="outline" className="gap-1.5" onClick={openNewMessage}>
            <PenSquare className="size-4" />
            {t("messages.newMessage")}
          </Button>
          <Button className="gap-1.5" onClick={openNewGroup}>
            <UserPlus className="size-4" />
            {t("messages.newGroup")}
          </Button>
        </div>
      </div>

      {showNewMessage ? (
        <div className="mb-4 rounded-xl border border-border bg-card p-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-bold">{t("messages.startConversation")}</p>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowNewMessage(false)}
              aria-label={t("common.close")}
            >
              <X className="size-4" />
            </Button>
          </div>
          {dmFriends.length === 0 ? (
            <p className="py-3 text-center text-sm text-muted-foreground">
              {t("messages.groupNoFriends")}
            </p>
          ) : (
            <div className="max-h-56 space-y-1 overflow-y-auto">
              {dmFriends.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setDmSelected(f.id)}
                  className="flex w-full items-center gap-3 rounded-lg px-2 py-1.5 text-start transition-colors hover:bg-accent"
                >
                  <Avatar className="size-9">
                    {f.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={f.avatarUrl}
                        alt=""
                        className="size-full object-cover"
                      />
                    ) : (
                      <span className="flex size-full items-center justify-center bg-brand-gradient text-xs font-bold text-primary-foreground">
                        {initials(f.name || f.username)}
                      </span>
                    )}
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {f.name || f.username}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      @{f.username}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "flex size-5 shrink-0 items-center justify-center rounded-full border",
                      dmSelected === f.id
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border",
                    )}
                  >
                    {dmSelected === f.id ? (
                      <span className="text-[10px]">✓</span>
                    ) : null}
                  </span>
                </button>
              ))}
            </div>
          )}
          <div className="mt-3 flex justify-end">
            <Button
              onClick={startDirectChat}
              disabled={!dmSelected || creatingDm}
            >
              {creatingDm ? (
                <Spinner className="size-4" />
              ) : (
                t("messages.send")
              )}
            </Button>
          </div>
        </div>
      ) : null}

      {showNewGroup ? (
        <div className="mb-4 rounded-xl border border-border bg-card p-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-bold">{t("messages.newGroup")}</p>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowNewGroup(false)}
              aria-label={t("common.close")}
            >
              <X className="size-4" />
            </Button>
          </div>
          <Input
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            placeholder={t("messages.groupNamePlaceholder")}
            className="mb-3"
          />
          {friendsForGroup.length === 0 ? (
            <p className="py-3 text-center text-sm text-muted-foreground">
              {t("messages.groupNoFriends")}
            </p>
          ) : (
            <div className="max-h-56 space-y-1 overflow-y-auto">
              {friendsForGroup.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => toggleMember(f.id)}
                  className="flex w-full items-center gap-3 rounded-lg px-2 py-1.5 text-start transition-colors hover:bg-accent"
                >
                  <Avatar className="size-9">
                    {f.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={f.avatarUrl}
                        alt=""
                        className="size-full object-cover"
                      />
                    ) : (
                      <span className="flex size-full items-center justify-center bg-brand-gradient text-xs font-bold text-primary-foreground">
                        {initials(f.name || f.username)}
                      </span>
                    )}
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {f.name || f.username}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      @{f.username}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "flex size-5 shrink-0 items-center justify-center rounded-md border",
                      selected.includes(f.id)
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border",
                    )}
                  >
                    {selected.includes(f.id) ? (
                      <span className="text-[10px]">✓</span>
                    ) : null}
                  </span>
                </button>
              ))}
            </div>
          )}
          <div className="mt-3 flex justify-end">
            <Button
              onClick={createGroup}
              disabled={creating || !groupName.trim() || selected.length === 0}
            >
              {creating ? (
                <Spinner className="size-4" />
              ) : (
                t("messages.groupCreate")
              )}
            </Button>
          </div>
        </div>
      ) : null}

      {loading ? (
        <div className="flex min-h-[30vh] items-center justify-center">
          <Spinner className="size-6 text-primary" />
        </div>
      ) : conversations.length === 0 ? (
        <EmptyState message={t("messages.empty")} icon={MessageSquare}>
          <Button className="mt-4 gap-2" onClick={() => onSwitchTab()}>
            <Users className="size-4" />
            {t("messages.browseFriends")}
          </Button>
        </EmptyState>
      ) : (
        <div className="space-y-2">
          {conversations.map((c) => {
            const isGroup = c.kind === "group";
            const title = isGroup
              ? c.group?.name || t("messages.group")
              : c.other?.name || c.other?.username || "";
            const avatarUrl = isGroup ? c.group?.avatarUrl : c.other?.avatarUrl;
            const subtitle = isGroup
              ? `${c.group?.memberCount ?? 0} ${t("messages.members")}`
              : `@${c.other?.username ?? ""}`;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => router.push(`/messages/${c.id}`)}
                className="block w-full rounded-xl border border-border bg-card p-3 text-start transition-colors hover:border-primary/50 hover:bg-accent"
              >
                <div className="flex items-center gap-3">
                  <Avatar className="size-12">
                    {avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={avatarUrl}
                        alt=""
                        className="size-full object-cover"
                      />
                    ) : (
                      <span className="flex size-full items-center justify-center bg-brand-gradient text-sm font-bold text-primary-foreground">
                        {isGroup ? (
                          <Users className="size-5" />
                        ) : (
                          initials(title)
                        )}
                      </span>
                    )}
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-sm font-bold">{title}</p>
                      <span className="shrink-0 text-[11px] text-muted-foreground">
                        {timeAgo(c.updatedAt, locale)}
                      </span>
                    </div>
                    <div className="mt-0.5 flex items-center justify-between gap-2">
                      <p className="truncate text-sm text-muted-foreground">
                        {c.lastMessage?.type === "image"
                          ? `📷 ${t("messages.imageMessage")}`
                          : c.lastMessage?.type === "video"
                            ? `🎬 ${t("messages.videoMessage")}`
                            : c.lastMessage?.type === "audio"
                              ? `🎤 ${t("messages.voiceMessage")}`
                              : c.lastMessage?.body ?? t("messages.noMessages")}
                      </p>
                      <span className="shrink-0 text-[11px] text-muted-foreground">
                        {subtitle}
                      </span>
                      {c.unreadCount > 0 ? (
                        <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">
                          {c.unreadCount}
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Friends Section ──

function FriendsSection({
  t,
  friendTab,
  setFriendTab,
  friendTabs,
  friends,
  requests,
  suggestions,
  searchQ,
  setSearchQ,
  searchResults,
  searching,
  loading,
  busy,
  addFriend,
  accept,
  reject,
  removeFriend,
  startChat,
  router,
}: {
  t: ReturnType<typeof useTranslations>;
  friendTab: FriendTab;
  setFriendTab: (tab: FriendTab) => void;
  friendTabs: Array<{ key: FriendTab; label: string; icon: typeof Users; badge?: number }>;
  friends: FriendUser[];
  requests: FriendRequestItem[];
  suggestions: FriendUser[];
  searchQ: string;
  setSearchQ: (q: string) => void;
  searchResults: SearchUser[];
  searching: boolean;
  loading: boolean;
  busy: string | null;
  addFriend: (id: string) => void;
  accept: (id: string) => void;
  reject: (id: string) => void;
  removeFriend: (id: string) => void;
  startChat: (id: string) => void;
  router: ReturnType<typeof useRouter>;
}) {
  return (
    <div>
      <h2 className="mb-4 flex items-center gap-2 text-lg font-bold">
        <Users className="size-5 text-primary" />
        {t("friends.title")}
      </h2>

      <div className="mb-4 flex gap-1.5 overflow-x-auto rounded-xl border border-border bg-card p-1">
        {friendTabs.map((tb) => (
          <button
            key={tb.key}
            type="button"
            onClick={() => setFriendTab(tb.key)}
            className={cn(
              "flex shrink-0 items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors",
              friendTab === tb.key
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
                  friendTab === tb.key
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
        <div className="flex min-h-[30vh] items-center justify-center">
          <Spinner className="size-6 text-primary" />
        </div>
      ) : friendTab === "friends" ? (
        friends.length === 0 ? (
          <EmptyState message={t("friends.emptyFriends")} icon={Users} />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {friends.map((f) => (
              <div
                key={f.id}
                className="flex items-center gap-3 rounded-xl border border-border bg-card p-4"
              >
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
                    onClick={() => startChat(f.id)}
                    disabled={busy === f.id}
                  >
                    <MessageSquare className="size-3.5" />
                    {t("friends.message")}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="gap-1.5 text-destructive"
                    onClick={() => removeFriend(f.id)}
                    disabled={busy === f.id}
                  >
                    <UserX className="size-3.5" />
                    {t("friends.remove")}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )
      ) : friendTab === "requests" ? (
        requests.length === 0 ? (
          <EmptyState message={t("friends.emptyRequests")} icon={UserPlus} />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {requests.map((r) => (
              <div
                key={r.id}
                className="flex items-center gap-3 rounded-xl border border-border bg-card p-4"
              >
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
                    onClick={() => accept(r.id)}
                    disabled={busy === r.id}
                  >
                    <UserCheck className="size-3.5" />
                    {t("friends.accept")}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => reject(r.id)}
                    disabled={busy === r.id}
                  >
                    {t("friends.reject")}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )
      ) : friendTab === "suggestions" ? (
        suggestions.length === 0 ? (
          <EmptyState message={t("friends.emptySuggestions")} icon={UserCheck} />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {suggestions.map((s) => (
              <div
                key={s.id}
                className="flex items-center gap-3 rounded-xl border border-border bg-card p-4"
              >
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
                  onClick={() => addFriend(s.id)}
                  disabled={busy === s.id}
                >
                  <UserPlus className="size-3.5" />
                  {t("friends.addFriend")}
                </Button>
              </div>
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
                <div
                  key={u.id}
                  className="flex items-center gap-3 rounded-xl border border-border bg-card p-4"
                >
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
                      onClick={() => addFriend(u.id)}
                      disabled={busy === u.id}
                    >
                      <UserPlus className="size-3.5" />
                      {t("friends.addFriend")}
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
