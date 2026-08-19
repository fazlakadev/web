import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  const t = useTranslations();
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-6xl font-black text-primary">404</h1>
      <p className="text-lg font-semibold">{t("common.notFound")}</p>
      <p className="text-sm text-muted-foreground">
        {t("common.pageNotFound")}
      </p>
      <Link href="/">
        <Button>{t("common.backHome")}</Button>
      </Link>
    </div>
  );
}
