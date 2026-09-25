'use client';
import { AppIcon } from '@/components/common/DashboardIcon';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ThemeToggleSwitch } from './ThemeToggleSwitch';
import { LanguageToggleSwitch } from './LanguageToggleSwitch';
import { BrandLogo } from './BrandLogo';

interface Table {
  _id: string;
  tableName: string;
  status: string;
}

type Lang = 'vi' | 'en' | 'zh';

interface HeaderProps {
  table: Table | null;
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (open: boolean) => void;
  handleCallStaff: () => void;
  callStaffCooldown: number;
  isCallingStaff: boolean;
  setIsTransferModalOpen: (open: boolean) => void;
  handleLeaveTable?: () => void;
  isLeaveDisabled?: boolean;
  leaveDisabledReason?: string;
  isDark: boolean;
  setTheme: (theme: string) => void;
  lang: Lang;
  setLang: (l: Lang) => void;
  handleOpenOrderHistory: () => void;
  activeOrders?: any[];
  onOpenQRModal?: () => void;
  setIsCartOpen?: (open: boolean) => void;
  totalQuantity?: number;
  onOpenNotifications?: () => void;
  unreadNotificationCount?: number;
  customerName?: string;
  onOpenNamePrompt?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  table,
  isMobileMenuOpen,
  setIsMobileMenuOpen,
  handleCallStaff,
  callStaffCooldown,
  isCallingStaff,
  setIsTransferModalOpen,
  handleLeaveTable,
  isLeaveDisabled = false,
  leaveDisabledReason,
  isDark,
  setTheme,
  lang,
  setLang,
  handleOpenOrderHistory,
  activeOrders = [],
  onOpenQRModal,
  setIsCartOpen,
  totalQuantity = 0,
  onOpenNotifications,
  unreadNotificationCount = 0,
  customerName,
  onOpenNamePrompt,
}) => {
  const [isFloatingPopupOpen, setIsFloatingPopupOpen] = useState(false);

  const togglePopup = () => {
    setIsFloatingPopupOpen((prev) => !prev);
  };

  const closePopup = () => {
    setIsFloatingPopupOpen(false);
  };

  return (
    <>
      {/* ── Mobile Top App Bar ──────────────────────────────────────────────── */}
      <header className="fixed top-0 left-0 right-0 z-40 h-16 px-4 bg-white/90 dark:bg-[#0E121B]/95 backdrop-blur-xl border-b border-slate-200/80 dark:border-white/10 flex justify-between items-center md:hidden shadow-xs transition-colors">
        <BrandLogo />
        <div className="flex items-center gap-1.5 sm:gap-2">


          {/* Notification Button */}
          <button
            type="button"
            onClick={onOpenNotifications || handleOpenOrderHistory}
            className="relative w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-900/80 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 flex items-center justify-center shadow-xs active:scale-95 transition-all cursor-pointer"
            title="Xem danh sách thông báo"
          >
            <AppIcon name="notifications" className="text-xl" />
            {unreadNotificationCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 flex items-center justify-center text-[10px] font-black bg-[#3B82F6] text-white rounded-full shadow-xs leading-none animate-pulse">
                {unreadNotificationCount}
              </span>
            )}
          </button>

          {/* 3-Dots Dropdown Menu Button */}
          <button
            type="button"
            onClick={togglePopup}
            className={`relative w-10 h-10 rounded-xl border flex items-center justify-center shadow-xs active:scale-95 transition-all cursor-pointer ${
              isFloatingPopupOpen
                ? 'bg-slate-900 text-white border-slate-900 dark:bg-sky-500 dark:text-slate-950 dark:border-sky-500 shadow-sky-500/20'
                : 'bg-slate-100 dark:bg-slate-900/80 border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 hover:text-sky-600 dark:hover:text-sky-400'
            }`}
            title="Danh mục tùy chọn"
            aria-label="Danh mục tùy chọn"
            aria-expanded={isFloatingPopupOpen}
          >
            <AppIcon name="more_vert" className="text-2xl transition-transform duration-200" />

            {/* Notification Dot Badge */}
            {!isFloatingPopupOpen && (totalQuantity > 0 || activeOrders.length > 0) && (
              <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-rose-500 rounded-full border-2 border-white dark:border-[#0B0F17]" />
            )}
          </button>
        </div>
      </header>

      {/* ── Mobile Nav Drawer (Left Off-canvas Navigation) ───────────────────── */}
      <AnimatePresence>
        {isFloatingPopupOpen && (
          <>
            {/* Backdrop Scrim overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={closePopup}
              className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs md:hidden"
              aria-hidden="true"
            />

            {/* Left Nav Drawer Container */}
            <motion.nav
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 280 }}
              role="dialog"
              aria-modal="true"
              aria-label="Navigation Drawer"
              className="fixed inset-y-0 left-0 z-50 w-[84%] max-w-[340px] sm:max-w-[360px] h-full h-dvh bg-white dark:bg-[#090D16] border-r border-slate-200/90 dark:border-white/10 rounded-r-3xl shadow-2xl md:hidden font-sans flex flex-col justify-between overflow-hidden"
            >
              {/* Drawer Top Header: Table Info & QR Button & Close */}
              <div className="p-4 sm:p-5 pb-3.5 border-b border-slate-200/80 dark:border-white/10 flex items-center justify-between shrink-0 bg-white/95 dark:bg-[#090D16]/95 backdrop-blur-md">
                <div className="min-w-0 pr-2">
                  <p className="text-[10px] uppercase tracking-wider font-extrabold text-slate-500 dark:text-slate-400">
                    {lang === 'en' ? 'CURRENT TABLE' : lang === 'zh' ? '当前桌位' : 'VỊ TRÍ BÀN'}
                  </p>
                  <h4 className="text-base font-black text-slate-900 dark:text-white mt-0.5 truncate">
                    {table?.tableName ?? (lang === 'en' ? 'Table 01' : lang === 'zh' ? '01号桌' : 'Bàn 01')}{' '}
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                      {lang === 'en' ? '(1st Floor)' : lang === 'zh' ? '(1层)' : '(Tầng 1)'}
                    </span>
                  </h4>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {onOpenQRModal && (
                    <button
                      type="button"
                      onClick={() => {
                        closePopup();
                        onOpenQRModal();
                      }}
                      className="px-2.5 py-1.5 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 text-[#0284c7] dark:text-[#38BDF8] text-xs font-bold transition-all active:scale-95 border border-sky-500/30 cursor-pointer"
                    >
                      {lang === 'en' ? 'QR Code' : lang === 'zh' ? '二维码' : 'Mã QR'}
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={closePopup}
                    className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white flex items-center justify-center transition-all active:scale-95 cursor-pointer"
                    title={lang === 'en' ? 'Close' : lang === 'zh' ? '关闭' : 'Đóng'}
                    aria-label="Đóng menu"
                  >
                    <AppIcon name="close" className="text-lg" />
                  </button>
                </div>
              </div>

              {/* Scrollable Drawer Body Content */}
              <div className="flex-1 overflow-y-auto px-4 sm:px-5 py-4 space-y-3.5 scrollbar-none overscroll-contain">
                {/* Customer Name Profile in Mobile Sheet */}
                <div className="bg-sky-500/10 dark:bg-sky-500/15 border border-sky-500/30 rounded-2xl p-3 flex items-center justify-between shadow-xs">
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] uppercase tracking-wider font-extrabold text-slate-500 dark:text-slate-400">
                      {lang === 'en' ? 'CUSTOMER NAME' : lang === 'zh' ? '顾客姓名' : 'TÊN CỦA BẠN'}
                    </p>
                    <p className="text-sm font-bold text-slate-900 dark:text-white truncate mt-0.5">
                      {customerName || (lang === 'en' ? 'Guest (Not set)' : lang === 'zh' ? '未设置（访客）' : 'Chưa đặt tên')}
                    </p>
                  </div>
                  {onOpenNamePrompt && (
                    <button
                      type="button"
                      onClick={() => {
                        closePopup();
                        onOpenNamePrompt();
                      }}
                      className="px-3 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold transition-all active:scale-95 shadow-xs cursor-pointer flex items-center gap-1 shrink-0 ml-2"
                    >
                      <AppIcon name="edit" className="text-sm" />
                      <span>{customerName ? (lang === 'en' ? 'Edit' : 'Đổi tên') : (lang === 'en' ? 'Enter' : 'Nhập tên')}</span>
                    </button>
                  )}
                </div>

                {/* Primary Actions (Modern Inset Grouped List) */}
                <div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200/90 dark:border-white/10 rounded-2xl overflow-hidden divide-y divide-slate-200/80 dark:divide-white/5 shadow-xs">
                  {/* Thực Đơn */}
                  <button
                    type="button"
                    onClick={() => {
                      closePopup();
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="w-full px-3.5 py-3 flex items-center justify-between text-left hover:bg-slate-100/80 dark:hover:bg-slate-800/60 transition-colors active:scale-[0.99] cursor-pointer group"
                  >
                    <div>
                      <h5 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-sky-500 dark:group-hover:text-sky-400 transition-colors">
                        {lang === 'en' ? 'Menu' : lang === 'zh' ? '完整菜单' : 'Thực đơn'}
                      </h5>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {lang === 'en' ? 'Browse coffee & food' : lang === 'zh' ? '浏览咖啡与点心' : 'Xem danh sách món ăn'}
                      </p>
                    </div>
                    <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 group-hover:text-sky-500 dark:group-hover:text-sky-400 group-hover:translate-x-0.5 transition-all">
                      →
                    </span>
                  </button>

                  {/* Giỏ Hàng */}
                  <button
                    type="button"
                    onClick={() => {
                      closePopup();
                      if (setIsCartOpen) setIsCartOpen(true);
                    }}
                    className="w-full px-3.5 py-3 flex items-center justify-between text-left hover:bg-slate-100/80 dark:hover:bg-slate-800/60 transition-colors active:scale-[0.99] cursor-pointer group"
                  >
                    <div>
                      <h5 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                        {lang === 'en' ? 'Your Cart' : lang === 'zh' ? '购物车' : 'Giỏ hàng'}
                      </h5>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {totalQuantity > 0
                          ? (lang === 'en' ? `${totalQuantity} items selected` : lang === 'zh' ? `已选择 ${totalQuantity} 件商品` : `Đã chọn ${totalQuantity} món`)
                          : (lang === 'en' ? 'No items selected' : lang === 'zh' ? '尚未选择商品' : 'Chưa có món nào')}
                      </p>
                    </div>
                    {totalQuantity > 0 ? (
                      <span className="px-2.5 py-0.5 text-xs font-black bg-emerald-500 text-white rounded-lg shadow-2xs">
                        {totalQuantity} {lang === 'en' ? 'items' : lang === 'zh' ? '件' : 'món'}
                      </span>
                    ) : (
                      <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">
                        {lang === 'en' ? 'Empty' : lang === 'zh' ? '空' : 'Trống'}
                      </span>
                    )}
                  </button>

                  {/* Lịch Sử Đơn Hàng */}
                  <button
                    type="button"
                    onClick={() => {
                      closePopup();
                      handleOpenOrderHistory();
                    }}
                    className="w-full px-3.5 py-3 flex items-center justify-between text-left hover:bg-slate-100/80 dark:hover:bg-slate-800/60 transition-colors active:scale-[0.99] cursor-pointer group"
                  >
                    <div>
                      <h5 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-sky-500 dark:group-hover:text-sky-400 transition-colors">
                        {lang === 'en' ? 'Orders' : lang === 'zh' ? '点单记录' : 'Đơn hàng'}
                      </h5>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {activeOrders.length > 0
                          ? (lang === 'en' ? `${activeOrders.length} active orders` : lang === 'zh' ? `${activeOrders.length} 笔订单进行中` : `${activeOrders.length} đơn đang theo dõi`)
                          : (lang === 'en' ? 'No active orders' : lang === 'zh' ? '暂无进行中订单' : 'Chưa có đơn nào')}
                      </p>
                    </div>
                    {activeOrders.length > 0 ? (
                      <span className="px-2.5 py-0.5 text-xs font-black bg-sky-500 text-white rounded-lg shadow-2xs">
                        {activeOrders.length} {lang === 'en' ? 'orders' : lang === 'zh' ? '单' : 'đơn'}
                      </span>
                    ) : (
                      <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 group-hover:text-sky-500 dark:group-hover:text-sky-400 group-hover:translate-x-0.5 transition-all">
                        →
                      </span>
                    )}
                  </button>
                </div>

                {/* Gọi Nhân Viên Banner */}
                <button
                  type="button"
                  onClick={handleCallStaff}
                  disabled={callStaffCooldown > 0 || isCallingStaff}
                  className={`w-full p-3.5 rounded-2xl border text-left transition-all flex items-center justify-between cursor-pointer active:scale-[0.99] shadow-xs ${
                    callStaffCooldown > 0
                      ? 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400 opacity-80 cursor-not-allowed'
                      : 'bg-amber-500/15 hover:bg-amber-500/25 border-amber-500/35 text-amber-700 dark:text-amber-300'
                  }`}
                >
                  <div>
                    <h5 className="text-sm font-extrabold leading-tight">
                      {callStaffCooldown > 0
                        ? (lang === 'en' ? `Please wait (${callStaffCooldown}s)` : lang === 'zh' ? `请稍候 (${callStaffCooldown}秒)` : `Đang gọi (Chờ ${callStaffCooldown}s)`)
                        : (lang === 'en' ? 'Call Staff' : lang === 'zh' ? '呼叫服务员' : 'Gọi nhân viên')}
                    </h5>
                    <p className="text-xs opacity-80 mt-0.5 font-medium">
                      {callStaffCooldown > 0
                        ? (lang === 'en' ? 'Staff is being notified' : lang === 'zh' ? '服务员正在前往' : 'Nhân viên đang tiếp nhận thông tin')
                        : (lang === 'en' ? 'Request table assistance' : lang === 'zh' ? '需要餐桌协助与服务' : 'Yêu cầu phục vụ tại bàn')}
                    </p>
                  </div>
                  <span className="px-3 py-1.5 rounded-xl bg-amber-500 text-white text-xs font-black shadow-xs shrink-0">
                    {callStaffCooldown > 0
                      ? `${callStaffCooldown}s`
                      : (lang === 'en' ? 'Request' : lang === 'zh' ? '立即呼叫' : 'Gửi yêu cầu')}
                  </span>
                </button>

                {/* Secondary Table Actions (Change Table / Leave Table) */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      closePopup();
                      setIsTransferModalOpen(true);
                    }}
                    className="px-3 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-900/80 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 transition-all cursor-pointer border border-slate-200 dark:border-white/10 text-center truncate shadow-2xs active:scale-95"
                  >
                    {lang === 'en' ? 'Change Table' : lang === 'zh' ? '更换桌位' : 'Yêu cầu đổi bàn'}
                  </button>

                  {handleLeaveTable && (
                    <div className="flex flex-col gap-1">
                      <button
                        type="button"
                        disabled={isLeaveDisabled}
                        onClick={() => {
                          if (isLeaveDisabled) return;
                          closePopup();
                          handleLeaveTable();
                        }}
                        className={`px-3 py-2.5 rounded-xl text-xs font-bold transition-all text-center truncate shadow-2xs ${
                          isLeaveDisabled
                            ? 'bg-slate-100/60 dark:bg-slate-800/30 border border-slate-200/50 dark:border-white/5 text-slate-400 dark:text-slate-600 cursor-not-allowed opacity-60'
                            : 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 cursor-pointer border border-rose-500/30 active:scale-95'
                        }`}
                        title={isLeaveDisabled ? (leaveDisabledReason || 'Đơn hàng đã được duyệt và đang chờ làm, không thể rời bàn.') : undefined}
                      >
                        {lang === 'en' ? 'Leave Table' : lang === 'zh' ? '离开桌位' : 'Rời bàn'}
                      </button>
                      {isLeaveDisabled && (
                        <span className="text-[10px] text-amber-500/90 dark:text-amber-400 font-medium text-center">
                          {leaveDisabledReason || 'Đơn đã duyệt & đang làm'}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Footer Settings: Theme & Language */}
              <div className="p-4 sm:p-5 border-t border-slate-200/80 dark:border-white/10 flex items-center justify-between shrink-0 bg-slate-50/80 dark:bg-slate-900/40">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                  {lang === 'en' ? 'Theme & Language' : lang === 'zh' ? '主题与语言' : 'Giao diện & Ngôn ngữ'}
                </span>
                <div className="flex items-center gap-2">
                  <ThemeToggleSwitch isDark={isDark} setTheme={setTheme} />
                  <LanguageToggleSwitch lang={lang} setLang={setLang} />
                </div>
              </div>
            </motion.nav>
          </>
        )}
      </AnimatePresence>
    </>
  );
};
