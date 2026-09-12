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

      const storedName = typeof window !== 'undefined' ? localStorage.getItem('kohi_customer_name') : null;
      const effectiveCustomerName = (customerName && customerName !== 'Khách' && customerName !== 'Bạn')
        ? customerName
        : (storedName || '');

      const badgeText = item.addedBy && item.addedBy !== 'Khách' && item.addedBy !== 'Bạn'
        ? item.addedBy
        : (isMine ? (effectiveCustomerName || (lang === 'en' ? 'You' : lang === 'zh' ? '您' : 'Bạn')) : (lang === 'en' ? 'Companion' : lang === 'zh' ? '同桌' : 'Cùng bàn'));

      return (
        <div
          key={`${item.food._id}_${item.addedByDeviceId || 'local'}`}
          className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 shadow-xs transition-colors"
        >
          <div className="flex justify-between items-start gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h4 className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                  {item.food.name}
                </h4>
                {badgeText && (
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider font-mono ${
                    isMine
                      ? 'bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/30'
                      : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                  }`}>
                    <span className="material-symbols-outlined text-[12px]">{isMine ? 'person' : 'groups'}</span>
                    <span>{badgeText}</span>
                  </span>
                )}
              </div>
              <span className="text-[13px] font-bold text-[#0284c7] dark:text-sky-400 block mt-0.5">
                {formatPrice(effectivePrice, lang)}
              </span>
            </div>
            <button
              onClick={() => handleRemove(item.food._id)}
              className="w-6 h-6 rounded-full text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 flex items-center justify-center transition-all cursor-pointer font-medium text-sm"
              title={lang === 'en' ? 'Remove item' : lang === 'zh' ? '删除' : 'Xóa món'}
            >
              ×
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
                className="w-6 h-6 rounded-full flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-300/80 dark:hover:bg-slate-700 transition-colors active:scale-95 cursor-pointer font-medium text-base leading-none"
                title={lang === 'en' ? 'Decrease' : 'Giảm'}
              >
                −
              </button>
              <span className="text-xs font-semibold text-slate-900 dark:text-white min-w-5 text-center font-mono">
                {item.quantity}
              </span>
              <button
                onClick={() => handleIncrease(item.food)}
                className="w-6 h-6 rounded-full flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-300/80 dark:hover:bg-slate-700 transition-colors active:scale-95 cursor-pointer font-medium text-base leading-none"
                title={lang === 'en' ? 'Increase' : 'Tăng'}
              >
                +
              </button>
            </div>
            <span className="text-xs font-semibold text-slate-900 dark:text-white font-mono">
              {formatPrice(effectivePrice * item.quantity, lang)}
            </span>
          </div>
        </div>
      );
    };

    return (
      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 xl:px-5 py-3 space-y-3 font-sans scrollbar-thin">
        {cart.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6 text-center gap-2">
            <div className="w-12 h-12 rounded-2xl bg-sky-500/10 dark:bg-sky-500/20 text-sky-500 flex items-center justify-center">
              <span className="material-symbols-outlined text-2xl">local_cafe</span>
            </div>
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              {t.emptyCart}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-[220px] leading-relaxed">
              {lang === 'en' ? 'Select drinks from the menu to add to table cart.' : 'Chọn món từ thực đơn để thêm vào giỏ hàng chung của bàn.'}
            </p>
          </div>
        ) : (
          <>
            {/* Section 1: Món của tôi */}
            {myItems.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-sky-600 dark:text-sky-400">
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">person</span>
                    <span>{lang === 'en' ? 'Your Selection' : lang === 'zh' ? '您选择的商品' : 'Món bạn chọn'}</span>
                    <span>({myItems.reduce((acc, i) => acc + i.quantity, 0)})</span>
                  </span>
                  <span className="text-[11px] font-mono text-slate-400">
                    {formatPrice(myItems.reduce((acc, i) => acc + (i.unitPrice ?? i.food.price) * i.quantity, 0), lang)}
                  </span>
                </div>
                {myItems.map(renderSingleItem)}
              </div>
            )}

            {/* Section 2: Món người khác chọn trong nhóm */}
            {othersItems.length > 0 && (
              <div className="space-y-2 pt-2.5 border-t border-slate-200 dark:border-white/10">
                <div className="flex items-center justify-between text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">groups</span>
                    <span>{lang === 'en' ? 'Table Members Selection' : lang === 'zh' ? '同桌成员选择' : 'Món thành viên cùng bàn'}</span>
                    <span>({othersItems.reduce((acc, i) => acc + i.quantity, 0)})</span>
                  </span>
                  <span className="text-[11px] font-mono text-slate-400">
                    {formatPrice(othersItems.reduce((acc, i) => acc + (i.unitPrice ?? i.food.price) * i.quantity, 0), lang)}
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
            <p className="text-[10px] font-semibold uppercase tracking-[0.04em] text-amber-500 dark:text-amber-400 mb-2 flex items-center justify-between">
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-xs">recommend</span>
                <span>{t.suggestedForYou || (lang === 'en' ? 'Recommended For You' : lang === 'zh' ? '猜你喜欢' : 'Gợi ý món nên thử')}</span>
              </span>
            </p>
            <div className="space-y-2">
              {foods
                .filter((f) => !cartMap.has(f._id))
                .slice(0, cart.length === 0 ? 3 : 2)
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
                        <p className="text-xs font-medium text-slate-900 dark:text-white truncate">
                          {recomFood.name}
                        </p>
                        <p className="text-[12px] font-bold text-[#0284c7] dark:text-sky-400">
                          {formatPrice(recomFood.price, lang)}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleIncrease(recomFood)}
                      className="px-2.5 py-1 bg-sky-500/15 dark:bg-sky-500/20 hover:bg-[#38BDF8] text-sky-600 dark:text-sky-400 hover:text-slate-950 dark:hover:text-slate-950 rounded-lg text-[11px] font-semibold transition-all flex items-center gap-1 flex-shrink-0 active:scale-95 cursor-pointer shadow-2xs"
                    >
                      <span>+ {t.addItem || (lang === 'en' ? 'Add' : lang === 'zh' ? '添加' : 'Thêm')}</span>
                    </button>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderCheckoutControls = () => {
    if (cart.length === 0) {
      return (
        <div className="flex-shrink-0 p-3.5 bg-slate-50/80 dark:bg-[#0B0F17]/90 border-t border-slate-200 dark:border-white/10 font-sans pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <div className="flex items-center gap-2.5 p-3 rounded-xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-white/10 shadow-xs text-left">
            <span className="material-symbols-outlined text-2xl text-sky-500 shrink-0">shopping_bag</span>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                {lang === 'en' ? 'Table Cart is Empty' : lang === 'zh' ? '本桌购物车暂无商品' : 'Giỏ hàng bàn chưa có món'}
              </p>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate">
                {lang === 'en' ? 'Pick items from menu to start order' : lang === 'zh' ? '请在菜单中选择商品开始点单' : 'Chọn món bên cạnh để gửi đơn cả bàn'}
              </p>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="flex-shrink-0 p-3.5 xl:p-5 bg-white/95 dark:bg-[#0B0F17]/95 border-t border-slate-200 dark:border-white/10 shadow-lg dark:shadow-2xl font-sans pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        {/* Coupon Input Group */}
        <div className="flex gap-2">
          <div className="flex-1">
            <input
              type="text"
              value={couponInput}
              onChange={(e) => {
                setCouponInput(e.target.value.toUpperCase());
                setCouponResult(null);
              }}
              onKeyDown={(e) => e.key === 'Enter' && handleValidateCoupon()}
              placeholder={t.promoCode ? `${t.promoCode}...` : (lang === 'en' ? 'Promo Code...' : lang === 'zh' ? '优惠码...' : 'Mã giảm giá...')}
              className="w-full bg-slate-100 dark:bg-slate-900/80 border border-slate-200 dark:border-white/10 rounded-xl py-2.5 px-3.5 text-xs text-slate-900 dark:text-white font-medium uppercase focus:border-sky-500 outline-none font-sans placeholder-slate-400 dark:placeholder-slate-500"
            />
          </div>
          <button
            onClick={handleValidateCoupon}
            disabled={isValidatingCoupon || !couponInput.trim()}
            className={`px-4 py-2.5 rounded-xl text-xs font-semibold transition-all font-sans ${
              couponInput.trim()
                ? 'bg-sky-500 text-slate-950 font-semibold cursor-pointer shadow-md hover:bg-sky-400 active:scale-95'
                : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed'
            }`}
          >
            {isValidatingCoupon ? '...' : (t.apply || (lang === 'en' ? 'Apply' : lang === 'zh' ? '应用' : 'Áp dụng'))}
          </button>
        </div>
        {couponResult && (
          <p
            className={`text-xs font-medium mt-2 ${
              couponResult.valid ? 'text-sky-500 dark:text-sky-400' : 'text-rose-500 dark:text-rose-400'
            }`}
          >
            {couponResult.valid
              ? `${lang === 'en' ? 'Discount ' : lang === 'zh' ? '立减 ' : 'Giảm '}${formatPrice(couponResult.discountAmount, lang)}`
              : couponResult.message}
          </p>
        )}

        <div className="border-t border-slate-200 dark:border-white/10 my-3" />

        {/* Payment Method Selector - High Contrast, Clear Interactive State */}
        <div className="flex gap-2">
          <button
            onClick={() => setPaymentMethod('cash')}
            className={`flex-1 h-[44px] px-2 text-xs font-bold uppercase tracking-wider rounded-xl flex items-center justify-center gap-1.5 transition-all font-sans cursor-pointer ${
              paymentMethod === 'cash'
                ? 'bg-[#38BDF8] text-slate-950 shadow-md shadow-sky-500/20 border-2 border-sky-400'
                : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-850 dark:hover:bg-slate-800 border-2 border-slate-300 dark:border-slate-650 text-slate-800 dark:text-slate-200 hover:border-sky-400 shadow-xs'
            }`}
          >
            <span className="material-symbols-outlined text-base">payments</span>
            <span>{t.cash || (lang === 'en' ? 'Cash' : lang === 'zh' ? '现金' : 'Tiền mặt')}</span>
            {paymentMethod === 'cash' && (
              <span className="material-symbols-outlined text-[15px] text-slate-950 font-bold">check_circle</span>
            )}
          </button>
          <button
            onClick={() => setPaymentMethod('bank_transfer')}
            className={`flex-1 h-[44px] px-2 text-xs font-bold uppercase tracking-wider rounded-xl flex items-center justify-center gap-1.5 transition-all font-sans cursor-pointer ${
              paymentMethod === 'bank_transfer' || paymentMethod === 'momo'
                ? 'bg-[#38BDF8] text-slate-950 shadow-md shadow-sky-500/20 border-2 border-sky-400'
                : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-850 dark:hover:bg-slate-800 border-2 border-slate-300 dark:border-slate-650 text-slate-800 dark:text-slate-200 hover:border-sky-400 shadow-xs'
            }`}
          >
            <span className="material-symbols-outlined text-base">qr_code_2</span>
            <span>{t.bankTransfer || (lang === 'en' ? 'Bank QR' : lang === 'zh' ? '银行转账' : 'CK Ngân hàng')}</span>
            {(paymentMethod === 'bank_transfer' || paymentMethod === 'momo') && (
              <span className="material-symbols-outlined text-[15px] text-slate-950 font-bold">check_circle</span>
            )}
          </button>
        </div>

        <div className="border-t border-slate-200 dark:border-white/10 my-3" />

        {/* Summary Details */}
        <div className="space-y-2 mb-4">
          <div className="flex justify-between text-[13.5px] font-normal text-slate-600 dark:text-slate-300 font-sans">
            <span>{t.subtotal || (lang === 'en' ? 'Subtotal' : lang === 'zh' ? '小计' : 'Tạm tính')} ({totalQuantity} {lang === 'en' ? 'items' : lang === 'zh' ? '件' : 'món'})</span>
            <span className="font-semibold text-slate-900 dark:text-white font-mono">{formatPrice(totalAmount, lang)}</span>
          </div>
          {couponResult?.valid && couponResult.discountAmount > 0 && (
            <div className="flex justify-between text-[13.5px] font-semibold text-emerald-600 dark:text-emerald-400 font-sans">
              <span>{lang === 'en' ? 'Discount' : lang === 'zh' ? '优惠' : 'Khuyến mãi'}</span>
              <span className="font-mono">-{formatPrice(couponResult.discountAmount, lang)}</span>
            </div>
          )}
          <div className="flex justify-between items-baseline pt-1">
            <span className="text-[15px] font-bold text-slate-900 dark:text-white font-sans">
              {t.total || (lang === 'en' ? 'Total' : lang === 'zh' ? '总计' : 'Tổng cộng')}
            </span>
            <span className="text-[20px] font-bold text-[#0284c7] dark:text-sky-400 tracking-tight font-sans font-mono">
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

        {/* Pending Order Notice */}
      {hasPendingOrder && (
        <div className="mt-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-400 text-xs font-medium flex items-center gap-2">
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
        className={`w-full h-[52px] mt-2 rounded-xl text-[14px] font-bold uppercase tracking-[0.04em] flex items-center justify-center transition-all font-sans ${
          cart.length === 0 || hasPendingOrder
            ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed shadow-none'
            : 'bg-[#38BDF8] hover:bg-sky-400 text-slate-950 shadow-lg cursor-pointer active:scale-[0.99]'
        }`}
      >
        <span>
          {isSubmitting
            ? t.submitting
            : hasPendingOrder
            ? (lang === 'en' ? 'WAITING FOR APPROVAL...' : lang === 'zh' ? '正在等待确认...' : 'ĐANG CHỜ DUYỆT ĐƠN...')
            : (lang === 'en' ? `SUBMIT TABLE ORDER (${totalQuantity})` : lang === 'zh' ? `提交整桌订单 (${totalQuantity})` : `GỬI ĐƠN CẢ BÀN (${totalQuantity} MÓN)`)}
        </span>
      </button>
    </div>
  );
};

  return (
    <>
      {/* ── DESKTOP CART SIDEBAR ───────────────────────────────────────────── */}
      <aside className="hidden lg:flex w-[320px] xl:w-[360px] h-full flex-col bg-white/95 dark:bg-[#0F172A]/80 backdrop-blur-xl border-l border-slate-200 dark:border-white/10 flex-shrink-0 transition-colors">
        {/* Header */}
        <div className="px-4 xl:px-5 py-4 border-b border-slate-200 dark:border-white/10 flex justify-between items-center bg-white/90 dark:bg-[#0F172A]/90 font-sans">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
              {t.cartTitle}
            </h3>
            <p className="text-[10px] font-semibold text-sky-600 dark:text-sky-400 uppercase tracking-wider mt-0.5 font-mono flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>{lang === 'en' ? 'GROUP TABLE CART' : lang === 'zh' ? '同桌共享购物车' : 'GIỎ HÀNG CHUNG CỦA BÀN'}</span>
            </p>
          </div>
          <div className="bg-sky-50 dark:bg-sky-500/10 border border-sky-500/30 px-3 py-1 rounded-full text-xs font-semibold text-sky-600 dark:text-sky-400 font-mono flex items-center gap-1">
            <span className="material-symbols-outlined text-[15px]">table_bar</span>
            <span>{formatTableName(table?.tableName, lang)}</span>
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
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {t.cartTitle}
                  </h3>
                  <span className="bg-[#38BDF8] text-slate-950 text-xs font-semibold px-2.5 py-0.5 rounded-full shadow-2xs font-mono">
                    {totalQuantity} {lang === 'en' ? 'items' : lang === 'zh' ? '件' : 'món'}
                  </span>
                </div>
                <button
                  onClick={() => setIsCartOpen && setIsCartOpen(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white flex items-center justify-center transition-all cursor-pointer font-medium text-lg leading-none"
                  title="Đóng giỏ hàng"
                >
                  ×
                </button>
              </div>

              {/* Drawer Body */}
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
