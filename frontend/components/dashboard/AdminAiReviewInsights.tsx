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

  const toggleAcknowledge = (index: number) => {
    setAcknowledgedItems((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-[var(--radius-lg)] p-5 space-y-4 shadow-sm">
      {/* Title & Refresh */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--border-color)] pb-4">
        <div>
          <h3 className="text-base font-bold text-[var(--text-primary)] font-sans">
            AI Phân Tích & Đề Xuất Cải Tiến Chất Lượng
          </h3>
          <p className="text-xs text-[var(--text-secondary)] font-sans mt-0.5">
            Tự động tổng hợp phản hồi đánh giá sao thấp từ khách hàng và đưa ra giải pháp điều chỉnh công thức pha chế.
          </p>
        </div>
        <button
          onClick={fetchInsights}
          disabled={loading}
          className="px-3.5 py-2 rounded-[var(--radius-sm)] bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] text-white text-xs font-semibold font-sans transition-all active:scale-95 disabled:opacity-50 cursor-pointer self-start sm:self-auto"
        >
          {loading ? 'Đang phân tích...' : 'Cập nhật phân tích AI'}
        </button>
      </div>

      {/* Content Cards */}
      {loading ? (
        <div className="py-8 text-center text-xs text-[var(--text-secondary)] font-sans animate-pulse">
          Hệ thống AI đang phân tích toàn bộ dữ liệu đánh giá của khách hàng...
        </div>
      ) : insights.length === 0 ? (
        <div className="py-8 text-center text-xs text-[var(--text-secondary)] font-sans">
          Chưa ghi nhận đánh giá thấp nào từ khách hàng. Chất lượng thực đơn hiện tại đạt chuẩn.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {insights.map((item, idx) => {
            const isAck = acknowledgedItems[idx];
            return (
              <div
                key={idx}
                className={`p-4 rounded-lg border transition-all space-y-3 ${
                  isAck
                    ? 'bg-emerald-500/5 border-emerald-500/30 opacity-75'
                    : item.lowRatingCount > 0
                    ? 'bg-amber-500/5 border-amber-500/30'
                    : 'bg-[var(--bg-primary)] border-[var(--border-color)]'
                }`}
              >
                {/* Header item */}
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-bold text-[var(--text-primary)] font-sans">
                    {item.foodName}
                  </span>
                  <div className="flex items-center gap-2">
                    {item.lowRatingCount > 0 && (
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-rose-500/10 text-rose-600 border border-rose-500/20 font-sans">
                        {item.lowRatingCount} lượt phàn nàn
                      </span>
                    )}
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-amber-500/10 text-amber-600 border border-amber-500/20 font-sans">
                      {item.avgStar} sao
                    </span>
                  </div>
                </div>

                {/* Complaint Summary */}
                <div className="space-y-1">
                  <span className="text-[11px] font-bold text-[var(--text-secondary)] font-sans uppercase tracking-wider">
                    Tóm tắt phản hồi của khách hàng:
                  </span>
                  <p className="text-[12.5px] text-[var(--text-primary)] font-sans leading-relaxed bg-[var(--bg-card)] p-2.5 rounded border border-[var(--border-color)]">
                    {item.negativeSummary}
                  </p>
                </div>

                {/* AI Solution */}
                <div className="space-y-1">
                  <span className="text-[11px] font-bold text-[var(--brand-primary)] font-sans uppercase tracking-wider">
                    AI Đề xuất giải pháp cải tiến:
                  </span>
                  <p className="text-[12.5px] text-[var(--text-primary)] font-sans leading-relaxed bg-[var(--brand-primary)]/5 p-2.5 rounded border border-[var(--brand-primary)]/20 font-medium">
                    {item.aiSuggestedSolution}
                  </p>
                </div>

                {/* Action button */}
                <div className="pt-1 flex justify-end">
                  <button
                    onClick={() => toggleAcknowledge(idx)}
                    className={`px-3 py-1.5 rounded text-[11.5px] font-semibold font-sans transition-all cursor-pointer ${
                      isAck
                        ? 'bg-emerald-600 text-white'
                        : 'bg-[var(--bg-primary)] hover:bg-[var(--border-color)] text-[var(--text-primary)] border border-[var(--border-color)]'
                    }`}
                  >
                    {isAck ? 'Đã ghi nhận giải pháp' : 'Đánh dấu đã xử lý'}
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
