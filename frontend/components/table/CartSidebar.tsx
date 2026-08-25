'use client';

import React from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';

interface Food {
  _id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  isAvailable: boolean;
}

interface Table {
  _id: string;
  tableName: string;
  status: string;
}

interface CartItem {
  food: Food;
  quantity: number;
  note: string;
  unitPrice?: number;
  addedBy?: string;
  addedByDeviceId?: string;
}

type Lang = 'vi' | 'en' | 'zh';

interface CouponResult {
  valid: boolean;
  message?: string;
  discountAmount: number;
}

interface CartSidebarProps {
  table: Table | null;
  totalQuantity: number;
  totalAmount: number;
  cart: CartItem[];
  foods: Food[];
  cartMap: Map<string, CartItem>;
  lang: Lang;
  formatPrice: (price: number, lang: Lang) => string;
  handleIncrease: (food: Food) => void;
  handleDecrease: (foodId: string) => void;
  handleRemove: (foodId: string) => void;
  couponInput: string;
  setCouponInput: (val: string) => void;
  couponResult: CouponResult | null;
  setCouponResult: (res: CouponResult | null) => void;
  handleValidateCoupon: () => void;
  isValidatingCoupon: boolean;
  paymentMethod: 'cash' | 'momo';
  setPaymentMethod: (m: 'cash' | 'momo') => void;
  handleSubmitOrder: () => void;
  isSubmitting: boolean;
  t: any;
  isCartOpen?: boolean;
  setIsCartOpen?: (open: boolean) => void;
  currentDeviceId?: string;
  customerName?: string;
}

