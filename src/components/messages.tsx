"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";
import { MessageSquare, PenSquare, UserPlus, Users, X } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "@/i18n/navigation";
import { useAuth } from "@/providers/auth-provider";
import { Avatar, Spinner } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/empty-state";
import { api } from "@/lib/api";
import { useUserRealtime } from "@/lib/realtime";
import { cn, initials, timeAgo } from "@/lib/format";
import type { ConversationDetail, ConversationSummary, FriendUser } from "@/lib/types";

export function MessagesPage() {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const { user } = useAuth();

  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const [showNewGroup, setShowNewGroup] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [friends, setFriends] = useState<FriendUser[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);

  const [showNewMessage, setShowNewMessage] = useState(false);
  const [dmFriends, setDmFriends] = useState<FriendUser[]>([]);
  const [dmSelected, setDmSelected] = useState("");
  const [creatingDm, setCreatingDm] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<ConversationSummary[]>("/messages/conversations", {
        limit: 50,
      });
      setConversations(res.data ?? []);
    } catch {
      setConversations([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const refresh = useCallback(async () => {
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
    "message:new": () => void refresh(),
    "group:invite": () => void refresh(),
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
      setFriends(res.data ?? []);
    } catch {
      setFriends([]);
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

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2.5 text-2xl font-bold">
            <MessageSquare className="size-6 text-primary" />
            {t("messages.title")}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("messages.subtitle")}
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <Button
            variant="outline"
            className="gap-1.5"
            onClick={() => void openNewMessage()}
          >
            <PenSquare className="size-4" />
            {t("messages.newMessage")}
          </Button>
          <Button className="gap-1.5" onClick={() => void openNewGroup()}>
            <UserPlus className="size-4" />
            {t("messages.newGroup")}
          </Button>
        </div>
      </div>

      {showNewMessage ? (
        <div className="mb-6 rounded-xl border border-border bg-card p-4">
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
              onClick={() => void startDirectChat()}
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
        <div className="mb-6 rounded-xl border border-border bg-card p-4">
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
          {friends.length === 0 ? (
            <p className="py-3 text-center text-sm text-muted-foreground">
              {t("messages.groupNoFriends")}
            </p>
          ) : (
            <div className="max-h-56 space-y-1 overflow-y-auto">
              {friends.map((f) => (
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
              onClick={() => void createGroup()}
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
        <div className="flex min-h-[40vh] items-center justify-center">
          <Spinner className="size-6 text-primary" />
        </div>
      ) : conversations.length === 0 ? (
        <EmptyState message={t("messages.empty")} icon={MessageSquare}>
          <Button className="mt-4 gap-2" onClick={() => router.push("/friends")}>
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
