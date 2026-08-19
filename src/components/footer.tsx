import { useTranslations } from "next-intl";
import { Mail, Download, Smartphone } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { NewsletterForm } from "@/components/newsletter-form";
import { FooterSocials } from "@/components/footer-socials";

export function Footer() {
  const t = useTranslations();
  const year = new Date().getFullYear();

  return (
    <footer className="mt-16 px-3 sm:px-6">
      <div className="mx-auto max-w-7xl overflow-hidden rounded-[2.5rem] border border-border glass">
        {/* Main grid */}
        <div className="grid gap-10 p-8 sm:p-10 lg:grid-cols-12">
          {/* Brand column */}
          <div className="space-y-4 lg:col-span-4">
            <Link href="/" className="inline-flex items-center gap-2.5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/logoA.png"
                alt={t("common.appName")}
                className="size-9 rounded-xl object-contain shadow-glow"
                width={36}
                height={36}
              />
              <span className="text-xl font-extrabold">
                <span className="text-gradient">{t("common.appName")}</span>
              </span>
            </Link>
            <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">
              {t("common.appTagline")}
            </p>
            <FooterSocials />
          </div>

          {/* Content column */}
          <div className="lg:col-span-2">
            <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground/60">
              {t("footer.explore")}
            </h3>
            <ul className="space-y-2">
              {[
                { href: "/browse", label: t("nav.browse") },
                { href: "/seasons", label: t("nav.seasons") },
                { href: "/articles", label: t("nav.articles") },
                { href: "/playlists", label: t("nav.playlists") },
                { href: "/search", label: t("common.search") },
              ].map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company column */}
          <div className="lg:col-span-2">
            <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground/60">
              {t("nav.company")}
            </h3>
            <ul className="space-y-2">
              {[
                { href: "/about", label: t("nav.about") },
                { href: "/faq", label: t("footer.faq") },
                { href: "/support", label: t("nav.support") },
                { href: "/download", label: t("footer.getApp") },
              ].map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Account column */}
          <div className="lg:col-span-2">
            <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground/60">
              {t("footer.account")}
            </h3>
            <ul className="space-y-2">
              {[
                { href: "/register", label: t("nav.register") },
                { href: "/login", label: t("nav.login") },
                { href: "/favorites", label: t("nav.favorites") },
                { href: "/settings", label: t("nav.settings") },
              ].map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter + Download */}
          <div className="space-y-5 lg:col-span-2">
            <div>
              <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground/60">
                {t("newsletter.title")}
              </h3>
              <p className="mb-3 text-sm text-muted-foreground">
                {t("newsletter.description")}
              </p>
              <NewsletterForm />
            </div>
            <Link
              href="/download"
              className="flex items-center gap-2.5 rounded-xl bg-brand-gradient px-4 py-3 text-sm font-semibold text-white shadow-glow transition-all hover:opacity-90 hover:shadow-lifted"
            >
              <Smartphone className="size-4" />
              {t("footer.getApp")}
            </Link>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Mail className="size-3.5" />
              support@fazlaka.app
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-border bg-background/20 px-8 py-4">
          <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 sm:flex-row">
            <p className="text-xs text-muted-foreground">
              &copy; {year} {t("common.appName")}. {t("footer.rights")}
            </p>
            <div className="flex gap-5 text-xs text-muted-foreground">
              <Link href="/terms" className="transition-colors hover:text-foreground">
                {t("footer.terms")}
              </Link>
              <Link href="/privacy" className="transition-colors hover:text-foreground">
                {t("footer.privacy")}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
