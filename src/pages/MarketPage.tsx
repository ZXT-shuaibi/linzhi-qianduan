import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import CommunityTopNav from "@/components/layout/CommunityTopNav";
import { useAuth } from "@/context/AuthContext";
import { tradeService } from "@/services/tradeService";
import type { TradeActivity, TradeOrder } from "@/types/trade";
import styles from "./MarketPage.module.css";

const moneyFormatter = new Intl.NumberFormat("zh-CN", {
  style: "currency",
  currency: "CNY"
});

const stageFilters = [
  { value: "", label: "全部" },
  { value: "active", label: "进行中" },
  { value: "upcoming", label: "未开始" },
  { value: "sold_out", label: "已售罄" }
] as const;

const formatMoney = (value: number) => moneyFormatter.format(value);

const formatDateTime = (value?: string | null) => {
  if (!value) {
    return "时间待定";
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "时间待定" : date.toLocaleString("zh-CN");
};

const formatActivityStatus = (status: string, active: boolean) => {
  if (active) {
    return "进行中";
  }
  const statusMap: Record<string, string> = {
    NOT_STARTED: "未开始",
    ACTIVE: "进行中",
    ENDED: "已结束",
    SOLD_OUT: "已售罄",
    DISABLED: "已下架"
  };
  return statusMap[status] ?? status;
};

const formatOrderStatus = (status: TradeOrder["status"]) => {
  const statusMap: Record<string, string> = {
    PENDING_PAYMENT: "待支付",
    PAID: "已支付",
    CLOSED: "已关闭"
  };
  return statusMap[status] ?? status;
};

const MarketPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activities, setActivities] = useState<TradeActivity[]>([]);
  const [orders, setOrders] = useState<TradeOrder[]>([]);
  const [stage, setStage] = useState("");
  const [loading, setLoading] = useState(false);
  const [orderLoading, setOrderLoading] = useState<string | null>(null);
  const [selectedActivity, setSelectedActivity] = useState<TradeActivity | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadOrders = useCallback(async () => {
    if (!user) {
      setOrders([]);
      return;
    }
    try {
      const response = await tradeService.myOrders(undefined, 1, 10);
      setOrders(response.items ?? []);
    } catch {
      setOrders([]);
    }
  }, [user]);

  const loadActivities = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await tradeService.listActivities(stage || undefined, 1, 20);
      setActivities(response.items ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "加载活动失败");
    } finally {
      setLoading(false);
    }
  }, [stage]);

  useEffect(() => {
    void loadActivities();
  }, [loadActivities]);

  useEffect(() => {
    void loadOrders();
  }, [loadOrders]);

  const requireLogin = () => {
    navigate("/login", { state: { from: "/market" } });
  };

  const requestOrder = (activity: TradeActivity) => {
    if (!user) {
      requireLogin();
      return;
    }
    setSelectedActivity(activity);
  };

  const placeOrder = async () => {
    if (!selectedActivity) return;
    setOrderLoading(selectedActivity.activityId);
    setMessage(null);
    setError(null);
    try {
      const result = await tradeService.placeOrder(selectedActivity.activityId, 1);
      setMessage(result.message ?? `订单已受理：${result.orderNo}`);
      setSelectedActivity(null);
      await loadOrders();
    } catch (err) {
      setError(err instanceof Error ? err.message : "下单失败");
    } finally {
      setOrderLoading(null);
    }
  };

  const payOrder = async (orderNo: string) => {
    setOrderLoading(orderNo);
    setMessage(null);
    setError(null);
    try {
      const result = await tradeService.pay(orderNo, "wechat");
      setMessage(`订单 ${result.orderNo} 已支付`);
      await loadOrders();
    } catch (err) {
      setError(err instanceof Error ? err.message : "支付失败");
    } finally {
      setOrderLoading(null);
    }
  };

  const cancelOrder = async (orderNo: string) => {
    setOrderLoading(orderNo);
    setMessage(null);
    setError(null);
    try {
      await tradeService.cancel(orderNo);
      setMessage(`订单 ${orderNo} 已取消`);
      await loadOrders();
    } catch (err) {
      setError(err instanceof Error ? err.message : "取消订单失败");
    } finally {
      setOrderLoading(null);
    }
  };

  return (
    <main className={styles.shell}>
      <CommunityTopNav locationLabel="邻知市集" />

      <section className={styles.hero}>
        <div>
          <span>Community Market</span>
          <h1>把附近活动做成可信赖的轻量交易。</h1>
          <p>活动、下单、模拟支付、取消和我的订单均使用 `linli` 交易接口；优惠券先保留真实空态。</p>
        </div>
        <div className={styles.heroStats}>
          <div><strong>{activities.length}</strong><span>活动</span></div>
          <div><strong>{orders.length}</strong><span>我的订单</span></div>
          <div><strong>{activities.filter((item) => item.active).length}</strong><span>进行中</span></div>
        </div>
      </section>

      {error ? <div className={styles.error}>{error}</div> : null}
      {message ? <div className={styles.message}>{message}</div> : null}

      <section className={styles.marketGrid}>
        <div className={styles.activityColumn}>
          <div className={styles.sectionBar}>
            <div>
              <span>Activities</span>
              <h2>市集活动</h2>
            </div>
            <div className={styles.filterGroup}>
              {stageFilters.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  className={stage === item.value ? styles.filterActive : ""}
                  onClick={() => setStage(item.value)}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.grid}>
            {activities.map((item) => (
              <article key={item.activityId} className={styles.activityCard}>
                {item.cover ? <img src={item.cover} alt={item.title} className={styles.cover} /> : <div className={styles.coverFallback}>市集</div>}
                <div className={styles.activityBody}>
                  <div className={styles.statusRow}>
                    <span className={`${styles.statusBadge} ${item.active ? styles.statusActive : ""}`}>
                      {formatActivityStatus(item.status, item.active)}
                    </span>
                    <span>库存 {item.availableStock} / {item.totalStock}</span>
                  </div>
                  <h3>{item.title}</h3>
                  <p>{item.description || "暂无活动说明"}</p>
                  <div className={styles.priceRow}>
                    <strong>{formatMoney(item.seckillPrice)}</strong>
                    <span>{formatMoney(item.originalPrice)}</span>
                  </div>
                  <div className={styles.meta}>
                    <span>每人限购 {item.perUserLimit}</span>
                    <span>{formatDateTime(item.beginTime)}</span>
                  </div>
                  <button
                    type="button"
                    className={styles.primaryButton}
                    disabled={orderLoading === item.activityId || !item.active}
                    onClick={() => requestOrder(item)}
                  >
                    {orderLoading === item.activityId ? "提交中..." : item.active ? "立即下单" : "暂不可下单"}
                  </button>
                </div>
              </article>
            ))}
          </div>

          {loading ? <div className={styles.stateCard}>正在加载活动...</div> : null}
          {!loading && activities.length === 0 ? <div className={styles.stateCard}>暂无可展示的真实活动。</div> : null}
        </div>

        <aside className={styles.orderColumn}>
          <div className={styles.couponPanel}>
            <span>Coupon Center</span>
            <h2>优惠券接口未接入</h2>
            <p>当前 `linli` 后端没有优惠券/卡券接口，因此这里不提供假领取按钮。</p>
          </div>

          <div className={styles.ordersPanel}>
            <div className={styles.sectionBar}>
              <div>
                <span>Orders</span>
                <h2>我的订单</h2>
              </div>
            </div>

            {!user ? (
              <div className={styles.stateCard}>登录后可以查看待支付和已完成订单。</div>
            ) : orders.length === 0 ? (
              <div className={styles.stateCard}>你还没有订单，先去挑一个活动吧。</div>
            ) : (
              <div className={styles.orderList}>
                {orders.map((order) => (
                  <article key={order.orderNo} className={styles.orderCard}>
                    {order.activityCover ? <img src={order.activityCover} alt={order.activityTitle} /> : null}
                    <div className={styles.orderContent}>
                      <div className={styles.orderTop}>
                        <h3>{order.activityTitle}</h3>
                        <span className={`${styles.statusBadge} ${order.status === "PAID" ? styles.statusActive : ""}`}>
                          {formatOrderStatus(order.status)}
                        </span>
                      </div>
                      <div className={styles.meta}>
                        <span>订单号：{order.orderNo}</span>
                        <span>数量：{order.quantity}</span>
                        <span>金额：{formatMoney(order.amount)}</span>
                        <span>下单：{formatDateTime(order.orderTime)}</span>
                      </div>
                      {order.status === "PENDING_PAYMENT" ? (
                        <div className={styles.orderActions}>
                          <button
                            type="button"
                            className={styles.primaryButton}
                            disabled={orderLoading === order.orderNo}
                            onClick={() => void payOrder(order.orderNo)}
                          >
                            {orderLoading === order.orderNo ? "处理中..." : "立即支付"}
                          </button>
                          <button
                            type="button"
                            className={styles.secondaryButton}
                            disabled={orderLoading === order.orderNo}
                            onClick={() => void cancelOrder(order.orderNo)}
                          >
                            取消订单
                          </button>
                        </div>
                      ) : null}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </aside>
      </section>

      {selectedActivity ? (
        <div className={styles.modalOverlay} onClick={() => setSelectedActivity(null)}>
          <div className={styles.orderModal} onClick={(event) => event.stopPropagation()}>
            <span>Order Confirm</span>
            <h2>{selectedActivity.title}</h2>
            <p>{selectedActivity.description || "确认后会调用真实下单接口创建订单。"}</p>
            <div className={styles.modalPrice}>
              <strong>{formatMoney(selectedActivity.seckillPrice)}</strong>
              <span>库存 {selectedActivity.availableStock}</span>
            </div>
            <div className={styles.modalActions}>
              <button type="button" className={styles.secondaryButton} onClick={() => setSelectedActivity(null)}>再看看</button>
              <button
                type="button"
                className={styles.primaryButton}
                disabled={orderLoading === selectedActivity.activityId}
                onClick={() => void placeOrder()}
              >
                {orderLoading === selectedActivity.activityId ? "提交中..." : "确认下单"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
};

export default MarketPage;
