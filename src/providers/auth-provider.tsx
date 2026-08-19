"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { useRouter } from "@/i18n/navigation";
import { api, clearTokens, getAccessToken, setTokens } from "@/lib/api";
import type { UserProfile } from "@/lib/types";

export interface PhoneChallenge {
  verificationId?: string;
  phone: string;
  status: "code_sent" | "not_linked";
  botUsername: string;
  botUrl: string;
  expiresIn: number;
  resendAt?: number;
}

export interface PhoneLinkStatus {
  phone: string;
  linked: boolean;
  botUsername: string;
  botUrl: string;
}

const WELCOME_FLAG = "fazlaka_welcome";

export function markWelcome(kind: "new" | "back" = "back") {
  try {
    localStorage.setItem(WELCOME_FLAG, kind);
  } catch {
    // ignore
  }
}

export function consumeWelcomeFlag(): "new" | "back" | null {
  try {
    const v = localStorage.getItem(WELCOME_FLAG);
    if (!v) return null;
    localStorage.removeItem(WELCOME_FLAG);
    return v === "new" ? "new" : "back";
  } catch {
    return null;
  }
}

interface AuthContextValue {
  token: string | null;
  user: UserProfile | null;
  loading: boolean;
  registerPhone: (
    phone: string,
    username: string,
    name?: string,
  ) => Promise<PhoneChallenge>;
  requestPhoneLogin: (phone: string) => Promise<PhoneChallenge>;
  getPhoneStatus: (phone: string) => Promise<PhoneLinkStatus>;
  resendPhoneCode: (phone: string, verificationId?: string) => Promise<{ status: "code_sent" | "not_linked"; resendAt?: number }>;
  completePhoneAuth: (
    phone: string,
    verificationId: string,
    code: string,
    kind?: "new" | "back",
  ) => Promise<{ success: boolean; onboarded: boolean }>;
  login: (
    email: string,
    password: string,
  ) => Promise<{
    requiresTwoFactor: boolean;
    email?: string;
    method?: "EMAIL" | "APP";
  }>;
  verifyTwoFactor: (email: string, otp: string) => Promise<void>;
  register: (data: {
    email: string;
    password: string;
    name: string;
    username: string;
    referralCode?: string;
    backupEmail?: string;
  }) => Promise<void>;
  completeOAuth: (accessToken: string, refreshToken: string) => Promise<void>;
  acceptTerms: (username?: string) => Promise<UserProfile>;
  refreshUser: () => Promise<void>;
  logout: () => Promise<void>;
}

