import { apiFetch } from "./apiClient";
import { mapFeedPreview } from "@/services/mappers/postMappers";
import type { SearchResponse, SuggestResponse } from "@/types/search";

type SearchApiItem = {
  postId: string;
  title: string;
  summary?: string | null;
  coverUrl?: string | null;
  tags?: string[];
  authorId?: string | null;
  authorNickname?: string | null;
  authorAvatar?: string | null;
  authorTagJson?: string | null;
  likeCount?: number | null;
  favoriteCount?: number | null;
  liked?: boolean | null;
  faved?: boolean | null;
  isTop?: boolean | null;
  publishedAt?: string | null;
};

type SearchApiResponse = {
  items?: SearchApiItem[];
  page?: {
    page: number;
    size: number;
    hasMore: boolean;
    nextAfter?: string | null;
  };
};

const SEARCH_PREFIX = "/api/v1/search";

export const searchService = {
  query: async (params: { q: string; page?: number; size?: number; tag?: string; tags?: string; after?: string | null }) => {
    const { q, page = 1, size = 20, tag, tags, after } = params;
    const usp = new URLSearchParams();
    usp.set("q", q);
    usp.set("page", String(page));
    usp.set("size", String(size));

    const nextTag = tag ?? tags;
    if (nextTag) {
      usp.set("tag", nextTag);
    }
    if (after) {
      usp.set("searchAfter", after);
    }

    const response = await apiFetch<SearchApiResponse>(`${SEARCH_PREFIX}/posts?${usp.toString()}`);
    return {
      items: (response.items ?? []).map((item) =>
        mapFeedPreview({
          id: item.postId,
          title: item.title,
          description: item.summary,
          coverImage: item.coverUrl,
          tags: item.tags,
          tagJson: item.authorTagJson ?? undefined,
          authorAvatar: item.authorAvatar,
          authorNickname: item.authorNickname,
          authorId: item.authorId,
          likeCount: item.likeCount,
          favoriteCount: item.favoriteCount,
          liked: item.liked,
          faved: item.faved,
          isTop: item.isTop,
          publishedAt: item.publishedAt
        })
      ),
      page: response.page?.page ?? page,
      size: response.page?.size ?? size,
      nextAfter: response.page?.nextAfter ?? null,
      hasMore: response.page?.hasMore ?? false
    } satisfies SearchResponse;
  },

  suggest: async (q: string, size = 10) => {
    const usp = new URLSearchParams();
    usp.set("q", q);
    usp.set("size", String(size));

    const response = await apiFetch<{ items?: Array<{ text?: string | null }> }>(`${SEARCH_PREFIX}/suggest?${usp.toString()}`);
    return {
      items: (response.items ?? [])
        .map((item) => item.text?.trim() ?? "")
        .filter(Boolean)
    } satisfies SuggestResponse;
  }
};
