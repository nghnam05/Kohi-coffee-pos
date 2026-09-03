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

          {/* 3-Dots Dropdown Menu Button */}
          <button
            type="button"
            onClick={togglePopup}
            className={`relative w-10 h-10 rounded-2xl border flex items-center justify-center shadow-xs active:scale-95 transition-all cursor-pointer ${
              isFloatingPopupOpen
                ? 'bg-[#0284c7] text-white border-[#0284c7] shadow-sky-500/30'
                : 'bg-slate-100 dark:bg-slate-800/80 border-slate-200/80 dark:border-slate-700/60 text-slate-700 dark:text-slate-200 hover:text-[#0284c7] dark:hover:text-[#38BDF8]'
            }`}
            title="Danh mục tùy chọn"
          >
            <span className="material-symbols-outlined text-2xl transition-transform duration-200">
              {isFloatingPopupOpen ? 'close' : 'more_vert'}
            </span>

            {/* Notification Dot Badge */}
            {!isFloatingPopupOpen && (totalQuantity > 0 || activeOrders.length > 0) && (
              <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-rose-500 rounded-full border-2 border-white dark:border-slate-900" />
            )}
          </button>
        </div>
      </header>

      {/* ── Mobile Crisp Bottom Sheet Modal ─────────────────────────────────── */}
      <AnimatePresence>
        {isFloatingPopupOpen && (
          <>
            {/* Backdrop overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closePopup}
              className="fixed inset-0 z-40 bg-slate-950/70 backdrop-blur-xs md:hidden"
            />

            {/* Bottom Sheet Container (Solid Background for Ultra Sharp Contrast) */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 26, stiffness: 300 }}
              className="fixed inset-x-0 bottom-0 z-50 bg-white dark:bg-[#0F172A] border-t border-slate-200 dark:border-slate-800 rounded-t-[32px] p-5 pt-3 shadow-[0_-16px_48px_rgba(0,0,0,0.35)] md:hidden font-sans space-y-4 max-h-[85vh] overflow-y-auto"
            >
              {/* Drag Handle Indicator */}
              <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto opacity-70" />

              {/* High Contrast Header: Table Info & QR Button */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <p className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400 dark:text-slate-400">Vị trí bàn</p>
                  <h4 className="text-base font-black text-slate-900 dark:text-white">
                    {table?.tableName ?? 'Bàn 01'} (Tầng 1)
                  </h4>
                </div>

                <div className="flex items-center gap-2">
                  {onOpenQRModal && (
                    <button
                      onClick={() => {
                        closePopup();
                        onOpenQRModal();
                      }}
                      className="px-3 py-1.5 rounded-xl bg-sky-50 dark:bg-sky-950/60 hover:bg-sky-100 text-[#0284c7] dark:text-[#38BDF8] text-xs font-bold transition-all active:scale-95 border border-sky-200 dark:border-sky-800"
                    >
                      Mã QR
                    </button>
                  )}

                  <button
                    onClick={closePopup}
                    className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700 transition-all active:scale-95"
                  >
                    <span className="material-symbols-outlined text-lg">close</span>
                  </button>
                </div>
              </div>

              {/* Main Action Grid (High-Contrast Vibrant Cards) */}
              <div className="grid grid-cols-2 gap-3">
                {/* 1. Menu Thực Đơn */}
                <button
                  onClick={() => {
                    closePopup();
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/90 hover:bg-sky-50 dark:hover:bg-slate-800/90 border border-slate-200 dark:border-slate-800 text-left transition-all flex flex-col justify-between gap-3 cursor-pointer active:scale-95 shadow-xs"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-black text-slate-900 dark:text-white">
                      {lang === 'en' ? 'Menu' : lang === 'zh' ? '菜单' : 'Thực đơn'}
                    </p>
                    <span className="material-symbols-outlined text-xl text-[#0284c7] dark:text-[#38BDF8]">
                      restaurant_menu
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Danh sách món ăn</p>
                </button>

                {/* 2. Giỏ Hàng */}
                <button
                  onClick={() => {
                    closePopup();
                    if (setIsCartOpen) setIsCartOpen(true);
                  }}
                  className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/90 hover:bg-emerald-50 dark:hover:bg-slate-800/90 border border-slate-200 dark:border-slate-800 text-left transition-all flex flex-col justify-between gap-3 cursor-pointer active:scale-95 shadow-xs relative"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-black text-slate-900 dark:text-white">
                      {lang === 'en' ? 'Cart' : lang === 'zh' ? '购物车' : 'Giỏ hàng'}
                    </p>
                    <div className="flex items-center gap-1.5">
                      {totalQuantity > 0 && (
                        <span className="px-2 py-0.5 text-[10px] font-black bg-emerald-600 text-white rounded-lg shadow-2xs">
                          {totalQuantity} món
                        </span>
                      )}
                      <span className="material-symbols-outlined text-xl text-emerald-600 dark:text-emerald-400">
                        shopping_bag
                      </span>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Xem món đã chọn</p>
                </button>

                {/* 3. Lịch Sử Đơn Hàng */}
                <button
                  onClick={() => {
                    closePopup();
                    handleOpenOrderHistory();
                  }}
                  className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/90 hover:bg-indigo-50 dark:hover:bg-slate-800/90 border border-slate-200 dark:border-slate-800 text-left transition-all flex flex-col justify-between gap-3 cursor-pointer active:scale-95 shadow-xs"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-black text-slate-900 dark:text-white">
                      {lang === 'en' ? 'Orders' : lang === 'zh' ? '订单' : 'Đơn hàng'}
                    </p>
                    <div className="flex items-center gap-1.5">
                      {activeOrders.length > 0 && (
                        <span className="px-2 py-0.5 text-[10px] font-black bg-indigo-600 text-white rounded-lg shadow-2xs">
                          {activeOrders.length}
                        </span>
                      )}
                      <span className="material-symbols-outlined text-xl text-indigo-600 dark:text-indigo-400">
                        receipt_long
                      </span>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Theo dõi chế biến</p>
                </button>

                {/* 4. Gọi Nhân Viên */}
                <button
                  onClick={() => {
                    handleCallStaff();
                  }}
                  disabled={callStaffCooldown > 0 || isCallingStaff}
                  className={`p-4 rounded-2xl border text-left transition-all flex flex-col justify-between gap-3 cursor-pointer active:scale-95 shadow-xs ${
                    callStaffCooldown > 0
                      ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800 text-amber-700 dark:text-amber-300 opacity-80'
                      : 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800/80 text-amber-900 dark:text-amber-200 hover:bg-amber-100 dark:hover:bg-amber-900/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-black text-amber-950 dark:text-amber-100">
                      {callStaffCooldown > 0
                        ? `Chờ ${callStaffCooldown}s`
                        : lang === 'en'
                        ? 'Call Staff'
                        : lang === 'zh'
                        ? '呼叫服务'
                        : 'Gọi nhân viên'}
                    </p>
                    <span className={`material-symbols-outlined text-xl text-amber-600 dark:text-amber-400 ${callStaffCooldown === 0 ? 'animate-bounce' : ''}`}>
                      notifications_active
                    </span>
                  </div>
                  <p className="text-[11px] text-amber-700 dark:text-amber-300 font-medium">Yêu cầu hỗ trợ</p>
                </button>
              </div>

              {/* Utility Actions (Grid 2 Columns - Sharp Borders) */}
              <div className="grid grid-cols-2 gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                {/* Yêu cầu đổi vị trí bàn */}
                <button
                  onClick={() => {
                    closePopup();
                    setIsTransferModalOpen(true);
                  }}
                  className="px-3.5 py-3 rounded-xl bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200 transition-all cursor-pointer border border-slate-200 dark:border-slate-800 text-center truncate shadow-2xs"
                >
                  {lang === 'vi' ? 'Đổi bàn ăn' : lang === 'zh' ? '更换桌位' : 'Change Table'}
                </button>

                {/* Rời khỏi bàn */}
                {handleLeaveTable && (
                  <button
                    onClick={() => {
                      closePopup();
                      handleLeaveTable();
                    }}
                    className="px-3.5 py-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-xs font-bold text-rose-700 dark:text-rose-300 transition-all cursor-pointer border border-rose-200 dark:border-rose-900/60 text-center truncate shadow-2xs"
                  >
                    {lang === 'vi' ? 'Rời bàn' : lang === 'zh' ? '离开桌位' : 'Leave Table'}
                  </button>
                )}
              </div>

              {/* Footer Settings: Theme & Language */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <ThemeToggleSwitch isDark={isDark} setTheme={setTheme} />
                <LanguageToggleSwitch lang={lang} setLang={setLang} />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};
