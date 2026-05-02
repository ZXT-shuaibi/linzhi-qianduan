import type { FeedItem, KnowpostDetailResponse, PostLocation, VisibleScope } from "@/types/knowpost";
import type { RelationStatus, SocialCounters } from "@/types/profile";

type PostPreviewSource = {
  id: string;
  title: string;
  description?: string | null;
  coverImage?: string | null;
  tags?: string[];
  tagJson?: string;
  authorAvatar?: string | null;
  authorNickname?: string | null;
  authorId?: string | null;
  authorSocialCounters?: SocialCounters;
  authorRelationStatus?: RelationStatus;
  likeCount?: number | null;
  favoriteCount?: number | null;
  liked?: boolean | null;
  faved?: boolean | null;
  isTop?: boolean | null;
  distanceMeters?: number | null;
  hotScore?: number | null;
  visible?: VisibleScope | null;
  publishedAt?: string | null;
};

type PostDetailSource = PostPreviewSource & {
  contentUrl: string;
  images?: string[];
  visible?: VisibleScope | null;
  type?: string | null;
  status?: string | null;
  location?: PostLocation | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

export const mapFeedPreview = (source: PostPreviewSource): FeedItem => ({
  id: source.id,
  title: source.title,
  description: source.description ?? "",
  coverImage: source.coverImage ?? undefined,
  tags: source.tags ?? [],
  tagJson: source.tagJson ?? undefined,
  authorAvatar: source.authorAvatar ?? undefined,
  authorAvator: source.authorAvatar ?? undefined,
  authorNickname: source.authorNickname ?? "社区用户",
  authorId: source.authorId ?? undefined,
  authorSocialCounters: source.authorSocialCounters,
  authorRelationStatus: source.authorRelationStatus,
  likeCount: source.likeCount ?? 0,
  favoriteCount: source.favoriteCount ?? 0,
  liked: source.liked ?? false,
  faved: source.faved ?? false,
  isTop: source.isTop ?? false,
  distanceMeters: source.distanceMeters ?? undefined,
  hotScore: source.hotScore ?? undefined,
  visible: source.visible ?? undefined,
  publishedAt: source.publishedAt ?? undefined
});

export const mapPostDetail = (source: PostDetailSource): KnowpostDetailResponse => ({
  id: source.id,
  title: source.title,
  description: source.description ?? "",
  contentUrl: source.contentUrl,
  images: source.images ?? [],
  tags: source.tags ?? [],
  authorAvatar: source.authorAvatar ?? undefined,
  authorNickname: source.authorNickname ?? "社区用户",
  authorId: source.authorId ?? undefined,
  authorTagJson: source.tagJson ?? undefined,
  authorSocialCounters: source.authorSocialCounters,
  authorRelationStatus: source.authorRelationStatus,
  likeCount: source.likeCount ?? 0,
  favoriteCount: source.favoriteCount ?? 0,
  liked: source.liked ?? false,
  faved: source.faved ?? false,
  isTop: source.isTop ?? false,
  visible: source.visible ?? "public",
  type: source.type ?? "post",
  status: source.status ?? undefined,
  location: source.location ?? null,
  publishedAt: source.publishedAt ?? undefined,
  createdAt: source.createdAt ?? undefined,
  updatedAt: source.updatedAt ?? undefined
});
