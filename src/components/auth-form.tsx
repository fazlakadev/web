"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { useRouter, Link } from "@/i18n/navigation";
import { useAuth, type PhoneChallenge } from "@/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/card";
import { GoogleButton, OrDivider } from "@/components/google-button";
import { GithubButton } from "@/components/github-button";
import { FacebookButton } from "@/components/facebook-button";
import { PhoneInput } from "@/components/phone-input";
import { ApiError } from "@/lib/api";
import { cn } from "@/lib/format";
import { Check, Send, CheckCircle2 } from "lucide-react";

const REGISTER_STEPS = 3;

type AuthMethod = "email" | "phone";

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const t = useTranslations();
  const {
    login,
    verifyTwoFactor,
    register,
    registerPhone,
    requestPhoneLogin,
    getPhoneStatus,
    resendPhoneCode,
    completePhoneAuth,
  } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [method, setMethod] = useState<AuthMethod>("email");
  const [step, setStep] = useState(0);
  const [accepted, setAccepted] = useState(false);
  const [twoFactorEmail, setTwoFactorEmail] = useState<string | null>(null);
  const [twoFactorMethod, setTwoFactorMethod] = useState<"EMAIL" | "APP">(
    "EMAIL",
  );
  const [otp, setOtp] = useState("");
  const [form, setForm] = useState({
    name: "",
    username: "",
    email: "",
    password: "",
    confirm: "",
    referral: "",
    backup: "",
  });
  const [phone, setPhone] = useState("");
  const [phoneName, setPhoneName] = useState("");
  const [phoneUsername, setPhoneUsername] = useState("");
  const [phoneAccepted, setPhoneAccepted] = useState(false);
  const [challenge, setChallenge] = useState<PhoneChallenge | null>(null);
  const [codeInput, setCodeInput] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [linked, setLinked] = useState(false);
  const [linkChecked, setLinkChecked] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const challengeRef = useRef<PhoneChallenge | null>(null);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const tryTranslate = (msg: string): string => {
    if (/^(errors|auth|common)\.[A-Za-z0-9.]+$/.test(msg)) {
      const translated = (t as unknown as (k: string) => string)(msg);
      return translated === msg ? msg : translated;
    }
    return msg;
  };

  const getErrorMessage = (err: unknown): string => {
    if (err instanceof ApiError && typeof err.message === "string") {
      const msg = tryTranslate(err.message);
      const attemptsLeft =
        typeof err.details?.attemptsLeft === "number"
          ? (err.details.attemptsLeft as number)
          : undefined;
      if (attemptsLeft && attemptsLeft > 0) {
        return `${msg}. ${t("auth.attemptsLeft", { count: attemptsLeft })}`;
      }
      return msg;
    }
    return t("auth.errorGeneric");
  };

  useEffect(() => {
    if (mode !== "register") return;
    const ref = new URLSearchParams(window.location.search).get("ref");
    if (ref) setForm((f) => ({ ...f, referral: ref }));
  }, [mode]);

  useEffect(() => {
    challengeRef.current = challenge;
  }, [challenge]);

  useEffect(() => {
    if (!challenge || challenge.status === "code_sent") return;
    let active = true;
    let timer: number | undefined;
    let resendTimer: number | undefined;
    const COOLDOWN_MS = 60000;
    const requestedAt = Date.now();

    const poll = async () => {
      if (!active || !challengeRef.current) return;
      try {
        const st = await getPhoneStatus(challengeRef.current.phone);
        if (!active) return;
        setLinkChecked(true);
        if (!st.linked) {
          timer = window.setTimeout(poll, 2500);
          return;
        }
        setLinked(true);
        // Phone is now linked — wait out the resend cooldown, then push the code.
        const wait = Math.max(0, requestedAt + COOLDOWN_MS - Date.now());
        if (wait > 0) {
          resendTimer = window.setTimeout(sendCode, wait + 100);
          return;
        }
        await sendCode();
      } catch {
        if (!active) return;
        timer = window.setTimeout(poll, 3000);
      }
    };

    const sendCode = async () => {
      if (!active || !challengeRef.current) return;
      try {
        const r = await resendPhoneCode(
          challengeRef.current.phone,
          challengeRef.current.verificationId,
        );
        if (!active) return;
        if (r.status === "code_sent") {
          setChallenge((c) =>
            c ? { ...c, status: "code_sent", resendAt: r.resendAt } : c,
          );
        } else {
          timer = window.setTimeout(poll, 2500);
        }
      } catch {
        if (!active) return;
        timer = window.setTimeout(poll, 3000);
      }
    };

    timer = window.setTimeout(poll, 1200);
    return () => {
      active = false;
      if (timer) window.clearTimeout(timer);
      if (resendTimer) window.clearTimeout(resendTimer);
    };
  }, [challenge, getPhoneStatus, resendPhoneCode]);

  useEffect(() => {
    if (!challenge?.resendAt) return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [challenge?.resendAt]);

  const resendLeft = challenge?.resendAt
    ? Math.max(0, Math.ceil((challenge.resendAt - now) / 1000))
    : 0;

  const resendCode = async () => {
    if (!challenge || resendLeft > 0) return;
    try {
      const r = await resendPhoneCode(challenge.phone, challenge.verificationId);
      if (r.status === "code_sent") {
        setChallenge((c) =>
          c ? { ...c, status: "code_sent", resendAt: r.resendAt } : c,
        );
        setNow(Date.now());
        toast.success(t("auth.phoneCodeSent"));
      } else {
        toast.info(t("auth.phoneNotLinkedYet"));
      }
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const submitPhoneCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!challenge?.verificationId) return;
    if (!/^\d{6}$/.test(codeInput)) {
      toast.error(t("auth.phoneCodeInvalid"));
      return;
    }
    setVerifying(true);
    try {
      const res = await completePhoneAuth(
        challenge.phone,
        challenge.verificationId,
        codeInput,
        mode === "register" ? "new" : "back",
      );
      if (res.success) {
        toast.success(
          mode === "register" ? t("auth.registerSuccess") : t("auth.loginSuccess"),
        );
        router.push("/");
      } else {
        toast.error(t("auth.phoneCodeInvalid"));
      }
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setVerifying(false);
    }
  };

  const validateStep = (): string | null => {
    if (step === 0) {
      if (form.name.trim().length < 2) return t("auth.errorGeneric");
      if (!/^[a-zA-Z0-9_.-]{3,30}$/.test(form.username.trim()))
        return t("auth.errorGeneric");
      return null;
    }
    if (step === 1) {
      if (!/^\S+@\S+\.\S+$/.test(form.email)) return t("auth.errorGeneric");
      if (form.password.length < 8) return t("auth.errorGeneric");
      if (form.password !== form.confirm) return t("auth.errorGeneric");
      if (form.backup.trim() && !/^\S+@\S+\.\S+$/.test(form.backup.trim()))
        return t("auth.errorGeneric");
      return null;
    }
    if (!accepted) return t("auth.acceptTermsRequired");
    return null;
  };

  const nextStep = () => {
    const error = validateStep();
    if (error) {
      toast.error(error);
      return;
    }
    setStep((s) => Math.min(s + 1, REGISTER_STEPS - 1));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === "register") {
      if (step < REGISTER_STEPS - 1) {
        nextStep();
        return;
      }
      const error = validateStep();
      if (error) {
        toast.error(error);
        return;
      }
    } else {
      if (form.password.length < 8) {
        toast.error(t("auth.errorGeneric"));
        return;
      }
    }
    setLoading(true);
    try {
      if (mode === "login") {
        const result = await login(form.email, form.password);
        if (result.requiresTwoFactor) {
          setTwoFactorEmail(result.email ?? form.email);
          setTwoFactorMethod(result.method ?? "EMAIL");
          setLoading(false);
          return;
        }
        toast.success(t("auth.loginSuccess"));
      } else {
        await register({
          email: form.email,
          password: form.password,
          name: form.name,
          username: form.username,
          referralCode: form.referral.trim() || undefined,
          backupEmail: form.backup.trim() || undefined,
        });
        toast.success(t("auth.registerSuccess"));
      }
      router.push("/");
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const submitPhone = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = phone.replace(/[\s\-().]/g, "").trim();
    if (!/^\+?[0-9]{7,15}$/.test(cleaned)) {
      toast.error(t("auth.phoneInvalid"));
      return;
    }
    if (mode === "register") {
      if (!/^[a-zA-Z0-9_.-]{3,30}$/.test(phoneUsername.trim())) {
        toast.error(t("auth.errorGeneric"));
        return;
      }
      if (phoneName.trim().length < 2) {
        toast.error(t("auth.errorGeneric"));
        return;
      }
      if (!phoneAccepted) {
        toast.error(t("auth.acceptTermsRequired"));
        return;
      }
    }
    setLoading(true);
    try {
      const result =
        mode === "register"
          ? await registerPhone(cleaned, phoneUsername.trim(), phoneName.trim())
          : await requestPhoneLogin(cleaned);
      setChallenge(result);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const submitOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!twoFactorEmail || otp.length < 4) {
      toast.error(t("auth.errorGeneric"));
      return;
    }
    setLoading(true);
    try {
      await verifyTwoFactor(twoFactorEmail, otp);
      toast.success(t("auth.loginSuccess"));
      router.push("/");
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  if (mode === "login" && twoFactorEmail) {
    return (
      <form onSubmit={submitOtp} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="otp">{t("auth.otpLabel")}</Label>
          <Input
            id="otp"
            inputMode="numeric"
            autoComplete="one-time-code"
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder="••••••"
            required
            autoFocus
          />
          <p className="text-xs text-muted-foreground">
            {twoFactorMethod === "APP"
              ? t("auth.otpAppHint")
              : t("auth.otpEmailHint")}
          </p>
        </div>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading && <Spinner />}
          {t("auth.verify")}
        </Button>
        <button
          type="button"
          className="w-full text-center text-sm text-muted-foreground hover:text-foreground"
          onClick={() => {
            setTwoFactorEmail(null);
            setOtp("");
          }}
        >
          {t("auth.backToLogin")}
        </button>
      </form>
    );
  }

  if (challenge) {
    if (challenge.status === "code_sent") {
      return (
        <form onSubmit={submitPhoneCode} className="space-y-4">
          <div className="text-center">
            <CheckCircle2 className="mx-auto size-10 text-emerald-500" />
            <p className="mt-2 text-sm font-semibold">{t("auth.phoneCodeTitle")}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {t("auth.phoneCodeHint")}
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="phone-code">{t("auth.otpLabel")}</Label>
            <Input
              id="phone-code"
              inputMode="numeric"
              autoComplete="one-time-code"
              value={codeInput}
              onChange={(e) =>
                setCodeInput(e.target.value.replace(/\D/g, "").slice(0, 6))
              }
              placeholder="••••••"
              required
              autoFocus
              className="text-center font-mono text-lg tracking-[0.4em]"
            />
            <p className="text-xs text-muted-foreground">
              {t("auth.phoneCodeInputHint")}
            </p>
          </div>

          <Button type="submit" className="w-full" disabled={verifying}>
            {verifying && <Spinner />}
            {t("auth.verify")}
          </Button>

          <div className="flex items-center justify-between gap-2 text-sm">
            <button
              type="button"
              className="text-muted-foreground hover:text-foreground disabled:cursor-not-allowed disabled:opacity-60"
              onClick={resendCode}
              disabled={resendLeft > 0}
            >
              {resendLeft > 0
                ? t("auth.phoneResendCooldown", { seconds: resendLeft })
                : t("auth.phoneResend")}
            </button>
            <a
              href={challenge.botUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground"
            >
              <Send className="size-3.5" />
              {t("auth.telegramOpenBot")}
            </a>
          </div>

          <button
            type="button"
            className="w-full text-center text-sm text-muted-foreground hover:text-foreground"
            onClick={() => {
              setChallenge(null);
              setCodeInput("");
              setLinked(false);
              setLinkChecked(false);
            }}
          >
            {t("auth.telegramBack")}
          </button>
        </form>
      );
    }

    return (
      <div className="space-y-4">
        <div className="rounded-2xl border border-primary/20 bg-secondary/30 p-4">
          <div className="flex items-center gap-3">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-brand-gradient text-primary-foreground shadow-sm">
              <Send className="size-5" />
            </div>
            <div className="min-w-0 flex-1 text-start">
              <p className="truncate text-sm font-bold text-foreground">
                @{challenge.botUsername}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {t("auth.phoneLinkBotName")}
              </p>
            </div>
            <span className="shrink-0 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
              {t("auth.phoneLinkBotBadge")}
            </span>
          </div>
        </div>

        <div className="text-center">
          <p className="text-sm font-semibold">{t("auth.phoneLinkTitle")}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {t("auth.phoneLinkHint")}
          </p>
        </div>

        <div className="space-y-2 text-start">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="flex items-center gap-3 rounded-xl border border-border bg-card px-3 py-2.5"
            >
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                {n}
              </span>
              <span className="text-sm text-foreground">
                {n === 1
                  ? t("auth.phoneLinkStep1", { bot: challenge.botUsername })
                  : n === 2
                    ? t("auth.phoneLinkStep2")
                    : t("auth.phoneLinkStep3")}
              </span>
            </div>
          ))}
        </div>

        <a
          href={challenge.botUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex w-full animate-pulse items-center justify-center gap-2 rounded-xl bg-brand-gradient px-5 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:opacity-90 active:scale-[0.99]"
        >
          <Send className="size-4" />
          {t("auth.phoneShareNumber", { bot: challenge.botUsername })}
        </a>

        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          {linked ? (
            <>
              <Check className="size-4 text-emerald-500" />
              {t("auth.phoneLinkConfirmed")}
            </>
          ) : (
            <>
              <Spinner className="size-4" />
              {linkChecked
                ? t("auth.phoneLinkWaiting")
                : t("auth.phoneLinkChecking")}
            </>
          )}
        </div>

        <button
          type="button"
          className="w-full rounded-xl border border-border px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          onClick={resendCode}
          disabled={resendLeft > 0}
        >
          {resendLeft > 0
            ? t("auth.phoneResendCooldown", { seconds: resendLeft })
            : t("auth.phoneIveShared")}
        </button>

        <button
          type="button"
          className="w-full text-center text-sm text-muted-foreground hover:text-foreground"
          onClick={() => {
            setChallenge(null);
            setLinked(false);
            setLinkChecked(false);
          }}
        >
          {t("auth.telegramBack")}
        </button>
      </div>
    );
  }

  const stepTitle = () => {
    if (step === 0) return t("auth.accountStep");
    if (step === 1) return t("auth.securityStep");
    return t("auth.finishStep");
  };

  const stepHint = () => {
    if (step === 0) return t("auth.accountStepHint");
    if (step === 1) return t("auth.securityStepHint");
    return t("auth.finishStepHint");
  };

  return (
    <form onSubmit={method === "phone" ? submitPhone : submit} className="space-y-4">
      <div className="grid grid-cols-2 gap-2">
        <GoogleButton variant={mode} />
        <GithubButton variant={mode} />
      </div>
      <FacebookButton variant={mode} />
      <OrDivider label={t("auth.orContinueWith")} />

      <div className="grid grid-cols-2 gap-1 rounded-xl border border-border bg-secondary/40 p-1">
        {(["email", "phone"] as AuthMethod[]).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMethod(m)}
            className={cn(
              "rounded-lg py-2 text-sm font-medium transition-colors",
              method === m
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {m === "email" ? t("auth.emailTab") : t("auth.phoneTab")}
          </button>
        ))}
      </div>

      {method === "phone" ? (
        <>
          {mode === "register" && (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="phone-name">{t("auth.name")}</Label>
                <Input
                  id="phone-name"
                  value={phoneName}
                  onChange={(e) => setPhoneName(e.target.value)}
                  required
                  minLength={2}
                  maxLength={50}
                  autoFocus
                />
                <p className="text-xs text-muted-foreground">
                  {t("auth.phoneRegisterNameHint")}
                </p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="phone-username">{t("auth.username")}</Label>
                <Input
                  id="phone-username"
                  value={phoneUsername}
                  onChange={(e) => setPhoneUsername(e.target.value)}
                  required
                  minLength={3}
                  maxLength={30}
                  pattern="[a-zA-Z0-9_.-]+"
                  placeholder="my_username"
                />
                <p className="text-xs text-muted-foreground">
                  {t("auth.phoneUsernameHint")}
                </p>
              </div>
              <label className="flex items-start gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={phoneAccepted}
                  onChange={(e) => setPhoneAccepted(e.target.checked)}
                  className="mt-0.5 size-4 shrink-0 accent-primary"
                  required
                />
                <span>
                  {t("auth.acceptTerms")}
                  <Link
                    href="/terms"
                    className="font-medium text-primary hover:underline"
                  >
                    {t("auth.termsAndPrivacy")}
                  </Link>
                </span>
              </label>
            </>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="phone">{t("auth.phone")}</Label>
            <PhoneInput
              id="phone"
              value={phone}
              onChange={setPhone}
              autoFocus={mode === "login"}
              placeholder={t("auth.phoneNumberPlaceholder")}
            />
            <p className="text-xs text-muted-foreground">
              {mode === "register" ? t("auth.phoneRegisterHint") : t("auth.phoneLoginHint")}
            </p>
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Spinner />}
            {t("auth.phoneContinue")}
          </Button>
        </>
      ) : (
        <>
          {mode === "register" && (
            <>
              <div className="space-y-2">
                <div className="flex gap-1.5" aria-hidden="true">
                  {Array.from({ length: REGISTER_STEPS }).map((_, i) => (
                    <span
                      key={i}
                      className={cn(
                        "h-1 flex-1 rounded-full transition-colors",
                        i <= step ? "bg-primary" : "bg-border",
                      )}
                    />
                  ))}
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold">{stepTitle()}</p>
                    <p className="text-xs text-muted-foreground">{stepHint()}</p>
                  </div>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {t("auth.stepOf", { current: step + 1, total: REGISTER_STEPS })}
                  </span>
                </div>
              </div>

              {step === 0 && (
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="name">{t("auth.name")}</Label>
                    <Input
                      id="name"
                      value={form.name}
                      onChange={set("name")}
                      required
                      minLength={2}
                      maxLength={50}
                      autoFocus
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
                </div>
              )}

              {step === 1 && (
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="email">{t("auth.email")}</Label>
                    <Input
                      id="email"
                      type="email"
                      value={form.email}
                      onChange={set("email")}
                      required
                      autoComplete="email"
                      autoFocus
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="backup-email">
                      {t("auth.backupEmail")}{" "}
                      <span className="text-xs text-muted-foreground">
                        ({t("auth.optional")})
                      </span>
                    </Label>
                    <Input
                      id="backup-email"
                      type="email"
                      value={form.backup}
                      onChange={set("backup")}
                      autoComplete="email"
                      placeholder={t("auth.backupEmailPlaceholder")}
                    />
                    <p className="text-xs text-muted-foreground">
                      {t("auth.backupEmailHint")}
                    </p>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="password">{t("auth.password")}</Label>
                    <Input
                      id="password"
                      type="password"
                      value={form.password}
                      onChange={set("password")}
                      required
                      minLength={8}
                      autoComplete="new-password"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="confirm">{t("auth.confirmPassword")}</Label>
                    <Input
                      id="confirm"
                      type="password"
                      value={form.confirm}
                      onChange={set("confirm")}
                      required
                      minLength={8}
                      autoComplete="new-password"
                    />
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-4">
                  <div className="rounded-xl border border-border bg-secondary/40 p-3 text-sm">
                    <p className="truncate">
                      <span className="text-muted-foreground">{t("auth.name")}: </span>
                      <span className="font-medium">{form.name}</span>
                    </p>
                    <p className="truncate">
                      <span className="text-muted-foreground">
                        {t("auth.username")}:{" "}
                      </span>
                      <span className="font-medium">@{form.username}</span>
                    </p>
                    <p className="truncate">
                      <span className="text-muted-foreground">{t("auth.email")}: </span>
                      <span className="font-medium">{form.email}</span>
                    </p>
                    {form.backup.trim() && (
                      <p className="truncate">
                        <span className="text-muted-foreground">
                          {t("auth.backupEmail")}:{" "}
                        </span>
                        <span className="font-medium">{form.backup.trim()}</span>
                      </p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="referral">
                      {t("auth.referralCode")}{" "}
                      <span className="text-xs text-muted-foreground">
                        ({t("auth.optional")})
                      </span>
                    </Label>
                    <Input
                      id="referral"
                      value={form.referral}
                      onChange={set("referral")}
                      maxLength={50}
                      placeholder={t("auth.referralCodePlaceholder")}
                    />
                  </div>
                  <label className="flex items-start gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={accepted}
                      onChange={(e) => setAccepted(e.target.checked)}
                      className="mt-0.5 size-4 shrink-0 accent-primary"
                      required
                    />
                    <span>
                      {t("auth.acceptTerms")}
                      <Link
                        href="/terms"
                        className="font-medium text-primary hover:underline"
                      >
                        {t("auth.termsAndPrivacy")}
                      </Link>
                    </span>
                  </label>
                </div>
              )}

              <div className="flex gap-2">
                {step > 0 && (
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => setStep((s) => Math.max(s - 1, 0))}
                    disabled={loading}
                  >
                    {t("auth.back")}
                  </Button>
                )}
                <Button type="submit" className="flex-1" disabled={loading}>
                  {loading && <Spinner />}
                  {step < REGISTER_STEPS - 1 ? t("auth.next") : t("auth.createAccount")}
                </Button>
              </div>
            </>
          )}

          {mode === "login" && (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="email">{t("auth.email")}</Label>
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={set("email")}
                  required
                  autoComplete="email"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password">{t("auth.password")}</Label>
                <Input
                  id="password"
                  type="password"
                  value={form.password}
                  onChange={set("password")}
                  required
                  autoComplete="current-password"
                />
              </div>
              <div className="text-end">
                <Link
                  href="/forgot-password"
                  className="text-sm text-muted-foreground hover:text-primary"
                >
                  {t("auth.forgotPassword")}
                </Link>
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Spinner />}
                {t("auth.login")}
              </Button>
            </>
          )}
        </>
      )}

      <p className="text-center text-sm text-muted-foreground">
        {mode === "login" ? t("auth.noAccount") : t("auth.haveAccount")}{" "}
        <Link
          href={mode === "login" ? "/register" : "/login"}
          className="font-medium text-primary hover:underline"
        >
          {mode === "login" ? t("auth.register") : t("auth.login")}
        </Link>
      </p>
    </form>
  );
}
