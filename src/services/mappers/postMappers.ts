import type { FeedItem, KnowpostDetailResponse, VisibleScope } from "@/types/knowpost";

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
  likeCount?: number | null;
  favoriteCount?: number | null;
  liked?: boolean | null;
  faved?: boolean | null;
  isTop?: boolean | null;
  publishedAt?: string | null;
};

type PostDetailSource = PostPreviewSource & {
  contentUrl: string;
  images?: string[];
  visible?: VisibleScope | null;
  type?: string | null;
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
  authorId: source.authorId ? Number(source.authorId) : undefined,
  likeCount: source.likeCount ?? 0,
  favoriteCount: source.favoriteCount ?? 0,
  liked: source.liked ?? false,
  faved: source.faved ?? false,
  isTop: source.isTop ?? false,
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
  authorId: source.authorId ? Number(source.authorId) : undefined,
  authorTagJson: source.tagJson ?? undefined,
  likeCount: source.likeCount ?? 0,
  favoriteCount: source.favoriteCount ?? 0,
  liked: source.liked ?? false,
  faved: source.faved ?? false,
  isTop: source.isTop ?? false,
  visible: source.visible ?? "public",
  type: source.type ?? "post",
  publishTime: source.publishedAt ?? undefined
});
