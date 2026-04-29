export type DiscoverEntityType = "post" | "merchant" | "mixed";

export type DiscoverItem = {
  id: string;
  entityType: "post" | "merchant";
  title: string;
  summary: string;
  coverUrl?: string | null;
  address?: string | null;
  tags: string[];
  authorId?: number;
  authorName: string;
  authorAvatar?: string | null;
  lat?: number | null;
  lng?: number | null;
  distance?: number | null;
  publishTime?: string | null;
  likeCount: number;
  favoriteCount: number;
  score?: number | null;
};

export type DiscoverResponse = {
  items: DiscoverItem[];
  total: number;
  page: number;
  size: number;
};

export type DiscoverQuery = {
  lat: number;
  lng: number;
  radius?: number;
  page?: number;
  size?: number;
  entityType?: DiscoverEntityType;
  tag?: string;
};
