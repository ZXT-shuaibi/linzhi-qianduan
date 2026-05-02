import { apiFetch } from "./apiClient";
import type {
  TradeActivity,
  TradeActivityPage,
  TradeOrder,
  TradeOrderPage,
  TradeOrderStatus,
  TradeSubmitData
} from "@/types/trade";

const TRADE_PREFIX = "/api/v1/trade";

type TradeActivityApi = {
  activityId: string;
  title: string;
  description?: string | null;
  cover?: string | null;
  originalPrice?: string | number | null;
  seckillPrice?: string | number | null;
  totalStock?: number | null;
  availableStock?: number | null;
  perUserLimit?: number | null;
  status?: string | null;
  beginTime?: string | null;
  endTime?: string | null;
  payTimeoutMinutes?: number | null;
  active?: boolean | null;
};

type TradeOrderApi = {
  orderNo: string;
  activityId: string;
  activityTitle: string;
  activityCover?: string | null;
  amount?: string | number | null;
  quantity?: number | null;
  status: string;
  payChannel?: string | null;
  orderTime: string;
  expireAt?: string | null;
  payTime?: string | null;
  closeTime?: string | null;
  closeReason?: string | null;
};

const mapActivity = (item: TradeActivityApi): TradeActivity => ({
  activityId: item.activityId,
  title: item.title,
  description: item.description ?? null,
  cover: item.cover ?? null,
  originalPrice: String(item.originalPrice ?? "0.00"),
  seckillPrice: String(item.seckillPrice ?? "0.00"),
  totalStock: item.totalStock ?? 0,
  availableStock: item.availableStock ?? 0,
  perUserLimit: item.perUserLimit ?? 1,
  status: item.status ?? "UNKNOWN",
  beginTime: item.beginTime ?? "",
  endTime: item.endTime ?? "",
  payTimeoutMinutes: item.payTimeoutMinutes ?? 15,
  active: item.active ?? false
});

const mapOrder = (item: TradeOrderApi): TradeOrder => ({
  orderNo: item.orderNo,
  activityId: item.activityId,
  activityTitle: item.activityTitle,
  activityCover: item.activityCover ?? null,
  amount: String(item.amount ?? "0.00"),
  quantity: item.quantity ?? 0,
  status: item.status,
  payChannel: item.payChannel ?? null,
  orderTime: item.orderTime,
  expireAt: item.expireAt ?? null,
  payTime: item.payTime ?? null,
  closeTime: item.closeTime ?? null,
  closeReason: item.closeReason ?? null
});

export const tradeService = {
  listActivities: async (stage?: string, page = 1, size = 20) => {
    const usp = new URLSearchParams({
      page: String(page),
      size: String(size)
    });
    if (stage) {
      usp.set("stage", stage);
    }
    const response = await apiFetch<{
      items?: TradeActivityApi[];
      page?: number;
      size?: number;
      total?: number;
      hasMore?: boolean;
    }>(`${TRADE_PREFIX}/activities?${usp.toString()}`);
    return {
      items: (response.items ?? []).map(mapActivity),
      page: response.page ?? page,
      size: response.size ?? size,
      total: response.total ?? 0,
      hasMore: response.hasMore ?? false
    } satisfies TradeActivityPage;
  },

  getActivity: async (activityId: string) => {
    const response = await apiFetch<TradeActivityApi>(`${TRADE_PREFIX}/activities/${activityId}`);
    return mapActivity(response);
  },

  placeOrder: (activityId: string, quantity = 1) =>
    apiFetch<TradeSubmitData>(`${TRADE_PREFIX}/activities/${activityId}/orders?quantity=${quantity}`, {
      method: "POST"
    }),

  pay: async (orderNo: string, payChannel = "wechat") => {
    const response = await apiFetch<TradeOrderApi>(`${TRADE_PREFIX}/orders/${orderNo}/pay`, {
      method: "POST",
      body: { payChannel }
    });
    return mapOrder(response);
  },

  cancel: async (orderNo: string) => {
    const response = await apiFetch<TradeOrderApi>(`${TRADE_PREFIX}/orders/${orderNo}/cancel`, {
      method: "POST"
    });
    return mapOrder(response);
  },

  myOrders: async (status?: string, page = 1, size = 10) => {
    const usp = new URLSearchParams({
      page: String(page),
      size: String(size)
    });
    if (status) {
      usp.set("status", status);
    }
    const response = await apiFetch<{
      items?: TradeOrderApi[];
      page?: number;
      size?: number;
      total?: number;
      hasMore?: boolean;
    }>(`${TRADE_PREFIX}/orders/me?${usp.toString()}`);
    return {
      items: (response.items ?? []).map(mapOrder),
      page: response.page ?? page,
      size: response.size ?? size,
      total: response.total ?? 0,
      hasMore: response.hasMore ?? false
    } satisfies TradeOrderPage;
  },

  myOrderStatus: (orderNo: string) =>
    apiFetch<TradeOrderStatus>(`${TRADE_PREFIX}/orders/${orderNo}/status`),

  myOrder: async (orderNo: string) => {
    const response = await apiFetch<TradeOrderApi>(`${TRADE_PREFIX}/orders/${orderNo}`);
    return mapOrder(response);
  }
};
