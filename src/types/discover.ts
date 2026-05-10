export type DiscoverEntityType = "post" | "merchant" | "mixed";

export type DiscoverItem = {
  id: string;
  entityType: "post" | "merchant";
  title: string;
  summary: string;
  coverUrl?: string | null;
  address?: string | null;
  tags: string[];
  authorId?: string;
  authorName: string;
  authorAvatar?: string | null;
  lat?: number | null;
  lng?: number | null;
  distance?: number | null;
  publishTime?: string | null;
  likeCount: number;
  favoriteCount: number;
  liked?: boolean;
  faved?: boolean;
  score?: number | null;
};

export type DiscoverResponse = {
  items: DiscoverItem[];
  total: number;
  page: number;
  size: number;
  hasMore: boolean;
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

export type ReverseGeoResult = {
  lat?: number | null;
  lng?: number | null;
  formattedAddress?: string | null;
  province?: string | null;
  city?: string | null;
  district?: string | null;
  township?: string | null;
  street?: string | null;
  adCode?: string | null;
};
