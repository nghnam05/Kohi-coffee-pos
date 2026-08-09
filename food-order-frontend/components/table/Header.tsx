'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ThemeToggleSwitch } from './ThemeToggleSwitch';

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
  handleOpenOrderHistory?: () => void;
  activeOrders?: any[];
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
}) => {
  return (
    <>
      {/* ── Mobile Top App Bar ──────────────────────────────────────────────── */}
      <header className="fixed top-0 left-0 right-0 z-40 h-16 sm:h-18 px-4 sm:px-5 bg-[var(--bg-primary)]/95 backdrop-blur-md border-b border-[var(--border-color)] flex justify-between items-center md:hidden shadow-sm transition-colors">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl overflow-hidden border border-[var(--border-color)] shadow-sm bg-[var(--bg-card)] flex items-center justify-center flex-shrink-0">
            <img
              alt="Kohi Coffee Logo"
              className="w-full h-full object-cover"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuC1gruMY9y7itKwQuGt_2QDbG7uIA1qTve1u9WDH-CKJQLM7F9Qw9vRxSl4_HMI9_XsWuqEjaaVZSAaPCY7-_dWlbtAlWBQYk5BLoONpBRYW0pLgjKwf23nU1P6ZZM8OUvEe5PSiGxng65S3Hx4-XKmnbmvKq_do2HYm5AMqKiZaGelzC3KCfS-B2K26AjAtskxfDHcLLp7PUjGLV50mFJkLVGR-yoiMk0qUd-ikHaWqjyOlCCKQC7Xmw"
            />
          </div>
          <div>
            <h1 className="text-[17px] sm:text-lg font-[700] text-[var(--text-primary)] tracking-tight leading-none font-heading">
              Kohi Coffee
            </h1>
            <p className="text-[9.5px] sm:text-[10px] font-[600] text-[#3AA6FF] uppercase tracking-[0.05em] mt-1 font-sans">
              COFFEE & PASTRY
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          {/* Table Badge */}
          <div className="bg-[var(--bg-card)] border border-[#3AA6FF]/30 rounded-xl px-3 py-1.5 text-[12.5px] font-[700] text-[#3AA6FF] shadow-xs flex items-center gap-1.5 font-sans">
            <span className="w-2 h-2 rounded-full bg-[#3AA6FF] animate-pulse" />
            <span>{table?.tableName ?? 'Bàn 05'}</span>
          </div>
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
                  <span>{lang === 'vi' ? 'Lịch sử & Trạng thái đơn' : 'Order History & Status'}</span>
                </div>
                {activeOrders.length > 0 && (
                  <span className="bg-[#3AA6FF] text-white text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse">
                    {activeOrders.length}
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
                  ? `${lang === 'vi' ? 'Chờ' : 'Wait'} ${callStaffCooldown}s`
                  : lang === 'vi'
                  ? 'Gọi nhân viên'
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
                {lang === 'vi' ? 'Đổi bàn' : 'Move Table'}
              </button>

              {/* Giao diện Sáng/Tối UIverse Switch */}
              <div className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-[var(--radius-sm)] bg-[var(--bg-primary)] text-[var(--text-primary)]">
                <span className="text-[13px] font-semibold font-sans">
                  {isDark ? 'Giao diện Tối' : 'Giao diện Sáng'}
                </span>
                <ThemeToggleSwitch isDark={isDark} setTheme={setTheme} />
              </div>

              {/* Language Switcher */}
              <div className="pt-2.5 border-t border-[var(--border-color)] flex justify-around items-center">
                <button
                  onClick={() => {
                    setLang('vi');
                    setIsMobileMenuOpen(false);
                  }}
                  className={`text-[11px] font-bold px-3 py-1 rounded-lg transition-all font-sans ${
                    lang === 'vi'
                      ? 'bg-[#3AA6FF] text-white shadow-sm'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  VI
                </button>
                <button
                  onClick={() => {
                    setLang('en');
                    setIsMobileMenuOpen(false);
                  }}
                  className={`text-[11px] font-bold px-3 py-1 rounded-lg transition-all font-sans ${
                    lang === 'en'
                      ? 'bg-[#3AA6FF] text-white shadow-sm'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  EN
                </button>
                <button
                  onClick={() => {
                    setLang('zh');
                    setIsMobileMenuOpen(false);
                  }}
                  className={`text-[11px] font-bold px-3 py-1 rounded-lg transition-all font-sans ${
                    lang === 'zh'
                      ? 'bg-[#3AA6FF] text-white shadow-sm'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  ZH
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};
