'use client';
import { AppIcon } from '@/components/common/DashboardIcon';

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
  rating?: number;
  totalReviews?: number;
  soldCount?: number;
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
  // Keyboard accessibility: Escape key to dismiss mobile drawer
  React.useEffect(() => {
    if (!isCartOpen || !setIsCartOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsCartOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCartOpen, setIsCartOpen]);

  const renderCartItems = () => {
    const storedName = typeof window !== 'undefined' ? localStorage.getItem('kohi_customer_name') : null;
    const effectiveCustomerName = (customerName && customerName !== 'Khách' && customerName !== 'Bạn')
      ? customerName
      : (storedName || '');

    interface CartGroup {
      id: string;
      callerName: string;
      isMine: boolean;
      items: CartItem[];
      totalQuantity: number;
      totalAmount: number;
    }

    const groups: CartGroup[] = [];

    // Group 1: My items (Gom toàn bộ món của bạn vào 1 nhóm)
    const myItems = cart.filter((item) =>
      currentDeviceId ? item.addedByDeviceId === currentDeviceId : true
    );
    if (myItems.length > 0) {
      const myCallerName = (effectiveCustomerName || (lang === 'en' ? 'You' : lang === 'zh' ? '您' : 'Bạn')).trim();
      groups.push({
        id: 'me',
        callerName: myCallerName,
        isMine: true,
        items: myItems,
        totalQuantity: myItems.reduce((acc, i) => acc + i.quantity, 0),
        totalAmount: myItems.reduce((acc, i) => acc + (i.unitPrice ?? i.food.price) * i.quantity, 0),
      });
    }

    // Group 2: Others items grouped by caller (Gom các món của từng người khác vào nhóm riêng)
    const othersItems = cart.filter((item) =>
      currentDeviceId ? item.addedByDeviceId !== currentDeviceId : false
    );
    if (othersItems.length > 0) {
      const othersMap = new Map<string, CartItem[]>();
      for (const item of othersItems) {
        const key = item.addedByDeviceId || item.addedBy || 'other';
        if (!othersMap.has(key)) {
          othersMap.set(key, []);
        }
        othersMap.get(key)!.push(item);
      }

      othersMap.forEach((items, key) => {
        const firstItem = items[0];
        const rawName = firstItem.addedBy && firstItem.addedBy !== 'Khách' && firstItem.addedBy !== 'Bạn'
          ? firstItem.addedBy
          : (lang === 'en' ? 'Companion' : lang === 'zh' ? '同桌' : 'Cùng bàn');
        groups.push({
          id: key,
          callerName: rawName,
          isMine: false,
          items,
          totalQuantity: items.reduce((acc, i) => acc + i.quantity, 0),
          totalAmount: items.reduce((acc, i) => acc + (i.unitPrice ?? i.food.price) * i.quantity, 0),
        });
      });
    }

    const renderSingleItem = (item: CartItem) => {
      const effectivePrice = item.unitPrice ?? item.food.price;

      return (
        <div
          key={`${item.food._id}_${item.addedByDeviceId || 'local'}`}
          className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 shadow-xs transition-colors"
        >
          <div className="flex items-start gap-3">
            {/* Food Thumbnail Image */}
            <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-200 dark:bg-slate-950 relative flex-shrink-0 border border-slate-200/60 dark:border-white/10 flex items-center justify-center">
              {item.food.image ? (
                <Image
                  src={item.food.image}
                  alt={item.food.name}
                  fill
                  sizes="48px"
                  className="object-cover"
                />
              ) : (
                <AppIcon name="local_cafe" className="text-slate-400 text-lg" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-start gap-1">
                <h4 className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                  {item.food.name}
                </h4>
                <button
                  onClick={() => handleRemove(item.food._id)}
                  className="w-5 h-5 rounded-full text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 flex items-center justify-center transition-all cursor-pointer font-medium text-sm -mr-1 -mt-0.5 flex-shrink-0"
                  title={lang === 'en' ? `Remove ${item.food.name}` : lang === 'zh' ? `删除 ${item.food.name}` : `Xóa món ${item.food.name}`}
                  aria-label={lang === 'en' ? `Remove ${item.food.name}` : lang === 'zh' ? `删除 ${item.food.name}` : `Xóa món ${item.food.name}`}
                >
                  ×
                </button>
              </div>
              <span className="text-[13px] font-bold text-[#0284c7] dark:text-sky-400 block mt-0.5">
                {formatPrice(effectivePrice, lang)}
              </span>
            </div>
          </div>

          {item.note && (
            <p className="text-[12px] font-normal text-slate-500 dark:text-slate-400 line-clamp-1 italic mt-1.5 pl-0.5">
              {lang === 'en' ? 'Note:' : lang === 'zh' ? '备注:' : 'Ghi chú:'} {item.note}
            </p>
          )}

          <div className="flex justify-between items-center mt-2.5">
            <div className="flex items-center gap-2 bg-slate-200/80 dark:bg-slate-800/80 border border-slate-300/70 dark:border-white/10 rounded-full px-2 py-1 shadow-xs">
              <button
                onClick={() => handleDecrease(item.food._id)}
                className="w-6 h-6 rounded-full flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-300/80 dark:hover:bg-slate-700 transition-colors active:scale-95 cursor-pointer font-medium text-base leading-none"
                title={lang === 'en' ? `Decrease quantity for ${item.food.name}` : `Giảm số lượng ${item.food.name}`}
                aria-label={lang === 'en' ? `Decrease quantity for ${item.food.name}` : `Giảm số lượng ${item.food.name}`}
              >
                −
              </button>
              <span className="text-xs font-semibold text-slate-900 dark:text-white min-w-5 text-center font-mono" role="status" aria-label={`${item.quantity} ${item.food.name}`}>
                {item.quantity}
              </span>
              <button
                onClick={() => handleIncrease(item.food)}
                className="w-6 h-6 rounded-full flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-300/80 dark:hover:bg-slate-700 transition-colors active:scale-95 cursor-pointer font-medium text-base leading-none"
                title={lang === 'en' ? `Increase quantity for ${item.food.name}` : `Tăng số lượng ${item.food.name}`}
                aria-label={lang === 'en' ? `Increase quantity for ${item.food.name}` : `Tăng số lượng ${item.food.name}`}
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
              <AppIcon name="local_cafe" className="text-2xl" />
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
            {groups.map((group, groupIdx) => (
              <div
                key={group.id}
                className={`space-y-2 ${groupIdx > 0 ? 'pt-3 border-t border-slate-200 dark:border-white/10' : ''}`}
              >
                {/* Group Header: Badge (NO ICON) + Quantity + Group Subtotal */}
                <div className="flex items-center justify-between text-xs font-semibold">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span
                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider font-mono truncate max-w-[140px] ${
                        group.isMine
                          ? 'bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/30'
                          : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                      }`}
                    >
                      {group.callerName}
                    </span>
                    <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 whitespace-nowrap">
                      {group.isMine ? (lang === 'en' ? '(You)' : '(Bạn)') : (lang === 'en' ? '(Companion)' : '(Cùng bàn)')} ({group.totalQuantity})
                    </span>
                  </div>
                  <span className="text-[11px] font-mono font-bold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                    {formatPrice(group.totalAmount, lang)}
                  </span>
                </div>

                {/* Items in this group */}
                {group.items.map(renderSingleItem)}
              </div>
            ))}
          </>
        )}

        {/* Upsell Recommendation Section */}
        {cart.length <= 2 && foods.length > 0 && (
          <div className="pt-2 border-t border-slate-200 dark:border-white/10">
            <p className="text-[10px] font-semibold uppercase tracking-[0.04em] text-amber-500 dark:text-amber-400 mb-2 flex items-center justify-between">
              <span className="flex items-center gap-1">
                <AppIcon name="recommend" className="text-xs" />
                <span>{t.suggestedForYou || (lang === 'en' ? 'Recommended For You' : lang === 'zh' ? '猜你喜欢' : 'Gợi ý món nên thử')}</span>
              </span>
            </p>
            <div className="space-y-2">
              {foods
                .filter((f) => f.isAvailable !== false && (f as any).available !== false && !cartMap.has(f._id))
                .slice(0, cart.length === 0 ? 3 : 2)
                .map((recomFood) => (
                  <div
                    key={recomFood._id}
                    className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 shadow-xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-200 dark:bg-slate-950 relative flex-shrink-0">
                        <Image
                          src={recomFood.image}
                          alt={recomFood.name}
                          fill
                          unoptimized={Boolean(recomFood.image?.startsWith('data:') || recomFood.image?.startsWith('blob:'))}
                          className="object-cover"
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-slate-900 dark:text-white truncate">
                          {recomFood.name}
                        </p>
                        <p className="text-[13px] font-extrabold text-[#0284c7] dark:text-[#38BDF8] font-sans tracking-tight">
                          {formatPrice(recomFood.price, lang)}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleIncrease(recomFood)}
                      className="px-3.5 py-1.5 bg-sky-500 hover:bg-sky-600 dark:bg-sky-500 dark:hover:bg-sky-400 text-white rounded-xl text-xs font-extrabold transition-all flex items-center gap-1 flex-shrink-0 active:scale-95 cursor-pointer shadow-xs hover:shadow-md hover:shadow-sky-500/25 min-h-[32px]"
                    >
                      <span className="text-white">+ {t.addItem || (lang === 'en' ? 'Add' : lang === 'zh' ? '添加' : 'Thêm')}</span>
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
            <AppIcon name="shopping_bag" className="text-2xl text-sky-500 shrink-0" />
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

    // Tự động tặng & áp dụng mã giảm giá 10% khi tổng đơn >= 300.000đ
    const isEligibleAutoDiscount = totalAmount >= 300000;
    const autoDiscountAmount = isEligibleAutoDiscount ? Math.round(totalAmount * 0.1) : 0;

    // Ưu tiên mã khách chủ động nhập nếu hợp lệ và có số tiền giảm > 0
    const hasManualCoupon = Boolean(couponResult?.valid && couponResult.discountAmount > 0);
    const effectiveDiscount = hasManualCoupon ? couponResult!.discountAmount : autoDiscountAmount;
    const isAutoDiscountApplied = isEligibleAutoDiscount && !hasManualCoupon;
    const finalCalculatedTotal = Math.max(0, totalAmount - effectiveDiscount);

    return (
      <div className="flex-shrink-0 max-h-[60vh] sm:max-h-none overflow-y-auto p-3.5 xl:p-5 bg-white/95 dark:bg-[#0B0F17]/95 border-t border-slate-200 dark:border-white/10 shadow-lg dark:shadow-2xl font-sans pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        {/* Auto 10% Voucher Banner when >= 300k */}
        {isAutoDiscountApplied && (
          <div className="mb-2.5 p-2.5 rounded-xl bg-gradient-to-r from-sky-500/15 via-blue-500/15 to-indigo-500/15 border border-sky-500/30 text-sky-700 dark:text-sky-300 text-xs font-semibold flex items-center gap-2">
            <AppIcon name="redeem" className="text-base text-sky-500 shrink-0" />
            <span className="leading-snug">
              {lang === 'en'
                ? 'Orders > 300k get 10% OFF automatically applied to bill!'
                : lang === 'zh'
                ? '满30万立减10%，已自动抵扣至账单！'
                : 'Đơn hàng > 300k: Tự động tặng mã giảm 10% áp dụng luôn vào hóa đơn!'}
            </span>
          </div>
        )}

        {/* Progress incentive hint when < 300k */}
        {!isEligibleAutoDiscount && totalAmount > 0 && (
          <div className="mb-2.5 px-2.5 py-1.5 rounded-xl bg-sky-500/5 dark:bg-sky-500/10 border border-sky-500/20 text-[11px] text-slate-600 dark:text-slate-300 flex items-center justify-between font-sans">
            <span className="truncate pr-1">
              {lang === 'en'
                ? `Add ${formatPrice(300000 - totalAmount, lang)} to get 10% OFF auto applied!`
                : lang === 'zh'
                ? `还差 ${formatPrice(300000 - totalAmount, lang)} 即可立减10%！`
                : `Gọi thêm ${formatPrice(300000 - totalAmount, lang)} để được tặng mã giảm 10%!`}
            </span>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-[#38BDF8] text-slate-950 font-mono shrink-0">
              TẶNG 10%
            </span>
          </div>
        )}

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
              aria-label={lang === 'en' ? 'Promo or discount code' : lang === 'zh' ? '优惠码' : 'Mã giảm giá'}
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

        {/* Payment Method Selector - Modern Segmented Control */}
        <div
          className="p-1 bg-slate-100 dark:bg-[#090D16] rounded-2xl border border-slate-200/80 dark:border-white/10 flex gap-1 font-sans shadow-inner"
          role="radiogroup"
          aria-label={lang === 'en' ? 'Payment method' : lang === 'zh' ? '支付方式' : 'Phương thức thanh toán'}
        >
          <button
            type="button"
            role="radio"
            aria-checked={paymentMethod === 'cash'}
            aria-label={lang === 'en' ? 'Pay with cash' : lang === 'zh' ? '现金支付' : 'Thanh toán tiền mặt'}
            onClick={() => setPaymentMethod('cash')}
            className={`flex-1 h-[42px] px-3 text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-[0.98] ${
              paymentMethod === 'cash'
                ? 'bg-sky-50 dark:bg-sky-500/15 text-[#0284c7] dark:text-[#38BDF8] border border-sky-200 dark:border-sky-500/30 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-white/5 border border-transparent'
            }`}
          >
            <AppIcon name="payments" className={`text-[18px] transition-transform ${
                paymentMethod === 'cash' ? 'text-[#0284c7] dark:text-[#38BDF8] scale-105' : 'text-slate-400 dark:text-slate-500'
              }`}
              aria-hidden="true" />
            <span className="font-sans whitespace-nowrap">{t.cash || (lang === 'en' ? 'Cash' : lang === 'zh' ? '现金' : 'Tiền mặt')}</span>
          </button>

          <button
            type="button"
            role="radio"
            aria-checked={paymentMethod === 'bank_transfer' || paymentMethod === 'momo'}
            aria-label={lang === 'en' ? 'Pay with bank transfer QR' : lang === 'zh' ? '银行转账扫码' : 'Thanh toán Chuyển khoản QR'}
            onClick={() => setPaymentMethod('bank_transfer')}
            className={`flex-1 h-[42px] px-3 text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-[0.98] ${
              paymentMethod === 'bank_transfer' || paymentMethod === 'momo'
                ? 'bg-sky-50 dark:bg-sky-500/15 text-[#0284c7] dark:text-[#38BDF8] border border-sky-200 dark:border-sky-500/30 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-white/5 border border-transparent'
            }`}
          >
            <AppIcon name="qr_code_2" className={`text-[18px] transition-transform ${
                paymentMethod === 'bank_transfer' || paymentMethod === 'momo'
                  ? 'text-[#0284c7] dark:text-[#38BDF8] scale-105'
                  : 'text-slate-400 dark:text-slate-500'
              }`}
              aria-hidden="true" />
            <span className="font-sans whitespace-nowrap">{t.bankTransfer || (lang === 'en' ? 'Bank QR' : lang === 'zh' ? '银行转账' : 'CK Ngân hàng')}</span>
          </button>
        </div>

        <div className="border-t border-slate-200 dark:border-white/10 my-3" />

        {/* Summary Details */}
        <div className="space-y-2 mb-4">
          <div className="flex justify-between text-[13.5px] font-normal text-slate-600 dark:text-slate-300 font-sans">
            <span>{t.subtotal || (lang === 'en' ? 'Subtotal' : lang === 'zh' ? '小计' : 'Tạm tính')} ({totalQuantity} {lang === 'en' ? 'items' : lang === 'zh' ? '件' : 'món'})</span>
            <span className="font-semibold text-slate-900 dark:text-white font-mono">{formatPrice(totalAmount, lang)}</span>
          </div>
          {effectiveDiscount > 0 && (
            <div className="flex justify-between text-[13.5px] font-semibold text-emerald-600 dark:text-emerald-400 font-sans">
              <span>
                {hasManualCoupon
                  ? `${lang === 'en' ? 'Discount' : lang === 'zh' ? '优惠' : 'Khuyến mãi'} (${couponInput})`
                  : (lang === 'en' ? 'Promo 10% (>300k)' : lang === 'zh' ? '满30万立减10%' : 'Tặng mã 10% (Đơn > 300k)')}
              </span>
              <span className="font-mono">-{formatPrice(effectiveDiscount, lang)}</span>
            </div>
          )}
          <div className="flex justify-between items-baseline pt-1">
            <span className="text-[15px] font-bold text-slate-900 dark:text-white font-sans">
              {t.total || (lang === 'en' ? 'Total' : lang === 'zh' ? '总计' : 'Tổng cộng')}
            </span>
            <span className="text-[20px] font-bold text-[#0284c7] dark:text-sky-400 tracking-tight font-sans font-mono">
              {formatPrice(finalCalculatedTotal, lang)}
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
            : effectiveDiscount > 0
            ? (lang === 'en' ? `SUBMIT TABLE ORDER (${totalQuantity}) • -10% OFF` : lang === 'zh' ? `提交整桌订单 (${totalQuantity}) • 立减10%` : `GỬI ĐƠN CẢ BÀN (${totalQuantity} MÓN) • GIẢM 10%`)
            : (lang === 'en' ? `SUBMIT TABLE ORDER (${totalQuantity})` : lang === 'zh' ? `提交整桌订单 (${totalQuantity})` : `GỬI ĐƠN CẢ BÀN (${totalQuantity} MÓN)`)}
        </span>
      </button>
    </div>
  );
};

  return (
    <>
      {/* ── DESKTOP CART SIDEBAR ───────────────────────────────────────────── */}
      <aside className="hidden lg:flex w-[320px] xl:w-[360px] h-full flex-col bg-white/95 dark:bg-[#0d1322]/95 backdrop-blur-xl border-l border-slate-200/80 dark:border-white/5 flex-shrink-0 transition-colors">
        {/* Header */}
        <div className="px-4 xl:px-5 py-4 border-b border-slate-200/80 dark:border-white/5 flex justify-between items-center bg-white/95 dark:bg-[#0d1322]/95 font-sans">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
              {t.cartTitle}
            </h3>
            <p className="text-[10px] font-semibold text-[#0284c7] dark:text-[#38BDF8] uppercase tracking-wider mt-0.5 font-mono flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>{lang === 'en' ? 'GROUP TABLE CART' : lang === 'zh' ? '同桌共享购物车' : 'GIỎ HÀNG CHUNG CỦA BÀN'}</span>
            </p>
          </div>
          <div className="bg-sky-500/10 border border-sky-500/25 px-3 py-1 rounded-full text-xs font-bold text-[#0284c7] dark:text-[#38BDF8] font-mono">
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
              role="dialog"
              aria-modal="true"
              aria-labelledby="mobile-cart-title"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="fixed bottom-0 inset-x-0 z-50 h-[85dvh] max-h-[85dvh] bg-white dark:bg-[#0d1322] rounded-t-[32px] border-t border-slate-200/80 dark:border-white/5 shadow-2xl flex flex-col font-sans lg:hidden overflow-hidden text-left"
            >
              {/* Drawer Handle */}
              <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto my-2.5 flex-shrink-0 opacity-70" aria-hidden="true" />

              {/* Mobile Drawer Header */}
              <div className="px-5 py-3 border-b border-slate-200/80 dark:border-white/5 flex justify-between items-center bg-white dark:bg-[#0d1322] flex-shrink-0">
                <div className="flex items-center gap-2">
                  <h3 id="mobile-cart-title" className="text-base font-bold text-slate-900 dark:text-white">
                    {t.cartTitle}
                  </h3>
                  <span className="bg-[#38BDF8] text-slate-950 text-xs font-black px-2.5 py-0.5 rounded-full shadow-2xs font-mono" aria-label={`${totalQuantity} ${lang === 'en' ? 'items' : lang === 'zh' ? '件' : 'món'}`}>
                    {totalQuantity} {lang === 'en' ? 'items' : lang === 'zh' ? '件' : 'món'}
                  </span>
                </div>
                <button
                  onClick={() => setIsCartOpen && setIsCartOpen(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white flex items-center justify-center transition-all cursor-pointer font-medium text-lg leading-none active:scale-95"
                  title={lang === 'en' ? 'Close cart' : lang === 'zh' ? '关闭购物车' : 'Đóng giỏ hàng'}
                  aria-label={lang === 'en' ? 'Close cart' : lang === 'zh' ? '关闭购物车' : 'Đóng giỏ hàng'}
                >
                  <AppIcon name="close" className="text-lg" aria-hidden="true" />
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
