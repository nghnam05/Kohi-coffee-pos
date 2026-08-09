'use client';

import React from 'react';

interface CatalogHeaderProps {
  t: any;
  customerName: string;
  handleOpenOrderHistory: () => void;
  activeOrders: any[];
  viewMode: 'grid' | 'list';
  setViewMode: (mode: 'grid' | 'list') => void;
}

export const CatalogHeader: React.FC<CatalogHeaderProps> = ({
  t,
  customerName,
  handleOpenOrderHistory,
  activeOrders,
  viewMode,
  setViewMode,
}) => {
  return (
    <div className="sticky top-0 z-30 bg-[#F8FAFC]/95 dark:bg-[#090D16]/95 backdrop-blur-md px-4 md:px-6 pt-4 pb-4 md:pt-6 md:pb-5 border-b border-[#E2E8F0] dark:border-[#222732] mb-5 md:mb-8 flex justify-between items-center transition-all shadow-sm">
      <div>
        <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-[32px] font-[700] text-[#000000] dark:text-[#FFFFFF] tracking-[-0.02em] leading-tight sm:leading-snug font-heading">
          {t.welcome ?? 'Hôm nay chúng ta uống gì?'}
        </h2>
        <p className="text-xs sm:text-[13px] md:text-[13.5px] font-[400] text-[#64748B] dark:text-[#9CA3AF] mt-1 sm:mt-1.5 leading-relaxed font-sans max-w-xl">
          {customerName
            ? `Xin chào, ${customerName} — Khám phá hương vị đặc trưng từ những hạt cà phê rang xay thủ công và bánh ngọt chuẩn Kohi.`
            : 'Khám phá hương vị đặc trưng từ những hạt cà phê rang xay thủ công và bánh ngọt chuẩn Kohi.'}
        </p>
      </div>

      {/* Desktop Right Header Actions */}
      <div className="hidden md:flex items-center gap-2 flex-shrink-0">
        <button
          onClick={handleOpenOrderHistory}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#FFFFFF] dark:bg-[#181B21] border border-[#E2E8F0] dark:border-[#222732] text-xs font-black text-[#000000] dark:text-[#FFFFFF] hover:text-[#3AA6FF] hover:border-[#3AA6FF]/50 transition-all shadow-sm active:scale-95 cursor-pointer"
          title="Xem lịch sử & trạng thái đơn hàng"
        >
          <span className="font-sans">Lịch sử & Trạng thái đơn</span>
          {activeOrders.length > 0 && (
            <span className="bg-[#3AA6FF] text-[#FFFFFF] text-[10px] font-black px-2 py-0.5 rounded-full animate-pulse">
              {activeOrders.length}
            </span>
          )}
        </button>

        {/* View Mode Toggle */}
        <div className="bg-[#FFFFFF] dark:bg-[#181B21] text-[#000000] dark:text-[#FFFFFF] rounded-xl p-1 border border-[#E2E8F0] dark:border-[#222732] shadow-sm flex items-center">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-lg transition-colors flex items-center justify-center ${
              viewMode === 'grid'
                ? 'bg-[#3AA6FF] text-white shadow-sm font-black'
                : 'text-[#64748B] dark:text-[#94A3B8] hover:text-[#000000] dark:hover:text-white'
            }`}
            title="Dạng lưới"
          >
            <span className="material-symbols-outlined text-lg">grid_view</span>
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-lg transition-colors flex items-center justify-center ${
              viewMode === 'list'
                ? 'bg-[#3AA6FF] text-white shadow-sm font-black'
                : 'text-[#64748B] dark:text-[#94A3B8] hover:text-[#000000] dark:hover:text-white'
            }`}
            title="Dạng danh sách"
          >
            <span className="material-symbols-outlined text-lg">view_list</span>
          </button>
        </div>
      </div>
    </div>
  );
};
