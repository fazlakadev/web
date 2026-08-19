"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";
import {
  ArrowLeft,
  ChevronDown,
  ImagePlus,
  LogOut,
  MessageSquare,
  Mic,
  Send,
  Settings2,
  Square,
  UserMinus,
  UserPlus,
  Users,
  Video,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "@/i18n/navigation";
import { useAuth } from "@/providers/auth-provider";
import { Avatar, Spinner } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { API_BASE, api, getAccessToken } from "@/lib/api";
import { useUserRealtime } from "@/lib/realtime";
import { cn, formatDuration, initials, timeAgo } from "@/lib/format";
import type {
  ConversationDetail,
  FriendUser,
  GroupDetail,
  MessageItem,
  Meta,
} from "@/lib/types";

interface ChatHeader {
  title: string;
  subtitle: string;
  avatarUrl: string | null;
  isGroup: boolean;
}

interface UploadChatResult {
  url: string;
  deleteUrl?: string | null;
  kind: "image" | "video" | "audio";
  mimeType: string;
  size: number;
  durationSec?: number | null;
}

export function ChatPage({ conversationId }: { conversationId: string }) {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const { user } = useAuth();

  const [header, setHeader] = useState<ChatHeader | null>(null);
  const [group, setGroup] = useState<GroupDetail | null>(null);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<number | null>(null);
  const recordingStartRef = useRef<number>(0);
  const [recording, setRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);

  const [meta, setMeta] = useState<Meta | null>(null);
  const [loadingOlder, setLoadingOlder] = useState(false);

  const [showInfo, setShowInfo] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState("");
  const [showAddMembers, setShowAddMembers] = useState(false);
  const [friendOptions, setFriendOptions] = useState<FriendUser[]>([]);
  const [addingIds, setAddingIds] = useState<string[]>([]);

  const myId = user?.id;

  const scrollToBottom = useCallback((smooth = true) => {
    requestAnimationFrame(() => {
      bottomRef.current?.scrollIntoView({ behavior: smooth ? "smooth" : "auto" });
    });
  }, []);

  const markRead = useCallback(async () => {
    try {
      await api.patch(`/messages/conversations/${conversationId}/read`);
    } catch {
      // ignore
    }
  }, [conversationId]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<ConversationDetail>(
        `/messages/conversations/${conversationId}`,
      );
      const conv = res.data.conversation;
      if (conv.kind === "group" && conv.group) {
        setGroup(conv.group);
        setHeader({
          title: conv.group.name || t("messages.group"),
          subtitle: `${conv.group.members.length} ${t("messages.members")}`,
          avatarUrl: conv.group.avatarUrl,
          isGroup: true,
        });
      } else if (conv.other) {
        setHeader({
          title: conv.other.name || conv.other.username,
          subtitle: `@${conv.other.username}`,
          avatarUrl: conv.other.avatarUrl,
          isGroup: false,
        });
      } else {
        setHeader(null);
      }
      setMessages(res.data.messages ?? []);
      setMeta(res.data.meta ?? null);
      void markRead();
    } catch {
      setHeader(null);
      setMessages([]);
    } finally {
      setLoading(false);
      setTimeout(() => scrollToBottom(false), 50);
    }
  }, [conversationId, markRead, scrollToBottom, t]);

  useEffect(() => {
    void load();
  }, [load]);

  useUserRealtime(myId, {
    "message:new": (data) => {
      const payload = data as { conversationId?: string; message?: MessageItem };
      if (payload.conversationId !== conversationId) return;
      if (payload.message) {
        setMessages((prev) =>
          prev.some((m) => m.id === payload.message?.id)
            ? prev
            : [...prev, payload.message as MessageItem],
        );
        void markRead();
        setTimeout(() => scrollToBottom(), 100);
      }
    },
  });

  const loadOlder = useCallback(async () => {
    if (!meta?.hasNextPage || loadingOlder) return;
    const nextPage = (meta.page ?? 1) + 1;
    setLoadingOlder(true);
    try {
      const res = await api.get<ConversationDetail>(
        `/messages/conversations/${conversationId}`,
        { page: nextPage, limit: 50 },
      );
      setMessages((prev) => {
        const existing = new Set(prev.map((m) => m.id));
        const older = (res.data.messages ?? []).filter(
          (m) => !existing.has(m.id),
        );
        return [...older, ...prev];
      });
      setMeta(res.data.meta ?? null);
    } catch {
      // ignore
    } finally {
      setLoadingOlder(false);
    }
  }, [conversationId, meta, loadingOlder]);

  const isGroupAdmin = group
    ? group.createdById === myId ||
      group.members.some((m) => m.id === myId && m.role === "admin")
    : false;

  const applyGroup = useCallback(
    (next: GroupDetail) => {
      setGroup(next);
      setHeader({
        title: next.name || t("messages.group"),
        subtitle: `${next.members.length} ${t("messages.members")}`,
        avatarUrl: next.avatarUrl,
        isGroup: true,
      });
    },
    [t],
  );

  const refreshGroup = useCallback(async () => {
    try {
      const res = await api.get<ConversationDetail>(
        `/messages/conversations/${conversationId}`,
        { page: meta?.page ?? 1, limit: 50 },
      );
      if (res.data.conversation.kind === "group" && res.data.conversation.group) {
        applyGroup(res.data.conversation.group);
      }
    } catch {
      // ignore
    }
  }, [conversationId, meta, applyGroup]);

  const saveRename = async () => {
    const name = nameDraft.trim();
    if (!name || saving) return;
    setSaving(true);
    try {
      await api.patch(`/messages/groups/${conversationId}`, { name });
      setEditingName(false);
      await refreshGroup();
      toast.success(t("messages.groupRenamed"));
    } catch {
      toast.error(t("messages.groupSaveFailed"));
    } finally {
      setSaving(false);
    }
  };

  const openAddMembers = async () => {
    setShowAddMembers(true);
    setAddingIds([]);
    try {
      const res = await api.get<FriendUser[]>("/friends", { limit: 100 });
      const memberIds = new Set(group?.members.map((m) => m.id) ?? []);
      setFriendOptions(
        (res.data ?? []).filter((f) => !memberIds.has(f.id)),
      );
    } catch {
      setFriendOptions([]);
    }
  };

  const addSelectedMembers = async () => {
    if (addingIds.length === 0 || saving) return;
    setSaving(true);
    try {
      await api.post(`/messages/groups/${conversationId}/members`, {
        userIds: addingIds,
      });
      setShowAddMembers(false);
      await refreshGroup();
      toast.success(t("messages.groupMemberAdded"));
    } catch {
      toast.error(t("messages.groupSaveFailed"));
    } finally {
      setSaving(false);
    }
  };

  const removeMember = async (memberId: string) => {
    if (saving) return;
    setSaving(true);
    try {
      await api.del(`/messages/groups/${conversationId}/members/${memberId}`);
      await refreshGroup();
      toast.success(t("messages.groupMemberRemoved"));
    } catch {
      toast.error(t("messages.groupSaveFailed"));
    } finally {
      setSaving(false);
    }
  };

  const leaveGroup = async () => {
    if (!myId || saving) return;
    setSaving(true);
    try {
      await api.del(`/messages/groups/${conversationId}/members/${myId}`);
      router.push("/messages");
    } catch {
      toast.error(t("messages.groupLeaveFailed"));
      setSaving(false);
    }
  };

  const sendMessage = async (
    body: string,
    extra: Partial<MessageItem> = {},
  ) => {
    setSending(true);
    try {
      const res = await api.post<MessageItem>(
        `/messages/conversations/${conversationId}/messages`,
        { body, ...extra },
      );
      setMessages((prev) => [...prev, res.data]);
      setInput("");
      setTimeout(() => scrollToBottom(), 100);
    } catch {
      toast.error(t("messages.sendFailed"));
    } finally {
      setSending(false);
    }
  };

  const send = async () => {
    const body = input.trim();
    if (!body || sending) return;
    await sendMessage(body);
  };

  const uploadChatFile = async (
    file: File,
    kind: "image" | "video" | "audio",
    durationSec?: number,
  ): Promise<UploadChatResult> => {
    const form = new FormData();
    form.append("file", file);
    const params = new URLSearchParams({ kind });
    if (durationSec) params.set("durationSec", String(durationSec));
    const token = getAccessToken();
    const res = await fetch(`${API_BASE}/upload/chat?${params.toString()}`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: form,
    });
    const json = await res.json();
    if (!res.ok || json?.success === false) {
      throw new Error(json?.message || "upload_failed");
    }
    return json.data;
  };

  const onFilePicked = async (
    file: File | undefined,
    kind: "image" | "video",
  ) => {
    if (!file || sending) return;
    setSending(true);
    try {
      const data = await uploadChatFile(file, kind);
      await sendMessage("", {
        type: kind,
        attachmentUrl: data.url,
        attachmentMime: data.mimeType,
        attachmentSize: data.size,
      });
    } catch {
      toast.error(t("messages.uploadFailed"));
    } finally {
      setSending(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      audioChunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        stream.getTracks().forEach((tr) => tr.stop());
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const durationSec = Math.max(
          1,
          Math.round((Date.now() - recordingStartRef.current) / 1000),
        );
        void (async () => {
          try {
            const data = await uploadChatFile(blob as File, "audio", durationSec);
            await sendMessage("", {
              type: "audio",
              attachmentUrl: data.url,
              attachmentMime: data.mimeType,
              attachmentSize: data.size,
              durationSec: data.durationSec ?? durationSec,
            });
          } catch {
            toast.error(t("messages.uploadFailed"));
          }
        })();
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
      recordingStartRef.current = Date.now();
      setRecordingSeconds(0);
      setRecording(true);
      recordingTimerRef.current = window.setInterval(() => {
        setRecordingSeconds(
          Math.round((Date.now() - recordingStartRef.current) / 1000),
        );
      }, 250);
    } catch {
      toast.error(t("messages.micDenied"));
    }
  };

  const stopRecording = () => {
    if (!mediaRecorderRef.current) return;
    if (recordingTimerRef.current) {
      window.clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    setRecording(false);
    try {
      mediaRecorderRef.current.stop();
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) {
        window.clearInterval(recordingTimerRef.current);
      }
      if (mediaRecorderRef.current?.state === "recording") {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  const renderMessage = (m: MessageItem, mine: boolean) => {
    const type = m.type ?? "text";
    return (
      <div
        className={cn(
          "flex max-w-[75%] flex-col overflow-hidden rounded-2xl",
          mine
            ? "self-end rounded-br-sm bg-primary text-primary-foreground"
            : "self-start rounded-bl-sm bg-secondary text-secondary-foreground",
        )}
      >
        {type === "image" && m.attachmentUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={m.attachmentUrl}
            alt=""
            className="max-h-64 w-full object-cover"
          />
        ) : null}
        {type === "video" && m.attachmentUrl ? (
          <video
            src={m.attachmentUrl}
            controls
            playsInline
            className="max-h-64 w-full"
          />
        ) : null}
        {type === "audio" && m.attachmentUrl ? (
          <div className="flex flex-col gap-1.5 p-3">
            <audio src={m.attachmentUrl} controls className="w-52 max-w-full" />
            {m.durationSec ? (
              <span
                className={cn(
                  "text-[11px]",
                  mine ? "text-primary-foreground/70" : "text-muted-foreground",
                )}
              >
                {formatDuration(m.durationSec)}
              </span>
            ) : null}
          </div>
        ) : null}
        {m.body ? (
          <p className="whitespace-pre-wrap break-words px-3.5 py-2 text-sm">
            {m.body}
          </p>
        ) : null}
        <p
          className={cn(
            "px-3.5 pb-1.5 text-[10px]",
            mine ? "text-primary-foreground/70" : "text-muted-foreground",
          )}
        >
          {timeAgo(m.createdAt, locale)}
          {mine && m.readAt
            ? ` • ${t("messages.seen")}`
            : mine
              ? ` • ${t("messages.sent")}`
              : ""}
        </p>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Spinner className="size-6 text-primary" />
      </div>
    );
  }

  if (!header) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-sm text-muted-foreground">{t("messages.notFound")}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex h-[calc(100vh-8rem)] max-w-3xl flex-col px-4 py-4 sm:px-6">
      <div className="mb-3 flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push("/messages")}
          aria-label={t("common.back")}
        >
          <ArrowLeft className="size-4" />
        </Button>
        <Avatar className="size-10">
          {header.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={header.avatarUrl} alt="" className="size-full object-cover" />
          ) : (
            <span className="flex size-full items-center justify-center bg-brand-gradient text-xs font-bold text-primary-foreground">
              {header.isGroup ? (
                <Users className="size-4" />
              ) : (
                initials(header.title)
              )}
            </span>
          )}
        </Avatar>
        <div className="min-w-0">
          <p className="truncate text-sm font-bold">{header.title}</p>
          <p className="truncate text-xs text-muted-foreground">
            {header.subtitle}
          </p>
        </div>
        {group ? (
          <div className="ms-auto flex items-center gap-2">
            <span className="flex items-center gap-1 rounded-full border border-border bg-background/60 px-2.5 py-1 text-[11px] text-muted-foreground">
              <Users className="size-3" />
              {group.members.length}
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowInfo((v) => !v)}
              aria-label={t("messages.groupInfo")}
              title={t("messages.groupInfo")}
            >
              <Settings2 className="size-4" />
            </Button>
          </div>
        ) : null}
      </div>

      {showInfo && group ? (
        <div className="mb-3 rounded-xl border border-border bg-card p-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-bold">{t("messages.groupInfo")}</p>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowInfo(false)}
              aria-label={t("common.close")}
            >
              <X className="size-4" />
            </Button>
          </div>

          <div className="mb-3 flex items-center gap-3">
            <Avatar className="size-12">
              {group.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={group.avatarUrl}
                  alt=""
                  className="size-full object-cover"
                />
              ) : (
                <span className="flex size-full items-center justify-center bg-brand-gradient text-sm font-bold text-primary-foreground">
                  <Users className="size-5" />
                </span>
              )}
            </Avatar>
            {editingName && isGroupAdmin ? (
              <div className="flex flex-1 items-center gap-2">
                <Input
                  value={nameDraft}
                  onChange={(e) => setNameDraft(e.target.value)}
                  className="flex-1"
                  placeholder={t("messages.groupNamePlaceholder")}
                />
                <Button
                  size="sm"
                  onClick={() => void saveRename()}
                  disabled={saving || !nameDraft.trim()}
                >
                  {saving ? (
                    <Spinner className="size-4" />
                  ) : (
                    t("messages.groupRename")
                  )}
                </Button>
              </div>
            ) : (
              <>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold">{group.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {group.members.length} {t("messages.members")}
                  </p>
                </div>
                {isGroupAdmin ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setNameDraft(group.name || "");
                      setEditingName(true);
                    }}
                  >
                    {t("messages.groupEditName")}
                  </Button>
                ) : null}
              </>
            )}
          </div>

          <div className="max-h-56 space-y-1 overflow-y-auto">
            {group.members.map((m) => {
              const isMe = m.id === myId;
              return (
                <div
                  key={m.id}
                  className="flex items-center gap-3 rounded-lg px-2 py-1.5"
                >
                  <Avatar className="size-8">
                    {m.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={m.avatarUrl}
                        alt=""
                        className="size-full object-cover"
                      />
                    ) : (
                      <span className="flex size-full items-center justify-center bg-brand-gradient text-[10px] font-bold text-primary-foreground">
                        {initials(m.name || m.username)}
                      </span>
                    )}
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {m.name || m.username}
                      {isMe ? (
                        <span className="text-muted-foreground">
                          {" "}
                          ({t("common.you")})
                        </span>
                      ) : null}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      @{m.username}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full border border-border px-2 py-0.5 text-[10px] text-muted-foreground">
                    {m.role === "admin"
                      ? t("messages.groupRoleAdmin")
                      : t("messages.groupRoleMember")}
                  </span>
                  {isGroupAdmin && !isMe ? (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7"
                      onClick={() => void removeMember(m.id)}
                      aria-label={t("messages.groupRemoveMember")}
                      title={t("messages.groupRemoveMember")}
                    >
                      <UserMinus className="size-4" />
                    </Button>
                  ) : null}
                </div>
              );
            })}
          </div>

          {isGroupAdmin ? (
            showAddMembers ? (
              <div className="mt-3 rounded-lg border border-border p-3">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-xs font-bold">
                    {t("messages.groupAddMembers")}
                  </p>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-6"
                    onClick={() => setShowAddMembers(false)}
                    aria-label={t("common.close")}
                  >
                    <X className="size-3.5" />
                  </Button>
                </div>
                {friendOptions.length === 0 ? (
                  <p className="py-2 text-center text-xs text-muted-foreground">
                    {t("messages.groupNoMoreFriends")}
                  </p>
                ) : (
                  <div className="max-h-40 space-y-1 overflow-y-auto">
                    {friendOptions.map((f) => (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() =>
                          setAddingIds((prev) =>
                            prev.includes(f.id)
                              ? prev.filter((x) => x !== f.id)
                              : [...prev, f.id],
                          )
                        }
                        className="flex w-full items-center gap-3 rounded-lg px-2 py-1.5 text-start transition-colors hover:bg-accent"
                      >
                        <Avatar className="size-8">
                          {f.avatarUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={f.avatarUrl}
                              alt=""
                              className="size-full object-cover"
                            />
                          ) : (
                            <span className="flex size-full items-center justify-center bg-brand-gradient text-[10px] font-bold text-primary-foreground">
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
                            addingIds.includes(f.id)
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-border",
                          )}
                        >
                          {addingIds.includes(f.id) ? (
                            <span className="text-[10px]">✓</span>
                          ) : null}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
                <div className="mt-2 flex justify-end">
                  <Button
                    size="sm"
                    onClick={() => void addSelectedMembers()}
                    disabled={addingIds.length === 0 || saving}
                  >
                    {saving ? (
                      <Spinner className="size-4" />
                    ) : (
                      t("messages.groupAddMembers")
                    )}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="mt-3 flex justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => void openAddMembers()}
                >
                  <UserPlus className="size-4" />
                  {t("messages.groupAddMembers")}
                </Button>
              </div>
            )
          ) : null}

          <div className="mt-3 flex justify-end">
            <Button
              variant="destructive"
              size="sm"
              onClick={() => void leaveGroup()}
              disabled={saving}
            >
              <LogOut className="size-4" />
              {t("messages.groupLeave")}
            </Button>
          </div>
        </div>
      ) : null}

      {meta?.hasNextPage ? (
        <div className="mb-2 flex justify-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => void loadOlder()}
            disabled={loadingOlder}
          >
            {loadingOlder ? (
              <Spinner className="size-4" />
            ) : (
              <ChevronDown className="size-4 rotate-180" />
            )}
            {t("messages.loadOlder")}
          </Button>
        </div>
      ) : null}

      <div className="flex-1 space-y-3 overflow-y-auto rounded-xl border border-border bg-card p-4">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-sm text-muted-foreground">
            <MessageSquare className="size-8 opacity-50" />
            {t("messages.noMessagesYet")}
          </div>
        ) : (
          messages.map((m) => {
            const mine = m.senderId === myId;
            return (
              <div
                key={m.id}
                className={cn("flex", mine ? "justify-end" : "justify-start")}
              >
                {renderMessage(m, mine)}
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0];
          e.target.value = "";
          void onFilePicked(f, "image");
        }}
      />
      <input
        ref={videoInputRef}
        type="file"
        accept="video/mp4,video/webm,video/ogg"
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0];
          e.target.value = "";
          void onFilePicked(f, "video");
        }}
      />

      <form
        className="mt-3 flex items-center gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          void send();
        }}
      >
        {recording ? (
          <div className="flex items-center gap-2 rounded-lg bg-destructive/10 px-3 py-1.5">
            <span className="size-2 animate-pulse rounded-full bg-destructive" />
            <span className="text-xs font-semibold text-destructive">
              {formatDuration(recordingSeconds)}
            </span>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="size-6"
              onClick={stopRecording}
              aria-label={t("messages.stopRecording")}
            >
              <Square className="size-3.5 fill-current" />
            </Button>
          </div>
        ) : (
          <>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              onClick={() => imageInputRef.current?.click()}
              aria-label={t("messages.sendImage")}
              title={t("messages.sendImage")}
            >
              <ImagePlus className="size-5" />
            </Button>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              onClick={() => videoInputRef.current?.click()}
              aria-label={t("messages.sendVideo")}
              title={t("messages.sendVideo")}
            >
              <Video className="size-5" />
            </Button>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              onClick={() => void startRecording()}
              aria-label={t("messages.recordVoice")}
              title={t("messages.recordVoice")}
            >
              <Mic className="size-5" />
            </Button>
          </>
        )}
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t("messages.placeholder")}
          className="flex-1"
        />
        <Button
          type="submit"
          size="icon"
          disabled={!input.trim() || sending || recording}
          aria-label={t("messages.send")}
        >
          {sending ? <Spinner className="size-4" /> : <Send className="size-4" />}
        </Button>
      </form>
    </div>
  );
}