function setAuthData(
  setToken: (t: string) => void,
  setUser: (u: UserProfile) => void,
  accessToken: string,
  refreshToken: string,
  user: UserProfile,
  kind: "new" | "back" = "back",
) {
  setTokens(accessToken, refreshToken);
  setToken(accessToken);
  setUser(user);
  markWelcome(kind);
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const t = getAccessToken();
    setToken(t);
    if (!t) {
      setLoading(false);
      return;
    }
    api
      .get<UserProfile>("/auth/me")
      .then((res) => setUser(res.data))
      .catch(() => {
        if (!getAccessToken()) {
          setToken(null);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const res = await api.post<
        | {
            accessToken: string;
            refreshToken: string;
            user: UserProfile;
          }
        | { requiresTwoFactor: true; email: string; method: "EMAIL" | "APP" }
      >("/auth/login", { email, password });
      if ("requiresTwoFactor" in res.data) {
        return {
          requiresTwoFactor: true,
          email: res.data.email,
          method: res.data.method,
        };
      }
      setAuthData(setToken, setUser, res.data.accessToken, res.data.refreshToken, res.data.user);
      return { requiresTwoFactor: false };
    },
    [],
  );

  const verifyTwoFactor = useCallback(
    async (email: string, otp: string) => {
      const res = await api.post<{
        accessToken: string;
        refreshToken: string;
        user: UserProfile;
      }>("/auth/login/2fa", { email, otp });
      setAuthData(setToken, setUser, res.data.accessToken, res.data.refreshToken, res.data.user);
    },
    [],
  );

  const register = useCallback(
    async (data: {
      email: string;
      password: string;
      name: string;
      username: string;
      referralCode?: string;
      backupEmail?: string;
    }) => {
      const res = await api.post<{
        accessToken: string;
        refreshToken: string;
        user: UserProfile;
      }>("/auth/register", {
        ...data,
        backupEmail: data.backupEmail?.trim() || undefined,
        termsAccepted: true,
      });
      setAuthData(setToken, setUser, res.data.accessToken, res.data.refreshToken, res.data.user, "new");
    },
    [],
  );

  const registerPhone = useCallback(
    async (phone: string, username: string, name?: string) => {
      const res = await api.post<PhoneChallenge>("/auth/register-phone", {
        phone,
        username,
        name,
        termsAccepted: true,
      });
      return res.data;
    },
    [],
  );

  const requestPhoneLogin = useCallback(async (phone: string) => {
    const res = await api.post<PhoneChallenge>("/auth/phone/login", { phone });
    return res.data;
  }, []);

  const getPhoneStatus = useCallback(async (phone: string) => {
    const res = await api.get<PhoneLinkStatus>("/auth/phone/status", { phone });
    return res.data;
  }, []);

  const resendPhoneCode = useCallback(
    async (phone: string, verificationId?: string) => {
      const res = await api.post<{
        status: "code_sent" | "not_linked";
        resendAt?: number;
      }>("/auth/phone/resend", { phone, verificationId });
      return res.data;
    },
    [],
  );

  const completePhoneAuth = useCallback(
    async (
      phone: string,
      verificationId: string,
      code: string,
      kind: "new" | "back" = "back",
    ) => {
      const res = await api.post<
        | { pending: true }
        | { accessToken: string; refreshToken: string; user: UserProfile }
      >("/auth/phone/complete", { phone, verificationId, code });
      if ("pending" in res.data) return { success: false, onboarded: false };
      const { accessToken, refreshToken, user } = res.data;
      setAuthData(setToken, setUser, accessToken, refreshToken, user, kind);
      return { success: true, onboarded: !!user.onboardedAt };
    },
    [],
  );

  const completeOAuth = useCallback(
    async (accessToken: string, refreshToken: string) => {
      setTokens(accessToken, refreshToken);
      setToken(accessToken);
      const res = await api.get<UserProfile>("/auth/me");
      setUser(res.data);
      markWelcome(res.data.termsAcceptedAt ? "back" : "new");
    },
    [],
  );

  const acceptTerms = useCallback(
    async (username?: string) => {
      const res = await api.post<{
        accessToken: string;
        refreshToken: string;
        user: UserProfile;
      }>("/auth/terms-accept", { termsAccepted: true, username });
      setTokens(res.data.accessToken, res.data.refreshToken);
      setToken(res.data.accessToken);
      setUser(res.data.user);
      return res.data.user;
    },
    [],
  );

  const refreshUser = useCallback(async () => {
    if (!getAccessToken()) return;
    const res = await api.get<UserProfile>("/auth/me");
    setUser(res.data);
  }, []);

  const logout = useCallback(async () => {
    try {
      const refresh = localStorage.getItem("fazlaka_user_refresh");
      if (refresh) {
        await api.post("/auth/logout", { refreshToken: refresh });
      }
    } catch {
      // ignore
    }
    clearTokens();
    setToken(null);
    setUser(null);
    router.push("/");
  }, [router]);

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        loading,
        login,
        verifyTwoFactor,
        register,
        registerPhone,
        requestPhoneLogin,
        getPhoneStatus,
        resendPhoneCode,
        completePhoneAuth,
        completeOAuth,
        acceptTerms,
        refreshUser,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
