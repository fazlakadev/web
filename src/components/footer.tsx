import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { NewsletterForm } from "@/components/newsletter-form";
import { FooterSocials } from "@/components/footer-socials";
import { Reveal } from "@/components/reveal";

export function Footer() {
  const t = useTranslations();
  const year = new Date().getFullYear();

  return (
    <footer className="mt-16 px-3 sm:px-6">
      <Reveal className="mx-auto max-w-7xl">
        <div className="relative overflow-hidden rounded-[2.5rem] border border-border glass">
          <div className="h-px w-full bg-brand-gradient-animated opacity-70" />
          <div className="pointer-events-none absolute -top-24 start-1/4 h-48 w-96 rounded-full bg-primary/10 blur-3xl" />

          {/* Section 1: Logo + tagline + social */}
          <div className="px-8 pt-10 sm:px-10">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-3">
                <Link href="/" className="group inline-flex items-center gap-2.5">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/logoA.png"
                    alt={t("common.appName")}
                    className="size-10 rounded-xl object-contain shadow-glow transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6"
                    width={40}
                    height={40}
                  />
                  <span className="text-2xl font-extrabold">
                    <span className="text-gradient">{t("common.appName")}</span>
                  </span>
                </Link>
                <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
                  {t("common.appTagline")}
                </p>
              </div>
              <FooterSocials />
            </div>
          </div>

          {/* Separator */}
          <div className="mx-8 mt-8 h-px bg-border sm:mx-10" />

          {/* Section 2: Three columns */}
          <div className="grid gap-8 px-8 pt-8 sm:px-10 md:grid-cols-3">
            {/* Content */}
            <div>
              <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-foreground">
                {t("footer.explore")}
              </h3>
              <ul className="space-y-2.5">
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
                      className="text-sm text-muted-foreground transition-colors duration-200 hover:text-primary"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Company */}
            <div>
              <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-foreground">
                {t("footer.company")}
              </h3>
              <ul className="space-y-2.5">
                {[
                  { href: "/about", label: t("nav.about") },
                  { href: "/faq", label: t("footer.faq") },
                  { href: "/help", label: t("nav.support") },
                  { href: "/download", label: t("nav.download") },
                ].map((l) => (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      className="text-sm text-muted-foreground transition-colors duration-200 hover:text-primary"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Account */}
            <div>
              <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-foreground">
                {t("footer.account")}
              </h3>
              <ul className="space-y-2.5">
                {[
                  { href: "/register", label: t("nav.register") },
                  { href: "/login", label: t("nav.login") },
                  { href: "/favorites", label: t("nav.favorites") },
                  { href: "/settings", label: t("nav.settings") },
                ].map((l) => (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      className="text-sm text-muted-foreground transition-colors duration-200 hover:text-primary"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Separator */}
          <div className="mx-8 mt-8 h-px bg-border sm:mx-10" />

          {/* Section 3: Newsletter — horizontal */}
          <div className="px-8 pt-8 sm:px-10">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="max-w-md">
                <h3 className="mb-1 text-sm font-bold uppercase tracking-wider text-foreground">
                  {t("newsletter.title")}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {t("newsletter.description")}
                </p>
              </div>
              <div className="w-full sm:max-w-sm">
                <NewsletterForm compact />
              </div>
            </div>
          </div>

          {/* Separator */}
          <div className="mx-8 mt-8 h-px bg-border sm:mx-10" />

          {/* Section 4: Terms */}
          <div className="px-8 pt-6 sm:px-10">
            <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-muted-foreground sm:justify-start">
              <Link href="/terms" className="transition-colors duration-200 hover:text-primary">
                {t("footer.terms")}
              </Link>
              <span className="text-border">·</span>
              <Link href="/privacy" className="transition-colors duration-200 hover:text-primary">
                {t("footer.privacy")}
              </Link>
            </div>
          </div>

          {/* Section 5: Copyright */}
          <div className="px-8 py-6 sm:px-10">
            <p className="text-center text-xs text-muted-foreground sm:text-start">
              &copy; {year} {t("common.appName")}. {t("footer.rights")}.
            </p>
          </div>
        </div>
      </Reveal>
    </footer>
  );
}
