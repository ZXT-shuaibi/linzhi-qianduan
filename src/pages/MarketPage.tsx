import { useEffect, useState } from "react";
import CheckoutDialog from "../components/CheckoutDialog";
import { todoApi } from "../services/todoApi";
import type { Coupon, MarketItem } from "../types/app";

function MarketPage() {
  const [couponList, setCouponList] = useState<Coupon[]>([]);
  const [items, setItems] = useState<MarketItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<MarketItem | null>(null);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      const [nextCoupons, nextItems] = await Promise.all([todoApi.getCoupons(), todoApi.getMarketItems()]);
      if (!cancelled) {
        setCouponList(nextCoupons);
        setItems(nextItems);
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, []);

  const activeCoupon = couponList.find((coupon) => coupon.claimed) ?? null;

  const claimCoupon = (couponId: string) => {
    setCouponList((current) =>
      current.map((coupon) => ({
        ...coupon,
        claimed: coupon.id === couponId ? !coupon.claimed : false
      }))
    );
  };

  return (
    <>
      <section className="coupon-grid">
        {couponList.map((coupon) => (
          <article key={coupon.id} className={`coupon-card coupon-${coupon.tone}`}>
            <div>
              <p className="coupon-kicker">{coupon.title}</p>
              <strong>¥{coupon.amount}</strong>
              <span>{coupon.hint}</span>
            </div>
            <button type="button" className="pill-button" onClick={() => claimCoupon(coupon.id)}>
              {coupon.claimed ? "已领取" : "领取"}
            </button>
          </article>
        ))}
      </section>

      <section className="section-card market-intro">
        <div>
          <h2>邻里集市先把“领券 + 下单预览”一条链路跑通。</h2>
          <p className="muted">
            当前支付只是前端预演，但结构已经给你留好。后面只要把领券、商品列表和下单接口接进去就行。
          </p>
        </div>
        <div className="status-board">
          <span>当前生效优惠券</span>
          <strong>{activeCoupon ? `${activeCoupon.title} - ¥${activeCoupon.amount}` : "未选择"}</strong>
        </div>
      </section>

      <section className="market-grid">
        {items.map((item) => (
          <article key={item.id} className="product-card">
            <div className="product-cover" style={{ backgroundImage: `url(${item.image})` }} />
            <div className="product-body">
              <span className="chip chip-soft">{item.tag}</span>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
              <div className="product-meta">
                <strong>¥{item.price}</strong>
                <span>原价 ¥{item.originalPrice}</span>
              </div>
              <div className="author-row compact-row">
                <div>
                  <strong>{item.seller}</strong>
                  <span>{item.distance}</span>
                </div>
                <button type="button" className="primary-link" onClick={() => setSelectedItem(item)}>
                  立即下单
                </button>
              </div>
            </div>
          </article>
        ))}
      </section>

      <CheckoutDialog item={selectedItem} coupon={activeCoupon} onClose={() => setSelectedItem(null)} />
    </>
  );
}

export default MarketPage;
