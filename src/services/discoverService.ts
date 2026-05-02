import { apiFetch } from "./apiClient";
import type { DiscoverItem, DiscoverQuery, DiscoverResponse, ReverseGeoResult } from "@/types/discover";

type DiscoverItemApi = {
  id: string;
  entityType?: "post" | "merchant";
  type?: "post" | "merchant";
  title: string;
  summary?: string | null;
  coverUrl?: string | null;
  address?: string | null;
  tags?: string[];
  authorId?: string | null;
  authorName?: string | null;
  authorAvatar?: string | null;
  lat?: number | null;
  lng?: number | null;
  distance?: number | null;
  publishTime?: number | string | null;
  likeCount?: number | null;
  favoriteCount?: number | null;
  score?: number | null;
};

type DiscoverApiResponse = {
  items?: DiscoverItemApi[];
  total?: number;
  page?: number;
  size?: number;
};

const DISCOVER_PREFIX = "/api/v1/discover";

const mapDiscoverItem = (item: DiscoverItemApi): DiscoverItem => ({
  id: item.id,
  entityType: item.entityType ?? item.type ?? "post",
  title: item.title,
  summary: item.summary ?? "",
  coverUrl: item.coverUrl ?? null,
  address: item.address ?? null,
  tags: item.tags ?? [],
  authorId: item.authorId ?? undefined,
  authorName: item.authorName ?? "社区用户",
  authorAvatar: item.authorAvatar ?? null,
  lat: item.lat ?? null,
  lng: item.lng ?? null,
  distance: item.distance ?? null,
  publishTime: item.publishTime == null ? null : String(item.publishTime),
  likeCount: item.likeCount ?? 0,
  favoriteCount: item.favoriteCount ?? 0,
  score: item.score ?? null
});

export const discoverService = {
  nearby: async ({
    lat,
    lng,
    radius = 3000,
    page = 1,
    size = 20,
    entityType = "mixed",
    tag
  }: DiscoverQuery) => {
    const usp = new URLSearchParams({
      lat: String(lat),
      lng: String(lng),
      radius: String(radius),
      page: String(page),
      size: String(size),
      entityType
    });
    if (tag) {
      usp.set("tag", tag);
    }
    const response = await apiFetch<DiscoverApiResponse>(`${DISCOVER_PREFIX}/nearby?${usp.toString()}`);
    const total = response.total ?? 0;
    const currentPage = response.page ?? page;
    const pageSize = response.size ?? size;
    return {
      items: (response.items ?? []).map(mapDiscoverItem),
      total,
      page: currentPage,
      size: pageSize,
      hasMore: currentPage * pageSize < total
    } satisfies DiscoverResponse;
  },

  reverseGeocode: async (lat: number, lng: number) => {
    const usp = new URLSearchParams({
      lat: String(lat),
      lng: String(lng)
    });
    return apiFetch<ReverseGeoResult | null>(`${DISCOVER_PREFIX}/map/reverse-geocode?${usp.toString()}`);
  }
};
