"use client";

import { useEffect } from "react";
import { useRouter } from "@/i18n/navigation";
import { useAuth } from "@/providers/auth-provider";
import { Spinner } from "@/components/ui/card";

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { token, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !token) {
      router.replace("/login");
    }
  }, [token, loading, router]);

  if (loading || !token) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Spinner className="size-6 text-primary" />
      </div>
    );
  }

  return <>{children}</>;
}
