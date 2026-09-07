'use client';

import React from 'react';

type Lang = 'vi' | 'en' | 'zh';

interface CatalogHeaderProps {
  t: any;
  customerName: string;
  handleOpenOrderHistory: () => void;
  activeOrders: any[];
  viewMode: 'grid' | 'list';
  setViewMode: (mode: 'grid' | 'list') => void;
  lang?: Lang;
}

export const CatalogHeader: React.FC<CatalogHeaderProps> = ({
  t,
  customerName,
  handleOpenOrderHistory,
  activeOrders,
  viewMode,
  setViewMode,
  lang = 'vi',
}) => {
  const getSubtitle = () => {
    if (lang === 'en') {
      return customerName
        ? `Hello, ${customerName} — Discover signature handcrafted coffee & fresh Kohi pastries.`
        : 'Discover signature handcrafted coffee & fresh Kohi pastries.';
    }
    if (lang === 'zh') {
      return customerName
        ? `你好，${customerName} — 探索手作特调咖啡与 Kohi 精致烘焙点心。`
        : '探索手作特调咖啡与 Kohi 精致烘焙点心。';
    }
    return customerName
      ? `Xin chào, ${customerName} — Khám phá hương vị đặc trưng từ những hạt cà phê rang xay thủ công và bánh ngọt chuẩn Kohi.`
      : 'Khám phá hương vị đặc trưng từ những hạt cà phê rang xay thủ công và bánh ngọt chuẩn Kohi.';
  };

  return (
    <div className="px-4 md:px-6 py-2.5 md:py-4 flex justify-between items-center transition-all">
      <div>
        <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-[32px] font-black text-slate-900 dark:text-white tracking-[-0.02em] leading-tight font-heading">
          {t.welcome ?? 'Hôm nay chúng ta uống gì?'}
        </h2>
        <p className="text-xs sm:text-[13.5px] md:text-[14px] font-medium text-slate-500 dark:text-slate-400 mt-1 leading-relaxed font-sans max-w-xl">
          {getSubtitle()}
        </p>
      </div>

      {/* Header Actions */}
      <div className="flex items-center gap-2 flex-shrink-0 ml-2">
        {/* Desktop Order History Button */}
        <button
          onClick={handleOpenOrderHistory}
          className="hidden md:flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 text-xs font-bold text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-500/50 transition-all shadow-xs active:scale-95 cursor-pointer font-sans"
          title={lang === 'en' ? 'View order history & status' : lang === 'zh' ? '查看点单记录与状态' : 'Xem lịch sử & trạng thái đơn hàng'}
        >
          <span className="material-symbols-outlined text-base text-blue-500 dark:text-blue-400">
            {activeOrders.length > 0 ? 'notifications_active' : 'notifications'}
          </span>
          <span>{t.orderHistory || (lang === 'en' ? 'Order History & Status' : lang === 'zh' ? '点单记录与状态' : 'Lịch sử & Trạng thái đơn')}</span>
          {activeOrders.length > 0 ? (
            <span className="bg-[#3B82F6] text-white text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse">
              {activeOrders.length}
            </span>
          ) : (
            <span className="bg-slate-200 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-slate-300/60 dark:border-white/10">
              {lang === 'en' ? 'None' : lang === 'zh' ? '暂无' : 'Chưa có'}
            </span>
          )}
        </button>

        {/* View Mode Toggle (Desktop only - Mobile version is positioned beside search bar) */}
        <div className="hidden md:flex bg-slate-100 dark:bg-slate-900/60 text-slate-700 dark:text-slate-200 rounded-xl p-1 border border-slate-200 dark:border-white/10 shadow-xs items-center">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-lg transition-colors flex items-center justify-center cursor-pointer ${
              viewMode === 'grid'
                ? 'bg-[#3B82F6] text-white shadow-xs font-bold'
                : 'text-slate-400 hover:text-slate-800 dark:hover:text-white'
            }`}
            title="Dạng lưới"
            aria-label="Dạng lưới"
          >
            <span className="material-symbols-outlined text-lg">grid_view</span>
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-lg transition-colors flex items-center justify-center cursor-pointer ${
              viewMode === 'list'
                ? 'bg-[#3B82F6] text-white shadow-xs font-bold'
                : 'text-slate-400 hover:text-slate-800 dark:hover:text-white'
            }`}
            title="Dạng danh sách"
            aria-label="Dạng danh sách"
          >
            <span className="material-symbols-outlined text-lg">view_list</span>
          </button>
        </div>
      </div>
    </div>
  );
};
