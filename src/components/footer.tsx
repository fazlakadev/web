import { useTranslations } from "next-intl";
import { Mail, Download } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { NewsletterForm } from "@/components/newsletter-form";
import { FooterSocials } from "@/components/footer-socials";

export function Footer() {
  const t = useTranslations();
  return (
    <footer className="mt-12 px-3 sm:px-6">
      <div className="mx-auto max-w-7xl overflow-hidden rounded-[2.5rem] border border-border glass">
        <div className="grid gap-8 p-7 sm:grid-cols-2 sm:p-10 lg:grid-cols-4">
        <div className="space-y-3">
          <div className="flex items-center gap-2.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logoA.png"
              alt={t("common.appName")}
              className="size-8 rounded-xl object-contain shadow-glow"
              width={32}
              height={32}
            />
            <span className="text-lg font-extrabold">
              <span className="text-gradient">{t("common.appName")}</span>
            </span>
          </div>
          <p className="max-w-xs text-sm text-muted-foreground">
            {t("common.appTagline")}
          </p>
          <FooterSocials />
        </div>

        <div className="space-y-2">
          <h3 className="text-sm font-bold">{t("footer.explore")}</h3>
          {[
            { href: "/browse", label: t("nav.browse") },
            { href: "/seasons", label: t("nav.seasons") },
            { href: "/articles", label: t("nav.articles") },
            { href: "/playlists", label: t("nav.playlists") },
            { href: "/search", label: t("common.search") },
          ].map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="block text-sm text-muted-foreground transition-colors hover:text-primary"
            >
              {l.label}
            </Link>
          ))}
          <Link
            href="/download"
            className="mt-2 flex items-center gap-2 rounded-xl bg-brand-gradient px-4 py-2.5 text-sm font-semibold text-white shadow-glow transition-all hover:opacity-90"
          >
            <Download className="size-4" />
            {t("nav.download")}
          </Link>
        </div>

        <div className="space-y-2">
          <h3 className="text-sm font-bold">{t("footer.account")}</h3>
          <Link
            href="/register"
            className="block text-sm text-muted-foreground transition-colors hover:text-primary"
          >
            {t("nav.register")}
          </Link>
          <Link
            href="/login"
            className="block text-sm text-muted-foreground transition-colors hover:text-primary"
          >
            {t("nav.login")}
          </Link>
          <Link
            href="/favorites"
            className="block text-sm text-muted-foreground transition-colors hover:text-primary"
          >
            {t("nav.favorites")}
          </Link>
          <Link
            href="/settings"
            className="block text-sm text-muted-foreground transition-colors hover:text-primary"
          >
            {t("nav.settings")}
          </Link>
          <Link
            href="/support"
            className="block text-sm text-muted-foreground transition-colors hover:text-primary"
          >
            {t("nav.support")}
          </Link>
        </div>

        <div className="space-y-3">
          <h3 className="text-sm font-bold">{t("newsletter.title")}</h3>
          <p className="text-sm text-muted-foreground">
            {t("newsletter.description")}
          </p>
          <NewsletterForm />
          <div className="flex items-center gap-2 pt-1 text-sm text-muted-foreground">
            <Mail className="size-4" />
            support@fazlaka.app
          </div>
        </div>
      </div>
      <div className="border-t border-border bg-background/30 px-7 py-5">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 sm:flex-row">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} {t("common.appName")}.{" "}
            {t("footer.rights")}
          </p>
          <div className="flex gap-4 text-sm text-muted-foreground">
            <Link href="/about" className="transition-colors hover:text-primary">
              {t("footer.about")}
            </Link>
            <Link href="/faq" className="transition-colors hover:text-primary">
              {t("footer.faq")}
            </Link>
            <Link href="/terms" className="transition-colors hover:text-primary">
              {t("footer.terms")}
            </Link>
            <Link href="/privacy" className="transition-colors hover:text-primary">
              {t("footer.privacy")}
            </Link>
          </div>
        </div>
      </div>
      </div>
    </footer>
  );
}
