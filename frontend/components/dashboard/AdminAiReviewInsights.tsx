'use client';

import React, { useState, useEffect, useCallback } from 'react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

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

  // Active (non-deleted) items
  const activeInsights = insights.filter((item, idx) => !deletedKeys.includes(getItemKey(item, idx)));

  // Filtered by Star Rating
  const filteredInsights = activeInsights.filter((item) => {
    if (selectedStarFilter === 'all') return true;
    return Math.round(item.avgStar) === selectedStarFilter;
  });

  // Count per star filter
  const starCounts = {
    all: activeInsights.length,
    1: activeInsights.filter((i) => Math.round(i.avgStar) === 1).length,
    2: activeInsights.filter((i) => Math.round(i.avgStar) === 2).length,
    3: activeInsights.filter((i) => Math.round(i.avgStar) === 3).length,
  };

  return (
    <div className="bg-white dark:bg-[#131929] border border-slate-200 dark:border-[#1e293b] rounded-2xl p-5 space-y-4 shadow-xs font-sans text-left">
      {/* Title & Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-amber-500 text-xl">auto_awesome</span>
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
          className="px-4 py-2 rounded-xl bg-[#0284c7] hover:bg-[#0369a1] dark:bg-[#38BDF8] dark:hover:bg-[#0284c7] text-white dark:text-slate-950 text-xs font-bold font-sans transition-all active:scale-95 disabled:opacity-50 cursor-pointer self-start sm:self-auto shadow-xs flex items-center gap-1.5 shrink-0"
        >
          <span className={`material-symbols-outlined text-base ${loading ? 'animate-spin' : ''}`}>refresh</span>
          <span>{loading ? 'Đang phân tích...' : 'Cập nhật phân tích AI'}</span>
        </button>
      </div>

      {/* Star Rating Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-50 dark:bg-slate-900/60 p-2 rounded-xl border border-slate-200/80 dark:border-slate-800">
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-300">
          <span className="material-symbols-outlined text-slate-400 text-base">filter_alt</span>
          <span>Lọc theo số sao:</span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setSelectedStarFilter('all')}
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
                onClick={() => setSelectedStarFilter(star)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                  isActive
                    ? 'bg-amber-500 text-white shadow-xs'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200/80 dark:border-slate-700'
                }`}
              >
                <span className="material-symbols-outlined text-xs text-amber-400">star</span>
                <span>{star} sao ({count})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Content Cards Grid */}
      {loading ? (
        <div className="py-12 text-center text-xs text-slate-400 font-sans animate-pulse flex flex-col items-center gap-2">
          <span className="material-symbols-outlined text-2xl text-amber-500 animate-spin">auto_awesome</span>
          <span>Hệ thống AI đang phân tích dữ liệu đánh giá thực tế từ khách hàng...</span>
        </div>
      ) : filteredInsights.length === 0 ? (
        <div className="py-10 text-center text-xs text-slate-500 dark:text-slate-400 font-sans bg-slate-50/50 dark:bg-slate-900/40 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
          <span className="material-symbols-outlined text-3xl text-emerald-500 mb-1 block">verified</span>
          <p className="font-bold text-slate-700 dark:text-slate-300">Không tìm thấy thẻ đánh giá nào phù hợp.</p>
          <p className="text-[11px] mt-0.5">Chất lượng các món ăn thuộc nhóm này hiện tại đang hoạt động rất tốt.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredInsights.map((item, idx) => {
            const itemKey = getItemKey(item, idx);
            const isAck = acknowledgedItems[itemKey];

            return (
              <div
                key={itemKey}
                className={`p-4 sm:p-5 rounded-2xl border transition-all space-y-3 shadow-xs relative flex flex-col justify-between ${
                  isAck
                    ? 'bg-emerald-500/5 dark:bg-emerald-950/10 border-emerald-500/30'
                    : item.avgStar <= 2
                    ? 'bg-amber-500/5 dark:bg-amber-950/10 border-amber-500/30'
                    : 'bg-slate-50/60 dark:bg-slate-900/50 border-slate-200/80 dark:border-slate-800'
                }`}
              >
                {/* Header Card */}
                <div className="flex items-start justify-between gap-2 pb-2.5 border-b border-slate-200/60 dark:border-slate-800">
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
                        <span className="material-symbols-outlined text-[13px] text-amber-500">star</span>
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
                    <span className="material-symbols-outlined text-base">delete</span>
                  </button>
                </div>

                {/* Complaint Summary */}
                <div className="space-y-1">
                  <span className="text-[10.5px] font-bold text-slate-400 dark:text-slate-500 font-sans uppercase tracking-wider block">
                    Tóm tắt phản hồi của khách hàng:
                  </span>
                  <p className="text-xs text-slate-700 dark:text-slate-200 font-sans leading-relaxed bg-white dark:bg-slate-950/60 p-3 rounded-xl border border-slate-200/70 dark:border-slate-800 font-medium">
                    {item.negativeSummary}
                  </p>
                </div>

                {/* AI Solution */}
                <div className="space-y-1">
                  <span className="text-[10.5px] font-bold text-[#0284c7] dark:text-[#38BDF8] font-sans uppercase tracking-wider block flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs">auto_awesome</span>
                    <span>AI Đề xuất giải pháp cải tiến:</span>
                  </span>
                  <p className="text-xs text-slate-800 dark:text-slate-100 font-sans leading-relaxed bg-sky-500/5 dark:bg-sky-950/20 p-3 rounded-xl border border-sky-500/20 font-medium">
                    {item.aiSuggestedSolution}
                  </p>
                </div>

                {/* Bottom Action Footer */}
                <div className="pt-2 border-t border-slate-200/50 dark:border-slate-800/60 flex items-center justify-between gap-2">
                  <button
                    onClick={() => handleDeleteInsight(itemKey)}
                    className="px-2.5 py-1.5 rounded-xl text-xs font-semibold text-rose-500 hover:bg-rose-500/10 transition-all cursor-pointer flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-sm">delete</span>
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
                    <span className="material-symbols-outlined text-sm">
                      {isAck ? 'check_circle' : 'task_alt'}
                    </span>
                    <span>{isAck ? 'Đã xử lý xong' : 'Đánh dấu đã xử lý'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
