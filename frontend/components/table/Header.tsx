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
      <header className="fixed top-0 left-0 right-0 z-40 h-16 px-4 bg-[var(--bg-primary)]/95 backdrop-blur-md border-b border-[var(--border-color)] flex justify-between items-center md:hidden shadow-xs transition-colors">
        <BrandLogo />
        <div className="flex items-center gap-2">
          {/* Mobile Direct Order History Notification Button */}
          <button
            onClick={handleOpenOrderHistory}
            className="relative p-2 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-primary)] hover:border-[var(--brand-primary)]/50 transition-all active:scale-95 cursor-pointer flex items-center justify-center"
            title={lang === 'en' ? 'Order History' : lang === 'zh' ? '点单记录' : 'Lịch sử đơn'}
          >
            <span className="material-symbols-outlined text-xl text-[var(--brand-primary)]">
              {activeOrders.length > 0 ? 'notifications_active' : 'notifications'}
            </span>
            {activeOrders.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-[var(--brand-primary)] text-[var(--brand-primary-fg)] text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center animate-pulse shadow-xs">
                {activeOrders.length}
              </span>
            )}
          </button>

          {/* Table Badge (Clickable to open Table QR Modal) */}
          <button
            onClick={onOpenQRModal}
            className="bg-[var(--bg-card)] border border-[var(--brand-primary)]/30 rounded-xl px-2.5 py-1.5 text-xs font-bold text-[var(--brand-primary)] shadow-xs flex items-center gap-1.5 font-sans cursor-pointer active:scale-95 transition-all"
            title="Bấm vào để xem mã QR bàn"
          >
            <span className="material-symbols-outlined text-base text-[var(--brand-primary)] animate-pulse">qr_code_2</span>
            <span>{table?.tableName ?? 'Bàn 01'}</span>
          </button>

          {/* Mobile Utility Menu Trigger */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className={`p-2 transition-colors rounded-xl active:scale-95 ${
              isMobileMenuOpen
                ? 'bg-[var(--brand-primary)] text-[var(--brand-primary-fg)] shadow-xs'
                : 'text-[var(--text-secondary)] hover:text-[var(--brand-primary)] bg-[var(--bg-card)] border border-[var(--border-color)]'
            }`}
            title="Menu tiện ích"
          >
            <span className="material-symbols-outlined text-xl">more_vert</span>
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
              className="fixed inset-0 z-40 bg-black/50 backdrop-blur-xs md:hidden"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              className="fixed top-16 right-4 z-50 w-64 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-3 shadow-2xl space-y-2 md:hidden font-sans"
            >
              {/* Gọi nhân viên */}
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  handleCallStaff();
                }}
                disabled={callStaffCooldown > 0 || isCallingStaff}
                className="w-full text-left px-3.5 py-2.5 text-[13px] font-bold rounded-xl bg-[var(--bg-card-inner)] border border-[var(--border-color)] text-[var(--text-primary)] hover:border-[var(--brand-primary)] hover:text-[var(--brand-primary)] transition-all disabled:opacity-50 font-sans flex items-center gap-2.5 cursor-pointer"
              >
                <span className="material-symbols-outlined text-base text-[var(--brand-primary)]">
                  support_agent
                </span>
                <span>
                  {callStaffCooldown > 0
                    ? `${lang === 'vi' ? 'Chờ' : lang === 'zh' ? '等待' : 'Wait'} ${callStaffCooldown}s`
                    : lang === 'vi'
                    ? 'Gọi nhân viên phục vụ'
                    : lang === 'zh'
                    ? '呼叫服务员'
                    : 'Call Staff'}
                </span>
              </button>

              {/* Đổi bàn */}
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  setIsTransferModalOpen(true);
                }}
                className="w-full text-left px-3.5 py-2.5 text-[13px] font-bold rounded-xl bg-[var(--bg-card-inner)] border border-[var(--border-color)] text-[var(--text-primary)] hover:border-[var(--brand-primary)] hover:text-[var(--brand-primary)] transition-all font-sans flex items-center gap-2.5 cursor-pointer"
              >
                <span className="material-symbols-outlined text-base text-[var(--brand-primary)]">
                  table_restaurant
                </span>
                <span>{lang === 'vi' ? 'Đổi vị trí bàn' : lang === 'zh' ? '更换桌位' : 'Move Table'}</span>
              </button>

              {/* Giao diện Sáng/Tối UIverse Switch */}
              <div className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-[var(--bg-card-inner)] border border-[var(--border-color)] text-[var(--text-primary)]">
                <div className="flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-base text-[var(--brand-primary)]">
                    {isDark ? 'dark_mode' : 'light_mode'}
                  </span>
                  <span className="text-[13px] font-bold font-sans">
                    {isDark
                      ? (lang === 'vi' ? 'Giao diện Tối' : lang === 'zh' ? '深色模式' : 'Dark Mode')
                      : (lang === 'vi' ? 'Giao diện Sáng' : lang === 'zh' ? '浅色模式' : 'Light Mode')}
                  </span>
                </div>
                <ThemeToggleSwitch isDark={isDark} setTheme={setTheme} />
              </div>

              {/* Language Switcher Switch */}
              <div className="pt-2 border-t border-[var(--border-color)] flex justify-center items-center">
                <LanguageToggleSwitch lang={lang} setLang={setLang} />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};
