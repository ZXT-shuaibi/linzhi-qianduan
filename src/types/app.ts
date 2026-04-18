export type AuthPayload = {
  phone: string;
  password?: string;
  code?: string;
};

export type RegisterPayload = {
  phone: string;
  code: string;
  password: string;
  confirmPassword: string;
};

export type CommentItem = {
  id: string;
  author: string;
  avatar: string;
  content: string;
  time: string;
};

export type FeedPost = {
  id: string;
  title: string;
  summary: string;
  content: string;
  category: string;
  categoryTone: "orange" | "green" | "blue";
  author: string;
  avatar: string;
  authorBadge: string;
  time: string;
  location: string;
  image?: string;
  likes: number;
  favorites: number;
  comments: CommentItem[];
  liked?: boolean;
  favorited?: boolean;
};

export type Coupon = {
  id: string;
  title: string;
  amount: number;
  hint: string;
  tone: "red" | "green";
  claimed?: boolean;
};

export type MarketItem = {
  id: string;
  title: string;
  description: string;
  price: number;
  originalPrice: number;
  seller: string;
  distance: string;
  image: string;
  tag: string;
};

export type TopicOption = {
  id: string;
  label: string;
};

export type FollowingUser = {
  id: string;
  name: string;
  avatar: string;
  bio: string;
  badge: string;
};

export type ProfileDraft = {
  name: string;
  badge: string;
  bio: string;
  neighborhood: string;
  hobbies: string;
};

export type ProfileBundle = {
  coverImage: string;
  avatarLabel: string;
  stats: {
    posts: number;
    saved: number;
    likesAndFavorites: number;
  };
  draft: ProfileDraft;
  myPosts: FeedPost[];
  myCollections: FeedPost[];
  myLikes: FeedPost[];
  following: FollowingUser[];
};
