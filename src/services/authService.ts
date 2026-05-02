import { apiFetch } from "./apiClient";
import { mapAuthenticatedUser, mapProfileResponse, type ProfileApiPayload } from "@/services/mappers/profileMappers";
import type {
  ActionResult,
  LoginRequest,
  LoginResponse,
  LogoutRequest,
  PasswordResetRequest,
  RefreshResponse,
  RegisterRequest,
  RegisterResponse,
  SendCodeRequest,
  SendCodeResponse
} from "@/types/auth";

const AUTH_PREFIX = "/api/v1/auth";
const PROFILE_PREFIX = "/api/v1/profile";

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

  resetPassword: (payload: PasswordResetRequest) =>
    apiFetch<ActionResult>(`${AUTH_PREFIX}/password/reset`, {
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
    const response = await apiFetch<ProfileApiPayload>(`${PROFILE_PREFIX}/me`, {
      accessToken
    });
    return mapAuthenticatedUser(mapProfileResponse(response));
  },

  refresh: (refreshToken: string) =>
    apiFetch<RefreshResponse>(`${AUTH_PREFIX}/token/refresh`, {
      method: "POST",
      body: { refreshToken },
      accessToken: null
    })
};
