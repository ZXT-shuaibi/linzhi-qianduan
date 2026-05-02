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
  hasMore: response.page?.hasMore ?? response.page?.hasNext ?? false
});

export const relationService = {
  follow: async (toUserId: number, accessToken: string) => {
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
      active: result.following ?? result.active ?? true,
      action: result.action ?? "follow",
      targetUserId: result.followeeId
    } satisfies FollowActionResponse;
  },

  unfollow: async (toUserId: number, accessToken: string) => {
    const result = await apiFetch<{
      action?: string;
      active?: boolean;
      following?: boolean;
      followeeId?: string;
    }>(`${FOLLOWS_PREFIX}/${toUserId}`, {
      method: "DELETE",
      accessToken
    });

    return {
      active: result.following ?? result.active ?? false,
      action: result.action ?? "unfollow",
      targetUserId: result.followeeId
    } satisfies FollowActionResponse;
  },

  status: (toUserId: number, accessToken: string) =>
    apiFetch<RelationStatusResponse>(`${FOLLOWS_PREFIX}/status?targetUserId=${toUserId}`, {
      accessToken
    }),

  following: async (userId: number, size = 20, page = 1, _cursor?: number, accessToken?: string) => {
    const response = await apiFetch<FollowListResponse>(`${PROFILE_PREFIX}/users/${userId}/following?page=${page}&size=${size}`, {
      accessToken: accessToken ?? null
    });
    return mapFollowListResponse(response, page, size);
  },

  followers: async (userId: number, size = 20, page = 1, _cursor?: number, accessToken?: string) => {
    const response = await apiFetch<FollowListResponse>(`${PROFILE_PREFIX}/users/${userId}/followers?page=${page}&size=${size}`, {
      accessToken: accessToken ?? null
    });
    return mapFollowListResponse(response, page, size);
  },

  counters: (userId: number, accessToken?: string) =>
    apiFetch<RelationCountersResponse>(`${SOCIAL_PREFIX}/counters/users/${userId}`, {
      accessToken: accessToken ?? null
    })
};
