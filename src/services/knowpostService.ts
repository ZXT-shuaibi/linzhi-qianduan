import { apiFetch } from "./apiClient";
import type {
  ConfirmContentRequest,
  CounterResponse,
  CreateDraftResponse,
  FavActionResponse,
  FeedItem,
  FeedResponse,
  KnowpostDetailResponse,
  LikeActionResponse,
  PresignRequest,
  PresignResponse,
  UpdateKnowPostRequest,
  VisibleScope
} from "@/types/knowpost";

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
    socialCounters?: unknown;
  };
  likeCount?: number | null;
  favoriteCount?: number | null;
  liked?: boolean | null;
  faved?: boolean | null;
  isTop?: boolean | null;
  publishedAt?: string | null;
};

type FeedApiResponse = {
  items: FeedItemApi[];
  page?: {
    page: number;
    size: number;
    hasMore: boolean;
  };
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
    tags?: string[];
  };
  likeCount?: number | null;
  favoriteCount?: number | null;
  liked?: boolean | null;
  faved?: boolean | null;
  isTop?: boolean | null;
  visibility?: VisibleScope | null;
  type?: string | null;
  publishedAt?: string | null;
};

const mapFeedItem = (item: FeedItemApi): FeedItem => ({
  id: item.postId,
  title: item.title,
  description: item.summary ?? "",
  coverImage: item.coverUrl ?? undefined,
  tags: item.tags ?? [],
  tagJson: JSON.stringify(item.author?.tags ?? []),
  authorAvatar: item.author?.avatar ?? undefined,
  authorAvator: item.author?.avatar ?? undefined,
  authorNickname: item.author?.nickname ?? "匿名用户",
  authorId: item.author?.userId ? Number(item.author.userId) : undefined,
  likeCount: item.likeCount ?? 0,
  favoriteCount: item.favoriteCount ?? 0,
  liked: item.liked ?? false,
  faved: item.faved ?? false,
  isTop: item.isTop ?? false,
  publishedAt: item.publishedAt ?? undefined
});

const mapDetail = (item: PostDetailApi): KnowpostDetailResponse => ({
  id: item.postId,
  title: item.title,
  description: item.summary ?? "",
  contentUrl: item.contentUrl,
  images: item.imageUrls ?? [],
  tags: item.tags ?? [],
  authorAvatar: item.author?.avatar ?? undefined,
  authorNickname: item.author?.nickname ?? "匿名用户",
  authorId: item.author?.userId ? Number(item.author.userId) : undefined,
  authorTagJson: JSON.stringify(item.author?.tags ?? []),
  likeCount: item.likeCount ?? 0,
  favoriteCount: item.favoriteCount ?? 0,
  liked: item.liked ?? false,
  faved: item.faved ?? false,
  isTop: item.isTop ?? false,
  visible: item.visibility ?? "public",
  type: item.type ?? "post",
  publishTime: item.publishedAt ?? undefined
});

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
        isTop: payload.isTop
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
    return {
      items: (response.items ?? []).map(mapFeedItem),
      page: response.page?.page ?? page,
      size: response.page?.size ?? size,
      hasMore: response.page?.hasMore ?? false,
      cacheLayer: response.cacheLayer
    } satisfies FeedResponse;
  },

  mine: async (page = 1, size = 20, accessToken: string) => {
    const response = await apiFetch<FeedApiResponse>(`${POSTS_PREFIX}/mine?page=${page}&size=${size}`, {
      accessToken
    });
    return {
      items: (response.items ?? []).map(mapFeedItem),
      page: response.page?.page ?? page,
      size: response.page?.size ?? size,
      hasMore: response.page?.hasMore ?? false
    } satisfies FeedResponse;
  },

  detail: async (id: string, accessToken?: string) => {
    const response = await apiFetch<PostDetailApi>(`${POSTS_PREFIX}/${id}`, {
      accessToken: accessToken ?? null
    });
    return mapDetail(response);
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
      }
    } satisfies CounterResponse;
  }
};

/**
 * 直传到预签名 URL。
 */
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
