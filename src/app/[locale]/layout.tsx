import type { Metadata } from "next";
import { Inter, Cairo } from "next/font/google";
import { notFound } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";
import { Toaster } from "sonner";
import { routing } from "@/i18n/routing";
import { ThemeProvider } from "@/providers/theme-provider";
import { AuthProvider } from "@/providers/auth-provider";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Background } from "@/components/background";
import { VerifyEmailBanner } from "@/components/verify-email-banner";
import { IncomingCallPopup } from "@/components/incoming-call-popup";
import { OnboardingFlow } from "@/components/onboarding-flow";
import { WelcomeToast } from "@/components/welcome-toast";
import { TermsConsentModal } from "@/components/terms-consent-modal";
import "./../globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans-stack",
  display: "swap",
});

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  variable: "--font-display-stack",
  display: "swap",
});

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "common" });
  return {
    title: {
      default: t("appName"),
      template: `%s | ${t("appName")}`,
    },
    description: t("appTagline"),
  };
}

const THEME_INIT = `(function(){try{var t=localStorage.getItem("fazlaka-theme");var d=t==="system"?(window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"):(t||"dark");var e=document.documentElement;e.classList.toggle("dark",d==="dark");e.style.colorScheme=d;}catch(x){document.documentElement.classList.add("dark");}})();`;

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!routing.locales.includes(locale as never)) {
    notFound();
  }
  setRequestLocale(locale);
  const messages = await getMessages();
  const dir = locale === "ar" ? "rtl" : "ltr";

  return (
    <html lang={locale} dir={dir} suppressHydrationWarning>
      <head>
        <script
          id="theme-init"
          dangerouslySetInnerHTML={{ __html: THEME_INIT }}
        />
      </head>
      <body
        className={`min-h-screen bg-background font-sans antialiased ${inter.variable} ${cairo.variable}`}
      >
        <NextIntlClientProvider messages={messages}>
          <ThemeProvider defaultTheme="dark">
            <AuthProvider>
              <Background />
              <div className="flex min-h-screen flex-col">
                <VerifyEmailBanner />
                <Header />
                <main className="flex-1">{children}</main>
                <Footer />
              </div>
              <Toaster richColors position="top-center" />
              <IncomingCallPopup />
              <OnboardingFlow />
              <WelcomeToast />
              <TermsConsentModal />
            </AuthProvider>
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
