export type TradeActivity = {
  activityId: string;
  title: string;
  description?: string | null;
  cover?: string | null;
  originalPrice: number;
  seckillPrice: number;
  totalStock: number;
  availableStock: number;
  perUserLimit: number;
  status: string;
  beginTime: string;
  endTime: string;
  payTimeoutMinutes: number;
  active: boolean;
};

export type TradeActivityPage = {
  items: TradeActivity[];
  page: number;
  size: number;
  total: number;
  hasMore: boolean;
};

export type TradeSubmitData = {
  orderNo: string;
  status: string;
  submittedAt?: string | null;
  message?: string | null;
};

export type TradeOrder = {
  orderNo: string;
  activityId: string;
  activityTitle: string;
  activityCover?: string | null;
  amount: number;
  quantity: number;
  status: "PENDING_PAYMENT" | "PAID" | "CLOSED" | string;
  payChannel?: string | null;
  orderTime: string;
  expireAt?: string | null;
  payTime?: string | null;
  closeTime?: string | null;
  closeReason?: string | null;
};

export type TradeOrderPage = {
  items: TradeOrder[];
  page: number;
  size: number;
  total: number;
  hasMore: boolean;
};

export type TradeOrderStatus = {
  orderNo: string;
  status: string;
  message?: string | null;
  updatedAt?: string | null;
};
