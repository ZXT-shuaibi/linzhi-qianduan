import { apiFetch } from "./apiClient";
import { mapProfileResponse, type ProfileApiPayload } from "@/services/mappers/profileMappers";
import type { FollowActionResponse, RelationCountersResponse, RelationStatusResponse } from "@/types/relation";
import type { ProfileListResponse, ProfileResponse } from "@/types/profile";

const FOLLOWS_PREFIX = "/api/v1/follows";
const PROFILE_PREFIX = "/api/v1/profile";
const SOCIAL_PREFIX = "/api/v1/social";

type FollowListResponse = Omit<ProfileListResponse, "items"> & {
  items?: ProfileApiPayload[];
};

type MappedFollowListResponse = {
  items: ProfileResponse[];
  page: number;
  size: number;
  hasMore: boolean;
};

const mapFollowListResponse = (response: FollowListResponse, page: number, size: number): MappedFollowListResponse => ({
  items: (response.items ?? []).map(mapProfileResponse),
  page: response.page?.page ?? page,
  size: response.page?.size ?? size,
  hasMore: response.page?.hasNext ?? false
});

export const relationService = {
  follow: async (toUserId: string, accessToken: string) => {
    const result = await apiFetch<{
      action?: string;
      following?: boolean;
      followeeId?: string;
      followerCount?: number;
      followCount?: number;
    }>(`${FOLLOWS_PREFIX}/${toUserId}`, {
      method: "POST",
      accessToken
    });

    return {
      following: result.following ?? true,
      action: result.action ?? "follow",
      targetUserId: result.followeeId,
      followerCount: result.followerCount,
      followCount: result.followCount
    } satisfies FollowActionResponse;
  },

  unfollow: async (toUserId: string, accessToken: string) => {
    const result = await apiFetch<{
      action?: string;
      following?: boolean;
      followeeId?: string;
      followerCount?: number;
      followCount?: number;
    }>(`${FOLLOWS_PREFIX}/${toUserId}`, {
      method: "DELETE",
      accessToken
    });

    return {
      following: result.following ?? false,
      action: result.action ?? "unfollow",
      targetUserId: result.followeeId,
      followerCount: result.followerCount,
      followCount: result.followCount
    } satisfies FollowActionResponse;
  },

  status: (toUserId: string, accessToken: string) =>
    apiFetch<RelationStatusResponse>(`${FOLLOWS_PREFIX}/status?targetUserId=${toUserId}`, {
      accessToken
    }),

  following: async (userId: string, size = 20, page = 1, _cursor?: number, accessToken?: string) => {
    const response = await apiFetch<FollowListResponse>(`${PROFILE_PREFIX}/users/${userId}/following?page=${page}&size=${size}`, {
      accessToken: accessToken ?? null
    });
    return mapFollowListResponse(response, page, size);
  },

  followers: async (userId: string, size = 20, page = 1, _cursor?: number, accessToken?: string) => {
    const response = await apiFetch<FollowListResponse>(`${PROFILE_PREFIX}/users/${userId}/followers?page=${page}&size=${size}`, {
      accessToken: accessToken ?? null
    });
    return mapFollowListResponse(response, page, size);
  },

  counters: (userId: string, accessToken?: string) =>
    apiFetch<RelationCountersResponse>(`${SOCIAL_PREFIX}/counters/users/${userId}`, {
      accessToken: accessToken ?? null
    })
};
