'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ThemeToggleSwitch } from './ThemeToggleSwitch';
import { LanguageToggleSwitch } from './LanguageToggleSwitch';
import { BrandLogo } from './BrandLogo';

interface Table {
  _id: string;
  tableName: string;
  status: string;
}

type Lang = 'vi' | 'en' | 'zh';

interface LeftSidebarProps {
  isLoading: boolean;
  table: Table | null;
  handleCallStaff: () => void;
  callStaffCooldown: number;
  isCallingStaff: boolean;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  activeCategory: string;
  setActiveCategory: (cat: string) => void;
  categories: string[];
  translateCategory: (cat: string) => string;
  isDark: boolean;
  setTheme: (theme: string) => void;
  lang: Lang;
  setLang: (l: Lang) => void;
  setIsTransferModalOpen: (open: boolean) => void;
  isAiChatOpen: boolean;
  setIsAiChatOpen: (open: boolean) => void;
  setAiInput: (input: string) => void;
  onOpenQRModal?: () => void;
  handleLeaveTable?: () => void;
}

export const LeftSidebar: React.FC<LeftSidebarProps> = ({
  isLoading,
  table,
  handleCallStaff,
  callStaffCooldown,
  isCallingStaff,
  searchQuery,
  setSearchQuery,
  activeCategory,
  setActiveCategory,
  categories,
  translateCategory,
  isDark,
  setTheme,
  lang,
  setLang,
  setIsTransferModalOpen,
  isAiChatOpen,
  setIsAiChatOpen,
  setAiInput,
  onOpenQRModal,
  handleLeaveTable,
}) => {
  return (
    <aside
      data-lenis-prevent
      className="hidden md:flex flex-col h-full py-5 px-4 w-64 xl:w-72 flex-shrink-0 bg-[var(--bg-card)] text-[var(--text-primary)] border-r border-[var(--border-color)] overflow-y-auto scrollbar-none transition-colors font-sans"
    >
      {/* Brand Header */}
      <div className="mb-5">
        <BrandLogo />
      </div>

      {/* Table Location Badge Box (Clickable to open Table QR Modal) */}
      <button
        onClick={onOpenQRModal}
        className="w-full text-left relative mb-3 group cursor-pointer active:scale-[0.98] transition-all"
        title={lang === 'en' ? 'Click to view QR code for this table' : lang === 'zh' ? '点击查看此桌位的二维码' : 'Bấm vào để xem mã QR đặt món của bàn này'}
      >
        <div className="bg-[var(--brand-primary)] text-[var(--brand-primary-fg)] rounded-2xl px-3.5 py-3 flex items-center justify-between shadow-md group-hover:brightness-110 transition-all">
          <div>
            <p className="text-[9px] font-[600] opacity-80 uppercase tracking-[0.08em] mb-0.5 font-sans">
              {lang === 'en' ? 'Current Table' : lang === 'zh' ? '当前位置' : 'Vị trí hiện tại'}
            </p>
            <span className="text-sm font-[700] tracking-tight flex items-center gap-1 font-sans">
              {isLoading ? (lang === 'en' ? 'Loading...' : lang === 'zh' ? '加载中...' : 'Đang tải...') : `${table?.tableName ?? 'Bàn 05'} (Tầng 1)`}
            </span>
          </div>
          <div className="flex items-center gap-1.5 bg-black/10 dark:bg-white/10 px-2 py-1 rounded-xl backdrop-blur-xs">
            <span className="material-symbols-outlined text-sm animate-pulse">qr_code_scanner</span>
            <span className="text-[10px] font-bold font-sans">{lang === 'en' ? 'QR Code' : lang === 'zh' ? '二维码' : 'Mã QR'}</span>
          </div>
        </div>
      </button>

      {/* High Visibility Call Staff Button */}
      <div className="relative mb-4">
        <button
          onClick={handleCallStaff}
          disabled={callStaffCooldown > 0 || isCallingStaff}
          className="w-full py-3 px-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-orange-500/25 font-[800] text-[13px] font-sans tracking-wide cursor-pointer"
        >
          <span className="material-symbols-outlined text-[19px] animate-bounce">notifications_active</span>
          <span>
            {callStaffCooldown > 0
              ? (lang === 'en' ? `WAIT ${callStaffCooldown}S...` : lang === 'zh' ? `请稍等 ${callStaffCooldown} 秒...` : `CHỜ ${callStaffCooldown}S...`)
              : (lang === 'en' ? 'CALL STAFF' : lang === 'zh' ? '呼叫服务员' : 'GỌI NHÂN VIÊN')}
          </span>
        </button>
      </div>

      {/* Search Input Box */}
      <div className="relative mb-4">
        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] text-base pointer-events-none">
          search
        </span>
        <input
          type="text"
          placeholder={lang === 'en' ? 'Search coffee, tea, pastry...' : lang === 'zh' ? '搜索咖啡、水果茶、糕点...' : 'Tìm kiếm món ăn, cà phê...'}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-[var(--bg-card-inner)] border border-[var(--border-color)] rounded-2xl py-2.5 pl-9 pr-3 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--brand-primary)] transition-colors placeholder-[var(--text-tertiary)] font-sans font-normal"
        />
      </div>

      {/* Category Navigation Menu */}
      <nav className="flex-col gap-1.5 flex mb-4">
        <button
          onClick={() => setActiveCategory('')}
          className={`w-full px-3.5 py-2.5 rounded-2xl text-xs transition-all text-left ${
            activeCategory === ''
              ? 'bg-[var(--brand-primary)] text-[var(--brand-primary-fg)] font-bold shadow-[0_4px_14px_rgba(0,132,255,0.35)]'
              : 'text-[var(--text-secondary)] font-medium hover:bg-[var(--bg-card-inner)] hover:text-[var(--text-primary)]'
          }`}
        >
          <span className="truncate font-sans">{lang === 'en' ? 'All' : lang === 'zh' ? '全部' : 'Tất cả'}</span>
        </button>
        {categories.map((cat) => {
          const isActive = activeCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`w-full px-3.5 py-2.5 rounded-2xl text-xs transition-all text-left ${
                isActive
                  ? 'bg-[var(--brand-primary)] text-[var(--brand-primary-fg)] font-bold shadow-[0_4px_14px_rgba(0,132,255,0.35)]'
                  : 'text-[var(--text-secondary)] font-medium hover:bg-[var(--bg-card-inner)] hover:text-[var(--text-primary)]'
              }`}
            >
              <span className="truncate font-sans">{translateCategory(cat)}</span>
            </button>
          );
        })}
      </nav>

      {/* Divider */}
      <div className="border-t border-[var(--border-color)] my-2" />

      {/* Utilities Stack */}
      <div className="flex flex-col gap-2.5 mb-4">
        <div className="flex items-center justify-between gap-3 bg-[var(--bg-card-inner)] border border-[var(--border-color)] rounded-2xl p-2 shadow-xs">
          {/* UIverse Sun/Moon Theme Toggle Switch */}
          <div className="flex items-center gap-2 pl-1">
            <ThemeToggleSwitch isDark={isDark} setTheme={setTheme} />
            <span className="text-[11px] font-[600] text-[var(--text-secondary)] font-sans">
              {isDark ? (lang === 'en' ? 'Dark' : lang === 'zh' ? '深色' : 'Tối') : (lang === 'en' ? 'Light' : lang === 'zh' ? '浅色' : 'Sáng')}
            </span>
          </div>

          {/* Language Switcher Pills */}
          <LanguageToggleSwitch lang={lang} setLang={setLang} />
        </div>

        {/* Button: Yêu cầu đổi bàn */}
        <button
          onClick={() => setIsTransferModalOpen(true)}
          className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-700 border border-slate-200/80 dark:border-slate-700/80 text-xs font-bold text-slate-700 dark:text-slate-200 transition-all text-center flex items-center justify-center font-sans cursor-pointer active:scale-95"
        >
          <span>{lang === 'en' ? 'Change Table' : lang === 'zh' ? '更换桌号' : 'Yêu cầu đổi bàn'}</span>
        </button>

        {/* Button: Rời bàn */}
        {handleLeaveTable && (
          <button
            onClick={handleLeaveTable}
            className="w-full px-3.5 py-2.5 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-xs font-bold text-rose-500 transition-all text-center flex items-center justify-center font-sans cursor-pointer active:scale-95"
          >
            <span>{lang === 'en' ? 'Leave Table' : lang === 'zh' ? '离开餐桌' : 'Rời bàn (Thoát)'}</span>
          </button>
        )}

        {/* AI Chat Bot Widget Box - Pro Frontend Design */}
        <motion.div
          whileHover={{ y: -2 }}
          transition={{ duration: 0.2 }}
          className="relative rounded-2xl p-[1px] bg-gradient-to-b from-[var(--brand-primary)]/40 via-[var(--border-color)] to-[var(--brand-primary)]/20 shadow-md mt-2 group"
        >
          <div className="bg-gradient-to-br from-[var(--bg-card)] via-[var(--bg-card-inner)] to-[var(--bg-card)] rounded-[15px] p-3.5 backdrop-blur-md relative overflow-hidden">
            {/* Background Glow Effect */}
            <div className="absolute -top-10 -right-10 w-24 h-24 bg-[var(--brand-primary)]/15 rounded-full blur-xl pointer-events-none group-hover:bg-[var(--brand-primary)]/25 transition-all duration-500" />

            {/* Header: AI Avatar + Title + Status */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                {/* Glowing Avatar Icon */}
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[var(--brand-primary)] to-sky-400 flex items-center justify-center text-white shadow-[0_0_12px_rgba(0,132,255,0.4)] flex-shrink-0">
                  <span className="material-symbols-outlined text-[17px] animate-pulse">auto_awesome</span>
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h4 className="text-[12.5px] font-bold text-[var(--text-primary)] leading-tight font-sans tracking-tight">
                      Kohi AI Assistant
                    </h4>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  </div>
                  <p className="text-[10px] font-medium text-[var(--text-secondary)] font-sans mt-0.5">
                    {lang === 'en' ? 'Smart Menu Guide' : lang === 'zh' ? '智能点餐助手' : 'Trợ lý gọi món thông minh'}
                  </p>
                </div>
              </div>

              {/* Toggle / Open Button */}
              <button
                onClick={() => setIsAiChatOpen(!isAiChatOpen)}
                className="px-2 py-1 rounded-lg bg-[var(--brand-primary-muted)] text-[var(--brand-primary)] border border-[var(--brand-primary)]/30 text-[10px] font-bold hover:bg-[var(--brand-primary)] hover:text-[var(--brand-primary-fg)] transition-all font-sans cursor-pointer active:scale-95 flex items-center gap-1"
                title={isAiChatOpen ? 'Collapse AI Chat' : 'Open AI Chat'}
              >
                <span>{isAiChatOpen ? (lang === 'en' ? 'Hide' : lang === 'zh' ? 'Ẩn' : 'Thu gọn') : (lang === 'en' ? 'Chat' : lang === 'zh' ? 'Chat' : 'Hỏi AI')}</span>
                <span className="material-symbols-outlined text-[12px]">
                  {isAiChatOpen ? 'expand_more' : 'chat_bubble'}
                </span>
              </button>
            </div>

            {/* Quick Prompt Action Chips */}
            <div className="flex flex-col gap-1.5 mt-2.5">
              <button
                onClick={() => {
                  setIsAiChatOpen(true);
                  setAiInput(lang === 'en' ? 'WHAT IS THE BEST SELLER?' : lang === 'zh' ? '招牌推荐是什么？' : 'MÓN NÀO NGON NHẤT?');
                }}
                className="w-full bg-[var(--bg-card-inner)] hover:bg-[var(--brand-primary)] hover:text-[var(--brand-primary-fg)] text-[var(--text-primary)] text-[10.5px] font-semibold py-1.5 px-2.5 rounded-xl border border-[var(--border-color)] hover:border-[var(--brand-primary)] transition-all duration-200 text-left flex items-center justify-between font-sans group/chip cursor-pointer shadow-2xs"
              >
                <span className="truncate">🔥 {lang === 'en' ? 'Best Sellers?' : lang === 'zh' ? '招牌推荐？' : 'Món nào ngon nhất?'}</span>
                <span className="material-symbols-outlined text-[13px] opacity-0 group-hover/chip:opacity-100 transition-opacity">arrow_forward</span>
              </button>

              <div className="grid grid-cols-2 gap-1.5">
                <button
                  onClick={() => {
                    setIsAiChatOpen(true);
                    setAiInput(lang === 'en' ? 'OPENING HOURS?' : lang === 'zh' ? '营业时间？' : 'GIỜ MỞ CỬA?');
                  }}
                  className="bg-[var(--bg-card-inner)] hover:bg-[var(--brand-primary)] hover:text-[var(--brand-primary-fg)] text-[var(--text-primary)] text-[10px] font-semibold py-1.5 px-2 rounded-xl border border-[var(--border-color)] hover:border-[var(--brand-primary)] transition-all duration-200 text-center truncate font-sans cursor-pointer shadow-2xs"
                >
                  ⏰ {lang === 'en' ? 'Hours?' : lang === 'zh' ? '营业时间？' : 'Giờ mở cửa?'}
                </button>

                <button
                  onClick={() => {
                    setIsAiChatOpen(true);
                    setAiInput(lang === 'en' ? 'WIFI PASSWORD?' : lang === 'zh' ? 'WiFi 密码？' : 'CÓ WIFI KHÔNG?');
                  }}
                  className="bg-[var(--bg-card-inner)] hover:bg-[var(--brand-primary)] hover:text-[var(--brand-primary-fg)] text-[var(--text-primary)] text-[10px] font-semibold py-1.5 px-2 rounded-xl border border-[var(--border-color)] hover:border-[var(--brand-primary)] transition-all duration-200 text-center truncate font-sans cursor-pointer shadow-2xs"
                >
                  📶 {lang === 'en' ? 'WiFi?' : lang === 'zh' ? 'WiFi 密码？' : 'Mật khẩu WiFi?'}
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </aside>
  );
};
