import {
  clearAuthSession,
  loadAuthTokens,
  persistAuthTokens,
  TOKEN_STORAGE_KEY
} from "./authSession.js";

type StorageMap = Record<string, string>;

class MemoryStorage {
  private readonly values: StorageMap = {};

  getItem(key: string) {
    return Object.prototype.hasOwnProperty.call(this.values, key) ? this.values[key] : null;
  }

  setItem(key: string, value: string) {
    this.values[key] = value;
  }

  removeItem(key: string) {
    delete this.values[key];
  }

  clear() {
    for (const key of Object.keys(this.values)) {
      delete this.values[key];
    }
  }
}

const installWindow = () => {
  const localStorage = new MemoryStorage();
  const sessionStorage = new MemoryStorage();
  (globalThis as unknown as { window: unknown }).window = {
    localStorage,
    sessionStorage,
    dispatchEvent: () => true,
    Event
  };
  return { localStorage, sessionStorage };
};

const tokens = {
  accessToken: "access-token",
  refreshToken: "refresh-token",
  expiresAt: Date.now() + 60_000
};

const assertEqual = (actual: unknown, expected: unknown) => {
  if (actual !== expected) {
    throw new Error(`Expected ${String(expected)}, got ${String(actual)}`);
  }
};

const assertDeepEqual = (actual: unknown, expected: unknown) => {
  const actualJson = JSON.stringify(actual);
  const expectedJson = JSON.stringify(expected);
  if (actualJson !== expectedJson) {
    throw new Error(`Expected ${expectedJson}, got ${actualJson}`);
  }
};

const shouldKeepAccessTokenOutOfBrowserStorage = () => {
  const { localStorage, sessionStorage } = installWindow();
  clearAuthSession();

  persistAuthTokens(tokens);

  assertEqual(localStorage.getItem(TOKEN_STORAGE_KEY), null);
  assertEqual(sessionStorage.getItem(TOKEN_STORAGE_KEY)?.includes("access-token"), false);
  assertDeepEqual(loadAuthTokens(), tokens);
};

const shouldMigrateAndDeleteLegacyLocalStorageTokens = () => {
  const { localStorage, sessionStorage } = installWindow();
  clearAuthSession();
  localStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(tokens));

  assertDeepEqual(loadAuthTokens(), tokens);

  assertEqual(localStorage.getItem(TOKEN_STORAGE_KEY), null);
  assertEqual(sessionStorage.getItem(TOKEN_STORAGE_KEY)?.includes("access-token"), false);
};

const shouldClearAllTokenStorage = () => {
  const { localStorage, sessionStorage } = installWindow();
  clearAuthSession();
  persistAuthTokens(tokens);

  clearAuthSession();

  assertEqual(loadAuthTokens(), null);
  assertEqual(localStorage.getItem(TOKEN_STORAGE_KEY), null);
  assertEqual(sessionStorage.getItem(TOKEN_STORAGE_KEY), null);
};

shouldKeepAccessTokenOutOfBrowserStorage();
shouldMigrateAndDeleteLegacyLocalStorageTokens();
shouldClearAllTokenStorage();
