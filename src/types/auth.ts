import type { Gender } from "@/types/profile";

export type VerificationScene = "register" | "login" | "password_reset";

export type SendCodeRequest = {
  identifier: string;
  scene: VerificationScene;
};

export type SendCodeResponse = {
  identifier: string;
  scene: VerificationScene;
  code: string;
  expireSeconds: number;
};

export type RegisterRequest = {
  phone: string;
  account: string;
  password: string;
  nickname: string;
  smsCode: string;
};

export type RegisterResponse = {
  userId: string;
  phone: string;
  account: string;
  nextAction: string;
  status: string;
};

export type LoginRequest = {
  identifier: string;
  password: string;
  channel?: string;
  captchaCode?: string;
};

export type AuthTokens = {
  accessToken: string;
  accessTokenExpiresAt: string;
  refreshToken: string;
  refreshTokenExpiresAt: string;
  tokenType?: string;
};

export type LoginResponse = {
  userId: string;
  tokens: AuthTokens;
};

export type RefreshResponse = AuthTokens;

export type LogoutRequest = {
  refreshToken: string;
  logoutScope?: "current_device" | "all_devices";
};

export type AuthenticatedUser = {
  id: number;
  userId: string;
  phone?: string | null;
  account?: string | null;
  nickname: string;
  avatar?: string | null;
  bio?: string | null;
  gender?: Gender;
  birthday?: string | null;
  school?: string | null;
  tags?: string[];
  skills?: string[];
  tagJson?: string;
  self?: boolean;
};

export type ErrorResponse = {
  code: string;
  message: string;
  errors?: Array<{
    field?: string;
    message?: string;
  }>;
  requestId?: string;
  timestamp?: string;
};
