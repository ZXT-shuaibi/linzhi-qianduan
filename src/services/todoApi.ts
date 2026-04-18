import { coupons, feedPosts, marketItems, profileBundle } from "../data/mockData";
import type {
  AuthPayload,
  Coupon,
  FeedPost,
  MarketItem,
  ProfileBundle,
  ProfileDraft,
  RegisterPayload
} from "../types/app";

const wait = (ms = 240) => new Promise((resolve) => window.setTimeout(resolve, ms));

const clone = <T,>(value: T): T => structuredClone(value);

export const todoApi = {
  async login(payload: AuthPayload) {
    await wait();
    // TODO: 对接登录接口，返回 token / 用户资料。
    return {
      ok: Boolean(payload.phone),
      message: "登录流程已预留，当前使用前端假数据演示。"
    };
  },

  async register(payload: RegisterPayload) {
    await wait();
    // TODO: 对接注册接口，完成短信校验和密码设置。
    return {
      ok: payload.password === payload.confirmPassword,
      message: "注册流程已预留，后续接真实接口即可。"
    };
  },

  async getFeed(): Promise<FeedPost[]> {
    await wait();
    // TODO: 对接社区动态列表接口。
    return clone(feedPosts);
  },

  async getCoupons(): Promise<Coupon[]> {
    await wait();
    // TODO: 对接优惠券列表接口。
    return clone(coupons);
  },

  async getMarketItems(): Promise<MarketItem[]> {
    await wait();
    // TODO: 对接社区集市商品列表接口。
    return clone(marketItems);
  },

  async getProfile(): Promise<ProfileBundle> {
    await wait();
    // TODO: 对接个人主页聚合接口。
    return clone(profileBundle);
  },

  async publishPost(payload: { topic: string; title: string; content: string }) {
    await wait(360);
    // TODO: 对接发布动态接口。
    return {
      ok: true,
      message: `已保留发布入口，后续把 ${payload.topic} 的请求改成真实接口即可。`
    };
  },

  async updateProfile(payload: ProfileDraft) {
    await wait(320);
    // TODO: 对接个人资料保存接口。
    return {
      ok: true,
      data: clone(payload)
    };
  }
};
