'use client';
import { DashboardIcon } from '@/components/common/DashboardIcon';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { InlineAlert } from '@/components/ui/InlineAlert';
import { StatusDot } from '@/components/ui/StatusDot';

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1')
  .trim()
  .replace(/[\r\n\t]+/g, '')
  .replace(/\/+$/, '');

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

  // Horizontal Scroll & Drag-to-scroll controls for 7-day forecast
  const forecastScrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const isDraggingRef = useRef(false);
  const startXRef = useRef(0);
  const scrollLeftStartRef = useRef(0);

  const checkScroll = useCallback(() => {
    const el = forecastScrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 5);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 5);
  }, []);

  const handleScrollNav = (direction: 'left' | 'right') => {
    const el = forecastScrollRef.current;
    if (!el) return;
    const scrollAmount = direction === 'left' ? -220 : 220;
    el.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    setTimeout(checkScroll, 350);
  };

  // Convert mouse wheel into horizontal scroll when hovering over the cards
  useEffect(() => {
    const el = forecastScrollRef.current;
    if (!el) return;

    const onWheel = (e: WheelEvent) => {
      if (e.deltaY === 0) return;
      const canLeft = el.scrollLeft > 0;
      const canRight = el.scrollLeft < el.scrollWidth - el.clientWidth - 2;

      if ((e.deltaY > 0 && canRight) || (e.deltaY < 0 && canLeft)) {
        e.preventDefault();
        el.scrollLeft += e.deltaY;
        checkScroll();
      }
    };

    el.addEventListener('wheel', onWheel, { passive: false });
    el.addEventListener('scroll', checkScroll, { passive: true });
    checkScroll();

    return () => {
      el.removeEventListener('wheel', onWheel);
      el.removeEventListener('scroll', checkScroll);
    };
  }, [data, checkScroll]);

  const handleMouseDown = (e: React.MouseEvent) => {
    const el = forecastScrollRef.current;
    if (!el) return;
    isDraggingRef.current = true;
    startXRef.current = e.pageX - el.offsetLeft;
    scrollLeftStartRef.current = el.scrollLeft;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current) return;
    const el = forecastScrollRef.current;
    if (!el) return;
    e.preventDefault();
    const x = e.pageX - el.offsetLeft;
    const walk = (x - startXRef.current) * 1.5;
    el.scrollLeft = scrollLeftStartRef.current - walk;
    checkScroll();
  };

  const handleMouseUpOrLeave = () => {
    isDraggingRef.current = false;
  };

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
        <DashboardIcon name="rotate_right" className="text-3xl text-[#38BDF8] animate-spin mb-3" />
        <p className="text-xs font-extrabold text-slate-600 dark:text-slate-300">
          Kohi AI đang phân tích chuỗi thời gian 30 ngày & tính toán dự báo...
        </p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      {/* Top Banner: AI Overview & Summary */}
      <div className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-slate-900 via-slate-950 to-[#090D16] border border-slate-800 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-[#38BDF8]/20 border border-[#38BDF8]/40 flex items-center justify-center text-[#38BDF8] shrink-0">
              <DashboardIcon name="auto_graph" className="text-2xl" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-extrabold text-white tracking-tight">
                  Dự Báo Nhu Cầu & Nhập Kho Thông Minh
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-[#38BDF8] text-slate-950 uppercase tracking-wider">
                  Kohi AI Engine
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Phân tích Time-Series từ lịch sử doanh số và tốc độ tiêu hao nguyên liệu thực tế
              </p>
            </div>
          </div>

          <button
            onClick={fetchForecast}
            disabled={loading}
            className="w-full sm:w-auto justify-center px-4 py-2.5 rounded-xl sm:rounded-2xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-xs font-extrabold text-slate-200 flex items-center gap-2 transition-colors active:scale-95 cursor-pointer"
          >
            <DashboardIcon name="sync" className={`text-sm ${loading ? 'animate-spin' : ''}`} />
            <span>Cập nhật dự báo</span>
          </button>
        </div>

        {/* AI Insight Narrative */}
        {data?.summary && (
          <div className="relative z-10 mt-4 p-4 rounded-2xl bg-white/5 border border-white/10 text-xs leading-relaxed text-slate-300 font-medium">
            <div className="flex items-center gap-2 text-[#38BDF8] font-extrabold mb-1">
              <DashboardIcon name="insights" className="text-base" />
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
          >
            <InlineAlert
              severity="success"
              dismissible
              onDismiss={() => setSuccessMsg(null)}
              icon={<DashboardIcon name="check_circle" />}
            >
              {successMsg}
            </InlineAlert>
          </motion.div>
        )}
        {errorMsg && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <InlineAlert
              severity="error"
              dismissible
              onDismiss={() => setErrorMsg(null)}
              icon={<DashboardIcon name="error_outline" />}
            >
              {errorMsg}
            </InlineAlert>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 7-Day Revenue & Demand Projection (Full-width 7 Columns) */}
      <div className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-white dark:bg-[#090D16] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <DashboardIcon name="calendar_month" className="text-[#38BDF8] text-xl" />
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
                Dự Báo Bán Hàng 7 Ngày Tới
              </h3>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="text-xs text-slate-400 font-bold hidden sm:inline">
                Độ tin cậy: ~90%
              </span>
              {/* Horizontal Scroll Navigation Buttons */}
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200 dark:border-white/10 shadow-2xs">
                <button
                  type="button"
                  onClick={() => handleScrollNav('left')}
                  disabled={!canScrollLeft}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-700 hover:text-sky-500 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer shadow-2xs active:scale-95"
                  title="Cuộn sang trái"
                  aria-label="Cuộn sang trái"
                >
                  <DashboardIcon name="chevron_left" className="text-base" />
                </button>
                <button
                  type="button"
                  onClick={() => handleScrollNav('right')}
                  disabled={!canScrollRight}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-700 hover:text-sky-500 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer shadow-2xs active:scale-95"
                  title="Cuộn sang phải"
                  aria-label="Cuộn sang phải"
                >
                  <DashboardIcon name="chevron_right" className="text-base" />
                </button>
              </div>
            </div>
          </div>

          <div
            ref={forecastScrollRef}
            data-lenis-prevent
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUpOrLeave}
            onMouseLeave={handleMouseUpOrLeave}
            className="custom-horizontal-scrollbar flex gap-3 overflow-x-auto pb-3.5 pt-1 -mx-1 px-1 touch-pan-x overscroll-x-contain cursor-grab active:cursor-grabbing select-none"
            style={{
              WebkitOverflowScrolling: 'touch',
            }}
          >
            {data?.forecastDays.map((day, idx) => {
              const isWeekend = day.dayOfWeek === 'Thứ Bảy' || day.dayOfWeek === 'Chủ Nhật';
              return (
                <div
                  key={idx}
                  className={`w-[165px] sm:w-[175px] min-w-[165px] sm:min-w-[175px] shrink-0 p-3.5 rounded-2xl border transition-all flex flex-col justify-between shadow-xs ${
                    isWeekend
                      ? 'bg-sky-50/70 dark:bg-sky-950/30 border-sky-300/80 dark:border-sky-800/60 shadow-sky-500/10'
                      : 'bg-slate-50/90 dark:bg-slate-900/50 border-slate-200/80 dark:border-slate-800/80'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-1 mb-2">
                      <span className="text-[13px] font-extrabold text-slate-900 dark:text-white whitespace-nowrap">
                        {day.dayOfWeek}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-slate-200/80 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold shrink-0">
                        {day.date.split('-').slice(1).reverse().join('/')}
                      </span>
                    </div>

                    <div className="text-base font-extrabold text-[#38BDF8] tracking-tight">
                      {day.projectedRevenue.toLocaleString('vi-VN')} đ
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 mt-2 pt-2 border-t border-slate-200/70 dark:border-slate-800/70">
                      <span>Dự kiến:</span>
                      <span className="font-extrabold text-slate-700 dark:text-slate-300">
                        {day.projectedOrders} đơn
                      </span>
                    </div>
                  </div>

                  <div className="mt-2.5 pt-2 border-t border-slate-200/60 dark:border-slate-800/70 text-[10.5px]">
                    <span className="text-slate-400 dark:text-slate-500 block text-[10px] font-medium">Cao điểm:</span>
                    <span className="font-bold text-slate-700 dark:text-slate-300 block leading-tight mt-0.5 whitespace-normal" title={day.peakHours}>
                      {day.peakHours}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
          <span>Dữ liệu tự động đồng bộ theo chu kỳ 30 ngày gần nhất</span>
          <span className="font-bold text-sky-500">Màu xanh: Ngày cao điểm cuối tuần</span>
        </div>
      </div>

      {/* Stockout Risk Warnings */}
      <div className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-white dark:bg-[#090D16] border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <DashboardIcon name="warning_amber" className="text-amber-500 text-xl" />
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
              Cảnh Báo Cạn Kho
            </h3>
          </div>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            {data?.stockoutWarnings.length || 0} mặt hàng
          </span>
        </div>

        {data?.stockoutWarnings && data.stockoutWarnings.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
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
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                      w.severity === 'critical'
                        ? 'bg-rose-600/10 text-rose-500 border border-rose-500/20'
                        : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                    }`}
                  >
                    <StatusDot
                      status={w.severity === 'critical' ? 'cancelled' : 'warning'}
                      size="sm"
                      ping={w.severity === 'critical'}
                    />
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
          <div className="p-6 text-center text-xs text-slate-500 dark:text-slate-400 flex items-center justify-center gap-3 bg-slate-50/60 dark:bg-white/5 rounded-2xl border border-slate-200/60 dark:border-white/5">
            <DashboardIcon name="check_circle" className="text-emerald-500 text-2xl shrink-0" />
            <span className="font-semibold text-slate-700 dark:text-slate-200">
              Tất cả nguyên liệu hiện đang ở mức an toàn cho 7 ngày tới. Không có nguyên liệu nào chạm ngưỡng cạn kiệt.
            </span>
          </div>
        )}

        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400">
          Hệ thống tự động phân tích và cảnh báo khi tồn kho chạm ngưỡng tối thiểu
        </div>
      </div>

      {/* Bottom Section: Smart Restock Recommendation Table */}
      {data?.recommendedRestock && data.recommendedRestock.length > 0 && (
        <div className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-white dark:bg-[#090D16] border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
            <div>
              <div className="flex items-center gap-2">
                <DashboardIcon name="inventory_2" className="text-[#38BDF8] text-xl" />
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
              className="w-full sm:w-auto justify-center px-5 py-2.5 rounded-xl sm:rounded-2xl bg-[#38BDF8] hover:bg-sky-400 text-slate-950 font-extrabold text-xs shadow-lg shadow-sky-500/20 flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              <DashboardIcon name={isApplying ? 'rotate_right' : 'task_alt'} className={`text-base ${isApplying ? 'animate-spin' : ''}`} />
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
