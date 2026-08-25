'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

interface FoodReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: any | null;
  tableId: string;
  formatPrice: (price: number, lang: any) => string;
  lang?: any;
}

export const FoodReviewModal: React.FC<FoodReviewModalProps> = ({
  isOpen,
  onClose,
  order,
  tableId,
  formatPrice,
  lang = 'vi',
}) => {
  const [overallStar, setOverallStar] = useState<number>(5);
  const [overallComment, setOverallComment] = useState<string>('');
  const [foodStars, setFoodStars] = useState<Record<string, number>>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isSubmittedSuccess, setIsSubmittedSuccess] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen || !order) return null;

  const items = order.items || [];

  const getItemFoodId = (item: any): string => {
    if (typeof item.foodId === 'object' && item.foodId?._id) return item.foodId._id;
    if (typeof item.foodId === 'string') return item.foodId;
    if (item.food?._id) return item.food._id;
    return '';
  };

  const getItemName = (item: any): string => {
    if (item.food?.name) return item.food.name;
    if (typeof item.foodId === 'object' && item.foodId?.name) return item.foodId.name;
    if (item.foodName) return item.foodName;
    if (item.name) return item.name;
    return 'Món ăn';
  };

  const handleStarClick = (foodId: string, star: number) => {
    setFoodStars((prev) => ({ ...prev, [foodId]: star }));
  };

  const handleSubmit = async () => {
    if (!order?._id || !tableId) return;
    setIsSubmitting(true);
    setErrorMsg(null);

    const ratings = items.map((item: any) => {
      const foodId = getItemFoodId(item);
      return {
        foodId,
        star: foodStars[foodId] || overallStar,
      };
    }).filter((r: any) => Boolean(r.foodId));

    const payload = {
      orderId: order._id,
      tableId,
      overallStar,
      overallComment: overallComment.trim() || undefined,
      ratings,
    };

    try {
      const res = await fetch(`${API_BASE}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || 'Không thể gửi đánh giá');
      }

      localStorage.setItem(`reviewed_order_${order._id}`, 'true');
      setIsSubmittedSuccess(true);
    } catch (err: any) {
      setErrorMsg(err.message || 'Đã có lỗi xảy ra khi gửi đánh giá');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 select-none">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/75 backdrop-blur-sm"
        />

        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          className="relative w-full max-w-lg bg-[#FFFFFF] dark:bg-[#181B21] border border-[var(--border-color)] rounded-[var(--radius-lg)] p-5 sm:p-6 shadow-2xl z-10 max-h-[90vh] flex flex-col font-sans overflow-hidden text-left"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3 mb-4 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center border border-amber-500/20">
                <span className="material-symbols-outlined text-xl">star</span>
              </div>
              <div>
                <h3 className="text-lg font-bold text-[var(--text-primary)] leading-tight">
                  {lang === 'en' ? 'Rate Experience & Items' : lang === 'zh' ? '评价体验与商品' : 'Đánh giá trải nghiệm & Món ăn'}
                </h3>
                <p className="text-xs font-medium text-[var(--text-secondary)] mt-0.5">
                  {lang === 'en' ? 'Order #' : lang === 'zh' ? '订单 #' : 'Đơn hàng #'}{order._id ? order._id.slice(-6).toUpperCase() : ''}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-[var(--bg-primary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-color)] flex items-center justify-center transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-base">close</span>
            </button>
          </div>

          {isSubmittedSuccess ? (
            <div className="py-8 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto border border-emerald-500/30">
                <span className="material-symbols-outlined text-3xl">task_alt</span>
              </div>
              <div className="space-y-1">
                <h4 className="text-base font-bold text-[var(--text-primary)]">
                  {lang === 'en' ? 'Thank you for your feedback!' : lang === 'zh' ? '感谢您的评价！' : 'Cảm ơn bạn đã đánh giá!'}
                </h4>
                <p className="text-xs text-[var(--text-secondary)] max-w-xs mx-auto">
                  {lang === 'en'
                    ? 'Your feedback helps Kohi Coffee continuously improve our service and drinks.'
                    : lang === 'zh'
                    ? '您的反馈有助于 Kohi Coffee 不断提升服务与餐品质量。'
                    : 'Ý kiến đóng góp của bạn giúp Kohi Coffee ngày càng nâng cao chất lượng phục vụ và món ăn.'}
                </p>
              </div>
              <button
                onClick={onClose}
                className="px-6 py-2.5 bg-[var(--brand-primary)] text-white text-xs font-bold rounded-xl shadow-md cursor-pointer hover:bg-[var(--brand-primary-hover)] transition-all"
              >
                {lang === 'en' ? 'Close' : lang === 'zh' ? '关闭' : 'Đóng'}
              </button>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
              {/* Overall Star Rating */}
              <div className="p-4 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl text-center space-y-2">
                <p className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider">
                  {lang === 'en' ? 'Overall Service Rating' : lang === 'zh' ? '整体服务评价' : 'Đánh giá tổng quan chất lượng phục vụ'}
                </p>
                <div className="flex justify-center items-center gap-2 py-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setOverallStar(s)}
                      className="p-1 transition-transform active:scale-95 cursor-pointer"
                    >
                      <span className={`material-symbols-outlined text-3xl ${
                        s <= overallStar ? 'text-amber-400 fill-current' : 'text-gray-300 dark:text-gray-600'
                      }`}>
                        star
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Items Individual Rating */}
              <div className="space-y-2.5">
                <p className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">
                  {lang === 'en' ? 'Itemized Item Ratings:' : lang === 'zh' ? '商品详细评价:' : 'Đánh giá chi tiết từng món ăn:'}
                </p>
                {items.map((item: any, idx: number) => {
                  const foodId = getItemFoodId(item);
                  const currentStar = foodStars[foodId] || overallStar;
                  return (
                    <div key={idx} className="p-3 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl flex items-center justify-between gap-3 text-xs">
                      <div className="truncate">
                        <span className="font-bold text-[var(--text-primary)] block truncate">
                          {getItemName(item)}
                        </span>
                        <span className="text-[11px] text-[var(--text-secondary)]">
                          {lang === 'en' ? 'Quantity:' : lang === 'zh' ? '数量:' : 'Số lượng:'} {item.quantity}
                        </span>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => handleStarClick(foodId, s)}
                            className="p-0.5 cursor-pointer"
                          >
                            <span className={`material-symbols-outlined text-xl ${
                              s <= currentStar ? 'text-amber-400' : 'text-gray-300 dark:text-gray-600'
                            }`}>
                              star
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Comment Input */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-[var(--text-secondary)]">
                  {lang === 'en' ? 'Additional Comments (Optional):' : lang === 'zh' ? '其他建议（选填）:' : 'Góp ý thêm cho nhà hàng (không bắt buộc):'}
                </label>
                <textarea
                  rows={3}
                  value={overallComment}
                  onChange={(e) => setOverallComment(e.target.value)}
                  placeholder={lang === 'en' ? 'Taste, service quality, recommendations...' : lang === 'zh' ? '餐品口味、服务态度...' : 'Hương vị món ăn, thái độ phục vụ...'}
                  className="w-full p-3 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl text-xs text-[var(--text-primary)] outline-none focus:border-[var(--brand-primary)] transition-all resize-none"
                />
              </div>

              {errorMsg && (
                <div className="p-2.5 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-500 font-semibold text-center">
                  {errorMsg}
                </div>
              )}

              {/* Submit Button */}
              <button
                disabled={isSubmitting}
                onClick={handleSubmit}
                className={`w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  isSubmitting ? 'opacity-70 cursor-not-allowed' : 'active:scale-95'
                }`}
              >
                <span className="material-symbols-outlined text-base">send</span>
                <span>
                  {isSubmitting
                    ? (lang === 'en' ? 'Submitting...' : lang === 'zh' ? '正在提交...' : 'Đang gửi đánh giá...')
                    : (lang === 'en' ? 'Submit Review' : lang === 'zh' ? '提交评价' : 'Gửi Đánh Giá Ngay')}
                </span>
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
