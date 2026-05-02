export type Gender = "male" | "female" | "other" | "unknown";

export type SocialCounters = {
  userId?: string;
  followings: number;
  followers: number;
  posts: number;
  likedPosts: number;
  favedPosts: number;
};

export type RelationStatus = {
  following: boolean;
  followedBy: boolean;
  mutual: boolean;
};

export type ProfileResponse = {
  id: string;
  userId: string;
  nickname: string;
  avatar?: string | null;
  bio?: string | null;
  account?: string | null;
  phone?: string | null;
  email?: string | null;
  gender?: Gender;
  birthday?: string | null;
  school?: string | null;
  tags?: string[];
  skills?: string[];
  tagJson?: string;
  socialCounters?: SocialCounters;
  relationStatus?: RelationStatus;
  followedAt?: string | null;
  self?: boolean;
};

export type ProfileUpdateRequest = {
  nickname?: string;
  bio?: string;
  gender?: Gender;
  birthday?: string;
  school?: string;
  tags?: string[];
  tagJson?: string;
};

export type ProfileListResponse = {
  items: ProfileResponse[];
  page?: {
    page: number;
    size: number;
    hasNext?: boolean;
    total?: number;
  };
};
