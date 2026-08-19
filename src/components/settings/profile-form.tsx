"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { api, getAccessToken, API_BASE } from "@/lib/api";
import { useAuth } from "@/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, Spinner } from "@/components/ui/card";
import { Camera, Loader2 } from "lucide-react";
import { initials } from "@/lib/format";

export function ProfileForm() {
  const t = useTranslations();
  const { user, refreshUser } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState<{ name: string; username: string; bio: string }>({
    name: user?.name ?? "",
    username: user?.username ?? "",
    bio: user?.bio ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  if (!user) return null;

  const set =
    (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }));

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.patch("/users/me", {
        name: form.name,
        username: form.username,
        bio: form.bio,
      });
      toast.success(t("profile.saved"));
      void refreshUser();
    } catch {
      toast.error(t("profile.saveFailed"));
    } finally {
      setSaving(false);
    }
  };

  const uploadAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch(`${API_BASE}/users/me/avatar`, {
        method: "POST",
        headers: { Authorization: `Bearer ${getAccessToken() ?? ""}` },
        body: fd,
      });
      const json = await res.json();
      if (!res.ok || json.success === false) throw new Error("upload failed");
      toast.success(t("profile.avatarUpdated"));
      void refreshUser();
    } catch {
      toast.error(t("profile.avatarFailed"));
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <form onSubmit={save} className="space-y-5">
      <div className="flex items-center gap-4">
        <Avatar className="size-16">
          {user.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={user.avatarUrl}
              alt=""
              className="size-full object-cover"
            />
          ) : (
            <span className="flex size-full items-center justify-center bg-primary text-lg font-bold text-primary-foreground">
              {initials(user.name || user.username)}
            </span>
          )}
        </Avatar>
        <div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={uploadAvatar}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Camera className="size-4" />
            )}
            {t("profile.changePhoto")}
          </Button>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="name">{t("auth.name")}</Label>
        <Input
          id="name"
          value={form.name}
          onChange={set("name")}
          required
          minLength={2}
          maxLength={50}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="username">{t("auth.username")}</Label>
        <Input
          id="username"
          value={form.username}
          onChange={set("username")}
          required
          minLength={3}
          maxLength={30}
          pattern="[a-zA-Z0-9_.-]+"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="bio">{t("profile.bio")}</Label>
        <Textarea
          id="bio"
          value={form.bio}
          onChange={set("bio")}
          rows={3}
          maxLength={500}
          placeholder={t("profile.bioPlaceholder")}
        />
      </div>

      <Button type="submit" disabled={saving}>
        {saving && <Spinner />}
        {t("profile.save")}
      </Button>
    </form>
  );
}
