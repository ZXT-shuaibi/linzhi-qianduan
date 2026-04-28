import { apiFetch } from "./apiClient";
import type { FollowActionResponse, RelationCountersResponse, RelationStatusResponse } from "@/types/relation";
import type { ProfileListResponse, ProfileResponse } from "@/types/profile";

const FOLLOWS_PREFIX = "/api/v1/follows";
const PROFILE_PREFIX = "/api/v1/profile";
const SOCIAL_PREFIX = "/api/v1/social";

type FollowListApiItem = {
  userId: string;
  nickname: string;
  avatar?: string | null;
  bio?: string | null;
  tags?: string[];
  socialCounters?: ProfileResponse["socialCounters"];
  relationStatus?: ProfileResponse["relationStatus"];
  self?: boolean;
};

const mapProfileItem = (item: FollowListApiItem): ProfileResponse => ({
  id: Number(item.userId),
  userId: item.userId,
  nickname: item.nickname,
  avatar: item.avatar ?? null,
  bio: item.bio ?? null,
  tags: item.tags ?? [],
  skills: item.tags ?? [],
  tagJson: JSON.stringify(item.tags ?? []),
  socialCounters: item.socialCounters,
  relationStatus: item.relationStatus,
  self: item.self ?? false
});

export const relationService = {
  follow: async (toUserId: number, accessToken: string) => {
    const result = await apiFetch<{
      action?: string;
      active?: boolean;
      followeeId?: string;
    }>(`${FOLLOWS_PREFIX}/${toUserId}`, {
      method: "POST",
      accessToken
    });
    return {
      active: result.active ?? true,
      action: result.action ?? "follow",
      targetUserId: result.followeeId
    } satisfies FollowActionResponse;
  },

  unfollow: async (toUserId: number, accessToken: string) => {
    const result = await apiFetch<{
      action?: string;
      active?: boolean;
      followeeId?: string;
    }>(`${FOLLOWS_PREFIX}/${toUserId}`, {
      method: "DELETE",
      accessToken
    });
    return {
      active: result.active ?? false,
      action: result.action ?? "unfollow",
      targetUserId: result.followeeId
    } satisfies FollowActionResponse;
  },

  status: (toUserId: number, accessToken: string) =>
    apiFetch<RelationStatusResponse>(`${FOLLOWS_PREFIX}/status?followeeId=${toUserId}`, {
      accessToken
    }),

  following: async (userId: number, size = 20, page = 1, _cursor?: number, accessToken?: string) => {
    const response = await apiFetch<ProfileListResponse>(`${PROFILE_PREFIX}/users/${userId}/following?page=${page}&size=${size}`, {
      accessToken: accessToken ?? null
    });
    return (response.items ?? []).map(mapProfileItem);
  },

  followers: async (userId: number, size = 20, page = 1, _cursor?: number, accessToken?: string) => {
    const response = await apiFetch<ProfileListResponse>(`${PROFILE_PREFIX}/users/${userId}/followers?page=${page}&size=${size}`, {
      accessToken: accessToken ?? null
    });
    return (response.items ?? []).map(mapProfileItem);
  },

  counters: (userId: number, accessToken: string) =>
    apiFetch<RelationCountersResponse>(`${SOCIAL_PREFIX}/counters/users/${userId}`, {
      accessToken
    })
};
