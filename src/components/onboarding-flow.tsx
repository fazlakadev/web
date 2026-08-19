"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { api, getAccessToken, API_BASE } from "@/lib/api";
import { useAuth } from "@/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, Spinner } from "@/components/ui/card";
import { Camera, Check, UserPlus, X } from "lucide-react";
import { cn, initials } from "@/lib/format";
import type { FriendUser } from "@/lib/types";

function uploadFile(path: string, file: File): Promise<void> {
  const fd = new FormData();
  fd.append("file", file);
  return fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${getAccessToken() ?? ""}` },
    body: fd,
  }).then(async (res) => {
    const json = await res.json().catch(() => undefined);
    if (!res.ok || json?.success === false) throw new Error("upload failed");
  });
}

export function OnboardingFlow() {
  const t = useTranslations();
  const { user, refreshUser } = useAuth();
  const avatarRef = useRef<HTMLInputElement>(null);
  const bannerRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState(0);
  const [name, setName] = useState(user?.name ?? "");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<FriendUser[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user || user.onboardedAt) return;
    setName(user.name ?? "");
    setAvatarPreview(user.avatarUrl);
  }, [user]);

  const pickAvatar = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const pickBanner = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBannerFile(file);
    setBannerPreview(URL.createObjectURL(file));
  };

  const loadSuggestions = useCallback(async () => {
    try {
      const res = await api.get<FriendUser[]>("/friends/suggestions", {
        limit: 6,
      });
      setSuggestions(res.data ?? []);
    } catch {
      setSuggestions([]);
    }
  }, []);

  useEffect(() => {
    if (step === 1) void loadSuggestions();
  }, [step, loadSuggestions]);

  const addFriend = async (userId: string) => {
    setBusy(userId);
    try {
      await api.post(`/friends/request/${userId}`);
      toast.success(t("onboarding.friendAdded"));
      setSuggestions((s) => s.filter((u) => u.id !== userId));
    } catch {
      toast.error(t("onboarding.friendError"));
    } finally {
      setBusy(null);
    }
  };

  const saveProfile = async () => {
    if (name.trim().length < 2) {
      toast.error(t("onboarding.saveFailed"));
      return;
    }
    setSaving(true);
    try {
      await api.patch("/users/me", { name: name.trim() });
      if (avatarFile) await uploadFile("/users/me/avatar", avatarFile);
      if (bannerFile) await uploadFile("/users/me/banner", bannerFile);
      await refreshUser();
      setStep(1);
    } catch {
      toast.error(t("onboarding.saveFailed"));
    } finally {
      setSaving(false);
    }
  };

  const finish = async () => {
    setSaving(true);
    try {
      await api.post("/users/me/onboarded");
      await refreshUser();
    } catch {
      await refreshUser();
    } finally {
      setSaving(false);
    }
  };

  if (!user || user.onboardedAt) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md overflow-hidden rounded-3xl border border-border bg-card shadow-lifted animate-in fade-in zoom-in-95 duration-200">
        <div className="relative flex h-24 items-center justify-center overflow-hidden bg-gradient-to-r from-primary/30 via-primary/10 to-primary/30">
          {bannerPreview && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={bannerPreview}
              alt=""
              className="absolute inset-0 size-full object-cover"
            />
          )}
          <input
            ref={bannerRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={pickBanner}
          />
          <button
            type="button"
            onClick={() => bannerRef.current?.click()}
            className="absolute bottom-2 end-2 flex items-center gap-1.5 rounded-full bg-background/80 px-3 py-1.5 text-xs font-medium backdrop-blur transition-colors hover:bg-background"
          >
            <Camera className="size-3.5" />
            {t("onboarding.uploadBanner")}
          </button>
        </div>

        <div className="-mt-8 px-6 pb-6">
          <div className="flex items-end justify-between">
            <input
              ref={avatarRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={pickAvatar}
            />
            <button
              type="button"
              onClick={() => avatarRef.current?.click()}
              className="group relative"
              aria-label={t("onboarding.uploadAvatar")}
            >
              <Avatar className="size-16 border-4 border-card">
                {avatarPreview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={avatarPreview}
                    alt=""
                    className="size-full object-cover"
                  />
                ) : (
                  <span className="flex size-full items-center justify-center bg-brand-gradient text-xl font-bold text-primary-foreground">
                    {initials(name || user.name || user.username)}
                  </span>
                )}
              </Avatar>
              <span className="absolute -bottom-1 -end-1 flex size-6 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm">
                <Camera className="size-3.5" />
              </span>
            </button>
            <button
              type="button"
              onClick={() => void finish()}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
              <X className="size-3.5" />
              {t("onboarding.skip")}
            </button>
          </div>

          <div className="mt-4">
            {step === 0 && (
              <>
                <p className="text-lg font-bold">{t("onboarding.stepProfile")}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {t("onboarding.stepProfileHint")}
                </p>
                <div className="mt-4 space-y-1.5">
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    maxLength={50}
                    placeholder={t("auth.name")}
                  />
                </div>
                <Button
                  type="button"
                  className="mt-5 w-full"
                  disabled={saving || name.trim().length < 2}
                  onClick={() => void saveProfile()}
                >
                  {saving && <Spinner />}
                  {t("onboarding.continue")}
                </Button>
              </>
            )}

            {step === 1 && (
              <>
                <p className="text-lg font-bold">{t("onboarding.stepFriends")}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {t("onboarding.stepFriendsHint")}
                </p>
                <div className="mt-4 space-y-2">
                  {suggestions.length === 0 ? (
                    <p className="py-4 text-center text-sm text-muted-foreground">
                      {t("onboarding.emptySuggestions")}
                    </p>
                  ) : (
                    suggestions.map((s) => (
                      <div
                        key={s.id}
                        className="flex items-center gap-3 rounded-xl border border-border bg-secondary/40 p-2.5"
                      >
                        <Avatar className="size-10">
                          {s.avatarUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={s.avatarUrl}
                              alt=""
                              className="size-full object-cover"
                            />
                          ) : (
                            <span className="flex size-full items-center justify-center bg-brand-gradient text-xs font-bold text-primary-foreground">
                              {initials(s.name || s.username)}
                            </span>
                          )}
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">
                            {s.name || s.username}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">
                            @{s.username}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={busy === s.id}
                          onClick={() => void addFriend(s.id)}
                        >
                          {busy === s.id ? (
                            <Spinner className="size-4" />
                          ) : (
                            <UserPlus className="size-4" />
                          )}
                          {t("onboarding.addFriend")}
                        </Button>
                      </div>
                    ))
                  )}
                </div>
                <Button
                  type="button"
                  className="mt-5 w-full"
                  onClick={() => setStep(2)}
                >
                  {t("onboarding.continue")}
                </Button>
              </>
            )}

            {step === 2 && (
              <div className="text-center">
                <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-500">
                  <Check className="size-6" />
                </span>
                <p className="mt-3 text-lg font-bold">{t("onboarding.done")}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {t("onboarding.doneHint")}
                </p>
                <Button
                  type="button"
                  className={cn("mt-5 w-full")}
                  disabled={saving}
                  onClick={() => void finish()}
                >
                  {saving && <Spinner />}
                  {t("onboarding.startExploring")}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
