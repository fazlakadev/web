import { getTranslations, setRequestLocale } from "next-intl/server";
import { UserPlus } from "lucide-react";
import { AuthForm } from "@/components/auth-form";
import { RedirectIfAuthed } from "@/components/redirect-if-authed";

export default async function RegisterPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();

  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md animate-in fade-in-0 zoom-in-95 duration-300">
        <div className="mb-6 flex flex-col items-center gap-3 text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logoA.png"
            alt={t("common.appName")}
            className="size-14 rounded-2xl object-contain shadow-glow"
            width={56}
            height={56}
          />
          <div>
            <h1 className="flex items-center justify-center gap-2 text-2xl font-black tracking-tight">
              <UserPlus className="size-5 text-primary" />
              {t("auth.joinUs")}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {t("common.appTagline")}
            </p>
          </div>
        </div>
        <div className="glass-card rounded-3xl border border-border p-6 shadow-lifted sm:p-8">
          <RedirectIfAuthed />
          <AuthForm mode="register" />
        </div>
      </div>
    </div>
  );
}
