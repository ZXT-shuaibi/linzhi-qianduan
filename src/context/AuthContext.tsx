import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";
import type { ReactNode } from "react";
import { authService } from "@/services/authService";
import type {
  AuthenticatedUser,
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RefreshResponse
} from "@/types/auth";

type AuthTokens = {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
};

type AuthContextValue = {
  user: AuthenticatedUser | null;
  isLoading: boolean;
  tokens: AuthTokens | null;
  login: (payload: LoginRequest) => Promise<void>;
  register: (payload: RegisterRequest) => Promise<AuthenticatedUser>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  reloadUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const STORAGE_KEY = "linzhi_auth_tokens";
const USER_STORAGE_KEY = "linzhi_current_user";

const readStoredTokens = (): AuthTokens | null => {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AuthTokens;
    if (!parsed.accessToken || !parsed.refreshToken || !parsed.expiresAt) return null;
    return parsed;
  } catch {
    return null;
  }
};

const persistTokens = (tokens: AuthTokens | null) => {
  if (typeof window === "undefined") {
    return;
  }
  if (!tokens) {
    localStorage.removeItem(STORAGE_KEY);
    return;
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tokens));
};

const readStoredUser = (): AuthenticatedUser | null => {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(USER_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AuthenticatedUser;
  } catch {
    return null;
  }
};

const persistUser = (user: AuthenticatedUser | null) => {
  if (typeof window === "undefined") return;
  if (!user) {
    localStorage.removeItem(USER_STORAGE_KEY);
    return;
  }
  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
};

const parseInstantToMillis = (value: string): number => {
  const numeric = Number(value);
  if (!Number.isNaN(numeric)) {
    return numeric > 1e12 ? numeric : numeric * 1000;
  }
  const timestamp = Date.parse(value);
  return Number.isNaN(timestamp) ? Date.now() + 10 * 60 * 1000 : timestamp;
};

const toTokens = (token: LoginResponse["tokens"] | RefreshResponse): AuthTokens => ({
  accessToken: token.accessToken,
  refreshToken: token.refreshToken,
  expiresAt: parseInstantToMillis(token.accessTokenExpiresAt)
});

type AuthProviderProps = {
  children: ReactNode;
};

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [tokens, setTokens] = useState<AuthTokens | null>(() => readStoredTokens());
  const [user, setUser] = useState<AuthenticatedUser | null>(() => readStoredUser());
  const [isLoading, setIsLoading] = useState<boolean>(!!readStoredTokens());
  const fetchingRef = useRef<Promise<void> | null>(null);

  const fetchUser = useCallback(async (accessToken: string) => {
    try {
      const profile = await authService.fetchCurrentUser(accessToken);
      setUser(profile);
      persistUser(profile);
    } catch (error) {
      console.error("获取当前用户信息失败", error);
      setUser(null);
      setTokens(null);
      persistTokens(null);
      persistUser(null);
    }
  }, []);

  useEffect(() => {
    if (!tokens) {
      setIsLoading(false);
      return;
    }

    if (!fetchingRef.current) {
      const task = fetchUser(tokens.accessToken).finally(() => {
        fetchingRef.current = null;
        setIsLoading(false);
      });
      fetchingRef.current = task;
    }
  }, [tokens, fetchUser]);

  const login = useCallback(async (payload: LoginRequest) => {
    const response = await authService.login(payload);
    const nextTokens = toTokens(response.tokens);
    setTokens(nextTokens);
    persistTokens(nextTokens);
    await fetchUser(nextTokens.accessToken);
  }, [fetchUser]);

  const register = useCallback(async (payload: RegisterRequest) => {
    await authService.register(payload);
    const loginResponse = await authService.login({
      identifier: payload.account,
      password: payload.password,
      channel: "H5"
    });
    const nextTokens = toTokens(loginResponse.tokens);
    setTokens(nextTokens);
    persistTokens(nextTokens);
    await fetchUser(nextTokens.accessToken);
    const currentUser = await authService.fetchCurrentUser(nextTokens.accessToken);
    setUser(currentUser);
    persistUser(currentUser);
    return currentUser;
  }, [fetchUser]);

  const logout = useCallback(async () => {
    if (tokens) {
      try {
        await authService.logout({ refreshToken: tokens.refreshToken }, tokens.accessToken);
      } catch (error) {
        console.warn("注销请求失败，继续清理本地状态", error);
      }
    }
    setTokens(null);
    setUser(null);
    persistTokens(null);
    persistUser(null);
  }, [tokens]);

  const refresh = useCallback(async () => {
    if (!tokens) {
      return;
    }
    try {
      if (Date.now() < tokens.expiresAt - 5_000) {
        return;
      }
      const result = await authService.refresh(tokens.refreshToken);
      const nextTokens = toTokens(result);
      setTokens(nextTokens);
      persistTokens(nextTokens);
      await fetchUser(nextTokens.accessToken);
    } catch (error) {
      console.error("刷新登录状态失败", error);
      await logout();
    }
  }, [tokens, fetchUser, logout]);

  const reloadUser = useCallback(async () => {
    if (!tokens) return;
    await fetchUser(tokens.accessToken);
  }, [tokens, fetchUser]);

  useEffect(() => {
    if (!tokens) {
      return;
    }
    const timer = window.setInterval(() => {
      void refresh();
    }, 60_000);
    return () => window.clearInterval(timer);
  }, [tokens, refresh]);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    tokens,
    isLoading,
    login,
    register,
    logout,
    refresh,
    reloadUser
  }), [user, tokens, isLoading, login, register, logout, refresh, reloadUser]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth 必须在 AuthProvider 内部使用");
  }
  return context;
};
