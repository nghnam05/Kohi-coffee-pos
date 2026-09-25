'use client';
import { AppIcon } from '@/components/common/DashboardIcon';

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
  onOpenVoiceOrder?: () => void;
}

export const CatalogHeader: React.FC<CatalogHeaderProps> = ({
  t,
  customerName,
  handleOpenOrderHistory,
  activeOrders,
  viewMode,
  setViewMode,
  lang = 'vi',
  onOpenVoiceOrder,
}) => {

  const getSubtitle = () => {
    if (lang === 'en') {
      return customerName ? (
        <>
          Welcome <span className="font-bold text-slate-900 dark:text-white">{customerName}</span>, enjoy your specialty coffee moments today.
        </>
      ) : (
        'Handcrafted specialty coffee & fresh artisanal pastries.'
      );
    }
    if (lang === 'zh') {
      return customerName ? (
        <>
          欢迎 <span className="font-bold text-slate-900 dark:text-white">{customerName}</span>，愿您享受温馨惬意的咖啡时光。
        </>
      ) : (
        '手工现磨特调咖啡与每日新鲜烘焙糕点。'
      );
    }
    return customerName ? (
      <>
        Chào mừng&nbsp;<span className="font-bold text-slate-900 dark:text-white">{customerName}</span>, chúc bạn một ngày an yên và thưởng thức trọn vị cà phê.
      </>
    ) : (
      'Cà phê rang xay thủ công & Bánh ngọt tươi mới mỗi ngày.'
    );
  };

  return (
    <div className="px-4 md:px-5 xl:px-6 py-2 md:py-3.5 flex justify-between items-center transition-all gap-2">
      <div className="min-w-0 flex-1 mr-2 sm:mr-3">
        <h2 className="text-lg sm:text-xl lg:text-[22px] xl:text-[26px] 2xl:text-[28px] font-extrabold text-slate-900 dark:text-white tracking-[-0.02em] leading-snug font-heading truncate">
          {t.welcome ?? (lang === 'en' ? 'What would you like today?' : lang === 'zh' ? '今天想喝点什么？' : 'Hôm nay bạn muốn dùng gì?')}
        </h2>
        <p className="text-xs sm:text-[13px] md:text-sm font-normal text-slate-500 dark:text-slate-400 mt-1 sm:mt-1.5 leading-normal font-sans max-w-xl truncate">
          {getSubtitle()}
        </p>
      </div>

      {/* Header Actions */}
      <div className="flex items-center gap-1.5 xl:gap-2 flex-shrink-0">
        {/* Desktop Voice Order Button */}
        {onOpenVoiceOrder && (
          <button
            onClick={onOpenVoiceOrder}
            className="hidden md:flex items-center justify-center w-8 h-8 xl:w-9 xl:h-9 rounded-xl bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 hover:text-sky-500 dark:hover:text-[#38BDF8] hover:border-sky-500/50 hover:bg-sky-50 dark:hover:bg-sky-500/10 transition-all shadow-xs active:scale-95 cursor-pointer font-sans group shrink-0"
            title={lang === 'en' ? 'Voice Order' : lang === 'zh' ? '语音点单' : 'Gọi món bằng giọng nói'}
            aria-label={lang === 'en' ? 'Voice Order' : lang === 'zh' ? '语音点单' : 'Gọi món bằng giọng nói'}
          >
            <AppIcon name="mic" className="text-[17px] xl:text-[19px] text-[#0284c7] dark:text-[#38BDF8] group-hover:scale-110 transition-transform" />
          </button>
        )}

        {/* Desktop Order History Button */}
        <button
          onClick={handleOpenOrderHistory}
          className="hidden md:flex items-center gap-1.5 px-2.5 xl:px-3 py-1.5 xl:py-2 rounded-xl bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:text-sky-600 dark:hover:text-sky-400 hover:border-sky-500/30 transition-all shadow-xs active:scale-95 cursor-pointer font-sans shrink-0"
          title={lang === 'en' ? 'View order history & status' : lang === 'zh' ? '查看点单记录与状态' : 'Xem lịch sử & trạng thái đơn hàng'}
        >
          <AppIcon name={activeOrders.length > 0 ? 'notifications_active' : 'notifications'} className="text-base text-sky-500 dark:text-sky-400 shrink-0" />
          <span className="whitespace-nowrap hidden xl:inline">{t.orderHistory || (lang === 'en' ? 'Order Status' : lang === 'zh' ? '点单状态' : 'Trạng thái đơn')}</span>
          {activeOrders.length > 0 ? (
            <span className="bg-[#0284C7] dark:bg-sky-400 text-white dark:text-slate-950 text-[10px] font-bold px-1.5 xl:px-2 py-0.5 rounded-full shrink-0">
              {activeOrders.length}
            </span>
          ) : (
            <span className="hidden xl:inline bg-slate-200 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-slate-300/60 dark:border-white/10 shrink-0">
              {lang === 'en' ? 'None' : lang === 'zh' ? '暂无' : 'Chưa có'}
            </span>
          )}
        </button>

        {/* View Mode Toggle: Grid vs List */}
        <div className="hidden sm:inline-flex items-center p-0.5 xl:p-1 bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 rounded-xl shadow-2xs font-sans shrink-0">
          <button
            type="button"
            onClick={() => setViewMode('grid')}
            className={`p-1 xl:p-1.5 rounded-lg transition-all cursor-pointer ${viewMode === 'grid'
                ? 'bg-white dark:bg-slate-800 text-sky-600 dark:text-sky-400 shadow-xs'
                : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
            title="Lưới"
          >
            <AppIcon name="grid_view" className="text-base xl:text-lg leading-none block" />
          </button>
          <button
            type="button"
            onClick={() => setViewMode('list')}
            className={`p-1 xl:p-1.5 rounded-lg transition-all cursor-pointer ${viewMode === 'list'
                ? 'bg-white dark:bg-slate-800 text-sky-600 dark:text-sky-400 shadow-xs'
                : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
            title="Danh sách"
          >
            <AppIcon name="view_list" className="text-base xl:text-lg leading-none block" />
          </button>
        </div>
      </div>
    </div>
  );
};
