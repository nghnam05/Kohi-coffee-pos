'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

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
}) => {
  return (
    <>
      {/* ── Mobile Top App Bar ──────────────────────────────────────────────── */}
      <header className="fixed top-0 left-0 right-0 z-40 h-16 sm:h-18 px-4 sm:px-5 bg-[var(--bg-primary)]/95 backdrop-blur-md border-b border-[var(--border-color)] flex justify-between items-center md:hidden shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-[var(--radius-md)] overflow-hidden border border-[var(--border-color)] shadow-sm bg-[var(--bg-card)] flex items-center justify-center flex-shrink-0">
            <img
              alt="Kohi Coffee Logo"
              className="w-full h-full object-cover"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuC1gruMY9y7itKwQuGt_2QDbG7uIA1qTve1u9WDH-CKJQLM7F9Qw9vRxSl4_HMI9_XsWuqEjaaVZSAaPCY7-_dWlbtAlWBQYk5BLoONpBRYW0pLgjKwf23nU1P6ZZM8OUvEe5PSiGxng65S3Hx4-XKmnbmvKq_do2HYm5AMqKiZaGelzC3KCfS-B2K26AjAtskxfDHcLLp7PUjGLV50mFJkLVGR-yoiMk0qUd-ikHaWqjyOlCCKQC7Xmw"
            />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-bold text-[var(--text-primary)] tracking-tight leading-none font-sans">
              Kohi
            </h1>
            <p className="text-[9px] sm:text-[9.5px] font-semibold text-[var(--accent)] uppercase tracking-[0.04em] mt-1 font-sans">
              COFFEE & PASTRY
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          {/* Table Badge */}
          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-[var(--radius-sm)] px-3 py-1.5 text-xs font-semibold text-[var(--brand-primary)] shadow-sm">
            {table?.tableName ?? 'Bàn 05'}
          </div>
          {/* Mobile Utility Menu Trigger */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 text-[var(--text-secondary)] hover:text-[var(--brand-primary)] transition-colors"
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

              {/* Giao diện Sáng/Tối */}
              <button
                onClick={() => {
                  setTheme(isDark ? 'light' : 'dark');
                  setIsMobileMenuOpen(false);
                }}
                className="w-full text-left px-3.5 py-2.5 text-[13px] font-semibold rounded-[var(--radius-sm)] bg-[var(--bg-primary)] text-[var(--text-primary)] hover:bg-[var(--brand-primary)]/10 hover:text-[var(--brand-primary)] transition-all font-sans"
              >
                {isDark
                  ? lang === 'vi'
                    ? 'Giao diện Sáng'
                    : 'Light Mode'
                  : lang === 'vi'
                  ? 'Giao diện Tối'
                  : 'Dark Mode'}
              </button>

              {/* Language Switcher */}
              <div className="pt-2 border-t border-[var(--border-color)] flex justify-around items-center">
                <button
                  onClick={() => {
                    setLang('vi');
                    setIsMobileMenuOpen(false);
                  }}
                  className={`text-[11px] font-semibold px-3 py-1.5 rounded-[var(--radius-full)] transition-colors ${
                    lang === 'vi'
                      ? 'bg-[var(--brand-primary)] text-white'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  VN VI
                </button>
                <button
                  onClick={() => {
                    setLang('en');
                    setIsMobileMenuOpen(false);
                  }}
                  className={`text-[11px] font-semibold px-3 py-1.5 rounded-[var(--radius-full)] transition-colors ${
                    lang === 'en'
                      ? 'bg-[var(--brand-primary)] text-white'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  US EN
                </button>
                <button
                  onClick={() => {
                    setLang('zh');
                    setIsMobileMenuOpen(false);
                  }}
                  className={`text-[11px] font-semibold px-3 py-1.5 rounded-[var(--radius-full)] transition-colors ${
                    lang === 'zh'
                      ? 'bg-[var(--brand-primary)] text-white'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  CN ZH
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};
