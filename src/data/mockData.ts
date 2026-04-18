import type { Coupon, FeedPost, MarketItem, ProfileBundle, TopicOption } from "../types/app";

export const communityMetrics = [
  { label: "今日活跃邻居", value: "2,468" },
  { label: "互助响应率", value: "96%" },
  { label: "本周新帖", value: "314" }
];

export const trendingTopics = [
  "旧物交换",
  "周末羽毛球",
  "小区拼单",
  "遛狗搭子",
  "亲子手作"
];

export const topicOptions: TopicOption[] = [
  { id: "daily", label: "日常分享" },
  { id: "exchange", label: "闲置交易" },
  { id: "help", label: "求助互助" },
  { id: "event", label: "邻里活动" },
  { id: "food", label: "拼单美食" }
];

export const feedPosts: FeedPost[] = [
  {
    id: "post-1",
    title: "今晚 7 点楼下羽毛球，有没有临时搭子？",
    summary: "拍子多带了一副，强度友好，想活动一下的都可以来。",
    content:
      "今晚 7 点楼下羽毛球场临时组局，我多带了一副球拍，完全新手也没关系。打完如果大家有兴趣，还可以一起去门口喝糖水。想来的人评论区喊我就行。",
    category: "邻里活动",
    categoryTone: "orange",
    author: "李建国",
    avatar: "李",
    authorBadge: "热心邻居",
    time: "10 分钟前",
    location: "悦澜庭 3 栋",
    image:
      "https://images.unsplash.com/photo-1526676037777-05a232554f77?auto=format&fit=crop&w=900&q=80",
    likes: 38,
    favorites: 12,
    liked: true,
    favorited: false,
    comments: [
      { id: "c-1", author: "小顾", avatar: "顾", content: "我来，刚好下班回家。", time: "刚刚" },
      { id: "c-2", author: "芳芳", avatar: "芳", content: "我也想参加，带我一个。", time: "2 分钟前" }
    ]
  },
  {
    id: "post-2",
    title: "9 成新空气炸锅转让，今晚可自提",
    summary: "用了两次，厨房台面太小放不下，带原包装。",
    content:
      "空气炸锅是去年双十一买的，功能都正常，带原包装和说明书。优先本小区自提，价格可以小刀，想要的朋友私信我。",
    category: "闲置交易",
    categoryTone: "green",
    author: "周周",
    avatar: "周",
    authorBadge: "旧物整理官",
    time: "28 分钟前",
    location: "悦澜庭 5 栋",
    image:
      "https://images.unsplash.com/photo-1585515656335-9a21502f0c8d?auto=format&fit=crop&w=900&q=80",
    likes: 21,
    favorites: 47,
    liked: false,
    favorited: true,
    comments: [{ id: "c-3", author: "阿飞", avatar: "飞", content: "还在吗？想今晚过去看。", time: "7 分钟前" }]
  },
  {
    id: "post-3",
    title: "小区门口新开的烘焙店，拼 6 个贝果更划算",
    summary: "有香葱芝士和海盐黄油两个口味，我可以负责去取。",
    content:
      "门口新开的烘焙店这两天做活动，买 6 个贝果立减 18 元。我想拼 3 个海盐黄油，如果有人想要其他口味我们可以一起下单，晚上 8 点前统一去取。",
    category: "拼单美食",
    categoryTone: "blue",
    author: "Miya",
    avatar: "M",
    authorBadge: "社区吃货",
    time: "1 小时前",
    location: "南门商业街",
    image:
      "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=900&q=80",
    likes: 52,
    favorites: 30,
    liked: true,
    favorited: true,
    comments: [{ id: "c-4", author: "小陈", avatar: "陈", content: "给我留两个香葱芝士。", time: "19 分钟前" }]
  }
];

export const coupons: Coupon[] = [
  { id: "coupon-1", title: "新邻里成交券", amount: 50, hint: "满 199 可用，48 小时内有效", tone: "red" },
  { id: "coupon-2", title: "本周互助礼金", amount: 10, hint: "满 39 可用，限社区集市", tone: "green" }
];

export const marketItems: MarketItem[] = [
  {
    id: "item-1",
    title: "露营折叠椅两把",
    description: "周末露营后闲置，展开很稳，收纳袋也在。",
    price: 88,
    originalPrice: 138,
    seller: "老徐",
    distance: "步行 5 分钟",
    image:
      "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&w=900&q=80",
    tag: "户外"
  },
  {
    id: "item-2",
    title: "儿童绘本一套",
    description: "适合 4-6 岁，保存很好，已经消毒整理。",
    price: 59,
    originalPrice: 119,
    seller: "糖糖妈妈",
    distance: "同楼栋可送",
    image:
      "https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=900&q=80",
    tag: "亲子"
  },
  {
    id: "item-3",
    title: "咖啡手冲入门套装",
    description: "滤杯、分享壶、电子秤齐全，适合刚入门。",
    price: 126,
    originalPrice: 199,
    seller: "阿哲",
    distance: "北区 2 栋",
    image:
      "https://images.unsplash.com/photo-1511920170033-f8396924c348?auto=format&fit=crop&w=900&q=80",
    tag: "生活方式"
  },
  {
    id: "item-4",
    title: "可升降电脑支架",
    description: "桌面办公神器，成色很好，附赠理线夹。",
    price: 72,
    originalPrice: 129,
    seller: "Nina",
    distance: "地下车库交接",
    image:
      "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=900&q=80",
    tag: "办公"
  }
];

export const profileBundle: ProfileBundle = {
  coverImage:
    "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80",
  avatarLabel: "李",
  stats: {
    posts: 14,
    saved: 27,
    likesAndFavorites: 308
  },
  draft: {
    name: "李建国",
    badge: "IT 邻居",
    bio: "喜欢折腾数码，也喜欢把社区里的好人和好事串起来。周末常驻羽毛球场，欢迎来约球。",
    neighborhood: "悦澜庭 3 栋",
    hobbies: "羽毛球 / 咖啡 / 社区活动"
  },
  myPosts: [feedPosts[0], feedPosts[2]],
  myCollections: [feedPosts[1], feedPosts[2]],
  myLikes: [feedPosts[0]],
  following: [
    { id: "u-1", name: "王大爷", avatar: "王", bio: "小区里最靠谱的修理师傅，热心又细致。", badge: "热心肠榜 1" },
    { id: "u-2", name: "芳芳教练", avatar: "芳", bio: "每天晨练都在花园平台，擅长拉伸和瑜伽。", badge: "运动达人" },
    { id: "u-3", name: "Miya", avatar: "M", bio: "新店情报收集员，拼单速度很快。", badge: "社区吃货" }
  ]
};
