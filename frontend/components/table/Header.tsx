'use client';

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
      <header className="fixed top-0 left-0 right-0 z-40 h-16 px-4 bg-[var(--bg-primary)]/95 backdrop-blur-md border-b border-[var(--border-color)] flex justify-between items-center md:hidden shadow-xs transition-colors">
        <BrandLogo />
        <div className="flex items-center gap-2">
          {/* Notification Button */}
          <button
            type="button"
            onClick={onOpenNotifications || handleOpenOrderHistory}
            className="relative w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/60 text-slate-700 dark:text-slate-200 hover:text-[#0284c7] dark:hover:text-[#38BDF8] flex items-center justify-center shadow-xs active:scale-95 transition-all cursor-pointer"
            title="Xem danh sách thông báo"
          >
            <span className="material-symbols-outlined text-xl">notifications</span>
            {unreadNotificationCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 flex items-center justify-center text-[10px] font-black bg-[#0284c7] dark:bg-[#38BDF8] text-white dark:text-slate-950 rounded-full shadow-xs leading-none animate-pulse">
                {unreadNotificationCount}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* ── Mobile Floating Action Button (FAB Widget) ──────────────────────── */}
      <div className="fixed bottom-6 right-5 z-50 md:hidden flex flex-col items-end">
        <button
          type="button"
          onClick={togglePopup}
          className={`relative w-14 h-14 rounded-full flex items-center justify-center text-white shadow-2xl transition-all duration-300 active:scale-95 cursor-pointer ${
            isFloatingPopupOpen
              ? 'bg-slate-900 dark:bg-white dark:text-slate-900 rotate-90 scale-105'
              : 'bg-gradient-to-tr from-[#0284c7] to-[#38BDF8] shadow-sky-500/40 hover:scale-105'
          }`}
          title="Mở menu chức năng"
        >
          <span className="material-symbols-outlined text-2xl transition-transform duration-300">
            {isFloatingPopupOpen ? 'close' : 'widgets'}
          </span>

          {/* Combined Badge Indicator */}
          {!isFloatingPopupOpen && (totalQuantity > 0 || activeOrders.length > 0) && (
            <span className="absolute -top-1 -right-1 min-w-[20px] h-[20px] px-1.5 flex items-center justify-center text-[10px] font-black bg-rose-500 text-white rounded-full border-2 border-white dark:border-slate-900 shadow-md animate-bounce">
              {totalQuantity + activeOrders.length}
            </span>
          )}
        </button>
      </div>

      {/* ── Mobile Floating Popup Menu Card ─────────────────────────────────── */}
      <AnimatePresence>
        {isFloatingPopupOpen && (
          <>
            {/* Backdrop overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closePopup}
              className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-xs md:hidden"
            />

            {/* Floating Card Popup */}
            <motion.div
              initial={{ opacity: 0, scale: 0.85, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.85, y: 30 }}
              transition={{ type: 'spring', damping: 22, stiffness: 280 }}
              className="fixed bottom-22 right-4 left-4 sm:left-auto sm:w-88 z-50 bg-white/95 dark:bg-[#0f172a]/95 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-4 shadow-2xl backdrop-blur-xl md:hidden font-sans space-y-3 max-h-[80vh] overflow-y-auto"
            >
              {/* Header: Table Info & QR */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-sky-500/10 text-[#0284c7] dark:text-[#38BDF8] flex items-center justify-center">
                    <span className="material-symbols-outlined text-lg">location_on</span>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold text-slate-400">Vị trí hiện tại</p>
                    <h4 className="text-xs font-black text-slate-900 dark:text-white">
                      {table?.tableName ?? 'Bàn 01'} (Tầng 1)
                    </h4>
                  </div>
                </div>

                {onOpenQRModal && (
                  <button
                    onClick={() => {
                      closePopup();
                      onOpenQRModal();
                    }}
                    className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-all active:scale-95"
                  >
                    <span className="material-symbols-outlined text-sm">qr_code_2</span>
                    <span>Mã QR</span>
                  </button>
                )}
              </div>

              {/* Main Action Grid */}
              <div className="grid grid-cols-2 gap-2">
                {/* 1. Menu Thực Đơn */}
                <button
                  onClick={() => {
                    closePopup();
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/80 hover:bg-sky-500/10 border border-slate-200/70 dark:border-slate-800 text-left transition-all flex flex-col justify-between gap-2 cursor-pointer active:scale-95"
                >
                  <div className="w-8 h-8 rounded-xl bg-[#0284c7]/10 dark:bg-[#38BDF8]/15 text-[#0284c7] dark:text-[#38BDF8] flex items-center justify-center">
                    <span className="material-symbols-outlined text-lg">restaurant_menu</span>
                  </div>
                  <div>
                    <p className="text-xs font-black text-slate-900 dark:text-white">
                      {lang === 'en' ? 'Menu' : lang === 'zh' ? '菜单' : 'Thực đơn'}
                    </p>
                    <p className="text-[10px] text-slate-400 font-medium">Danh sách món ăn</p>
                  </div>
                </button>

                {/* 2. Giỏ Hàng */}
                <button
                  onClick={() => {
                    closePopup();
                    if (setIsCartOpen) setIsCartOpen(true);
                  }}
                  className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/80 hover:bg-emerald-500/10 border border-slate-200/70 dark:border-slate-800 text-left transition-all flex flex-col justify-between gap-2 cursor-pointer active:scale-95 relative"
                >
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                    <span className="material-symbols-outlined text-lg">shopping_bag</span>
                  </div>
                  <div>
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-black text-slate-900 dark:text-white">
                        {lang === 'en' ? 'Cart' : lang === 'zh' ? '购物车' : 'Giỏ hàng'}
                      </p>
                      {totalQuantity > 0 && (
                        <span className="px-1.5 py-0.5 text-[10px] font-black bg-emerald-500 text-white rounded-md">
                          {totalQuantity} món
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-400 font-medium">Xem các món đã chọn</p>
                  </div>
                </button>

                {/* 3. Lịch Sử Đơn hàng */}
                <button
                  onClick={() => {
                    closePopup();
                    handleOpenOrderHistory();
                  }}
                  className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/80 hover:bg-indigo-500/10 border border-slate-200/70 dark:border-slate-800 text-left transition-all flex flex-col justify-between gap-2 cursor-pointer active:scale-95"
                >
                  <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                    <span className="material-symbols-outlined text-lg">receipt_long</span>
                  </div>
                  <div>
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-black text-slate-900 dark:text-white">
                        {lang === 'en' ? 'Orders' : lang === 'zh' ? '订单' : 'Đơn hàng'}
                      </p>
                      {activeOrders.length > 0 && (
                        <span className="px-1.5 py-0.5 text-[10px] font-black bg-indigo-500 text-white rounded-md">
                          {activeOrders.length}
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-400 font-medium">Theo dõi chế biến</p>
                  </div>
                </button>

                {/* 4. Gọi Nhân Viên */}
                <button
                  onClick={() => {
                    handleCallStaff();
                  }}
                  disabled={callStaffCooldown > 0 || isCallingStaff}
                  className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between gap-2 cursor-pointer active:scale-95 ${
                    callStaffCooldown > 0
                      ? 'bg-amber-500/5 border-amber-500/20 text-amber-600 opacity-80'
                      : 'bg-amber-500/10 dark:bg-amber-500/15 border-amber-500/30 text-amber-700 dark:text-amber-300 hover:bg-amber-500/20'
                  }`}
                >
                  <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                    <span className={`material-symbols-outlined text-lg ${callStaffCooldown === 0 ? 'animate-bounce' : ''}`}>
                      notifications_active
                    </span>
                  </div>
                  <div>
                    <p className="text-xs font-black">
                      {callStaffCooldown > 0
                        ? `Chờ ${callStaffCooldown}s`
                        : lang === 'en'
                        ? 'Call Staff'
                        : lang === 'zh'
                        ? '呼叫服务'
                        : 'Gọi nhân viên'}
                    </p>
                    <p className="text-[10px] text-amber-600/80 dark:text-amber-400/80 font-medium">Yêu cầu hỗ trợ</p>
                  </div>
                </button>
              </div>

              {/* Utility Action List */}
              <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                {/* Yêu cầu đổi vị trí bàn */}
                <button
                  onClick={() => {
                    closePopup();
                    setIsTransferModalOpen(true);
                  }}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900/60 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center justify-between transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-base text-[#0284c7] dark:text-[#38BDF8]">chair</span>
                    <span>{lang === 'vi' ? 'Chuyển / Đổi bàn ăn' : lang === 'zh' ? '更换桌位' : 'Change Table'}</span>
                  </div>
                  <span className="material-symbols-outlined text-sm text-slate-400">chevron_right</span>
                </button>

                {/* Rời khỏi bàn */}
                {handleLeaveTable && (
                  <button
                    onClick={() => {
                      closePopup();
                      handleLeaveTable();
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-xs font-bold text-rose-600 dark:text-rose-400 flex items-center justify-between transition-all cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-base text-rose-500">logout</span>
                      <span>{lang === 'vi' ? 'Rời khỏi bàn' : lang === 'zh' ? '离开桌位' : 'Leave Table'}</span>
                    </div>
                    <span className="material-symbols-outlined text-sm text-rose-400">chevron_right</span>
                  </button>
                )}
              </div>

              {/* Footer Settings: Theme & Language */}
              <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-base text-slate-400">
                    {isDark ? 'dark_mode' : 'light_mode'}
                  </span>
                  <ThemeToggleSwitch isDark={isDark} setTheme={setTheme} />
                </div>

                <div className="flex items-center gap-2">
                  <LanguageToggleSwitch lang={lang} setLang={setLang} />
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};
