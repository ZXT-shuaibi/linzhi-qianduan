type ApiEnvelope<T> = {
  code: string;
  message: string;
  data: T;
  requestId?: string;
  timestamp?: string;
};

const TOKEN_STORAGE_KEY = "linzhi_auth_tokens";

const getBaseUrl = () => {
  const envBase = import.meta.env.VITE_API_BASE_URL as string | undefined;
  return envBase?.replace(/\/$/, "") ?? "";
};

export type ApiFetchOptions = {
  method?: string;
  headers?: Record<string, string>;
  body?: unknown;
  accessToken?: string | null;
  signal?: AbortSignal;
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

const readStoredAccessToken = (): string | null => {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    const raw = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw) as { accessToken?: string };
    return parsed.accessToken ?? null;
  } catch {
    return null;
  }
};

export async function apiFetch<TResponse>(path: string, options: ApiFetchOptions = {}): Promise<TResponse> {
  const baseUrl = getBaseUrl();
  const { method = "GET", headers = {}, body, accessToken, signal } = options;
  const isFormData = typeof FormData !== "undefined" && body instanceof FormData;

  const mergedHeaders: Record<string, string> = {
    ...(isFormData ? {} : { "Content-Type": "application/json" }),
    ...headers
  };

  const token = accessToken === undefined ? readStoredAccessToken() : accessToken;
  if (token) {
    mergedHeaders.Authorization = `Bearer ${token}`;
  }

  const url = baseUrl ? `${baseUrl}${path}` : path;
  const response = await fetch(url, {
    method,
    headers: mergedHeaders,
    body: isFormData ? (body as FormData) : body !== undefined ? JSON.stringify(body) : undefined,
    signal,
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
    const message = typeof parsedBody === "object" && parsedBody !== null && "message" in parsedBody
      ? String((parsedBody as { message?: unknown }).message ?? `请求失败：${response.status}`)
      : rawText || `请求失败：${response.status}`;
    throw new ApiError(response.status, message, parsedBody);
  }

  if (response.status === 204) {
    return undefined as TResponse;
  }

  if (contentType.includes("application/json") && typeof parsedBody === "object" && parsedBody !== null && "data" in parsedBody) {
    return (parsedBody as ApiEnvelope<TResponse>).data;
  }

  return parsedBody as TResponse;
}
