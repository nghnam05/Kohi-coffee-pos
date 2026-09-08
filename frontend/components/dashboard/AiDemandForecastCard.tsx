'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

interface ForecastDay {
  date: string;
  dayOfWeek: string;
  projectedRevenue: number;
  projectedOrders: number;
  confidence: number;
  peakHours: string;
}

interface StockoutWarning {
  ingredientName: string;
  category: string;
  currentQuantity: number;
  unit: string;
  estimatedDaysLeft: number;
  severity: 'critical' | 'high' | 'medium';
  reason: string;
}

interface RecommendedRestockItem {
  name: string;
  category: string;
  currentQuantity: number;
  unit: string;
  suggestedQuantity: number;
  unitPrice: number;
  estimatedCost: number;
  reason: string;
}

interface AiForecastData {
  generatedAt: string;
  forecastDays: ForecastDay[];
  stockoutWarnings: StockoutWarning[];
  recommendedRestock: RecommendedRestockItem[];
  summary: string;
}

interface AiDemandForecastCardProps {
  token: string | null;
  onRestockSuccess?: () => void;
}

export const AiDemandForecastCard: React.FC<AiDemandForecastCardProps> = ({
  token,
  onRestockSuccess,
}) => {
  const [data, setData] = useState<AiForecastData | null>(null);
  const [loading, setLoading] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchForecast = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch(`${API_BASE}/analytics/ai-forecast`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const json = await res.json();
        setData(json);
      } else {
        setErrorMsg('Không thể tải dữ liệu dự báo AI.');
      }
    } catch (err) {
      console.error('Lỗi khi tải AI Forecast:', err);
      setErrorMsg('Lỗi kết nối máy chủ khi tính toán dự báo.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchForecast();
  }, [fetchForecast]);

  const handleApplyRestock = async () => {
    if (!data || data.recommendedRestock.length === 0 || !token) return;
    setIsApplying(true);
    setSuccessMsg(null);
    try {
      const res = await fetch(`${API_BASE}/ingredients/apply-restock`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          items: data.recommendedRestock.map((r) => ({
            name: r.name,
            quantity: r.suggestedQuantity,
            unitPrice: r.unitPrice,
            unit: r.unit,
            category: r.category,
          })),
          restockedBy: 'Quản trị viên (AI Restock)',
        }),
      });

      if (res.ok) {
        const resJson = await res.json();
        setSuccessMsg(resJson.message || 'Đã nhập kho thành công theo đề xuất AI!');
        if (onRestockSuccess) onRestockSuccess();
        // Refresh forecast after restock
        setTimeout(() => {
          fetchForecast();
        }, 1500);
      } else {
        setErrorMsg('Lỗi khi áp dụng nhập kho.');
      }
    } catch (err) {
      console.error('Lỗi apply restock:', err);
      setErrorMsg('Lỗi kết nối khi duyệt nhập kho.');
    } finally {
      setIsApplying(false);
    }
  };

  if (loading && !data) {
    return (
      <div className="p-8 rounded-3xl bg-white dark:bg-[#090D16] border border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center min-h-[220px]">
        <span className="material-symbols-outlined text-3xl text-[#38BDF8] animate-spin mb-3">
          rotate_right
        </span>
        <p className="text-xs font-extrabold text-slate-600 dark:text-slate-300">
          Kohi AI đang phân tích chuỗi thời gian 30 ngày & tính toán dự báo...
        </p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      {/* Top Banner: AI Overview & Summary */}
      <div className="p-6 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-950 to-[#090D16] border border-slate-800 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#38BDF8]/20 border border-[#38BDF8]/40 flex items-center justify-center text-[#38BDF8]">
              <span className="material-symbols-outlined text-2xl">auto_graph</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-extrabold text-white tracking-tight">
                  Dự Báo Nhu Cầu & Nhập Kho Thông Minh
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-[#38BDF8] text-slate-950 uppercase tracking-wider">
                  Kohi AI Engine
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Phân tích Time-Series từ lịch sử doanh số và tốc độ tiêu hao nguyên liệu thực tế
              </p>
            </div>
          </div>

          <button
            onClick={fetchForecast}
            disabled={loading}
            className="px-4 py-2 rounded-2xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-xs font-extrabold text-slate-200 flex items-center gap-2 transition-colors active:scale-95"
          >
            <span className={`material-symbols-outlined text-sm ${loading ? 'animate-spin' : ''}`}>
              sync
            </span>
            <span>Cập nhật dự báo</span>
          </button>
        </div>

        {/* AI Insight Narrative */}
        {data?.summary && (
          <div className="relative z-10 mt-4 p-4 rounded-2xl bg-white/5 border border-white/10 text-xs leading-relaxed text-slate-300 font-medium">
            <div className="flex items-center gap-2 text-[#38BDF8] font-extrabold mb-1">
              <span className="material-symbols-outlined text-base">insights</span>
              <span>Đánh giá từ Trí tuệ nhân tạo:</span>
            </div>
            {data.summary}
          </div>
        )}
      </div>

      {/* Success/Error Alerts */}
      <AnimatePresence>
        {successMsg && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-base">check_circle</span>
              <span>{successMsg}</span>
            </div>
            <button
              onClick={() => setSuccessMsg(null)}
              className="text-emerald-500 hover:text-emerald-700"
            >
              <span className="material-symbols-outlined text-sm">close</span>
            </button>
          </motion.div>
        )}
        {errorMsg && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-bold flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-base">error_outline</span>
              <span>{errorMsg}</span>
            </div>
            <button
              onClick={() => setErrorMsg(null)}
              className="text-rose-500 hover:text-rose-700"
            >
              <span className="material-symbols-outlined text-sm">close</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Grid: 7-Day Forecast & Stockout Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: 7-Day Revenue & Demand Projection */}
        <div className="lg:col-span-2 p-6 rounded-3xl bg-white dark:bg-[#090D16] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#38BDF8] text-xl">calendar_month</span>
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
                  Dự Báo Bán Hàng 7 Ngày Tới
                </h3>
              </div>
              <span className="text-xs text-slate-400 font-bold">
                Độ tin cậy: ~90%
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
              {data?.forecastDays.map((day, idx) => {
                const isWeekend = day.dayOfWeek === 'Thứ Bảy' || day.dayOfWeek === 'Chủ Nhật';
                return (
                  <div
                    key={idx}
                    className={`p-3.5 rounded-2xl border transition-all ${
                      isWeekend
                        ? 'bg-sky-50/50 dark:bg-sky-950/20 border-sky-200/80 dark:border-sky-800/50'
                        : 'bg-slate-50/70 dark:bg-slate-900/40 border-slate-200/80 dark:border-slate-800/80'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-extrabold text-slate-900 dark:text-white">
                        {day.dayOfWeek}
                      </span>
                      <span className="text-[10px] text-slate-400 font-semibold">
                        {day.date.split('-').slice(1).reverse().join('/')}
                      </span>
                    </div>

                    <div className="text-base font-extrabold text-[#38BDF8] tracking-tight">
                      {day.projectedRevenue.toLocaleString('vi-VN')} đ
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 mt-2 pt-2 border-t border-slate-200/60 dark:border-slate-800/60">
                      <span>Dự kiến:</span>
                      <span className="font-extrabold text-slate-700 dark:text-slate-300">
                        {day.projectedOrders} đơn
                      </span>
                    </div>

                    <div className="mt-1 text-[10px] text-slate-400 truncate" title={day.peakHours}>
                      Cao điểm: {day.peakHours}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Dữ liệu tự động đồng bộ theo chu kỳ 30 ngày gần nhất</span>
            <span className="font-bold text-sky-500">Màu xanh: Ngày cao điểm cuối tuần</span>
          </div>
        </div>

        {/* Right 1 Col: Stockout Risk Warnings */}
        <div className="p-6 rounded-3xl bg-white dark:bg-[#090D16] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-amber-500 text-xl">warning_amber</span>
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
                  Cảnh Báo Cạn Kho
                </h3>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                {data?.stockoutWarnings.length || 0} mặt hàng
              </span>
            </div>

            {data?.stockoutWarnings && data.stockoutWarnings.length > 0 ? (
              <div className="space-y-3">
                {data.stockoutWarnings.map((w, idx) => (
                  <div
                    key={idx}
                    className={`p-3.5 rounded-2xl border ${
                      w.severity === 'critical'
                        ? 'bg-rose-50/70 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/60'
                        : 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/60'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-extrabold text-slate-900 dark:text-white">
                        {w.ingredientName}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                          w.severity === 'critical'
                            ? 'bg-rose-600 text-white'
                            : 'bg-amber-500 text-slate-950'
                        }`}
                      >
                        {w.severity === 'critical' ? 'Khẩn cấp' : 'Sắp hết'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-300 mt-1">
                      <span>Hiện còn:</span>
                      <span className="font-extrabold">
                        {w.currentQuantity} {w.unit}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 leading-snug">
                      {w.reason}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-xs text-slate-400 flex flex-col items-center justify-center">
                <span className="material-symbols-outlined text-emerald-500 text-3xl mb-2">check_circle</span>
                <span>Tất cả nguyên liệu hiện đang ở mức an toàn cho 7 ngày tới.</span>
              </div>
            )}
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400">
            Tự động cảnh báo khi tồn kho chạm ngưỡng tối thiểu
          </div>
        </div>
      </div>

      {/* Bottom Section: Smart Restock Recommendation Table */}
      {data?.recommendedRestock && data.recommendedRestock.length > 0 && (
        <div className="p-6 rounded-3xl bg-white dark:bg-[#090D16] border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#38BDF8] text-xl">inventory_2</span>
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
                  Kế Hoạch Nhập Hàng Đề Xuất Bởi AI (Smart Restock Advice)
                </h3>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Được tính toán để đảm bảo kho đủ vận hành an toàn trong 7 ngày tới
              </p>
            </div>

            <button
              onClick={handleApplyRestock}
              disabled={isApplying}
              className="px-5 py-2.5 rounded-2xl bg-[#38BDF8] hover:bg-sky-400 text-slate-950 font-extrabold text-xs shadow-lg shadow-sky-500/20 flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50"
            >
              <span className={`material-symbols-outlined text-base ${isApplying ? 'animate-spin' : ''}`}>
                {isApplying ? 'rotate_right' : 'task_alt'}
              </span>
              <span>
                {isApplying ? 'Đang cập nhật kho...' : 'Nhập Kho Theo Đề Xuất (1-Click)'}
              </span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-extrabold uppercase text-[10px]">
                  <th className="py-3 px-3">Tên Nguyên Liệu</th>
                  <th className="py-3 px-3">Danh Mục</th>
                  <th className="py-3 px-3 text-center">Tồn Hiện Tại</th>
                  <th className="py-3 px-3 text-center text-[#38BDF8]">Đề Xuất Nhập</th>
                  <th className="py-3 px-3 text-right">Đơn Giá</th>
                  <th className="py-3 px-3 text-right">Dự Toán Chi Phí</th>
                  <th className="py-3 px-3">Lý Do Đề Xuất</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {data.recommendedRestock.map((item, idx) => (
                  <tr
                    key={idx}
                    className="hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors"
                  >
                    <td className="py-3 px-3 font-extrabold text-slate-900 dark:text-white">
                      {item.name}
                    </td>
                    <td className="py-3 px-3 text-slate-500 dark:text-slate-400">
                      {item.category}
                    </td>
                    <td className="py-3 px-3 text-center text-slate-600 dark:text-slate-300 font-medium">
                      {item.currentQuantity} {item.unit}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="px-2.5 py-1 rounded-xl bg-[#38BDF8]/10 text-[#38BDF8] font-extrabold text-xs">
                        +{item.suggestedQuantity} {item.unit}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right text-slate-600 dark:text-slate-300">
                      {item.unitPrice.toLocaleString('vi-VN')} đ
                    </td>
                    <td className="py-3 px-3 text-right font-extrabold text-slate-900 dark:text-white">
                      {item.estimatedCost.toLocaleString('vi-VN')} đ
                    </td>
                    <td className="py-3 px-3 text-slate-500 dark:text-slate-400 text-[11px]">
                      {item.reason}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-slate-200 dark:border-slate-800 font-extrabold text-xs">
                  <td colSpan={5} className="py-3 px-3 text-slate-700 dark:text-slate-300 uppercase">
                    Tổng Dự Toán Chi Phí Nhập Kho Đề Xuất:
                  </td>
                  <td className="py-3 px-3 text-right text-[#38BDF8] text-sm">
                    {data.recommendedRestock
                      .reduce((sum, item) => sum + item.estimatedCost, 0)
                      .toLocaleString('vi-VN')}{' '}
                    đ
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
