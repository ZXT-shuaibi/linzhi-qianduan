import { apiFetch } from "./apiClient";
import { mapFeedPreview, mapPostDetail } from "@/services/mappers/postMappers";
import type {
  ConfirmContentRequest,
  CounterResponse,
  CreateDraftResponse,
  FavActionResponse,
  FeedResponse,
  LikeActionResponse,
  PostLocation,
  PresignRequest,
  PresignResponse,
  UpdateKnowPostRequest,
  VisibleScope
} from "@/types/knowpost";
import type { RelationStatus, SocialCounters } from "@/types/profile";

const POSTS_PREFIX = "/api/v1/posts";
const STORAGE_PREFIX = "/api/v1/storage";
const INTERACTIONS_PREFIX = "/api/v1/interactions/targets";
const LLM_PREFIX = "/api/v1/llm";

type FeedItemApi = {
  postId: string;
  title: string;
  summary?: string | null;
  coverUrl?: string | null;
  tags?: string[];
  author?: {
    userId?: string | null;
    nickname?: string | null;
    avatar?: string | null;
    socialCounters?: SocialCounters;
    relationStatus?: RelationStatus;
  };
  likeCount?: number | null;
  favoriteCount?: number | null;
  liked?: boolean | null;
  faved?: boolean | null;
  visibility?: VisibleScope | null;
  distanceMeters?: number | null;
  hotScore?: number | null;
  isTop?: boolean | null;
  publishedAt?: string | null;
};

type FeedApiResponse = {
  items?: FeedItemApi[];
  page?: number | {
    page?: number;
    size?: number;
    hasNext?: boolean;
  };
  size?: number;
  hasMore?: boolean;
  cacheLayer?: string;
};

