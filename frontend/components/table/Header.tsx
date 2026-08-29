'use client';

import React from 'react';
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

      {/* ── Mobile Bottom Navigation Bar (Mobile-only, < md) ────────────────── */}
      <nav
        aria-label="Thanh điều hướng khách hàng"
        className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 dark:bg-[#0c121e]/95 backdrop-blur-lg border-t border-slate-200 dark:border-slate-800/80 flex items-center justify-around h-16 px-1 shadow-[0_-4px_24px_rgba(0,0,0,0.12)] dark:shadow-[0_-4px_24px_rgba(0,0,0,0.4)] font-sans"
      >
        {/* Tab 1: Thực đơn */}
        <button
          type="button"
          onClick={() => {
            setIsMobileMenuOpen(false);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className="flex-1 min-h-[48px] py-1 mx-0.5 rounded-xl flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer select-none outline-none text-[#3AA6FF] font-black active:scale-95"
        >
          <span className="material-symbols-outlined text-xl">restaurant_menu</span>
          <span className="text-[10px] tracking-tight">{lang === 'en' ? 'Menu' : lang === 'zh' ? '菜单' : 'Menu'}</span>
        </button>

        {/* Tab 2: Giỏ hàng */}
        <button
          type="button"
          onClick={() => {
            setIsMobileMenuOpen(false);
            if (setIsCartOpen) setIsCartOpen(true);
          }}
          className="flex-1 min-h-[48px] py-1 mx-0.5 rounded-xl flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer select-none outline-none text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-bold active:scale-95"
        >
          <div className="relative flex items-center justify-center">
            <span className="material-symbols-outlined text-xl">shopping_bag</span>
            {totalQuantity > 0 && (
              <span className="absolute -top-1 -right-2.5 min-w-[16px] h-4 px-1 flex items-center justify-center text-[9px] font-black bg-emerald-500 text-white rounded-full shadow-xs leading-none animate-pulse">
                {totalQuantity}
              </span>
            )}
          </div>
          <span className="text-[10px] tracking-tight">{lang === 'en' ? 'Cart' : lang === 'zh' ? '购物车' : 'Giỏ hàng'}</span>
        </button>

        {/* Tab 3: Đơn hàng (Lịch sử đơn) */}
        <button
          type="button"
          onClick={handleOpenOrderHistory}
          className="flex-1 min-h-[48px] py-1 mx-0.5 rounded-xl flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer select-none outline-none text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-bold active:scale-95"
        >
          <div className="relative flex items-center justify-center">
            <span className="material-symbols-outlined text-xl">receipt_long</span>
            {activeOrders.length > 0 && (
              <span className="absolute -top-1 -right-2.5 min-w-[16px] h-4 px-1 flex items-center justify-center text-[9px] font-black bg-[#3AA6FF] text-white rounded-full shadow-xs leading-none animate-pulse">
                {activeOrders.length}
              </span>
            )}
          </div>
          <span className="text-[10px] tracking-tight">{lang === 'en' ? 'Orders' : lang === 'zh' ? '订单' : 'Đơn hàng'}</span>
        </button>

        {/* Tab 4: Gọi nhân viên */}
        <button
          type="button"
          onClick={handleCallStaff}
          disabled={callStaffCooldown > 0 || isCallingStaff}
          className={`flex-1 min-h-[48px] py-1 mx-0.5 rounded-xl flex flex-col items-center justify-center gap-0.5 transition-all duration-200 cursor-pointer select-none outline-none active:scale-95 group ${
            callStaffCooldown > 0
              ? 'text-amber-500/70 font-bold opacity-75'
              : 'text-amber-600 dark:text-amber-400 hover:bg-gradient-to-r hover:from-amber-500 hover:to-orange-500 hover:text-white hover:shadow-md hover:shadow-orange-500/20 font-black'
          }`}
        >
          <span className={`material-symbols-outlined text-xl transition-colors ${callStaffCooldown === 0 ? 'animate-bounce group-hover:text-white' : ''}`}>
            notifications_active
          </span>
          <span className="text-[10px] tracking-tight truncate px-1 transition-colors">
            {callStaffCooldown > 0
              ? `${callStaffCooldown}s`
              : lang === 'en'
              ? 'Call Staff'
              : lang === 'zh'
              ? '呼叫服务'
              : 'Gọi NV'}
          </span>
        </button>

        {/* Tab 5: Tiện ích */}
        <button
          type="button"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className={`flex-1 min-h-[48px] py-1 mx-0.5 rounded-xl flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer select-none outline-none active:scale-95 ${
            isMobileMenuOpen
              ? 'bg-[#3AA6FF]/10 text-[#3AA6FF] font-black'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-bold'
          }`}
        >
          <span className="material-symbols-outlined text-xl">tune</span>
          <span className="text-[10px] tracking-tight">{lang === 'en' ? 'Utilities' : lang === 'zh' ? '工具' : 'Tiện ích'}</span>
        </button>
      </nav>

      {/* ── Mobile Utilities Bottom Sheet Modal ─────────────────── */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs md:hidden"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="fixed bottom-16 inset-x-0 z-50 bg-[var(--bg-card)] border-t border-x border-[var(--border-color)] rounded-t-3xl p-5 shadow-2xl space-y-4 md:hidden font-sans"
            >
              {/* Drag Handle & Header */}
              <div className="flex flex-col items-center gap-2 pb-2 border-b border-[var(--border-color)]">
                <div className="w-10 h-1 bg-[var(--border-color)] rounded-full mb-1" />
                <div className="w-full flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#3AA6FF] text-xl">tune</span>
                    <h3 className="text-sm font-bold text-[var(--text-primary)]">
                      {lang === 'en' ? 'Utilities & Settings' : lang === 'zh' ? '小工具与设置' : 'Tiện ích & Cài đặt'}
                    </h3>
                  </div>
                  <button
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white flex items-center justify-center transition-all cursor-pointer active:scale-95"
                    title="Đóng tiện ích"
                  >
                    <span className="material-symbols-outlined text-lg">close</span>
                  </button>
                </div>
              </div>

              {/* Table Info Badge */}
              <div className="group bg-[var(--bg-card-inner)] hover:bg-gradient-to-r hover:from-[#3AA6FF] hover:to-[#0070F3] border border-[var(--border-color)] hover:border-transparent text-[var(--text-primary)] hover:text-white p-3.5 rounded-2xl flex items-center justify-between shadow-2xs hover:shadow-lg hover:shadow-sky-500/25 transition-all duration-300">
                <div>
                  <p className="text-[10px] uppercase font-bold text-[var(--text-tertiary)] group-hover:text-white/80 transition-colors">Vị trí hiện tại</p>
                  <p className="text-xs font-black mt-0.5 flex items-center gap-1.5 transition-colors">
                    <span className="material-symbols-outlined text-sm text-[#3AA6FF] group-hover:text-white transition-colors">location_on</span>
                    {table?.tableName ?? 'Bàn 01'} (Tầng 1)
                  </p>
                </div>
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    if (onOpenQRModal) onOpenQRModal();
                  }}
                  className="px-3 py-1.5 bg-[#3AA6FF]/10 group-hover:bg-white/20 text-[#3AA6FF] group-hover:text-white rounded-xl text-xs font-bold flex items-center gap-1 border border-[#3AA6FF]/30 group-hover:border-white/30 active:scale-95 transition-all"
                >
                  <span className="material-symbols-outlined text-sm">qr_code_2</span>
                  <span>Mã QR bàn</span>
                </button>
              </div>

              {/* Đổi bàn */}
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  setIsTransferModalOpen(true);
                }}
                className="w-full text-left px-4 py-3 text-[13px] font-bold rounded-2xl bg-[var(--bg-card-inner)] border border-[var(--border-color)] text-[var(--text-primary)] hover:border-[var(--brand-primary)] hover:text-[var(--brand-primary)] transition-all font-sans flex items-center gap-3 cursor-pointer active:scale-98"
              >
                <span className="material-symbols-outlined text-lg text-[var(--brand-primary)]">
                  chair
                </span>
                <span>{lang === 'vi' ? 'Yêu cầu đổi vị trí bàn' : lang === 'zh' ? '更换桌位' : 'Request Table Change'}</span>
              </button>

              {/* Rời khỏi bàn */}
              {handleLeaveTable && (
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    handleLeaveTable();
                  }}
                  className="w-full text-left px-4 py-3 text-[13px] font-bold rounded-2xl bg-red-500/10 dark:bg-red-500/15 border border-red-500/30 text-red-600 dark:text-red-400 hover:bg-red-500/20 transition-all font-sans flex items-center gap-3 cursor-pointer active:scale-98"
                >
                  <span className="material-symbols-outlined text-lg text-red-500">
                    logout
                  </span>
                  <span>{lang === 'vi' ? 'Rời khỏi bàn' : lang === 'zh' ? '离开桌位' : 'Leave Table'}</span>
                </button>
              )}

              {/* Giao diện Sáng/Tối */}
              <div className="w-full flex items-center justify-between px-4 py-3 rounded-2xl bg-[var(--bg-card-inner)] border border-[var(--border-color)] text-[var(--text-primary)]">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-lg text-[var(--brand-primary)]">
                    {isDark ? 'dark_mode' : 'light_mode'}
                  </span>
                  <span className="text-[13px] font-bold font-sans">
                    {isDark
                      ? (lang === 'vi' ? 'Giao diện Tối (Soft Dark)' : lang === 'zh' ? '深色模式' : 'Dark Mode')
                      : (lang === 'vi' ? 'Giao diện Sáng' : lang === 'zh' ? '浅色模式' : 'Light Mode')}
                  </span>
                </div>
                <ThemeToggleSwitch isDark={isDark} setTheme={setTheme} />
              </div>

              {/* Ngôn ngữ Switcher */}
              <div className="pt-2 border-t border-[var(--border-color)] flex items-center justify-between">
                <span className="text-xs font-bold text-[var(--text-secondary)]">
                  {lang === 'en' ? 'Language' : lang === 'zh' ? '语言' : 'Ngôn ngữ'}
                </span>
                <LanguageToggleSwitch lang={lang} setLang={setLang} />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};
