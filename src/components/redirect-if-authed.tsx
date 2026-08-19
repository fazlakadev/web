"use client";

import { useEffect } from "react";
import { useRouter } from "@/i18n/navigation";
import { useAuth } from "@/providers/auth-provider";

export function RedirectIfAuthed() {
  const { token, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && token) {
      router.replace("/");
    }
  }, [token, loading, router]);

  return null;
}
