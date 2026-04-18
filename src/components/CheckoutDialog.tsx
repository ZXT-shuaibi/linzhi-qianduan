import type { Coupon, MarketItem } from "../types/app";

type CheckoutDialogProps = {
  item: MarketItem | null;
  coupon: Coupon | null;
  onClose: () => void;
};

function CheckoutDialog({ item, coupon, onClose }: CheckoutDialogProps) {
  if (!item) {
    return null;
  }

  const discount = coupon?.amount ?? 0;
  const finalPrice = Math.max(item.price - discount, 0);

  return (
    <div className="dialog-backdrop" onClick={onClose}>
      <div className="dialog-card dialog-checkout" onClick={(event) => event.stopPropagation()}>
        <div className="dialog-header">
          <div>
            <span className="tone-pill tone-orange">订单预览</span>
            <h3>{item.title}</h3>
            <p className="muted">卖家：{item.seller}</p>
          </div>
          <button type="button" className="icon-button" onClick={onClose}>
            关闭
          </button>
        </div>

        <div className="checkout-row">
          <span>原价</span>
          <strong>¥{item.originalPrice}</strong>
        </div>
        <div className="checkout-row">
          <span>邻里成交价</span>
          <strong>¥{item.price}</strong>
        </div>
        <div className="checkout-row">
          <span>优惠券</span>
          <strong className={discount ? "accent-text" : ""}>{discount ? `-¥${discount}` : "未使用"}</strong>
        </div>
        <div className="checkout-total">
          <span>应付金额</span>
          <strong>¥{finalPrice}</strong>
        </div>

        <p className="todo-note">TODO：这里后续替换成真实下单和支付接口。</p>
      </div>
    </div>
  );
}

export default CheckoutDialog;
