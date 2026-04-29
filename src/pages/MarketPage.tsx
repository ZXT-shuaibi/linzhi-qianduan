import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";
import MainHeader from "@/components/layout/MainHeader";
import SectionHeader from "@/components/common/SectionHeader";
import AuthStatus from "@/features/auth/AuthStatus";
import { useAuth } from "@/context/AuthContext";
import { tradeService } from "@/services/tradeService";
import type { TradeActivity, TradeOrder } from "@/types/trade";
import styles from "./MarketPage.module.css";

const formatMoney = (value: number) => `¥${value.toFixed(2)}`;

const MarketPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activities, setActivities] = useState<TradeActivity[]>([]);
  const [orders, setOrders] = useState<TradeOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [orderLoading, setOrderLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadOrders = async () => {
    if (!user) {
      setOrders([]);
      return;
    }
    try {
      const response = await tradeService.myOrders(undefined, 1, 10);
      setOrders(response.items ?? []);
    } catch {
      // 订单列表拉取失败时静默处理，交互阶段再向用户暴露错误。
    }
  };

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await tradeService.listActivities(undefined, 1, 20);
        if (!cancelled) {
          setActivities(response.items ?? []);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "加载活动失败");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    void loadOrders();
  }, [user?.userId]);

  const requireLogin = () => {
    navigate("/login", { state: { from: "/market" } });
  };

  const placeOrder = async (activityId: string) => {
    if (!user) {
      requireLogin();
      return;
    }
    setOrderLoading(activityId);
    setMessage(null);
    setError(null);
    try {
      const result = await tradeService.placeOrder(activityId, 1);
      setMessage(result.message ?? `订单已受理：${result.orderNo}`);
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
      setError(err instanceof Error ? err.message : "取消失败");
    } finally {
      setOrderLoading(null);
    }
  };

  return (
    <AppLayout
      header={(
        <MainHeader
          headline="邻知市集"
          subtitle="活动列表、下单、支付与我的订单已接入 linli 交易接口"
          rightSlot={<AuthStatus />}
        />
      )}
    >
      {error ? <div className={styles.error}>{error}</div> : null}
      {message ? <div className={styles.message}>{message}</div> : null}

      <SectionHeader title="活动列表" subtitle="读取 /api/v1/trade/activities，直接展示真实库存与价格" />
      <div className={styles.grid}>
        {activities.map((item) => (
          <article key={item.activityId} className={styles.activityCard}>
            {item.cover ? <img src={item.cover} alt={item.title} className={styles.cover} /> : null}
            <div className={styles.activityBody}>
              <div className={styles.statusRow}>
                <span className={`${styles.statusBadge} ${item.active ? styles.statusActive : ""}`}>{item.status}</span>
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
                <span>{new Date(item.beginTime).toLocaleString("zh-CN")}</span>
              </div>
              <button
                type="button"
                className={styles.primaryButton}
                disabled={orderLoading === item.activityId || !item.active}
                onClick={() => void placeOrder(item.activityId)}
              >
                {orderLoading === item.activityId ? "提交中..." : item.active ? "立即下单" : "暂不可下单"}
              </button>
            </div>
          </article>
        ))}
      </div>
      {loading ? <div className={styles.loading}>正在加载活动...</div> : null}

      <SectionHeader title="我的订单" subtitle={user ? "订单状态会在操作后自动刷新" : "登录后查看自己的订单"} />
      {!user ? (
        <div className={styles.empty}>登录后可以在这里查看待支付和已完成订单。</div>
      ) : orders.length === 0 ? (
        <div className={styles.empty}>你还没有订单，先去上面挑一个活动吧。</div>
      ) : (
        <div className={styles.orderList}>
          {orders.map((order) => (
            <article key={order.orderNo} className={styles.orderCard}>
              <div>
                <h3>{order.activityTitle}</h3>
                <div className={styles.meta}>
                  <span>订单号：{order.orderNo}</span>
                  <span>数量：{order.quantity}</span>
                  <span>金额：{formatMoney(order.amount)}</span>
                </div>
              </div>
              <div className={styles.orderActions}>
                <span className={`${styles.statusBadge} ${order.status === "PAID" ? styles.statusActive : ""}`}>{order.status}</span>
                {order.status === "PENDING_PAYMENT" ? (
                  <>
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
                  </>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      )}
    </AppLayout>
  );
};

export default MarketPage;
