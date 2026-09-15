'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1')
  .trim()
  .replace(/[\r\n\t]+/g, '')
  .replace(/\/+$/, '');

interface FoodReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: any | null;
  tableId: string;
  formatPrice: (price: number, lang: any) => string;
  lang?: any;
}

const EMOTION_LABELS: Record<number, { vi: string; en: string; zh: string; emoji: string }> = {
  1: { vi: 'Rất thất vọng', en: 'Very Dissatisfied', zh: '非常不满意', emoji: '😞' },
  2: { vi: 'Chưa hài lòng', en: 'Dissatisfied', zh: '不满意', emoji: '🙁' },
  3: { vi: 'Tạm ổn', en: 'Average', zh: '一般', emoji: '😐' },
  4: { vi: 'Hài lòng', en: 'Satisfied', zh: '满意', emoji: '😊' },
  5: { vi: 'Tuyệt vời!', en: 'Excellent!', zh: '非常满意！', emoji: '🤩' },
};

const QUICK_CHIPS_HIGH = {
  vi: ['Đồ uống ngon ☕', 'Phục vụ nhanh ⚡', 'Không gian đẹp 🌿', 'Nhân viên nhiệt tình 🥰', 'Rất đáng tiền 💰'],
  en: ['Delicious Drinks ☕', 'Fast Service ⚡', 'Cozy Ambiance 🌿', 'Friendly Staff 🥰', 'Great Value 💰'],
  zh: ['饮品美味 ☕', '出餐迅速 ⚡', '环境优美 🌿', '服务热情 🥰', '物超所值 💰'],
};