export const CartSidebar: React.FC<CartSidebarProps> = ({
  table,
  totalQuantity,
  totalAmount,
  cart,
  foods,
  cartMap,
  lang,
  formatPrice,
  handleIncrease,
  handleDecrease,
  handleRemove,
  couponInput,
  setCouponInput,
  couponResult,
  setCouponResult,
  handleValidateCoupon,
  isValidatingCoupon,
  paymentMethod,
  setPaymentMethod,
  handleSubmitOrder,
  isSubmitting,
  t,
  isCartOpen = false,
  setIsCartOpen,
  currentDeviceId,
  customerName,
}) => {
  const renderCartItems = () => {
    const myItems = cart.filter((item) =>
      currentDeviceId ? item.addedByDeviceId === currentDeviceId : true
    );
    const othersItems = cart.filter((item) =>
      currentDeviceId ? item.addedByDeviceId !== currentDeviceId : false
    );

    const renderSingleItem = (item: CartItem) => {
      const effectivePrice = item.unitPrice ?? item.food.price;
      const isMine = currentDeviceId ? item.addedByDeviceId === currentDeviceId : true;

      // Nhãn người gọi: Nếu có tên riêng (khác 'Khách' và 'Bạn') -> hiển thị tên.
      // Nếu không: với món mình chọn -> 'Bạn' (hoặc customerName); với món người khác -> 'Người gọi'.
      const badgeText = item.addedBy && item.addedBy !== 'Khách' && item.addedBy !== 'Bạn'
        ? item.addedBy
        : (isMine ? (customerName || (lang === 'en' ? 'You' : lang === 'zh' ? '您' : 'Bạn')) : (lang === 'en' ? 'Other' : lang === 'zh' ? '同桌' : 'Người gọi'));

      return (
        <div
          key={`${item.food._id}_${item.addedByDeviceId || 'local'}`}
          className="p-3 rounded-[var(--radius-md)] bg-[var(--bg-primary)] border border-[var(--border-color)] shadow-xs transition-colors"
        >
          <div className="flex justify-between items-start gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h4 className="text-xs font-semibold text-[var(--text-primary)] truncate">
                  {item.food.name}
                </h4>
                {badgeText && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#3AA6FF]/10 text-[#3AA6FF] flex items-center gap-1 flex-shrink-0">
                    <span className="material-symbols-outlined text-[12px]">person</span>
                    <span>{badgeText}</span>
                  </span>
                )}
              </div>
              <span className="text-[13px] font-bold text-[var(--price-color)] block mt-0.5">
                {formatPrice(effectivePrice, lang)}
              </span>
            </div>
            <button
              onClick={() => handleRemove(item.food._id)}
              className="text-[var(--text-tertiary)] hover:text-red-500 transition-colors p-1"
              title={lang === 'en' ? 'Remove item' : lang === 'zh' ? '删除' : 'Xóa món'}
            >
              <span className="material-symbols-outlined text-base">close</span>
            </button>
          </div>
          {item.note && (
            <p className="text-[12px] font-normal text-[var(--text-secondary)] line-clamp-1 italic mt-1">
              {lang === 'en' ? 'Note:' : lang === 'zh' ? '备注:' : 'Ghi chú:'} {item.note}
            </p>
          )}
          <div className="flex justify-between items-center mt-2.5">
            <div className="flex items-center gap-2 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-full px-2 py-1 shadow-xs">
              <button
                onClick={() => handleDecrease(item.food._id)}
                className="w-5 h-5 rounded-full flex items-center justify-center text-[var(--text-primary)] hover:bg-[var(--bg-primary)] transition-colors active:scale-95"
              >
                <span className="material-symbols-outlined text-xs">remove</span>
              </button>
              <span className="text-xs font-bold text-[var(--text-primary)] min-w-4 text-center">
                {item.quantity}
              </span>
              <button
                onClick={() => handleIncrease(item.food)}
                className="w-5 h-5 rounded-full flex items-center justify-center text-[var(--text-primary)] hover:bg-[var(--bg-primary)] transition-colors active:scale-95"
              >
                <span className="material-symbols-outlined text-xs">add</span>
              </button>
            </div>
            <span className="text-xs font-black text-[var(--text-primary)]">
              {formatPrice(effectivePrice * item.quantity, lang)}
            </span>
          </div>
        </div>
      );
    };

    return (
      <div className="flex-1 overflow-y-auto px-4 xl:px-5 py-4 space-y-4 scrollbar-none font-sans">
        {cart.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center gap-2">
            <span className="material-symbols-outlined text-4xl text-[var(--text-tertiary)]">
              shopping_bag
            </span>
            <p className="text-xs font-semibold text-[var(--text-tertiary)]">
              {t.emptyCart}
            </p>
          </div>
        ) : (
          <>
            {/* Section 1: Món của tôi */}
            {myItems.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#3AA6FF]">
                  <span className="material-symbols-outlined text-sm">person</span>
                  <span>
                    {lang === 'en' ? 'Your Selection' : lang === 'zh' ? '您选择的商品' : 'Món bạn chọn'} ({myItems.reduce((acc, i) => acc + i.quantity, 0)})
                  </span>
                </div>
                {myItems.map(renderSingleItem)}
              </div>
            )}

            {/* Section 2: Món người khác chọn trong nhóm */}
            {othersItems.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-[var(--border-color)]">
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-500">
                  <span className="material-symbols-outlined text-sm">group</span>
                  <span>
                    {lang === 'en' ? 'Group Selection' : lang === 'zh' ? '同桌选择' : 'Món người khác chọn'} ({othersItems.reduce((acc, i) => acc + i.quantity, 0)})
                  </span>
                </div>
                {othersItems.map(renderSingleItem)}
              </div>
            )}
          </>
        )}

        {/* Upsell Recommendation Section */}
        {cart.length <= 2 && foods.length > 0 && (
          <div className="pt-2 border-t border-[var(--border-color)]">
            <p className="text-[10px] font-semibold uppercase tracking-[0.04em] text-[var(--accent)] mb-2.5 flex items-center gap-1.5">
              <span>{t.suggestedForYou || (lang === 'en' ? 'You Might Also Like' : lang === 'zh' ? '猜你喜欢' : 'Có thể bạn sẽ thích')}</span>
            </p>
            <div className="space-y-2">
              {foods
                .filter((f) => !cartMap.has(f._id))
                .slice(0, 2)
                .map((recomFood) => (
                  <div
                    key={recomFood._id}
                    className="flex items-center justify-between p-2 rounded-[var(--radius-md)] bg-[var(--upsell-card-bg)] border border-[var(--upsell-card-border)] shadow-[var(--upsell-card-shadow)]"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-10 h-10 rounded-[var(--radius-sm)] overflow-hidden bg-[var(--bg-card)] relative flex-shrink-0">
                        <Image src={recomFood.image} alt={recomFood.name} fill className="object-cover" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-[var(--text-primary)] truncate">
                          {recomFood.name}
                        </p>
                        <p className="text-[12px] font-bold text-[var(--price-color)]">
                          {formatPrice(recomFood.price, lang)}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleIncrease(recomFood)}
                      className="px-2.5 py-1 bg-[var(--brand-primary-muted)] hover:bg-[var(--brand-primary)] text-[var(--brand-primary)] hover:text-white rounded-[var(--radius-sm)] text-[11px] font-semibold transition-all flex items-center gap-0.5 flex-shrink-0 active:scale-95"
                    >
                      <span className="material-symbols-outlined text-[13px]">add</span>
                      <span>{t.addItem || (lang === 'en' ? 'Add' : lang === 'zh' ? '添加' : 'Thêm')}</span>
                    </button>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderCheckoutControls = () => (
    <div className="p-4 xl:p-5 bg-[var(--bg-primary)] border-t border-[var(--border-color)] shadow-2xl font-sans">
      {cart.length === 0 && (
        <p className="text-[13px] font-medium text-[var(--text-secondary)] text-center py-2 font-sans">
          {lang === 'en' ? 'Add items to continue' : lang === 'zh' ? '添加商品以继续支付' : 'Thêm món để tiếp tục thanh toán'}
        </p>
      )}

      <div className={cart.length === 0 ? 'opacity-50 pointer-events-none select-none' : ''}>
        {/* Coupon Input Group */}
        <div className="flex gap-2">
          <div className="flex-1">
            <input
              type="text"
              value={couponInput}
              disabled={cart.length === 0}
              onChange={(e) => {
                setCouponInput(e.target.value.toUpperCase());
                setCouponResult(null);
              }}
              onKeyDown={(e) => e.key === 'Enter' && handleValidateCoupon()}
              placeholder={t.promoCode ? `${t.promoCode}...` : (lang === 'en' ? 'Promo Code...' : lang === 'zh' ? '优惠码...' : 'Mã giảm giá...')}
              className="w-full bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl py-2.5 px-3.5 text-xs text-[var(--text-primary)] font-medium uppercase focus:border-[var(--brand-primary)] outline-none font-sans placeholder-[var(--text-tertiary)]"
            />
          </div>
          <button
            onClick={handleValidateCoupon}
            disabled={isValidatingCoupon || !couponInput.trim() || cart.length === 0}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all font-sans ${
              couponInput.trim() && cart.length > 0
                ? 'uiverse-btn cursor-pointer shadow-md'
                : 'bg-[var(--btn-disabled-bg)] text-[var(--btn-disabled-text)] cursor-not-allowed'
            }`}
          >
            {isValidatingCoupon ? '...' : (t.apply || (lang === 'en' ? 'Apply' : lang === 'zh' ? '应用' : 'Áp dụng'))}
          </button>
        </div>
        {couponResult && (
          <p
            className={`text-xs font-semibold mt-2 ${
              couponResult.valid ? 'text-[var(--brand-primary)]' : 'text-red-500'
            }`}
          >
            {couponResult.valid
              ? `${lang === 'en' ? 'Discount ' : lang === 'zh' ? '立减 ' : 'Giảm '}${formatPrice(couponResult.discountAmount, lang)}`
              : couponResult.message}
          </p>
        )}

        <div className="border-t border-[var(--border-color)] my-3" />

        {/* Payment Method Selector */}
        <div className="flex gap-3">
          <button
            onClick={() => setPaymentMethod('cash')}
            disabled={cart.length === 0}
            className={`flex-1 h-[44px] text-[13px] font-semibold rounded-xl flex items-center justify-center gap-2 transition-all font-sans ${
              paymentMethod === 'cash'
                ? 'bg-[#3AA6FF] text-white shadow-md'
                : 'bg-[var(--payment-inactive-bg)] border-2 border-[var(--payment-inactive-border)] text-[var(--payment-inactive-text)] hover:border-[#3AA6FF] hover:text-[#3AA6FF]'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">payments</span>
            {t.cash || (lang === 'en' ? 'Cash' : lang === 'zh' ? '现金' : 'Tiền mặt')}
          </button>
          <button
            onClick={() => setPaymentMethod('momo')}
            disabled={cart.length === 0}
            className={`flex-1 h-[44px] text-[13px] font-semibold rounded-xl flex items-center justify-center gap-2 transition-all font-sans ${
              paymentMethod === 'momo'
                ? 'bg-[#A50064] dark:bg-[#D94FAF] text-white shadow-md'
                : 'bg-[var(--payment-inactive-bg)] border-2 border-[#A50064]/50 dark:border-[#D94FAF]/50 text-[#A50064] dark:text-[#D94FAF] hover:border-[#A50064] dark:hover:border-[#D94FAF] hover:bg-[#A50064]/5'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">qr_code_scanner</span>
            {t.momoQr || (lang === 'en' ? 'MoMo QR' : lang === 'zh' ? 'MoMo 扫码' : 'MoMo QR')}
          </button>
        </div>

        <div className="border-t border-[var(--border-color)] my-3" />

        {/* Summary Details */}
        <div className="space-y-1.5 mb-4">
          <div className="flex justify-between text-[13.5px] font-normal text-[var(--text-secondary)] font-sans">
            <span>{t.subtotal || (lang === 'en' ? 'Subtotal' : lang === 'zh' ? '小计' : 'Tạm tính')} ({totalQuantity} {lang === 'en' ? 'items' : lang === 'zh' ? '件' : 'món'})</span>
            <span>{formatPrice(totalAmount, lang)}</span>
          </div>
          {couponResult?.valid && couponResult.discountAmount > 0 && (
            <div className="flex justify-between text-[13.5px] font-medium text-emerald-600 dark:text-emerald-400 font-sans">
              <span>{lang === 'en' ? 'Discount' : lang === 'zh' ? '优惠' : 'Khuyến mãi'}</span>
              <span>-{formatPrice(couponResult.discountAmount, lang)}</span>
            </div>
          )}
          <div className="flex justify-between items-baseline pt-1">
            <span className="text-[14px] font-normal text-[var(--text-primary)] font-sans">
              {t.total || (lang === 'en' ? 'Total' : lang === 'zh' ? '总计' : 'Tổng cộng')}
            </span>
            <span className="text-[20px] font-black text-[var(--price-color)] tracking-tight font-sans">
              {formatPrice(
                Math.max(
                  0,
                  totalAmount - (couponResult?.valid ? couponResult.discountAmount : 0)
                ),
                lang
              )}
            </span>
          </div>
        </div>
      </div>

      {/* Submit CTA Button */}
      <button
        onClick={handleSubmitOrder}
        disabled={cart.length === 0 || isSubmitting}
        className={`w-full h-[50px] mt-2 rounded-xl text-[14px] font-bold uppercase tracking-[0.04em] flex items-center justify-center transition-all font-sans shadow-md ${
          cart.length === 0
            ? 'bg-[var(--btn-disabled-bg)] text-[var(--btn-disabled-text)] cursor-not-allowed shadow-none'
            : 'uiverse-btn shadow-[0_4px_14px_rgba(58,166,255,0.35)]'
        }`}
      >
        <span>{isSubmitting ? t.submitting : (t.checkoutBtn || (lang === 'en' ? 'CONFIRM ORDER' : lang === 'zh' ? '确认提交订单' : 'GỬI ĐƠN HÀNG NGAY'))}</span>
      </button>
    </div>
  );

  return (
    <>
      {/* ── DESKTOP CART SIDEBAR ───────────────────────────────────────────── */}
      <aside className="hidden lg:flex w-[320px] xl:w-[360px] h-full flex-col bg-[var(--bg-card)] border-l border-[var(--border-color)] flex-shrink-0 transition-colors">
        {/* Header */}
        <div className="px-4 xl:px-5 py-4 border-b border-[var(--border-color)] flex justify-between items-center bg-[var(--bg-card)] font-sans">
          <div>
            <h3 className="text-base font-bold text-[var(--text-primary)] leading-tight">
              {t.cartTitle}
            </h3>
            <p className="text-[10px] font-bold text-[#3AA6FF] uppercase tracking-wider mt-0.5">
              {lang === 'en' ? 'TABLE DINE-IN ORDER' : lang === 'zh' ? '堂食订单' : 'ĐƠN HÀNG TẠI BÀN'}
            </p>
          </div>
          <div className="bg-[var(--bg-primary)] border border-[#3AA6FF]/30 px-3 py-1 rounded-full text-xs font-bold text-[#3AA6FF]">
            {table?.tableName ?? (lang === 'en' ? 'Table' : lang === 'zh' ? '桌号' : 'Bàn')}
          </div>
        </div>

        {renderCartItems()}
        {renderCheckoutControls()}
      </aside>

      {/* ── MOBILE / TABLET BOTTOM SHEET CART DRAWER ─────────────────────── */}
      <AnimatePresence>
        {isCartOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCartOpen && setIsCartOpen(false)}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs lg:hidden"
            />

            {/* Bottom Sheet Modal */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="fixed bottom-0 left-0 right-0 z-50 max-h-[90vh] bg-[var(--bg-card)] rounded-t-[24px] border-t border-[var(--border-color)] shadow-2xl flex flex-col font-sans lg:hidden overflow-hidden text-left"
            >
              {/* Drawer Handle */}
              <div className="w-12 h-1.5 bg-[var(--border-color)] rounded-full mx-auto my-2.5 flex-shrink-0" />

              {/* Mobile Drawer Header */}
              <div className="px-5 py-3 border-b border-[var(--border-color)] flex justify-between items-center bg-[var(--bg-card)]">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-[var(--text-primary)]">
                    {t.cartTitle}
                  </h3>
                  <span className="bg-[#3AA6FF] text-white text-xs font-bold px-2 py-0.5 rounded-full">
                    {totalQuantity} {lang === 'en' ? 'items' : lang === 'zh' ? '件' : 'món'}
                  </span>
                </div>
                <button
                  onClick={() => setIsCartOpen && setIsCartOpen(false)}
                  className="p-1.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-full bg-[var(--bg-primary)] border border-[var(--border-color)] transition-colors active:scale-95"
                >
                  <span className="material-symbols-outlined text-lg">close</span>
                </button>
              </div>

              {/* Drawer Body (Scrollable Cart Items) */}
              <div className="flex-1 overflow-y-auto max-h-[45vh]">
                {renderCartItems()}
              </div>

              {/* Drawer Footer Controls */}
              {renderCheckoutControls()}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};
