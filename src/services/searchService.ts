import { apiFetch } from "./apiClient";
import type { SearchResponse, SuggestResponse } from "@/types/search";
import type { FeedItem } from "@/types/knowpost";

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
  items: SearchApiItem[];
  page?: {
    page: number;
    size: number;
    hasMore: boolean;
    nextAfter?: string | null;
  };
};

const SEARCH_PREFIX = "/api/v1/search";

const mapSearchItem = (item: SearchApiItem): FeedItem => ({
  id: item.postId,
  title: item.title,
  description: item.summary ?? "",
  coverImage: item.coverUrl ?? undefined,
  tags: item.tags ?? [],
  tagJson: item.authorTagJson ?? undefined,
  authorAvatar: item.authorAvatar ?? undefined,
  authorNickname: item.authorNickname ?? "匿名用户",
  authorId: item.authorId ? Number(item.authorId) : undefined,
  likeCount: item.likeCount ?? 0,
  favoriteCount: item.favoriteCount ?? 0,
  liked: item.liked ?? false,
  faved: item.faved ?? false,
  isTop: item.isTop ?? false,
  publishedAt: item.publishedAt ?? undefined
});

export const searchService = {
  query: async (params: { q: string; size?: number; tag?: string; tags?: string; after?: string | null }) => {
    const { q, size = 20, tag, tags, after } = params;
    const usp = new URLSearchParams();
    usp.set("q", q);
    usp.set("page", "1");
    usp.set("size", String(size));
    const nextTag = tag ?? tags;
    if (nextTag) usp.set("tag", nextTag);
    if (after) usp.set("searchAfter", after);
    const response = await apiFetch<SearchApiResponse>(`${SEARCH_PREFIX}/posts?${usp.toString()}`);
    return {
      items: (response.items ?? []).map(mapSearchItem),
      nextAfter: response.page?.nextAfter ?? null,
      hasMore: response.page?.hasMore ?? false
    } satisfies SearchResponse;
  },

  suggest: (q: string, size = 10) => {
    const usp = new URLSearchParams();
    usp.set("q", q);
    usp.set("size", String(size));
    return apiFetch<SuggestResponse>(`${SEARCH_PREFIX}/suggest?${usp.toString()}`);
  }
};