const QUICK_CHIPS_LOW = {
  vi: ['Đồ uống hơi ngọt 🍬', 'Phục vụ chậm ⏳', 'Không gian ồn ào 📢', 'Món ra chưa đủ ⚠️', 'Cần cải thiện thái độ 💬'],
  en: ['Too Sweet 🍬', 'Slow Service ⏳', 'Noisy Space 📢', 'Missing Items ⚠️', 'Staff Attitude 💬'],
  zh: ['饮品偏甜 🍬', '上餐较慢 ⏳', '环境嘈杂 📢', '遗漏餐品 ⚠️', '需改善态度 💬'],
};

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
  const [copiedVoucher, setCopiedVoucher] = useState<boolean>(false);

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

  const getItemImage = (item: any): string | null => {
    if (typeof item.foodId === 'object' && item.foodId?.image) return item.foodId.image;
    if (item.food?.image) return item.food.image;
    if (item.image) return item.image;
    return null;
  };

  const handleStarClick = (foodId: string, star: number) => {
    setFoodStars((prev) => ({ ...prev, [foodId]: star }));
  };

  const handleToggleChip = (chip: string) => {
    if (overallComment.includes(chip)) {
      setOverallComment((prev) =>
        prev.replace(chip, '').replace(/,\s*,/g, ',').trim().replace(/^,\s*|,\s*$/g, '')
      );
    } else {
      setOverallComment((prev) => (prev ? `${prev}, ${chip}` : chip));
    }
  };

  const handleCopyVoucher = () => {
    try {
      navigator.clipboard.writeText('KOHICARE10');
      setCopiedVoucher(true);
      setTimeout(() => setCopiedVoucher(false), 2500);
    } catch (e) {}
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

  const chipsList = overallStar >= 4
    ? (QUICK_CHIPS_HIGH[lang as keyof typeof QUICK_CHIPS_HIGH] || QUICK_CHIPS_HIGH.vi)
    : (QUICK_CHIPS_LOW[lang as keyof typeof QUICK_CHIPS_LOW] || QUICK_CHIPS_LOW.vi);

  const emotionInfo = EMOTION_LABELS[overallStar] || EMOTION_LABELS[5];
  const emotionText = (lang === 'en' ? emotionInfo.en : lang === 'zh' ? emotionInfo.zh : emotionInfo.vi) + ' ' + emotionInfo.emoji;

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
            <div className="py-6 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto border border-emerald-500/30 shadow-xs">
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

              {/* Gamified Post-Review Voucher Reward Banner */}
              <div className="p-4 bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-amber-500/15 border border-amber-500/30 rounded-2xl text-left space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-amber-500 text-base">redeem</span>
                    <span className="text-[11px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 font-mono">
                      {lang === 'en' ? 'Loyalty Gift Voucher' : lang === 'zh' ? '感恩回馈礼券' : 'Quà tặng tri ân Kohi'}
                    </span>
                  </div>
                  <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                    -10% OFF
                  </span>
                </div>

                <div className="flex items-center justify-between bg-[var(--bg-card)]/80 p-2.5 rounded-xl border border-amber-500/20">
                  <div>
                    <span className="text-[10px] text-[var(--text-secondary)] uppercase block font-semibold">Mã ưu đãi:</span>
                    <span className="text-sm font-black font-mono text-[#0284c7] dark:text-[#38BDF8]">KOHICARE10</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyVoucher}
                    className="px-3 py-1.5 bg-[#0284c7] hover:bg-[#0369a1] text-white font-extrabold text-[11px] uppercase tracking-wider rounded-lg shadow-xs active:scale-95 transition-all cursor-pointer flex items-center gap-1 shrink-0"
                  >
                    <span className="material-symbols-outlined text-sm">{copiedVoucher ? 'check' : 'content_copy'}</span>
                    <span>{copiedVoucher ? 'Đã chép' : 'Sao chép'}</span>
                  </button>
                </div>

                <p className="text-[10px] text-[var(--text-secondary)] leading-relaxed">
                  {lang === 'en'
                    ? 'Valid for 30 days across all Kohi Coffee branches on your next visit.'
                    : lang === 'zh'
                    ? '有效期 30 天，适用于所有 Kohi Coffee 门店下次消费。'
                    : 'Áp dụng giảm 10% cho lần ghé tiếp theo tại tất cả chi nhánh Kohi Coffee (HSD: 30 ngày).'}
                </p>
              </div>

              <button
                onClick={onClose}
                className="w-full py-3 bg-[#0284c7] text-white text-xs font-bold rounded-xl shadow-md cursor-pointer hover:bg-[#0369a1] active:scale-95 transition-all"
              >
                {lang === 'en' ? 'Done & Close' : lang === 'zh' ? '完成并关闭' : 'Hoàn tất & Đóng'}
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
                      className="p-1 transition-transform active:scale-95 hover:scale-110 cursor-pointer"
                    >
                      <span className={`material-symbols-outlined text-3xl ${
                        s <= overallStar ? 'text-amber-400 fill-current' : 'text-gray-300 dark:text-gray-600'
                      }`}>
                        star
                      </span>
                    </button>
                  ))}
                </div>

                {/* Emotional Star Rating Label */}
                <p className="text-xs font-bold text-amber-600 dark:text-amber-400">
                  {emotionText}
                </p>
              </div>

              {/* Quick-Feedback Chips */}
              <div className="space-y-1.5">
                <p className="text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">
                  {lang === 'en' ? 'Quick Feedback Tags:' : lang === 'zh' ? '快捷标签:' : 'Gợi ý nhận xét nhanh:'}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {chipsList.map((chip) => {
                    const isSelected = overallComment.includes(chip);
                    return (
                      <button
                        key={chip}
                        type="button"
                        onClick={() => handleToggleChip(chip)}
                        className={`px-2.5 py-1 rounded-full text-[11px] font-bold border transition-all cursor-pointer select-none ${
                          isSelected
                            ? 'bg-[#0284c7] text-white border-[#0284c7] shadow-xs'
                            : 'bg-[var(--bg-primary)] hover:bg-slate-100 dark:hover:bg-slate-800 text-[var(--text-secondary)] border-[var(--border-color)]'
                        }`}
                      >
                        {chip}
                      </button>
                    );
                  })}
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
                  const foodImage = getItemImage(item);

                  return (
                    <div key={idx} className="p-3 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl flex items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-2.5 min-w-0">
                        {foodImage ? (
                          <img
                            src={foodImage}
                            alt=""
                            className="w-10 h-10 rounded-lg object-cover border border-[var(--border-color)] shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-[#0284c7]/10 text-[#0284c7] flex items-center justify-center shrink-0 border border-[#0284c7]/20">
                            <span className="material-symbols-outlined text-base">local_cafe</span>
                          </div>
                        )}
                        <div className="truncate">
                          <span className="font-bold text-[var(--text-primary)] block truncate">
                            {getItemName(item)}
                          </span>
                          <span className="text-[11px] text-[var(--text-secondary)]">
                            {lang === 'en' ? 'Quantity:' : lang === 'zh' ? '数量:' : 'Số lượng:'} {item.quantity}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => handleStarClick(foodId, s)}
                            className="p-0.5 cursor-pointer hover:scale-110 transition-transform"
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
                  className="w-full p-3 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl text-xs text-[var(--text-primary)] outline-none focus:border-[#0284c7] transition-all resize-none font-sans"
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
                className={`w-full py-3.5 bg-[#0284c7] hover:bg-[#0369a1] text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer ${
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
