export type CreateDraftResponse = {
  id: string;
  status?: string;
  createdAt?: string;
};

export type PresignRequest = {
  scene: "knowpost_content" | "knowpost_image" | "profile_avatar";
  postId?: string;
  filename: string;
  contentType: string;
  ext?: string;
};

export type PresignResponse = {
  objectKey: string;
  putUrl: string;
  publicUrl?: string;
  headers: Record<string, string>;
  expireAt?: string;
};

export type ConfirmContentRequest = {
  objectKey: string;
  etag: string;
  size: number;
  sha256: string;
};

export type VisibleScope = "public" | "followers" | "private";

export type UpdateKnowPostRequest = {
  title?: string;
  tags?: string[];
  imgUrls?: string[];
  imageUrls?: string[];
  visible?: VisibleScope;
  isTop?: boolean;
  description?: string;
  summary?: string;
};

export type FeedItem = {
  id: string;
  title: string;
  description: string;
  coverImage?: string;
  tags: string[];
  tagJson?: string;
  authorAvatar?: string;
  authorAvator?: string;
  authorNickname: string;
  authorId?: number;
  likeCount?: number;
  favoriteCount?: number;
  liked?: boolean;
  faved?: boolean;
  isTop?: boolean;
  visible?: VisibleScope;
  publishedAt?: string;
};

export type FeedResponse = {
  items: FeedItem[];
  page: number;
  size: number;
  hasMore: boolean;
  cacheLayer?: string;
};

export type KnowpostDetailResponse = {
  id: string;
  title: string;
  description: string;
  contentUrl: string;
  images: string[];
  tags: string[];
  authorAvatar?: string;
  authorNickname: string;
  authorId?: number;
  authorTagJson?: string;
  likeCount: number;
  favoriteCount: number;
  liked?: boolean;
  faved?: boolean;
  isTop: boolean;
  visible: VisibleScope;
  type: string;
  publishTime?: string;
};

export type LikeActionResponse = {
  changed: boolean;
  liked: boolean;
};

export type FavActionResponse = {
  changed: boolean;
  faved: boolean;
};

export type CounterResponse = {
  entityType: string;
  entityId: string;
  counts: {
    like: number;
    fav: number;
  };
};
