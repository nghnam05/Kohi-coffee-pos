'use client';

import React from 'react';
import Image from 'next/image';

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
}) => {
  return (
    <aside className="hidden lg:flex flex-col h-full w-[320px] xl:w-[360px] flex-shrink-0 bg-[var(--bg-card)] text-[var(--text-primary)] border-l border-[var(--border-color)] shadow-xl z-20 overflow-hidden">
      {/* Cart Header */}
      <div className="p-4 xl:p-5 border-b border-[var(--border-color)] flex justify-between items-center bg-[var(--bg-primary)] text-[var(--text-primary)]">
        <div>
          <h2 className="text-base font-[700] text-[var(--text-primary)] tracking-tight font-heading">
            Đơn hàng tại bàn
          </h2>
          <p className="text-xs font-[500] text-[var(--brand-primary)] uppercase mt-1 tracking-[0.04em]">
            {table?.tableName ?? 'Bàn 05'}
          </p>
        </div>
        <div className="w-10 h-10 rounded-full bg-[var(--bg-card)] border border-[var(--border-color)] flex items-center justify-center text-[var(--text-primary)] relative shadow-sm">
          <span className="material-symbols-outlined">shopping_basket</span>
          {totalQuantity > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-[var(--brand-primary)] text-white rounded-full text-[10px] font-black flex items-center justify-center border-2 border-[var(--bg-card)]">
              {totalQuantity}
            </span>
          )}
        </div>
      </div>

      {/* Cart Items List */}
      <div className="flex-1 overflow-y-auto p-4 xl:p-5 flex flex-col gap-4 scrollbar-none">
        {cart.length === 0 ? (
          <div className="text-center py-16 text-[var(--text-secondary)] flex flex-col items-center">
            <span className="material-symbols-outlined text-4xl text-[var(--text-tertiary)] mb-2">
              shopping_bag
            </span>
            <p className="text-xs font-normal">{t.emptyCart}</p>
          </div>
        ) : (
          cart.map((item) => (
            <div key={item.food._id} className="flex gap-3 pb-4 border-b border-[var(--border-color)]">
              <div className="w-16 h-16 rounded-[var(--radius-md)] overflow-hidden bg-[var(--bg-primary)] flex-shrink-0 relative">
                <Image src={item.food.image} alt={item.food.name} fill className="object-cover" />
              </div>
              <div className="flex-1 flex flex-col justify-between">
                <div className="flex justify-between items-start">
                  <h4 className="text-[15px] font-[600] text-[var(--text-primary)] line-clamp-1">
                    {item.food.name}
                  </h4>
                  <span className="text-[16px] font-[700] text-[var(--price-color)] tracking-tight">
                    {formatPrice((item.unitPrice ?? item.food.price) * item.quantity, lang)}
                  </span>
                </div>
                {item.note && (
                  <p className="text-[13.5px] font-normal text-[var(--text-secondary)] line-clamp-1 italic mt-1">
                    Ghi chú: {item.note}
                  </p>
                )}
                <div className="flex justify-between items-center mt-2">
                  <div className="flex items-center gap-1.5 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-[var(--radius-sm)] px-2 py-1 shadow-sm font-black">
                    <button
                      onClick={() => handleDecrease(item.food._id)}
                      className="w-5 h-5 rounded-full bg-[var(--bg-card)] text-[var(--text-primary)] border border-[var(--border-color)] flex items-center justify-center hover:bg-[var(--brand-primary)] hover:text-white transition-colors"
                    >
                      <span className="material-symbols-outlined text-[12px]">remove</span>
                    </button>
                    <span className="text-[12px] font-black text-[var(--brand-primary)] w-4 text-center font-sans">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => handleIncrease(item.food)}
                      className="w-5 h-5 rounded-full bg-[#3AA6FF] dark:bg-[#5B9EFF] text-white flex items-center justify-center hover:bg-[#2B96EF] transition-colors"
                    >
                      <span className="material-symbols-outlined text-[12px]">add</span>
                    </button>
                  </div>
                  <button
                    onClick={() => handleRemove(item.food._id)}
                    className="text-[#9CA3AF] hover:text-red-500 text-xs font-extrabold tracking-wider"
                  >
                    Xóa
                  </button>
                </div>
              </div>
            </div>
          ))
        )}

        {/* Upsell Recommendation Section */}
        {cart.length <= 2 && foods.length > 0 && (
          <div className="pt-2 border-t border-[var(--border-color)]">
            <p className="text-[10px] font-semibold uppercase tracking-[0.04em] text-[var(--accent)] mb-2.5 flex items-center gap-1.5">
              <span>Có thể bạn sẽ thích</span>
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
                        <p className="text-xs font-[600] text-[var(--text-primary)] truncate">
                          {recomFood.name}
                        </p>
                        <p className="text-[12px] font-[700] text-[var(--price-color)]">
                          {formatPrice(recomFood.price, lang)}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleIncrease(recomFood)}
                      className="px-2.5 py-1 bg-[var(--brand-primary-muted)] hover:bg-[var(--brand-primary)] text-[var(--brand-primary)] hover:text-white rounded-[var(--radius-sm)] text-[11px] font-[600] transition-all flex items-center gap-0.5 flex-shrink-0 active:scale-95"
                    >
                      <span className="material-symbols-outlined text-[13px]">add</span>
                      <span>Thêm</span>
                    </button>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>

      {/* Checkout Section */}
      <div className="p-4 xl:p-5 bg-[var(--bg-primary)] border-t border-[var(--border-color)] shadow-2xl font-sans">
        {cart.length === 0 && (
          <p className="text-[13px] font-medium text-[var(--text-secondary)] text-center py-3 font-sans">
            Thêm món để tiếp tục thanh toán
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
                placeholder="Mã giảm giá..."
                className="w-full bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl py-2.5 px-3.5 text-xs text-[var(--text-primary)] font-[500] uppercase focus:border-[var(--brand-primary)] outline-none font-sans placeholder-[var(--text-tertiary)]"
              />
            </div>
            <button
              onClick={handleValidateCoupon}
              disabled={isValidatingCoupon || !couponInput.trim() || cart.length === 0}
              className={`px-4 py-2.5 rounded-xl text-xs font-[600] transition-all font-sans ${
                couponInput.trim() && cart.length > 0
                  ? 'bg-[#3AA6FF] hover:bg-[#2B96EF] text-white cursor-pointer shadow-md active:scale-95'
                  : 'bg-[var(--btn-disabled-bg)] text-[var(--btn-disabled-text)] cursor-not-allowed'
              }`}
            >
              {isValidatingCoupon ? '...' : 'Áp dụng'}
            </button>
          </div>
          {couponResult && (
            <p
              className={`text-xs font-semibold mt-2 ${
                couponResult.valid ? 'text-[var(--brand-primary)]' : 'text-red-500'
              }`}
            >
              {couponResult.valid
                ? `Giảm ${new Intl.NumberFormat('vi-VN').format(couponResult.discountAmount)}đ`
                : couponResult.message}
            </p>
          )}

          <div className="border-t border-[var(--border-color)] my-4" />

          {/* Payment Method Selector */}
          <div className="flex gap-3">
            <button
              onClick={() => setPaymentMethod('cash')}
              disabled={cart.length === 0}
              className={`flex-1 h-[48px] text-[13px] font-[600] rounded-[var(--radius-sm)] flex items-center justify-center gap-2 transition-all font-sans ${
                paymentMethod === 'cash'
                  ? 'bg-[#3AA6FF] text-white shadow-md'
                  : 'bg-[var(--payment-inactive-bg)] border-2 border-[var(--payment-inactive-border)] text-[var(--payment-inactive-text)] hover:border-[#3AA6FF] hover:text-[#3AA6FF]'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">payments</span>
              Tiền mặt
            </button>
            <button
              onClick={() => setPaymentMethod('momo')}
              disabled={cart.length === 0}
              className={`flex-1 h-[48px] text-[13px] font-[600] rounded-[var(--radius-sm)] flex items-center justify-center gap-2 transition-all font-sans ${
                paymentMethod === 'momo'
                  ? 'bg-[#A50064] dark:bg-[#D94FAF] text-white shadow-md'
                  : 'bg-[var(--payment-inactive-bg)] border-2 border-[#A50064]/50 dark:border-[#D94FAF]/50 text-[#A50064] dark:text-[#D94FAF] hover:border-[#A50064] dark:hover:border-[#D94FAF] hover:bg-[#A50064]/5'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">qr_code_scanner</span>
              MoMo QR
            </button>
          </div>

          <div className="border-t border-[var(--border-color)] my-4" />

          {/* Summary Details */}
          <div className="space-y-2 mb-5">
            <div className="flex justify-between text-[14px] font-normal text-[var(--text-secondary)] font-sans">
              <span>Tạm tính ({totalQuantity} món)</span>
              <span>{formatPrice(totalAmount, lang)}</span>
            </div>
            {couponResult?.valid && couponResult.discountAmount > 0 && (
              <div className="flex justify-between text-[14px] font-medium text-emerald-600 dark:text-emerald-400 font-sans">
                <span>Khuyến mãi</span>
                <span>-{formatPrice(couponResult.discountAmount, lang)}</span>
              </div>
            )}
            <div className="flex justify-between items-baseline pt-1">
              <span className="text-[14px] font-normal text-[var(--text-primary)] font-sans">
                Tổng cộng
              </span>
              <span className="text-[22px] font-black text-[var(--price-color)] tracking-tight font-sans">
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
          className={`w-full h-[52px] mt-4 rounded-[var(--radius-md)] text-[14px] font-[600] uppercase tracking-[0.04em] flex items-center justify-center transition-all font-sans shadow-md ${
            cart.length === 0
              ? 'bg-[var(--btn-disabled-bg)] text-[var(--btn-disabled-text)] cursor-not-allowed shadow-none'
              : 'bg-[#3AA6FF] hover:bg-[#2B96EF] text-white cursor-pointer active:scale-95 shadow-[0_4px_14px_rgba(58,166,255,0.35)]'
          }`}
        >
          <span>{isSubmitting ? t.submitting : 'GỬI ĐƠN HÀNG NGAY'}</span>
        </button>
      </div>
    </aside>
  );
};
