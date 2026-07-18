export const TOKEN_STORAGE_KEY = "linzhi_auth_tokens";
export const USER_STORAGE_KEY = "linzhi_current_user";
export const TOKEN_CHANGED_EVENT = "linzhi_auth_tokens_changed";

export type StoredAuthTokens = {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
};

type PersistedRefreshSession = {
  refreshToken: string;
  expiresAt: number;
};

let memoryTokens: StoredAuthTokens | null = null;

const hasWindow = () => typeof window !== "undefined";

const parseStoredTokens = (raw: string | null): StoredAuthTokens | null => {
  if (!raw) {
    return null;
  }
  try {
    const parsed = JSON.parse(raw) as Partial<StoredAuthTokens>;
    if (!parsed.accessToken || !parsed.refreshToken || !parsed.expiresAt) {
      return null;
    }
    return {
      accessToken: parsed.accessToken,
      refreshToken: parsed.refreshToken,
      expiresAt: parsed.expiresAt
    };
  } catch {
    return null;
  }
};

const parseStoredRefreshSession = (raw: string | null): PersistedRefreshSession | null => {
  if (!raw) {
    return null;
  }
  try {
    const parsed = JSON.parse(raw) as Partial<PersistedRefreshSession>;
    if (!parsed.refreshToken || !parsed.expiresAt) {
      return null;
    }
    return {
      refreshToken: parsed.refreshToken,
      expiresAt: parsed.expiresAt
    };
  } catch {
    return null;
  }
};

const notifyTokenChanged = () => {
  if (hasWindow()) {
    window.dispatchEvent(new Event(TOKEN_CHANGED_EVENT));
  }
};

export const loadAuthTokens = (): StoredAuthTokens | null => {
  if (!hasWindow()) {
    return memoryTokens;
  }

  if (memoryTokens) {
    return memoryTokens;
  }

  const legacyTokens = parseStoredTokens(window.localStorage.getItem(TOKEN_STORAGE_KEY));
  if (legacyTokens) {
    persistAuthTokens(legacyTokens);
    return legacyTokens;
  }

  const storedRefresh = parseStoredRefreshSession(window.sessionStorage.getItem(TOKEN_STORAGE_KEY));
  if (!storedRefresh) {
    return null;
  }
  memoryTokens = {
    accessToken: "",
    refreshToken: storedRefresh.refreshToken,
    expiresAt: 0
  };
  return memoryTokens;
};

export const persistAuthTokens = (tokens: StoredAuthTokens | null) => {
  memoryTokens = tokens;
  if (!hasWindow()) {
    return;
  }

  window.localStorage.removeItem(TOKEN_STORAGE_KEY);
  if (!tokens) {
    window.sessionStorage.removeItem(TOKEN_STORAGE_KEY);
    notifyTokenChanged();
    return;
  }

  const refreshSession: PersistedRefreshSession = {
    refreshToken: tokens.refreshToken,
    expiresAt: tokens.expiresAt
  };
  window.sessionStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(refreshSession));
  notifyTokenChanged();
};

export const clearAuthSession = () => {
  memoryTokens = null;
  if (!hasWindow()) {
    return;
  }
  window.localStorage.removeItem(TOKEN_STORAGE_KEY);
  window.sessionStorage.removeItem(TOKEN_STORAGE_KEY);
  window.localStorage.removeItem(USER_STORAGE_KEY);
  notifyTokenChanged();
};
