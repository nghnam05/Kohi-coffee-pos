'use client';
import { DashboardIcon } from '@/components/common/DashboardIcon';

import React, { useState, useEffect, useCallback } from 'react';

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1')
  .trim()
  .replace(/[\r\n\t]+/g, '')
  .replace(/\/+$/, '');

export interface AiReviewInsightItem {
  foodId?: string;
  foodName: string;
  lowRatingCount: number;
  avgStar: number;
  negativeSummary: string;
  aiSuggestedSolution: string;
}

interface AdminAiReviewInsightsProps {
  token: string | null;
}

export const AdminAiReviewInsights: React.FC<AdminAiReviewInsightsProps> = ({ token }) => {
  const [insights, setInsights] = useState<AiReviewInsightItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [acknowledgedItems, setAcknowledgedItems] = useState<Record<string, boolean>>({});
  const [deletedKeys, setDeletedKeys] = useState<string[]>([]);
  const [selectedStarFilter, setSelectedStarFilter] = useState<number | 'all'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 4; // 2 hàng x 2 cột = 4 thẻ/trang

  // Load deleted keys from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('kohi_deleted_ai_insights');
      if (saved) {
        setDeletedKeys(JSON.parse(saved));
      }
    } catch (e) {
      console.error('Error reading deleted ai insights', e);
    }
  }, []);

  const fetchInsights = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/reviews/ai-insights`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setInsights(data);
      }
    } catch (err) {
      console.error('Error fetching AI review insights:', err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchInsights();
  }, [fetchInsights]);

  const toggleAcknowledge = (key: string) => {
    setAcknowledgedItems((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleDeleteInsight = (key: string) => {
    const updated = [...deletedKeys, key];
    setDeletedKeys(updated);
    try {
      localStorage.setItem('kohi_deleted_ai_insights', JSON.stringify(updated));
    } catch (e) {
      console.error('Error saving deleted ai insights', e);
    }
  };

  // Unique key for each insight item
  const getItemKey = (item: AiReviewInsightItem, index: number) => {
    return `${item.foodName}_${item.avgStar}_${index}`;
  };

  // Helper bảo đảm món Bánh ngọt/Pastry không bị nhầm đề xuất đồ uống (đá/cà phê)
  const sanitizeInsight = (item: AiReviewInsightItem): AiReviewInsightItem => {
    const isBakery = /bánh|donut|macaron|tart|cheesecake|croissant|pastry/i.test(item.foodName);
    if (!isBakery) return item;

    let solution = item.aiSuggestedSolution;
    let summary = item.negativeSummary;

    if (/đá|cốt cà phê|cốt trà|pha chế|ly đong/i.test(solution)) {
      if (/ngọt|chè/i.test(summary)) {
        solution = 'Nên giảm 10-15% hàm lượng đường trong kem phủ và nhân bánh; cân bằng vị ngọt thanh tự nhiên.';
      } else if (/khô|cứng|nguội/i.test(summary)) {
        solution = 'Bọc kín màng thực phẩm chuyên dụng khi trưng bày tủ mát; hâm nóng lại bánh ở 150°C trong 2 phút trước khi mang ra cho khách.';
      } else {
        solution = 'Kiểm tra hạn sử dụng trong ngày của mẻ bánh nướng và bảo quản tủ mát 2-6°C để giữ độ mềm xốp chuẩn vị.';
      }
    }

    if (/bớt đá|nhiều đá|loãng vị/i.test(summary)) {
      summary = 'Khách nhận xét cần cân bằng lại độ ngọt và độ ẩm tươi mới của bánh.';
    }

    return {
      ...item,
      negativeSummary: summary,
      aiSuggestedSolution: solution,
    };
  };

  // Active (non-deleted) items
  const activeInsights = insights
    .filter((item, idx) => !deletedKeys.includes(getItemKey(item, idx)))
    .map(sanitizeInsight);

  // Filtered by Star Rating
  const filteredInsights = activeInsights.filter((item) => {
    if (selectedStarFilter === 'all') return true;
    return Math.round(item.avgStar) === selectedStarFilter;
  });

  // Pagination calculation
  const totalPages = Math.ceil(filteredInsights.length / ITEMS_PER_PAGE) || 1;
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedInsights = filteredInsights.slice(
    (safeCurrentPage - 1) * ITEMS_PER_PAGE,
    safeCurrentPage * ITEMS_PER_PAGE
  );

  const handleSelectStarFilter = (val: number | 'all') => {
    setSelectedStarFilter(val);
    setCurrentPage(1);
  };

  // Count per star filter
  const starCounts = {
    all: activeInsights.length,
    1: activeInsights.filter((i) => Math.round(i.avgStar) === 1).length,
    2: activeInsights.filter((i) => Math.round(i.avgStar) === 2).length,
    3: activeInsights.filter((i) => Math.round(i.avgStar) === 3).length,
  };

  return (
    <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-white/10 rounded-2xl p-5 space-y-4 shadow-xs font-sans text-left">
      {/* Title & Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-white/10 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <DashboardIcon name="auto_awesome" className="text-amber-500 text-xl" />
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white font-heading tracking-tight">
              AI Phân Tích & Đề Xuất Cải Tiến Chất Lượng
            </h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
            Tự động tổng hợp phản hồi đánh giá sao thấp từ khách hàng và đưa ra giải pháp điều chỉnh công thức pha chế.
          </p>
        </div>
        <button
          onClick={fetchInsights}
          disabled={loading}
          className="px-4 py-2 rounded-xl bg-[#3B82F6] hover:bg-blue-600 text-white text-xs font-bold font-sans transition-all active:scale-95 disabled:opacity-50 cursor-pointer self-start sm:self-auto shadow-xs flex items-center gap-1.5 shrink-0"
        >
          <DashboardIcon name="refresh" className={`text-base ${loading ? 'animate-spin' : ''}`} />
          <span>{loading ? 'Đang phân tích...' : 'Cập nhật phân tích AI'}</span>
        </button>
      </div>

      {/* Star Rating Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-50 dark:bg-slate-900/60 p-2 rounded-xl border border-slate-200/80 dark:border-white/10">
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-300">
          <DashboardIcon name="filter_alt" className="text-slate-400 text-base" />
          <span>Lọc theo số sao:</span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => handleSelectStarFilter('all')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              selectedStarFilter === 'all'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200/80 dark:border-slate-700'
            }`}
          >
            Tất cả ({starCounts.all})
          </button>

          {[1, 2, 3].map((star) => {
            const count = starCounts[star as 1 | 2 | 3];
            const isActive = selectedStarFilter === star;
            return (
              <button
                key={star}
                onClick={() => handleSelectStarFilter(star)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                  isActive
                    ? 'bg-amber-500 text-white shadow-xs'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200/80 dark:border-slate-700'
                }`}
              >
                <DashboardIcon name="star" className="text-xs text-amber-400" />
                <span>{star} sao ({count})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Content Cards Grid: 2 hàng (4 thẻ/trang) */}
      {loading ? (
        <div className="py-12 text-center text-xs text-slate-400 font-sans animate-pulse flex flex-col items-center gap-2">
          <DashboardIcon name="auto_awesome" className="text-2xl text-amber-500 animate-spin" />
          <span>Hệ thống AI đang phân tích dữ liệu đánh giá thực tế từ khách hàng...</span>
        </div>
      ) : filteredInsights.length === 0 ? (
        <div className="py-10 text-center text-xs text-slate-500 dark:text-slate-400 font-sans bg-slate-50/50 dark:bg-slate-900/40 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
          <DashboardIcon name="verified" className="text-3xl text-emerald-500 mb-1 block" />
          <p className="font-bold text-slate-700 dark:text-slate-300">Không tìm thấy thẻ đánh giá nào phù hợp.</p>
          <p className="text-[11px] mt-0.5">Chất lượng các món ăn thuộc nhóm này hiện tại đang hoạt động rất tốt.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {paginatedInsights.map((item, idx) => {
              const itemKey = getItemKey(item, idx);
              const isAck = acknowledgedItems[itemKey];

              return (
                <div
                  key={itemKey}
                  className={`p-4 sm:p-5 rounded-2xl border transition-all space-y-3 shadow-xs relative flex flex-col justify-between ${
                    isAck
                      ? 'bg-emerald-500/5 dark:bg-emerald-950/20 border-emerald-500/30'
                      : item.avgStar <= 2
                      ? 'bg-amber-500/5 dark:bg-amber-950/20 border-amber-500/30'
                      : 'bg-slate-50/60 dark:bg-slate-900/60 border-slate-200/80 dark:border-white/10'
                  }`}
                >
                  {/* Header Card */}
                  <div className="flex items-start justify-between gap-2 pb-2.5 border-b border-slate-200/60 dark:border-white/10">
                    <div>
                      <h4 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white font-sans tracking-tight">
                        {item.foodName}
                      </h4>
                      <div className="flex flex-wrap items-center gap-1.5 mt-1">
                        {item.lowRatingCount > 0 && (
                          <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 font-sans">
                            {item.lowRatingCount} lượt phàn nàn
                          </span>
                        )}
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 font-sans flex items-center gap-1">
                          <DashboardIcon name="star" className="text-[13px] text-amber-500" />
                          <span>{item.avgStar} sao</span>
                        </span>
                      </div>
                    </div>

                    {/* Top Right Action: Delete Button */}
                    <button
                      onClick={() => handleDeleteInsight(itemKey)}
                      className="w-7 h-7 rounded-lg bg-slate-200/60 hover:bg-rose-500/10 hover:text-rose-600 dark:bg-slate-800 dark:hover:bg-rose-500/20 text-slate-400 dark:hover:text-rose-400 flex items-center justify-center transition-all cursor-pointer active:scale-95 shrink-0"
                      title="Xóa thẻ đề xuất này"
                    >
                      <DashboardIcon name="delete" className="text-base" />
                    </button>
                  </div>

                  {/* Complaint Summary */}
                  <div className="space-y-1">
                    <span className="text-[10.5px] font-bold text-slate-400 dark:text-slate-500 font-sans uppercase tracking-wider block">
                      Tóm tắt phản hồi của khách hàng:
                    </span>
                    <p className="text-xs text-slate-700 dark:text-slate-200 font-sans leading-relaxed bg-white dark:bg-slate-950/60 p-3 rounded-xl border border-slate-200/70 dark:border-white/10 font-medium">
                      {item.negativeSummary}
                    </p>
                  </div>

                  {/* AI Solution */}
                  <div className="space-y-1">
                    <span className="text-[10.5px] font-bold text-[#3B82F6] dark:text-[#38BDF8] font-sans uppercase tracking-wider block flex items-center gap-1">
                      <DashboardIcon name="auto_awesome" className="text-xs" />
                      <span>AI Đề xuất giải pháp cải tiến:</span>
                    </span>
                    <p className="text-xs text-slate-800 dark:text-slate-100 font-sans leading-relaxed bg-blue-500/5 dark:bg-blue-500/10 p-3 rounded-xl border border-blue-500/20 font-medium">
                      {item.aiSuggestedSolution}
                    </p>
                  </div>

                  {/* Bottom Action Footer */}
                  <div className="pt-2 border-t border-slate-200/50 dark:border-slate-800/60 flex items-center justify-between gap-2">
                    <button
                      onClick={() => handleDeleteInsight(itemKey)}
                      className="px-2.5 py-1.5 rounded-xl text-xs font-semibold text-rose-500 hover:bg-rose-500/10 transition-all cursor-pointer flex items-center gap-1"
                    >
                      <DashboardIcon name="delete" className="text-sm" />
                      <span>Xóa</span>
                    </button>

                    <button
                      onClick={() => toggleAcknowledge(itemKey)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold font-sans transition-all cursor-pointer flex items-center gap-1.5 active:scale-95 ${
                        isAck
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      <DashboardIcon name={isAck ? 'check_circle' : 'task_alt'} className="text-sm" />
                      <span>{isAck ? 'Đã xử lý xong' : 'Đánh dấu đã xử lý'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Phân trang: 2 hàng (4 thẻ/trang) */}
          {totalPages > 1 && (
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-200/80 dark:border-white/10 font-sans text-xs">
              <span className="text-slate-500 dark:text-slate-400 font-medium whitespace-nowrap shrink-0">
                Hiển thị 2 hàng (trang <b className="text-slate-900 dark:text-white font-bold">{safeCurrentPage}</b> / {totalPages} • tổng {filteredInsights.length} thẻ đề xuất)
              </span>
              <div className="flex items-center gap-1.5 shrink-0 ml-auto">
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={safeCurrentPage <= 1}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all font-bold flex items-center gap-1 cursor-pointer whitespace-nowrap"
                >
                  <DashboardIcon name="chevron_left" className="text-sm" />
                  <span>Trang trước</span>
                </button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter((page) => totalPages <= 5 || Math.abs(page - safeCurrentPage) <= 1 || page === 1 || page === totalPages)
                    .map((page, idx, arr) => (
                      <React.Fragment key={page}>
                        {idx > 0 && page - arr[idx - 1] > 1 && (
                          <span className="px-1 text-slate-400 select-none">...</span>
                        )}
                        <button
                          key={page}
                          type="button"
                          onClick={() => setCurrentPage(page)}
                          className={`min-w-[28px] h-7 px-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            safeCurrentPage === page
                              ? 'bg-[#0284c7] dark:bg-[#38BDF8] text-white dark:text-[#090D16] shadow-xs'
                              : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                          }`}
                        >
                          {page}
                        </button>
                      </React.Fragment>
                    ))}
                </div>

                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={safeCurrentPage >= totalPages}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all font-bold flex items-center gap-1 cursor-pointer whitespace-nowrap"
                >
                  <span>Trang sau</span>
                  <DashboardIcon name="chevron_right" className="text-sm" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
