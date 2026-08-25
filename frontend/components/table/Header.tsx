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
  isDark: boolean;
  setTheme: (theme: string) => void;
  lang: Lang;
  setLang: (l: Lang) => void;
  handleOpenOrderHistory: () => void;
  activeOrders?: any[];
  onOpenQRModal?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  table,
  isMobileMenuOpen,
  setIsMobileMenuOpen,
  handleCallStaff,
  callStaffCooldown,
  isCallingStaff,
  setIsTransferModalOpen,
  isDark,
  setTheme,
  lang,
  setLang,
  handleOpenOrderHistory,
  activeOrders = [],
  onOpenQRModal,
}) => {
  return (
    <>
      {/* ── Mobile Top App Bar ──────────────────────────────────────────────── */}
      <header className="fixed top-0 left-0 right-0 z-40 h-16 sm:h-18 px-4 sm:px-5 bg-[var(--bg-primary)]/95 backdrop-blur-md border-b border-[var(--border-color)] flex justify-between items-center md:hidden shadow-sm transition-colors">
        <BrandLogo />
        <div className="flex items-center gap-2.5">
          {/* Table Badge (Clickable to open Table QR Modal) */}
          <button
            onClick={onOpenQRModal}
            className="bg-[var(--bg-card)] border border-[#3AA6FF]/30 rounded-xl px-3 py-1.5 text-[12.5px] font-[700] text-[#3AA6FF] shadow-xs flex items-center gap-1.5 font-sans cursor-pointer active:scale-95 transition-all"
            title="Bấm vào để xem mã QR bàn"
          >
            <span className="material-symbols-outlined text-sm text-[#3AA6FF] animate-pulse">qr_code_2</span>
            <span>{table?.tableName ?? 'Bàn 05'}</span>
          </button>
          {/* Mobile Utility Menu Trigger */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 text-[var(--text-secondary)] hover:text-[#3AA6FF] transition-colors rounded-xl active:scale-95"
            title="Menu tiện ích"
          >
            <span className="material-symbols-outlined text-2xl">more_vert</span>
          </button>
        </div>
      </header>

      {/* ── Mobile Utility Dropdown Menu ───────────────────────────────────── */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs md:hidden"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              className="fixed top-16 sm:top-18 right-4 z-50 w-64 bg-[#FFFFFF] dark:bg-[#181B21] border border-[var(--border-color)] rounded-[var(--radius-lg)] p-2.5 shadow-2xl space-y-1.5 md:hidden font-sans"
            >
              {/* Lịch sử & Trạng thái đơn */}
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  if (handleOpenOrderHistory) handleOpenOrderHistory();
                }}
                className="w-full text-left px-3.5 py-2.5 text-[13px] font-semibold rounded-[var(--radius-sm)] bg-[var(--bg-primary)] text-[var(--text-primary)] hover:bg-[var(--brand-primary)]/10 hover:text-[var(--brand-primary)] transition-all font-sans flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-base text-[#3AA6FF]">
                    {activeOrders.length > 0 ? 'notifications_active' : 'notifications'}
                  </span>
                  <span>{lang === 'vi' ? 'Lịch sử & Trạng thái đơn' : lang === 'zh' ? '点单记录与状态' : 'Order History & Status'}</span>
                </div>
                {activeOrders.length > 0 ? (
                  <span className="bg-[#3AA6FF] text-white text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse">
                    {activeOrders.length}
                  </span>
                ) : (
                  <span className="bg-slate-100 dark:bg-slate-800 text-[var(--text-tertiary)] text-[10px] font-semibold px-2 py-0.5 rounded-full border border-[var(--border-color)]">
                    {lang === 'vi' ? 'Chưa có' : lang === 'zh' ? '无' : 'None'}
                  </span>
                )}
              </button>

              {/* Gọi nhân viên */}
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  handleCallStaff();
                }}
                disabled={callStaffCooldown > 0 || isCallingStaff}
                className="w-full text-left px-3.5 py-2.5 text-[13px] font-semibold rounded-[var(--radius-sm)] bg-[var(--bg-primary)] text-[var(--text-primary)] hover:bg-[var(--brand-primary)]/10 hover:text-[var(--brand-primary)] transition-all disabled:opacity-50 font-sans"
              >
                {callStaffCooldown > 0
                  ? `${lang === 'vi' ? 'Chờ' : lang === 'zh' ? '等待' : 'Wait'} ${callStaffCooldown}s`
                  : lang === 'vi'
                  ? 'Gọi nhân viên'
                  : lang === 'zh'
                  ? '呼叫服务员'
                  : 'Call Staff'}
              </button>

              {/* Đổi bàn */}
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  setIsTransferModalOpen(true);
                }}
                className="w-full text-left px-3.5 py-2.5 text-[13px] font-semibold rounded-[var(--radius-sm)] bg-[var(--bg-primary)] text-[var(--text-primary)] hover:bg-[var(--brand-primary)]/10 hover:text-[var(--brand-primary)] transition-all font-sans"
              >
                {lang === 'vi' ? 'Đổi bàn' : lang === 'zh' ? '换桌' : 'Move Table'}
              </button>

              {/* Giao diện Sáng/Tối UIverse Switch */}
              <div className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-[var(--radius-sm)] bg-[var(--bg-primary)] text-[var(--text-primary)]">
                <span className="text-[13px] font-semibold font-sans">
                  {isDark
                    ? (lang === 'vi' ? 'Giao diện Tối' : lang === 'zh' ? '深色模式' : 'Dark Mode')
                    : (lang === 'vi' ? 'Giao diện Sáng' : lang === 'zh' ? '浅色模式' : 'Light Mode')}
                </span>
                <ThemeToggleSwitch isDark={isDark} setTheme={setTheme} />
              </div>

              {/* Language Switcher Switch */}
              <div className="pt-2.5 border-t border-[var(--border-color)] flex justify-center items-center">
                <LanguageToggleSwitch lang={lang} setLang={setLang} />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};
