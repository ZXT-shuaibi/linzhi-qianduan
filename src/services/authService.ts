import { apiFetch } from "./apiClient";
import type {
  AuthenticatedUser,
  LoginRequest,
  LoginResponse,
  LogoutRequest,
  RefreshResponse,
  RegisterRequest,
  RegisterResponse,
  SendCodeRequest,
  SendCodeResponse
} from "@/types/auth";
import type { ProfileResponse } from "@/types/profile";

const AUTH_PREFIX = "/api/v1/auth";
const PROFILE_PREFIX = "/api/v1/profile";

const mapProfileToAuthenticatedUser = (profile: ProfileResponse): AuthenticatedUser => ({
  id: Number(profile.userId),
  userId: profile.userId,
  phone: profile.phone ?? null,
  account: profile.account ?? null,
  nickname: profile.nickname,
  avatar: profile.avatar ?? null,
  bio: profile.bio ?? null,
  gender: profile.gender,
  birthday: profile.birthday ?? null,
  school: profile.school ?? null,
  tags: profile.tags ?? [],
  skills: profile.tags ?? [],
  tagJson: JSON.stringify(profile.tags ?? []),
  self: profile.self
});

export const authService = {
  sendCode: (payload: SendCodeRequest) =>
    apiFetch<SendCodeResponse>(`${AUTH_PREFIX}/send-code`, {
      method: "POST",
      body: payload
    }),

  register: (payload: RegisterRequest) =>
    apiFetch<RegisterResponse>(`${AUTH_PREFIX}/register`, {
      method: "POST",
      body: payload
    }),

  login: (payload: LoginRequest) =>
    apiFetch<LoginResponse>(`${AUTH_PREFIX}/login`, {
      method: "POST",
      body: payload
    }),

  logout: (payload: LogoutRequest, accessToken: string) =>
    apiFetch<void>(`${AUTH_PREFIX}/logout`, {
      method: "POST",
      body: payload,
      accessToken
    }),

  fetchCurrentUser: async (accessToken: string) => {
    const profile = await apiFetch<ProfileResponse>(`${PROFILE_PREFIX}/me`, {
      accessToken
    });
    return mapProfileToAuthenticatedUser(profile);
  },

  refresh: (refreshToken: string) =>
    apiFetch<RefreshResponse>(`${AUTH_PREFIX}/token/refresh`, {
      method: "POST",
      body: { refreshToken },
      accessToken: null
    })
};
