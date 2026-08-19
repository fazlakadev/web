"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { Heart, MailWarning, MessageSquare, Pencil, Reply, Send, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, Skeleton } from "@/components/ui/card";
import { useAuth } from "@/providers/auth-provider";
import { api, ApiError } from "@/lib/api";
import { timeAgo, initials } from "@/lib/format";
import { Link } from "@/i18n/navigation";
import type { CommentItem, Meta } from "@/lib/types";

const EDIT_WINDOW_MS = 60 * 60 * 1000;

function CommentThread({
  comment,
  contentType,
  contentId,
  locale,
  onDeleted,
  onUpdated,
}: {
  comment: CommentItem;
  contentType: string;
  contentId: string;
  locale: string;
  onDeleted: (id: string) => void;
  onUpdated: (c: CommentItem) => void;
}) {
  const t = useTranslations();
  const { token, user } = useAuth();

  const [editing, setEditing] = useState(false);
  const [editBody, setEditBody] = useState(comment.body);
  const [replying, setReplying] = useState(false);
  const [replyBody, setReplyBody] = useState("");
  const [replies, setReplies] = useState<CommentItem[]>([]);
  const [repliesLoaded, setRepliesLoaded] = useState(false);
  const [repliesLoading, setRepliesLoading] = useState(false);
  const [repliesOpen, setRepliesOpen] = useState(false);
  const [liked, setLiked] = useState(!!comment.likedByMe);
  const [likeCount, setLikeCount] = useState(comment.likesCount ?? 0);
  const [busy, setBusy] = useState(false);

  const isOwn = !!user && comment.user?.id === user.id;
  const openEdit = () => {
    if (Date.now() - new Date(comment.createdAt).getTime() >= EDIT_WINDOW_MS) {
      toast.error(t("watch.editWindowExpired"));
      return;
    }
    setEditing(true);
    setEditBody(comment.body);
  };

  const toggleLike = async () => {
    if (!token) {
      toast.info(t("watch.loginToLike"));
      return;
    }
    setBusy(true);
    try {
      const res = await api.post<{ liked: boolean }>(
        `/likes/comment/${comment.id}`,
        { type: "like" },
      );
      setLiked(res.data.liked);
      setLikeCount((c) => c + (res.data.liked ? 1 : -1));
    } catch {
      toast.error(t("common.error"));
    } finally {
      setBusy(false);
    }
  };

  const submitEdit = async () => {
    const text = editBody.trim();
    if (!text) return;
    setBusy(true);
    try {
      const res = await api.patch<CommentItem>(`/comments/${comment.id}`, {
        body: text,
      });
      onUpdated(res.data);
      setEditing(false);
      toast.success(t("watch.commentUpdated"));
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : "";
      toast.error(
        msg === "errors.editWindowExpired"
          ? t("watch.editWindowExpired")
          : t("common.error"),
      );
    } finally {
      setBusy(false);
    }
  };

  const removeComment = async () => {
    if (!window.confirm(t("watch.confirmDeleteComment"))) return;
    setBusy(true);
    try {
      await api.del(`/comments/${comment.id}`);
      onDeleted(comment.id);
      toast.success(t("watch.commentDeleted"));
    } catch {
      toast.error(t("common.error"));
    } finally {
      setBusy(false);
    }
  };

  const loadReplies = async () => {
    if (repliesLoaded || repliesLoading) return;
    setRepliesLoading(true);
    try {
      const res = await api.get<CommentItem[]>(
        `/comments/replies/${comment.id}`,
        { limit: 50 },
      );
      setReplies(res.data ?? []);
      setRepliesLoaded(true);
    } catch {
      // ignore
    } finally {
      setRepliesLoading(false);
    }
  };

  const submitReply = async () => {
    const text = replyBody.trim();
    if (!text) return;
    if (!token) {
      toast.info(t("watch.loginToComment"));
      return;
    }
    setBusy(true);
    try {
      const res = await api.post<CommentItem>(`/comments`, {
        contentType,
        contentId,
        parentId: comment.id,
        body: text,
      });
      setReplies((prev) => [...prev, res.data]);
      setReplyBody("");
      setReplying(false);
      setRepliesLoaded(true);
      setRepliesOpen(true);
      toast.success(t("watch.replySent"));
    } catch {
      toast.error(t("common.error"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <li className="flex gap-3">
      {comment.user?.avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={comment.user.avatarUrl}
          alt=""
          className="size-9 shrink-0 rounded-full object-cover"
        />
      ) : (
        <Avatar className="shrink-0">
          <span className="flex size-full items-center justify-center bg-secondary text-xs font-bold">
            {initials(comment.user?.name || comment.user?.username)}
          </span>
        </Avatar>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <span className="text-sm font-semibold">
            {comment.user?.name || comment.user?.username || "user"}
          </span>
          <span className="text-xs text-muted-foreground">
            {timeAgo(comment.createdAt, locale)}
          </span>
          {comment.edited ? (
            <span className="text-[11px] font-medium text-muted-foreground">
              ({t("watch.edited")})
            </span>
          ) : null}
        </div>

        {editing ? (
          <div className="mt-2">
            <Textarea
              value={editBody}
              onChange={(e) => setEditBody(e.target.value)}
              className="min-h-16"
              autoFocus
            />
            <div className="mt-2 flex justify-end gap-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setEditing(false);
                  setEditBody(comment.body);
                }}
                disabled={busy}
              >
                {t("common.cancel")}
              </Button>
              <Button
                size="sm"
                onClick={submitEdit}
                disabled={!editBody.trim() || busy}
              >
                {t("watch.submitComment")}
              </Button>
            </div>
          </div>
        ) : (
          <p className="mt-1 whitespace-pre-line text-sm leading-relaxed">
            {comment.body}
          </p>
        )}

        <div className="mt-1.5 flex flex-wrap items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 gap-1.5 px-2 text-xs text-muted-foreground"
            onClick={toggleLike}
            disabled={busy}
          >
            <Heart
              className={
                liked ? "size-3.5 fill-current text-primary" : "size-3.5"
              }
            />
            {likeCount > 0 ? likeCount : null}
            {t("watch.like")}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 gap-1.5 px-2 text-xs text-muted-foreground"
            onClick={() => {
              if (!token) {
                toast.info(t("watch.loginToComment"));
                return;
              }
              setReplying((r) => !r);
            }}
          >
            <Reply className="size-3.5" />
            {t("watch.reply")}
          </Button>
          {isOwn ? (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 gap-1.5 px-2 text-xs text-muted-foreground"
              onClick={openEdit}
              disabled={busy}
            >
              <Pencil className="size-3.5" />
              {t("watch.edit")}
            </Button>
          ) : null}
          {isOwn ? (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 gap-1.5 px-2 text-xs text-destructive hover:text-destructive"
              onClick={removeComment}
              disabled={busy}
            >
              <Trash2 className="size-3.5" />
              {t("watch.delete")}
            </Button>
          ) : null}
        </div>

        {replying ? (
          <div className="mt-2">
            <Textarea
              value={replyBody}
              onChange={(e) => setReplyBody(e.target.value)}
              placeholder={t("watch.addReply")}
              className="min-h-14"
              autoFocus
            />
            <div className="mt-2 flex justify-end gap-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setReplying(false)}
                disabled={busy}
              >
                {t("common.cancel")}
              </Button>
              <Button
                size="sm"
                onClick={submitReply}
                disabled={!replyBody.trim() || busy}
              >
                <Send className="size-3.5" />
                {t("watch.submitComment")}
              </Button>
            </div>
          </div>
        ) : null}

        {(comment._count?.replies ?? 0) > 0 || replies.length > 0 ? (
          <button
            type="button"
            onClick={() => {
              if (repliesOpen) {
                setRepliesOpen(false);
                return;
              }
              setRepliesOpen(true);
              void loadReplies();
            }}
            className="mt-1 text-xs font-medium text-primary hover:underline"
          >
            {repliesOpen
              ? t("watch.hideReplies")
              : t("watch.viewReplies", {
                  count: replies.length || comment._count?.replies || 0,
                })}
          </button>
        ) : null}
        {repliesLoading ? (
          <p className="mt-1 text-xs text-muted-foreground">{t("common.loading")}</p>
        ) : null}
        {repliesOpen && repliesLoaded && replies.length > 0 ? (
          <ul className="mt-3 space-y-3 border-s-2 border-border ps-3">
            {replies.map((r) => (
              <CommentThread
                key={r.id}
                comment={r}
                contentType={contentType}
                contentId={contentId}
                locale={locale}
                onDeleted={onDeleted}
                onUpdated={onUpdated}
              />
            ))}
          </ul>
        ) : null}
      </div>
    </li>
  );
}

export function CommentSection({
  contentType,
  contentId,
  locale,
}: {
  contentType: string;
  contentId: string;
  locale: string;
}) {
  const t = useTranslations();
  const { token, user } = useAuth();
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [meta, setMeta] = useState<Meta | null>(null);

  const load = useCallback(
    async (page = 1) => {
      setLoading(true);
      try {
        const res = await api.get<CommentItem[]>(
          `/comments/${contentType}/${contentId}`,
          { page, limit: 30 },
        );
        setComments((prev) => (page === 1 ? res.data ?? [] : [...prev, ...(res.data ?? [])]));
        setMeta(res.meta ?? null);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    },
    [contentType, contentId],
  );

  useEffect(() => {
    void load(1);
  }, [load]);

  const handleDeleted = useCallback((id: string) => {
    setComments((prev) => prev.filter((c) => c.id !== id));
    setMeta((m) => (m ? { ...m, total: Math.max(0, m.total - 1) } : m));
  }, []);

  const handleUpdated = useCallback((updated: CommentItem) => {
    setComments((prev) =>
      prev.map((c) => (c.id === updated.id ? { ...c, ...updated } : c)),
    );
  }, []);

  const submit = async () => {
    const text = body.trim();
    if (!text) return;
    if (!token) {
      toast.info(t("watch.loginToComment"));
      return;
    }
    setSending(true);
    try {
      const res = await api.post<CommentItem>(`/comments`, {
        contentType,
        contentId,
        body: text,
      });
      setComments((prev) => [res.data, ...prev]);
      setMeta((m) => (m ? { ...m, total: m.total + 1 } : m));
      setBody("");
      toast.success(t("watch.submitComment"));
    } catch {
      toast.error(t("common.error"));
    } finally {
      setSending(false);
    }
  };

  return (
    <section className="rounded-lg border border-border bg-card p-4 sm:p-6">
      <h3 className="mb-4 flex items-center gap-2 text-lg font-bold">
        <MessageSquare className="size-5 text-primary" />
        {t("watch.comments")}
        {meta ? (
          <span className="text-sm font-normal text-muted-foreground">
            ({meta.total})
          </span>
        ) : null}
      </h3>

      {user && !user.emailVerified && !user.phoneVerifiedAt ? (
        <div className="mb-4 flex flex-wrap items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-300">
          <MailWarning className="size-4 shrink-0" />
          <span>{t("errors.verifyToComment")}</span>
          <Link
            href="/verify-email"
            className="font-semibold text-primary hover:underline"
          >
            {t("auth.verifyNow")}
          </Link>
        </div>
      ) : null}

      <form
        className="mb-6 flex gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
      >
        {user ? (
          <Avatar className="mt-1">
            <span className="flex size-full items-center justify-center bg-primary text-xs font-bold text-primary-foreground">
              {initials(user.name || user.username)}
            </span>
          </Avatar>
        ) : null}
        <div className="flex-1">
          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder={t("watch.addComment")}
            className="min-h-16"
          />
          <div className="mt-2 flex justify-end">
            <Button type="submit" size="sm" disabled={!body.trim() || sending}>
              <Send className="size-4" />
              {t("watch.submitComment")}
            </Button>
          </div>
        </div>
      </form>

      {loading && comments.length === 0 ? (
        <div className="space-y-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex gap-3">
              <Skeleton className="size-9 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-full" />
              </div>
            </div>
          ))}
        </div>
      ) : comments.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">
          {t("watch.emptyComments")}
        </p>
      ) : (
        <ul className="space-y-4">
          {comments.map((c) => (
            <CommentThread
              key={c.id}
              comment={c}
              contentType={contentType}
              contentId={contentId}
              locale={locale}
              onDeleted={handleDeleted}
              onUpdated={handleUpdated}
            />
          ))}
        </ul>
      )}

      {meta && meta.hasNextPage ? (
        <Button
          variant="outline"
          size="sm"
          className="mt-4 w-full"
          onClick={() => void load(meta.page + 1)}
        >
          {t("common.viewAll")}
        </Button>
      ) : null}
    </section>
  );
}
