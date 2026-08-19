"use client";

import { useSearchParams } from "next/navigation";
import { VerifyEmailForm } from "./verify-email-form";

export function VerifyEmailClient() {
  const searchParams = useSearchParams();
  return <VerifyEmailForm token={searchParams.get("token")} />;
}
