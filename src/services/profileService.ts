import { apiFetch } from "./apiClient";
import { uploadToPresigned } from "./knowpostService";
import { mapProfileResponse, type ProfileApiPayload } from "@/services/mappers/profileMappers";
import type { ProfileUpdateRequest } from "@/types/profile";

const PROFILE_PREFIX = "/api/v1/profile";
const STORAGE_PREFIX = "/api/v1/storage";

const parseTags = (payload: ProfileUpdateRequest) => {
  if (payload.tags) {
    return payload.tags;
  }

  if (!payload.tagJson) {
    return undefined;
  }

  try {
    const parsed = JSON.parse(payload.tagJson);
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : undefined;
  } catch {
    return undefined;
  }
};

export const profileService = {
  update: async (payload: ProfileUpdateRequest) => {
    const response = await apiFetch<ProfileApiPayload>(`${PROFILE_PREFIX}/me`, {
      method: "PATCH",
      authMode: "required",
      body: {
        nickname: payload.nickname,
        bio: payload.bio,
        gender: payload.gender,
        birthday: payload.birthday || undefined,
        school: payload.school,
        tags: parseTags(payload),
        clearFields: payload.clearFields?.length ? payload.clearFields : undefined
      }
    });
    return mapProfileResponse(response);
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
      authMode: "required",
      body: {
        scene: "profile_avatar",
        filename,
        contentType,
        ext
      }
    });

    await uploadToPresigned(presign.uploadUrl, presign.headers ?? {}, file);

    const response = await apiFetch<ProfileApiPayload>(`${PROFILE_PREFIX}/avatar`, {
      method: "POST",
      authMode: "required",
      body: {
        objectKey: presign.objectKey,
        avatarUrl: presign.publicUrl
      }
    });
    return mapProfileResponse(response);
  },

  me: async () => {
    const response = await apiFetch<ProfileApiPayload>(`${PROFILE_PREFIX}/me`, {
      authMode: "required"
    });
    return mapProfileResponse(response);
  },

  user: async (userId: string, accessToken?: string | null) => {
    const response = await apiFetch<ProfileApiPayload>(`${PROFILE_PREFIX}/users/${userId}`, {
      accessToken: accessToken ?? undefined,
      authMode: "optional"
    });
    return mapProfileResponse(response);
  }
};
