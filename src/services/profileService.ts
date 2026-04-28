import { apiFetch } from "./apiClient";
import { computeSha256, uploadToPresigned } from "./knowpostService";
import type { ProfileResponse, ProfileUpdateRequest } from "@/types/profile";

const PROFILE_PREFIX = "/api/v1/profile";
const STORAGE_PREFIX = "/api/v1/storage";

const mapProfile = (profile: {
  userId: string;
  nickname: string;
  avatar?: string | null;
  bio?: string | null;
  account?: string | null;
  phone?: string | null;
  gender?: string | null;
  birthday?: string | null;
  school?: string | null;
  tags?: string[];
  socialCounters?: ProfileResponse["socialCounters"];
  relationStatus?: ProfileResponse["relationStatus"];
  self?: boolean;
}): ProfileResponse => ({
  id: Number(profile.userId),
  userId: profile.userId,
  nickname: profile.nickname,
  avatar: profile.avatar ?? null,
  bio: profile.bio ?? null,
  account: profile.account ?? null,
  phone: profile.phone ?? null,
  gender: profile.gender as ProfileResponse["gender"],
  birthday: profile.birthday ?? null,
  school: profile.school ?? null,
  tags: profile.tags ?? [],
  skills: profile.tags ?? [],
  tagJson: JSON.stringify(profile.tags ?? []),
  socialCounters: profile.socialCounters,
  relationStatus: profile.relationStatus,
  self: profile.self ?? false
});

export const profileService = {
  update: async (payload: ProfileUpdateRequest) => {
    const requestBody = {
      nickname: payload.nickname,
      bio: payload.bio,
      gender: payload.gender,
      birthday: payload.birthday || undefined,
      school: payload.school,
      tags: payload.tags ?? (() => {
        if (!payload.tagJson) return undefined;
        try {
          const parsed = JSON.parse(payload.tagJson);
          return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : undefined;
        } catch {
          return undefined;
        }
      })()
    };
    const response = await apiFetch<Parameters<typeof mapProfile>[0]>(`${PROFILE_PREFIX}/me`, {
      method: "PATCH",
      body: requestBody
    });
    return mapProfile(response);
  },

  uploadAvatar: async (file: File) => {
    const filename = file.name || "avatar.jpg";
    const extMatch = filename.match(/\.[^.]+$/);
    const ext = extMatch ? extMatch[0] : ".jpg";
    const contentType = file.type || "image/jpeg";
    const presign = await apiFetch<{
      objectKey: string;
      uploadUrl: string;
      publicUrl?: string;
      headers?: Record<string, string>;
    }>(`${STORAGE_PREFIX}/presign`, {
      method: "POST",
      body: {
        scene: "profile_avatar",
        filename,
        contentType,
        ext
      }
    });

    await uploadToPresigned(presign.uploadUrl, presign.headers ?? {}, file);
    const response = await apiFetch<Parameters<typeof mapProfile>[0]>(`${PROFILE_PREFIX}/avatar`, {
      method: "POST",
      body: {
        objectKey: presign.objectKey,
        avatarUrl: presign.publicUrl
      }
    });
    return mapProfile(response);
  },

  me: async () => {
    const response = await apiFetch<Parameters<typeof mapProfile>[0]>(`${PROFILE_PREFIX}/me`);
    return mapProfile(response);
  }
};
