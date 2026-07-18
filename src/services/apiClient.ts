import {
  clearAuthSession,
  loadAuthTokens,
  persistAuthTokens,
  type StoredAuthTokens
} from "./authSession";

type ApiEnvelope<T> = {
  code: string;
  message: string;
  data: T;
  requestId?: string;
  timestamp?: string;
};

const TOKEN_EXPIRY_SKEW_MS = 5_000;
const AUTH_REFRESH_PATH = "/api/v1/auth/token/refresh";

export type AuthMode = "none" | "optional" | "required";

export const getApiBaseUrl = () => {
  const envBase = import.meta.env.VITE_API_BASE_URL as string | undefined;
  return envBase?.replace(/\/$/, "") ?? "";
};

export type ApiFetchOptions = {
  method?: string;
  headers?: Record<string, string>;
  body?: unknown;
  accessToken?: string | null;
  authMode?: AuthMode;
  signal?: AbortSignal;
  keepalive?: boolean;
};

export class ApiError extends Error {
  readonly status: number;
  readonly data: unknown;

  constructor(status: number, message: string, data: unknown) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

type RefreshTokenPayload = {
  accessToken: string;
  accessExpiresAt?: string;
  refreshToken: string;
  refreshExpiresAt?: string;
  tokenType?: string;
};

let refreshPromise: Promise<StoredAuthTokens> | null = null;

const parseInstantToMillis = (value: string | undefined): number => {
  if (!value) {
    return Date.now() + 10 * 60 * 1000;
  }
  const numeric = Number(value);
  if (!Number.isNaN(numeric)) {
    return numeric > 1e12 ? numeric : numeric * 1000;
  }
  const timestamp = Date.parse(value);
  return Number.isNaN(timestamp) ? Date.now() + 10 * 60 * 1000 : timestamp;
};

const readStoredAccessToken = (): string | null => {
  const tokens = loadAuthTokens();
  if (!tokens) {
    return null;
  }
  if (Date.now() >= tokens.expiresAt - TOKEN_EXPIRY_SKEW_MS) {
    return null;
  }
  return tokens.accessToken;
};

const refreshStoredTokens = async (baseUrl: string): Promise<StoredAuthTokens> => {
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    const stored = loadAuthTokens();
    if (!stored?.refreshToken) {
      throw new ApiError(401, "登录已过期，请重新登录", null);
    }

    const response = await fetch(`${baseUrl}${AUTH_REFRESH_PATH}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken: stored.refreshToken }),
      credentials: "include"
    });

    const rawText = await response.text().catch(() => "");
    const contentType = response.headers.get("content-type") ?? "";
    let parsedBody: unknown = rawText;
    if (rawText && contentType.includes("application/json")) {
      try {
        parsedBody = JSON.parse(rawText);
      } catch {
        parsedBody = rawText;
      }
    }

    if (!response.ok) {
      clearAuthSession();
      const message = typeof parsedBody === "object" && parsedBody !== null && "message" in parsedBody
        ? String((parsedBody as { message?: unknown }).message ?? "登录已过期，请重新登录")
        : rawText || "登录已过期，请重新登录";
      throw new ApiError(response.status, message, parsedBody);
    }

    const payload = contentType.includes("application/json")
      && typeof parsedBody === "object"
      && parsedBody !== null
      && "data" in parsedBody
      ? (parsedBody as ApiEnvelope<RefreshTokenPayload>).data
      : parsedBody as RefreshTokenPayload;

    const nextTokens: StoredAuthTokens = {
      accessToken: payload.accessToken,
      refreshToken: payload.refreshToken,
      expiresAt: parseInstantToMillis(payload.accessExpiresAt)
    };
    persistAuthTokens(nextTokens);
    return nextTokens;
  })().finally(() => {
    refreshPromise = null;
  });

  return refreshPromise;
};

export async function getAccessTokenForRequest(
  authMode: AuthMode = "required",
  accessToken?: string | null
): Promise<string | null> {
  if (authMode === "none") {
    return null;
  }
  if (accessToken !== undefined) {
    return accessToken;
  }
  const token = readStoredAccessToken();
  if (token || authMode === "optional") {
    return token;
  }
  return (await refreshStoredTokens(getApiBaseUrl())).accessToken;
}

export async function refreshAccessTokenForRequest(): Promise<string> {
  return (await refreshStoredTokens(getApiBaseUrl())).accessToken;
}

export async function apiFetch<TResponse>(path: string, options: ApiFetchOptions = {}): Promise<TResponse> {
  const baseUrl = getApiBaseUrl();
  const { method = "GET", headers = {}, body, accessToken, authMode = "required", signal, keepalive } = options;
  const isFormData = typeof FormData !== "undefined" && body instanceof FormData;
  const url = baseUrl ? `${baseUrl}${path}` : path;

  const resolveToken = () => {
    if (authMode === "none") {
      return null;
    }
    return accessToken === undefined ? readStoredAccessToken() : accessToken;
  };

  const canUseStoredRefresh = authMode !== "none" && accessToken !== null && path !== AUTH_REFRESH_PATH;
  const send = async (token: string | null) => {
    const mergedHeaders: Record<string, string> = {
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...headers
    };
    if (token) {
      mergedHeaders.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      method,
      headers: mergedHeaders,
      body: isFormData ? (body as FormData) : body !== undefined ? JSON.stringify(body) : undefined,
      signal,
      keepalive,
      credentials: "include"
    });

    const rawText = await response.text().catch(() => "");
    const contentType = response.headers.get("content-type") ?? "";

    let parsedBody: unknown = rawText;
    if (rawText && contentType.includes("application/json")) {
      try {
        parsedBody = JSON.parse(rawText);
      } catch {
        parsedBody = rawText;
      }
    }

    return { response, rawText, contentType, parsedBody };
  };

  let token = resolveToken();
  if (authMode === "required" && canUseStoredRefresh && !token) {
    token = (await refreshStoredTokens(baseUrl)).accessToken;
  }
  let result = await send(token);
  if (authMode === "optional" && token && (result.response.status === 401 || result.response.status === 403)) {
    try {
      const refreshed = await refreshStoredTokens(baseUrl);
      result = await send(refreshed.accessToken);
      if (result.response.status === 401 || result.response.status === 403) {
        result = await send(null);
      }
    } catch {
      result = await send(null);
    }
  }
  if (authMode === "required" && canUseStoredRefresh && result.response.status === 401) {
    try {
      const refreshed = await refreshStoredTokens(baseUrl);
      result = await send(refreshed.accessToken);
    } catch (error) {
      clearAuthSession();
      throw error;
    }
  }

  if (!result.response.ok) {
    const message = typeof result.parsedBody === "object" && result.parsedBody !== null && "message" in result.parsedBody
      ? String((result.parsedBody as { message?: unknown }).message ?? `请求失败：${result.response.status}`)
      : result.rawText || `请求失败：${result.response.status}`;
    throw new ApiError(result.response.status, message, result.parsedBody);
  }

  if (result.response.status === 204) {
    return undefined as TResponse;
  }

  if (result.contentType.includes("application/json") && typeof result.parsedBody === "object" && result.parsedBody !== null && "data" in result.parsedBody) {
    return (result.parsedBody as ApiEnvelope<TResponse>).data;
  }

  return result.parsedBody as TResponse;
}
