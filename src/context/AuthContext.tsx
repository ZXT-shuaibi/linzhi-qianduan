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
import {
  clearAuthSession,
  loadAuthTokens,
  persistAuthTokens,
  TOKEN_CHANGED_EVENT,
  USER_STORAGE_KEY,
  type StoredAuthTokens
} from "@/services/authSession";
import type {
  AuthenticatedUser,
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RefreshResponse
} from "@/types/auth";

type AuthTokens = StoredAuthTokens;

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

const readStoredUser = (): AuthenticatedUser | null => {
  if (typeof window === "undefined") return null;

  try {
    const raw = localStorage.getItem(USER_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<AuthenticatedUser> & { id?: string | number };
    const userId = String(parsed.userId ?? parsed.id ?? "");
    if (!userId || !parsed.nickname) return null;
    return {
      ...parsed,
      id: userId,
      userId,
      nickname: parsed.nickname
    } as AuthenticatedUser;
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

const parseJwtRole = (token: string): string | undefined => {
  try {
    const payload = token.split(".")[1];
    if (!payload) return undefined;
    const json = JSON.parse(atob(payload));
    return json.role;
  } catch {
    return undefined;
  }
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
  expiresAt: parseInstantToMillis(token.accessExpiresAt ?? token.accessTokenExpiresAt ?? "")
});

type AuthProviderProps = {
  children: ReactNode;
};

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [tokens, setTokens] = useState<AuthTokens | null>(() => loadAuthTokens());
  const [user, setUser] = useState<AuthenticatedUser | null>(() => readStoredUser());
  const [isLoading, setIsLoading] = useState<boolean>(!!loadAuthTokens());
  const fetchingRef = useRef<Promise<AuthenticatedUser | null> | null>(null);

  const fetchUser = useCallback(async (accessToken: string) => {
    try {
      const authUser = await authService.fetchCurrentUser(accessToken);
      const latestRole = authUser.role ?? parseJwtRole(accessToken);
      let nextUser: AuthenticatedUser = { ...authUser, role: latestRole };
      try {
        nextUser = { ...await authService.fetchCurrentProfile(accessToken), role: latestRole };
      } catch (profileError) {
        console.warn("获取完整个人资料失败，已保留认证域用户信息", profileError);
      }
      setUser(nextUser);
      persistUser(nextUser);
      return nextUser;
    } catch (error) {
      console.error("获取当前用户信息失败", error);
      setUser(null);
      setTokens(null);
      clearAuthSession();
      persistUser(null);
      return null;
    }
  }, []);

  const login = useCallback(async (payload: LoginRequest) => {
    const response = await authService.login(payload);
    const nextTokens = toTokens(response.tokens);
    setTokens(nextTokens);
    persistAuthTokens(nextTokens);
    await fetchUser(nextTokens.accessToken);
  }, [fetchUser]);

  const register = useCallback(async (payload: RegisterRequest) => {
    await authService.register(payload);
    const loginResponse = await authService.login({
      identifier: payload.phone,
      password: payload.password,
      channel: "H5"
    });
    const nextTokens = toTokens(loginResponse.tokens);
    setTokens(nextTokens);
    persistAuthTokens(nextTokens);
    const currentUser = await fetchUser(nextTokens.accessToken);
    if (!currentUser) {
      throw new Error("Failed to fetch current user");
    }
    return currentUser;
  }, [fetchUser]);

  const logout = useCallback(async () => {
    if (tokens) {
      try {
        await authService.logout({ refreshToken: tokens.refreshToken });
      } catch (error) {
        console.warn("注销请求失败，继续清理本地状态", error);
      }
    }

    setTokens(null);
    setUser(null);
    clearAuthSession();
    persistUser(null);
  }, [tokens]);

  const refresh = useCallback(async () => {
    if (!tokens) {
      return;
    }

    try {
      if (tokens.accessToken && Date.now() < tokens.expiresAt - 5_000) {
        return;
      }
      const result = await authService.refresh(tokens.refreshToken);
      const nextTokens = toTokens(result);
      setTokens(nextTokens);
      persistAuthTokens(nextTokens);
      await fetchUser(nextTokens.accessToken);
    } catch (error) {
      console.error("刷新登录状态失败", error);
      setTokens(null);
      setUser(null);
      clearAuthSession();
      persistUser(null);
    }
  }, [tokens, fetchUser]);

  useEffect(() => {
    if (!tokens) {
      setIsLoading(false);
      return;
    }

    if (!tokens.accessToken) {
      void refresh();
      return;
    }

    if (!fetchingRef.current) {
      const task = fetchUser(tokens.accessToken).finally(() => {
        fetchingRef.current = null;
        setIsLoading(false);
      });
      fetchingRef.current = task;
    }
  }, [tokens, fetchUser, refresh]);

  const reloadUser = useCallback(async () => {
    if (!tokens?.accessToken) return;
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

  useEffect(() => {
    const syncTokensFromStorage = () => {
      const nextTokens = loadAuthTokens();
      setTokens(nextTokens);
      if (!nextTokens) {
        setUser(null);
        persistUser(null);
      }
    };
    window.addEventListener(TOKEN_CHANGED_EVENT, syncTokensFromStorage);
    return () => window.removeEventListener(TOKEN_CHANGED_EVENT, syncTokensFromStorage);
  }, []);

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
