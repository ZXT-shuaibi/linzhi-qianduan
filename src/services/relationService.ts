import { apiFetch } from "./apiClient";
import { mapProfileResponse, type ProfileApiPayload } from "@/services/mappers/profileMappers";
import type { FollowActionResponse, RelationCountersResponse, RelationStatusResponse } from "@/types/relation";
import type { ProfileListResponse } from "@/types/profile";

const FOLLOWS_PREFIX = "/api/v1/follows";
const PROFILE_PREFIX = "/api/v1/profile";
const SOCIAL_PREFIX = "/api/v1/social";

type FollowListResponse = Omit<ProfileListResponse, "items"> & {
  items?: ProfileApiPayload[];
};

const fetchProfileList = async (path: string, accessToken?: string) => {
  const response = await apiFetch<FollowListResponse>(path, {
    accessToken: accessToken ?? null,
    authMode: "optional"
  });
  return {
    items: (response.items ?? []).map(mapProfileResponse),
    page: response.page
  };
};

export const relationService = {
  follow: async (toUserId: string, accessToken: string) => {
    const result = await apiFetch<{
      action?: string;
      active?: boolean;
      following?: boolean;
      followeeId?: string;
    }>(`${FOLLOWS_PREFIX}/${toUserId}`, {
      method: "POST",
      accessToken
    });

    return {
      following: result.following ?? true,
      action: result.action ?? "follow",
      targetUserId: result.followeeId
    } satisfies FollowActionResponse;
  },

  unfollow: async (toUserId: string, accessToken: string) => {
    const result = await apiFetch<{
      action?: string;
      following?: boolean;
      followeeId?: string;
    }>(`${FOLLOWS_PREFIX}/${toUserId}`, {
      method: "DELETE",
      accessToken
    });

    return {
      following: result.following ?? false,
      action: result.action ?? "unfollow",
      targetUserId: result.followeeId
    } satisfies FollowActionResponse;
  },

  status: (toUserId: string, accessToken: string) =>
    apiFetch<RelationStatusResponse>(`${FOLLOWS_PREFIX}/status?targetUserId=${toUserId}`, {
      accessToken
    }),

  followingPage: (userId: string, size = 20, page = 1, accessToken?: string) =>
    fetchProfileList(`${PROFILE_PREFIX}/users/${userId}/following?page=${page}&size=${size}`, accessToken),

  followersPage: (userId: string, size = 20, page = 1, accessToken?: string) =>
    fetchProfileList(`${PROFILE_PREFIX}/users/${userId}/followers?page=${page}&size=${size}`, accessToken),

  following: async (userId: string, size = 20, page = 1, _cursor?: number, accessToken?: string) =>
    (await relationService.followingPage(userId, size, page, accessToken)).items,

  followers: async (userId: string, size = 20, page = 1, _cursor?: number, accessToken?: string) =>
    (await relationService.followersPage(userId, size, page, accessToken)).items,

  counters: (userId: string) =>
    apiFetch<RelationCountersResponse>(`${SOCIAL_PREFIX}/counters/users/${userId}`, {
      authMode: "none"
    })
};