type PostDetailApi = {
  postId: string;
  title: string;
  summary?: string | null;
  contentUrl: string;
  imageUrls?: string[];
  tags?: string[];
  author?: {
    userId?: string | null;
    nickname?: string | null;
    avatar?: string | null;
    socialCounters?: SocialCounters;
    relationStatus?: RelationStatus;
  };
  likeCount?: number | null;
  favoriteCount?: number | null;
  liked?: boolean | null;
  faved?: boolean | null;
  isTop?: boolean | null;
  visibility?: VisibleScope | null;
  type?: string | null;
  status?: string | null;
  location?: PostLocation | null;
  publishedAt?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

const resolveFeedPage = (response: FeedApiResponse, fallbackPage: number) => {
  if (typeof response.page === "number") return response.page;
  if (response.page && typeof response.page === "object") return response.page.page ?? fallbackPage;
  return fallbackPage;
};

const resolveFeedSize = (response: FeedApiResponse, fallbackSize: number) => {
  if (response.page && typeof response.page === "object") return response.page.size ?? response.size ?? fallbackSize;
  return response.size ?? fallbackSize;
};

const resolveFeedHasMore = (response: FeedApiResponse) => {
  if (typeof response.hasMore === "boolean") return response.hasMore;
  if (response.page && typeof response.page === "object") return response.page.hasNext ?? false;
  return false;
};

const buildFeedResponse = (response: FeedApiResponse, page: number, size: number) => ({
    items: (response.items ?? []).map((item) =>
      mapFeedPreview({
        id: item.postId,
        title: item.title,
        description: item.summary,
        coverImage: item.coverUrl,
        tags: item.tags,
        authorAvatar: item.author?.avatar,
        authorNickname: item.author?.nickname,
        authorId: item.author?.userId,
        authorSocialCounters: item.author?.socialCounters,
        authorRelationStatus: item.author?.relationStatus,
        likeCount: item.likeCount,
        favoriteCount: item.favoriteCount,
        liked: item.liked,
        faved: item.faved,
        visible: item.visibility,
        distanceMeters: item.distanceMeters,
        hotScore: item.hotScore,
        isTop: item.isTop,
        publishedAt: item.publishedAt
      })
    ),
    page: resolveFeedPage(response, page),
    size: resolveFeedSize(response, size),
    hasMore: resolveFeedHasMore(response),
    cacheLayer: response.cacheLayer
  }) satisfies FeedResponse;

export const knowpostService = {
  createDraft: async () => {
    const response = await apiFetch<{ postId: string; status?: string; createdAt?: string }>(`${POSTS_PREFIX}/drafts`, {
      method: "POST"
    });
    return {
      id: response.postId,
      status: response.status,
      createdAt: response.createdAt
    } satisfies CreateDraftResponse;
  },

  presign: async (payload: PresignRequest) => {
    const response = await apiFetch<{
      objectKey: string;
      uploadUrl: string;
      publicUrl?: string;
      headers?: Record<string, string>;
      expireAt?: string;
    }>(`${STORAGE_PREFIX}/presign`, {
      method: "POST",
      body: {
        scene: payload.scene,
        postId: payload.postId,
        filename: payload.filename,
        contentType: payload.contentType,
        ext: payload.ext
      }
    });
    return {
      objectKey: response.objectKey,
      putUrl: response.uploadUrl,
      publicUrl: response.publicUrl,
      headers: response.headers ?? {},
      expireAt: response.expireAt
    } satisfies PresignResponse;
  },

  confirmContent: (id: string, payload: ConfirmContentRequest) =>
    apiFetch<void>(`${POSTS_PREFIX}/${id}/content/confirm`, { method: "POST", body: payload }),

  update: (id: string, payload: UpdateKnowPostRequest) =>
    apiFetch<void>(`${POSTS_PREFIX}/${id}`, {
      method: "PATCH",
      body: {
        title: payload.title,
        summary: payload.summary ?? payload.description,
        tags: payload.tags,
        imageUrls: payload.imageUrls ?? payload.imgUrls,
        visibility: payload.visible,
        isTop: payload.isTop,
        location: payload.location
      }
    }),

  publish: (id: string) =>
    apiFetch<void>(`${POSTS_PREFIX}/${id}/publish`, { method: "POST" }),

  setTop: (id: string, isTop: boolean, accessToken: string) =>
    apiFetch<void>(`${POSTS_PREFIX}/${id}/top?isTop=${isTop}`, {
      method: "PATCH",
      accessToken
    }),

  setVisibility: (id: string, visible: VisibleScope, accessToken: string) =>
    apiFetch<void>(`${POSTS_PREFIX}/${id}/visibility?visibility=${visible}`, {
      method: "PATCH",
      accessToken
    }),

  remove: (id: string, accessToken: string) =>
    apiFetch<void>(`${POSTS_PREFIX}/${id}`, {
      method: "DELETE",
      accessToken
    }),

  feed: async (page = 1, size = 20) => {
    const response = await apiFetch<FeedApiResponse>(`${POSTS_PREFIX}/feed?page=${page}&size=${size}`);
    return buildFeedResponse(response, page, size);
  },

  homeFeed: async (page = 1, size = 20, params?: { lat?: number; lng?: number; geoHash?: string }) => {
    const usp = new URLSearchParams({
      page: String(page),
      size: String(size)
    });
    if (typeof params?.lat === "number") usp.set("lat", String(params.lat));
    if (typeof params?.lng === "number") usp.set("lng", String(params.lng));
    if (params?.geoHash) usp.set("geoHash", params.geoHash);

    const response = await apiFetch<FeedApiResponse>(`/api/v1/feed/home?${usp.toString()}`);
    return buildFeedResponse(response, page, size);
  },

  mine: async (page = 1, size = 20, accessToken: string) => {
    const response = await apiFetch<FeedApiResponse>(`${POSTS_PREFIX}/mine?page=${page}&size=${size}`, {
      accessToken
    });
    return buildFeedResponse(response, page, size);
  },

  userPosts: async (userId: string, page = 1, size = 20, accessToken?: string | null) => {
    const response = await apiFetch<FeedApiResponse>(`/api/v1/profile/users/${userId}/posts?page=${page}&size=${size}`, {
      accessToken: accessToken ?? null
    });
    return buildFeedResponse(response, page, size);
  },

  detail: async (id: string, accessToken?: string) => {
    const response = await apiFetch<PostDetailApi>(`${POSTS_PREFIX}/${id}`, {
      accessToken: accessToken ?? null
    });
    return mapPostDetail({
      id: response.postId,
      title: response.title,
      description: response.summary,
      contentUrl: response.contentUrl,
      images: response.imageUrls ?? [],
      tags: response.tags,
      authorAvatar: response.author?.avatar,
      authorNickname: response.author?.nickname,
      authorId: response.author?.userId,
      authorSocialCounters: response.author?.socialCounters,
      authorRelationStatus: response.author?.relationStatus,
      likeCount: response.likeCount,
      favoriteCount: response.favoriteCount,
      liked: response.liked,
      faved: response.faved,
      isTop: response.isTop,
      visible: response.visibility,
      type: response.type,
      status: response.status,
      location: response.location,
      publishedAt: response.publishedAt,
      createdAt: response.createdAt,
      updatedAt: response.updatedAt
    });
  },

  suggestDescription: (content: string, accessToken: string) =>
    apiFetch<{ model: string; description: string }>(`${LLM_PREFIX}/posts/description`, {
      method: "POST",
      body: { content },
      accessToken
    }),

  like: async (entityId: string, accessToken: string, entityType = "post") => {
    const response = await apiFetch<{ active?: boolean }>(`${INTERACTIONS_PREFIX}/${entityType}/${entityId}/like`, {
      method: "POST",
      accessToken
    });
    return {
      changed: true,
      liked: response.active ?? true
    } satisfies LikeActionResponse;
  },

  unlike: async (entityId: string, accessToken: string, entityType = "post") => {
    const response = await apiFetch<{ active?: boolean }>(`${INTERACTIONS_PREFIX}/${entityType}/${entityId}/like`, {
      method: "DELETE",
      accessToken
    });
    return {
      changed: true,
      liked: response.active ?? false
    } satisfies LikeActionResponse;
  },

  fav: async (entityId: string, accessToken: string, entityType = "post") => {
    const response = await apiFetch<{ active?: boolean }>(`${INTERACTIONS_PREFIX}/${entityType}/${entityId}/favorite`, {
      method: "POST",
      accessToken
    });
    return {
      changed: true,
      faved: response.active ?? true
    } satisfies FavActionResponse;
  },

  unfav: async (entityId: string, accessToken: string, entityType = "post") => {
    const response = await apiFetch<{ active?: boolean }>(`${INTERACTIONS_PREFIX}/${entityType}/${entityId}/favorite`, {
      method: "DELETE",
      accessToken
    });
    return {
      changed: true,
      faved: response.active ?? false
    } satisfies FavActionResponse;
  },

  counters: async (entityId: string, accessToken: string, entityType = "post") => {
    const response = await apiFetch<{
      likeCount?: number;
      favoriteCount?: number;
      viewerLiked?: boolean;
      viewerFavorited?: boolean;
    }>(`${INTERACTIONS_PREFIX}/${entityType}/${entityId}/summary`, {
      accessToken
    });
    return {
      entityType,
      entityId,
      counts: {
        like: response.likeCount ?? 0,
        fav: response.favoriteCount ?? 0
      },
      liked: response.viewerLiked,
      faved: response.viewerFavorited
    } satisfies CounterResponse;
  },

  countersBatch: async (entityType: string, entityIds: string[], accessToken?: string | null) => {
    if (!entityIds.length) {
      return {} satisfies Record<string, CounterResponse>;
    }

    const usp = new URLSearchParams({
      targetIds: entityIds.join(",")
    });
    const response = await apiFetch<Record<string, {
      targetType?: string;
      targetId?: string;
      likeCount?: number;
      favoriteCount?: number;
      viewerLiked?: boolean;
      viewerFavorited?: boolean;
    }>>(`${INTERACTIONS_PREFIX}/${entityType}/summary-batch?${usp.toString()}`, {
      accessToken: accessToken ?? null
    });

    return Object.fromEntries(
      Object.entries(response ?? {}).map(([id, item]) => [
        id,
        {
          entityType: item.targetType ?? entityType,
          entityId: item.targetId ?? id,
          counts: {
            like: item.likeCount ?? 0,
            fav: item.favoriteCount ?? 0
          },
          liked: item.viewerLiked,
          faved: item.viewerFavorited
        } satisfies CounterResponse
      ])
    );
  }
};

export async function uploadToPresigned(putUrl: string, headers: Record<string, string>, file: File) {
  const response = await fetch(putUrl, {
    method: "PUT",
    headers,
    body: file,
    credentials: "omit"
  });
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(text || `上传失败：${response.status}`);
  }
  const etag = response.headers.get("ETag") || response.headers.get("etag") || "";
  return { etag };
}

export async function computeSha256(file: File) {
  const buffer = await file.arrayBuffer();
  const digest = await crypto.subtle.digest("SHA-256", buffer);
  return Array.from(new Uint8Array(digest))
    .map((value) => value.toString(16).padStart(2, "0"))
    .join("");
}
