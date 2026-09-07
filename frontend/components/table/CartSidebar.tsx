'use client';

import React from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { formatTableName } from '@/utils/format';

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
  paymentMethod: 'cash' | 'momo' | 'bank_transfer' | string;
  setPaymentMethod: (m: 'cash' | 'bank_transfer' | 'momo') => void;
  handleSubmitOrder: () => void;
  isSubmitting: boolean;
  t: any;
  isCartOpen?: boolean;
  setIsCartOpen?: (open: boolean) => void;
  currentDeviceId?: string;
  customerName?: string;
  hasPendingOrder?: boolean;
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
  hasPendingOrder = false,
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

      const badgeText = item.addedBy && item.addedBy !== 'Khách' && item.addedBy !== 'Bạn'
        ? item.addedBy
        : (isMine ? (customerName || (lang === 'en' ? 'You' : lang === 'zh' ? '您' : 'Bạn')) : (lang === 'en' ? 'Other' : lang === 'zh' ? '同桌' : 'Người gọi'));

      return (
        <div
          key={`${item.food._id}_${item.addedByDeviceId || 'local'}`}
          className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 shadow-xs transition-colors"
        >
          <div className="flex justify-between items-start gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                  {item.food.name}
                </h4>
                {badgeText && (
                  <span className="px-1.5 py-0.5 rounded-lg text-[10px] font-extrabold bg-blue-500/20 text-blue-500 dark:text-blue-400 flex items-center flex-shrink-0 font-sans">
                    <span>{badgeText}</span>
                  </span>
                )}
              </div>
              <span className="text-[13px] font-extrabold text-[#0284c7] dark:text-sky-400 block mt-0.5">
                {formatPrice(effectivePrice, lang)}
              </span>
            </div>
            <button
              onClick={() => handleRemove(item.food._id)}
              className="w-7 h-7 rounded-full text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 flex items-center justify-center transition-all cursor-pointer active:scale-95"
              title={lang === 'en' ? 'Remove item' : lang === 'zh' ? '删除' : 'Xóa món'}
            >
              <span className="material-symbols-outlined text-base">close</span>
            </button>
          </div>
          {item.note && (
            <p className="text-[12px] font-normal text-slate-500 dark:text-slate-400 line-clamp-1 italic mt-1">
              {lang === 'en' ? 'Note:' : lang === 'zh' ? '备注:' : 'Ghi chú:'} {item.note}
            </p>
          )}
          <div className="flex justify-between items-center mt-2.5">
            <div className="flex items-center gap-2 bg-slate-200/80 dark:bg-slate-800/80 border border-slate-300/70 dark:border-white/10 rounded-full px-2 py-1 shadow-xs">
              <button
                onClick={() => handleDecrease(item.food._id)}
                className="w-7 h-7 rounded-full flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-300/80 dark:hover:bg-slate-700 transition-colors active:scale-95 cursor-pointer"
                title={lang === 'en' ? 'Decrease' : 'Giảm'}
              >
                <span className="material-symbols-outlined text-sm">remove</span>
              </button>
              <span className="text-xs font-black text-slate-900 dark:text-white min-w-5 text-center">
                {item.quantity}
              </span>
              <button
                onClick={() => handleIncrease(item.food)}
                className="w-7 h-7 rounded-full flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-300/80 dark:hover:bg-slate-700 transition-colors active:scale-95 cursor-pointer"
                title={lang === 'en' ? 'Increase' : 'Tăng'}
              >
                <span className="material-symbols-outlined text-sm">add</span>
              </button>
            </div>
            <span className="text-xs font-black text-slate-900 dark:text-white">
              {formatPrice(effectivePrice * item.quantity, lang)}
            </span>
          </div>
        </div>
      );
    };

    return (
      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 xl:px-5 py-3 space-y-3 font-sans scrollbar-thin">
        {cart.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center gap-2">
            <span className="material-symbols-outlined text-4xl text-slate-400 dark:text-slate-500">
              shopping_bag
            </span>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              {t.emptyCart}
            </p>
          </div>
        ) : (
          <>
            {/* Section 1: Món của tôi */}
            {myItems.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-extrabold text-blue-500 dark:text-blue-400">
                  <span>
                    {lang === 'en' ? 'Your Selection' : lang === 'zh' ? '您选择的商品' : 'Món bạn chọn'} ({myItems.reduce((acc, i) => acc + i.quantity, 0)})
                  </span>
                </div>
                {myItems.map(renderSingleItem)}
              </div>
            )}

            {/* Section 2: Món người khác chọn trong nhóm */}
            {othersItems.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-white/10">
                <div className="flex items-center gap-1.5 text-xs font-extrabold text-emerald-500 dark:text-emerald-400">
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
          <div className="pt-2 border-t border-slate-200 dark:border-white/10">
            <p className="text-[10px] font-bold uppercase tracking-[0.04em] text-amber-500 dark:text-amber-400 mb-2.5 flex items-center gap-1.5">
              <span>{t.suggestedForYou || (lang === 'en' ? 'You Might Also Like' : lang === 'zh' ? '猜你喜欢' : 'Có thể bạn sẽ thích')}</span>
            </p>
            <div className="space-y-2">
              {foods
                .filter((f) => !cartMap.has(f._id))
                .slice(0, 2)
                .map((recomFood) => (
                  <div
                    key={recomFood._id}
                    className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 shadow-xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-200 dark:bg-slate-950 relative flex-shrink-0">
                        <Image src={recomFood.image} alt={recomFood.name} fill className="object-cover" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {recomFood.name}
                        </p>
                        <p className="text-[12px] font-extrabold text-[#0284c7] dark:text-sky-400">
                          {formatPrice(recomFood.price, lang)}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleIncrease(recomFood)}
                      className="px-2.5 py-1 bg-blue-500/15 dark:bg-blue-500/20 hover:bg-[#3B82F6] text-blue-600 dark:text-blue-400 hover:text-white rounded-lg text-[11px] font-bold transition-all flex items-center gap-0.5 flex-shrink-0 active:scale-95 cursor-pointer"
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
    <div className="flex-shrink-0 p-3.5 xl:p-5 bg-white/95 dark:bg-[#0B0F17]/95 border-t border-slate-200 dark:border-white/10 shadow-lg dark:shadow-2xl font-sans pb-[max(0.75rem,env(safe-area-inset-bottom))]">
      {cart.length === 0 && (
        <p className="text-[13px] font-medium text-slate-500 dark:text-slate-400 text-center py-2 font-sans">
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
              className="w-full bg-slate-100 dark:bg-slate-900/80 border border-slate-200 dark:border-white/10 rounded-xl py-2.5 px-3.5 text-xs text-slate-900 dark:text-white font-medium uppercase focus:border-blue-500 outline-none font-sans placeholder-slate-400 dark:placeholder-slate-500"
            />
          </div>
          <button
            onClick={handleValidateCoupon}
            disabled={isValidatingCoupon || !couponInput.trim() || cart.length === 0}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all font-sans ${
              couponInput.trim() && cart.length > 0
                ? 'uiverse-btn cursor-pointer shadow-md'
                : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed'
            }`}
          >
            {isValidatingCoupon ? '...' : (t.apply || (lang === 'en' ? 'Apply' : lang === 'zh' ? '应用' : 'Áp dụng'))}
          </button>
        </div>
        {couponResult && (
          <p
            className={`text-xs font-semibold mt-2 ${
              couponResult.valid ? 'text-blue-500 dark:text-blue-400' : 'text-rose-500 dark:text-rose-400'
            }`}
          >
            {couponResult.valid
              ? `${lang === 'en' ? 'Discount ' : lang === 'zh' ? '立减 ' : 'Giảm '}${formatPrice(couponResult.discountAmount, lang)}`
              : couponResult.message}
          </p>
        )}

        <div className="border-t border-slate-200 dark:border-white/10 my-3" />

        {/* Payment Method Selector */}
        <div className="flex gap-3">
          <button
            onClick={() => setPaymentMethod('cash')}
            disabled={cart.length === 0}
            className={`flex-1 h-[44px] text-[13px] font-bold rounded-xl flex items-center justify-center gap-2 transition-all font-sans cursor-pointer ${
              paymentMethod === 'cash'
                ? 'bg-[#3B82F6] text-white shadow-md'
                : 'bg-slate-100 dark:bg-slate-900/70 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:border-blue-500/50 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">payments</span>
            {t.cash || (lang === 'en' ? 'Cash' : lang === 'zh' ? '现金' : 'Tiền mặt')}
          </button>
          <button
            onClick={() => setPaymentMethod('bank_transfer')}
            disabled={cart.length === 0}
            className={`flex-1 h-[44px] text-[13px] font-bold rounded-xl flex items-center justify-center gap-2 transition-all font-sans cursor-pointer ${
              paymentMethod === 'bank_transfer' || paymentMethod === 'momo'
                ? 'bg-[#3B82F6] text-white shadow-md'
                : 'bg-slate-100 dark:bg-slate-900/70 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:border-blue-500/50 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">account_balance</span>
            {t.bankTransfer || (lang === 'en' ? 'Bank QR' : lang === 'zh' ? '银行转账' : 'CK Ngân hàng')}
          </button>
        </div>

        <div className="border-t border-slate-200 dark:border-white/10 my-3" />

        {/* Summary Details */}
        <div className="space-y-2 mb-4">
          <div className="flex justify-between text-[13.5px] font-medium text-slate-600 dark:text-slate-300 font-sans">
            <span>{t.subtotal || (lang === 'en' ? 'Subtotal' : lang === 'zh' ? '小计' : 'Tạm tính')} ({totalQuantity} {lang === 'en' ? 'items' : lang === 'zh' ? '件' : 'món'})</span>
            <span className="font-bold text-slate-900 dark:text-white">{formatPrice(totalAmount, lang)}</span>
          </div>
          {couponResult?.valid && couponResult.discountAmount > 0 && (
            <div className="flex justify-between text-[13.5px] font-bold text-emerald-600 dark:text-emerald-400 font-sans">
              <span>{lang === 'en' ? 'Discount' : lang === 'zh' ? '优惠' : 'Khuyến mãi'}</span>
              <span>-{formatPrice(couponResult.discountAmount, lang)}</span>
            </div>
          )}
          <div className="flex justify-between items-baseline pt-1">
            <span className="text-[15px] font-black text-slate-900 dark:text-white font-sans">
              {t.total || (lang === 'en' ? 'Total' : lang === 'zh' ? '总计' : 'Tổng cộng')}
            </span>
            <span className="text-[22px] font-black text-[#0284c7] dark:text-sky-400 tracking-tight font-sans">
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

      {/* Pending Order Notice */}
      {hasPendingOrder && (
        <div className="mt-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-400 text-xs font-bold flex items-center gap-2.5">
          <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping shrink-0" />
          <span>
            {lang === 'en'
              ? 'An order is pending staff approval. Please wait a moment before adding more!'
              : lang === 'zh'
              ? '当前桌位有一笔订单等待服务员确认中，请稍候再加点！'
              : 'Bàn đang có 1 đơn chờ nhân viên xác nhận. Vui lòng đợi trong giây lát!'}
          </span>
        </div>
      )}

      {/* Submit CTA Button */}
      <button
        onClick={handleSubmitOrder}
        disabled={cart.length === 0 || isSubmitting || hasPendingOrder}
        className={`w-full h-[52px] mt-2 rounded-xl text-[14px] font-black uppercase tracking-[0.04em] flex items-center justify-center transition-all font-sans shadow-md ${
          cart.length === 0 || hasPendingOrder
            ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed shadow-none'
            : 'uiverse-btn shadow-lg'
        }`}
      >
        <span>
          {isSubmitting
            ? t.submitting
            : hasPendingOrder
            ? (lang === 'en' ? 'WAITING FOR APPROVAL...' : lang === 'zh' ? '正在等待确认...' : 'ĐANG CHỜ DUYỆT ĐƠN...')
            : (t.checkoutBtn || (lang === 'en' ? 'CONFIRM ORDER' : lang === 'zh' ? '确认提交订单' : 'XÁC NHẬN GỌI MÓN'))}
        </span>
      </button>
    </div>
  );

  return (
    <>
      {/* ── DESKTOP CART SIDEBAR ───────────────────────────────────────────── */}
      <aside className="hidden lg:flex w-[320px] xl:w-[360px] h-full flex-col bg-white/95 dark:bg-[#0F172A]/80 backdrop-blur-xl border-l border-slate-200 dark:border-white/10 flex-shrink-0 transition-colors">
        {/* Header */}
        <div className="px-4 xl:px-5 py-4 border-b border-slate-200 dark:border-white/10 flex justify-between items-center bg-white/90 dark:bg-[#0F172A]/90 font-sans">
          <div>
            <h3 className="text-base font-black text-slate-900 dark:text-white leading-tight">
              {t.cartTitle}
            </h3>
            <p className="text-[10px] font-extrabold text-blue-500 dark:text-blue-400 uppercase tracking-wider mt-0.5">
              {lang === 'en' ? 'TABLE DINE-IN ORDER' : lang === 'zh' ? '堂食订单' : 'ĐƠN HÀNG TẠI BÀN'}
            </p>
          </div>
          <div className="bg-blue-50 dark:bg-slate-900/80 border border-blue-500/30 px-3 py-1 rounded-full text-xs font-bold text-blue-600 dark:text-blue-400">
            {formatTableName(table?.tableName, lang)}
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
              className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs lg:hidden"
            />

            {/* Bottom Sheet Modal */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="fixed bottom-0 inset-x-0 z-50 h-[85dvh] max-h-[85dvh] bg-white dark:bg-[#0F172A] rounded-t-[28px] border-t border-slate-200 dark:border-white/10 shadow-2xl flex flex-col font-sans lg:hidden overflow-hidden text-left"
            >
              {/* Drawer Handle */}
              <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto my-2.5 flex-shrink-0" />

              {/* Mobile Drawer Header */}
              <div className="px-5 py-2.5 border-b border-slate-200 dark:border-white/10 flex justify-between items-center bg-white dark:bg-[#0F172A] flex-shrink-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    {t.cartTitle}
                  </h3>
                  <span className="bg-[#3B82F6] text-white text-xs font-black px-2.5 py-0.5 rounded-full shadow-2xs font-sans">
                    {totalQuantity} {lang === 'en' ? 'items' : lang === 'zh' ? '件' : 'món'}
                  </span>
                </div>
                <button
                  onClick={() => setIsCartOpen && setIsCartOpen(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white flex items-center justify-center transition-all cursor-pointer active:scale-95"
                  title="Đóng giỏ hàng"
                >
                  <span className="material-symbols-outlined text-lg">close</span>
                </button>
              </div>

              {/* Drawer Body (Scrollable Cart Items directly without double scroll deadlock) */}
              {renderCartItems()}

              {/* Drawer Footer Controls */}
              {renderCheckoutControls()}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};
