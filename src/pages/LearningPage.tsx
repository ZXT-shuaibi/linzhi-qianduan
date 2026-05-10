import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";
import MainHeader from "@/components/layout/MainHeader";
import SectionHeader from "@/components/common/SectionHeader";
import AuthStatus from "@/features/auth/AuthStatus";
import { useAuth } from "@/context/AuthContext";
import { tradeService } from "@/services/tradeService";
import type { TradeOrder } from "@/types/trade";
import { formatMoney } from "@/utils/money";
import styles from "./LearningPage.module.css";

const formatDateTime = (value?: string | null) => {
  if (!value) {
    return "暂无记录";
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "暂无记录" : date.toLocaleString("zh-CN");
};

const LearningPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [orders, setOrders] = useState<TradeOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (!user) {
        setOrders([]);
        setLoading(false);
        setError(null);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const response = await tradeService.myOrders("PAID", 1, 20);
        if (!cancelled) {
          setOrders(response.items ?? []);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "加载已购内容失败");
          setOrders([]);
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
  }, [user]);

  return (
    <AppLayout
      header={(
        <MainHeader
          headline="我的学习"
          subtitle="基于 linli 已支付订单展示你已经购买的内容"
          rightSlot={<AuthStatus />}
        />
      )}
    >
      <div className={styles.pageStack}>
        <section className={styles.summaryBand}>
          <div>
            <span className={styles.kicker}>已购内容</span>
            <h2>{orders.length}</h2>
          </div>
          <button type="button" className="ghost-button" onClick={() => navigate("/market")}>
            前往市集
          </button>
        </section>

        <SectionHeader title="学习清单" subtitle="读取 /api/v1/trade/orders/me?status=PAID" />
        {error ? <div className={styles.error}>{error}</div> : null}
        {loading ? <div className={styles.emptyCard}>正在加载已购内容...</div> : null}

        {!loading && !user ? (
          <div className={styles.emptyCard}>
            <div className={styles.icon}>知</div>
            <div className={styles.title}>登录后查看学习内容</div>
            <div className={styles.description}>已支付订单会自动汇总到这里，便于继续学习。</div>
            <button type="button" className="ghost-button" onClick={() => navigate("/login", { state: { from: "/learn" } })}>
              去登录
            </button>
          </div>
        ) : null}

        {!loading && user && orders.length === 0 ? (
          <div className={styles.emptyCard}>
            <div className={styles.icon}>课</div>
            <div className={styles.title}>还没有已购内容</div>
            <div className={styles.description}>去市集看看有没有你感兴趣的活动和内容。</div>
            <button type="button" className="ghost-button" onClick={() => navigate("/market")}>
              前往市集
            </button>
          </div>
        ) : null}

        {!loading && orders.length > 0 ? (
          <div className={styles.orderGrid}>
            {orders.map((order) => (
              <article key={order.orderNo} className={styles.orderCard}>
                {order.activityCover ? (
                  <img className={styles.cover} src={order.activityCover} alt={order.activityTitle} />
                ) : (
                  <div className={styles.coverFallback}>{order.activityTitle.slice(0, 1) || "知"}</div>
                )}
                <div className={styles.orderBody}>
                  <span className={styles.status}>已支付</span>
                  <h3>{order.activityTitle}</h3>
                  <div className={styles.meta}>
                    <span>订单号：{order.orderNo}</span>
                    <span>支付时间：{formatDateTime(order.payTime)}</span>
                    <span>下单时间：{formatDateTime(order.orderTime)}</span>
                  </div>
                  <div className={styles.footer}>
                    <strong>{formatMoney(order.amount)}</strong>
                    <span>数量 {order.quantity}</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : null}
      </div>
    </AppLayout>
  );
};

export default LearningPage;
