"use client";

import { useSearchParams } from "next/navigation";
import { ResetPasswordForm } from "./reset-password-form";

export function ResetPasswordClient() {
  const searchParams = useSearchParams();
  return <ResetPasswordForm token={searchParams.get("token")} />;
}
