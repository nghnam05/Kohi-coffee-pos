'use client';

import React from 'react';
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
  handleLeaveTable,
}) => {
  return (
    <aside
      data-lenis-prevent
      className="hidden md:flex flex-col h-full py-5 px-4 w-64 xl:w-72 flex-shrink-0 bg-[#FFFFFF] dark:bg-[#090D16] text-[#000000] dark:text-[#FFFFFF] border-r border-[#E2E8F0] dark:border-[#222732] overflow-y-auto scrollbar-none transition-colors"
    >
      {/* Brand Header */}
      <div className="mb-5">
        <BrandLogo />
      </div>

      {/* Table Location Badge Box */}
      <div className="relative mb-3">
        <div className="bg-gradient-to-r from-[#3AA6FF] to-[#5B9EFF] dark:from-[#3AA6FF] dark:to-[#5B9EFF] rounded-xl px-3.5 py-3 flex items-center justify-between shadow-lg shadow-[#3AA6FF]/30 dark:shadow-[#3AA6FF]/25">
          <div>
            <p className="text-[9px] font-[500] text-[#FFFFFF]/70 uppercase tracking-[0.08em] mb-0.5">
              Vị trí hiện tại
            </p>
            <span className="text-sm font-[700] text-[#FFFFFF] tracking-tight">
              {isLoading ? 'Đang tải...' : `${table?.tableName ?? 'Bàn 05'} (Tầng 1)`}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-[#FFFFFF] animate-pulse"></div>
            <span className="text-[10px] font-[500] text-[#FFFFFF]/80">Online</span>
          </div>
        </div>
      </div>

      {/* High Visibility Call Staff Button */}
      <div className="relative mb-4">
        <button
          onClick={handleCallStaff}
          disabled={callStaffCooldown > 0 || isCallingStaff}
          className="w-full uiverse-btn py-3 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-[#3AA6FF]/40 font-[700] text-[13px] font-sans tracking-wide"
        >
          <span className="material-symbols-outlined text-[18px]">support_agent</span>
          <span>
            {callStaffCooldown > 0 ? `CHỜ ${callStaffCooldown}S...` : 'GỌI NHÂN VIÊN'}
          </span>
        </button>
      </div>

      {/* Search Input Box */}
      <div className="relative mb-4">
        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B] dark:text-[#94A3B8] text-base pointer-events-none">
          search
        </span>
        <input
          type="text"
          placeholder="Tìm kiếm món ăn, cà phê..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-[#FFFFFF] dark:bg-[#181B21] border border-[#E2E8F0] dark:border-[#222732] rounded-xl py-2 pl-9 pr-3 text-xs text-[#000000] dark:text-[#FFFFFF] focus:outline-none focus:border-[#3AA6FF] transition-colors placeholder-[#64748B]/60 dark:placeholder-[#94A3B8]/60 font-sans font-normal"
        />
      </div>

      {/* Category Navigation Menu */}
      <nav className="flex-col gap-1.5 flex mb-4">
        <button
          onClick={() => setActiveCategory('')}
          className={`w-full px-3.5 py-2.5 rounded-xl text-xs transition-all text-left ${
            activeCategory === ''
              ? 'bg-[#3AA6FF] text-[#FFFFFF] font-black shadow-md shadow-[#3AA6FF]/20'
              : 'text-[#64748B] dark:text-[#94A3B8] font-normal hover:bg-[#F8FAFC] dark:hover:bg-[#181B21] hover:text-[#000000] dark:hover:text-[#FFFFFF]'
          }`}
        >
          <span className="truncate font-sans">Tất cả</span>
        </button>
        {categories.map((cat) => {
          const isActive = activeCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`w-full px-3.5 py-2.5 rounded-xl text-xs transition-all text-left ${
                isActive
                  ? 'bg-[#3AA6FF] text-[#FFFFFF] font-black shadow-md shadow-[#3AA6FF]/20'
                  : 'text-[#64748B] dark:text-[#94A3B8] font-normal hover:bg-[#F8FAFC] dark:hover:bg-[#181B21] hover:text-[#000000] dark:hover:text-[#FFFFFF]'
              }`}
            >
              <span className="truncate font-sans">{translateCategory(cat)}</span>
            </button>
          );
        })}
      </nav>

      {/* Divider */}
      <div className="border-t border-[#E2E8F0] dark:border-[#222732] my-2" />

      {/* Utilities Stack */}
      <div className="flex flex-col gap-2.5 mb-4">
        <div className="flex items-center justify-between gap-3 bg-[#FFFFFF] dark:bg-[#181B21] border border-[#E2E8F0] dark:border-[#222732] rounded-2xl p-2 shadow-sm">
          {/* UIverse Sun/Moon Theme Toggle Switch */}
          <div className="flex items-center gap-2 pl-1">
            <ThemeToggleSwitch isDark={isDark} setTheme={setTheme} />
            <span className="text-[11px] font-[600] text-[#64748B] dark:text-[#94A3B8] font-sans">
              {isDark ? 'Tối' : 'Sáng'}
            </span>
          </div>

          {/* Language Switcher Pills */}
          <LanguageToggleSwitch lang={lang} setLang={setLang} />
        </div>

        {/* Button: Yêu cầu đổi bàn */}
        <button
          onClick={() => setIsTransferModalOpen(true)}
          className="w-full px-3.5 py-2 rounded-xl bg-transparent border border-[#3AA6FF]/60 dark:border-[#5B9EFF]/60 text-xs font-semibold text-[#3AA6FF] dark:text-[#5B9EFF] hover:bg-[#3AA6FF] hover:text-white dark:hover:bg-[#5B9EFF] dark:hover:text-white hover:border-transparent hover:shadow-md hover:shadow-[#3AA6FF]/30 transition-all text-left flex items-center gap-2 font-sans cursor-pointer"
        >
          <span className="material-symbols-outlined text-[16px]">swap_horiz</span>
          <span>Yêu cầu đổi bàn</span>
        </button>

        {/* Button: Rời bàn */}
        {handleLeaveTable && (
          <button
            onClick={handleLeaveTable}
            className="w-full px-3.5 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-xs font-bold text-rose-500 transition-all text-left flex items-center gap-2 font-sans cursor-pointer active:scale-95"
          >
            <span className="material-symbols-outlined text-[16px]">logout</span>
            <span>Rời bàn (Thoát)</span>
          </button>
        )}

        {/* AI Chat Bot Widget Box */}
        <div className="bg-[#FFFFFF] dark:bg-[#181B21] border border-[#E2E8F0] dark:border-[#222732] rounded-xl p-3 relative overflow-hidden mt-1 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <span className="material-symbols-outlined text-[#3AA6FF] text-base flex-shrink-0">
              smart_toy
            </span>
            <button
              onClick={() => setIsAiChatOpen(!isAiChatOpen)}
              className="flex items-center gap-1.5 text-xs font-black text-[#000000] dark:text-[#FFFFFF] hover:text-[#3AA6FF] transition-colors text-left"
              title={isAiChatOpen ? 'Thu gọn trò chuyện AI' : 'Mở trò chuyện AI'}
            >
              <span>Hỏi AI Kohi Bot</span>
              <span className="text-[10px] font-black text-[#3AA6FF] bg-[#3AA6FF]/15 px-1.5 py-0.5 rounded border border-[#3AA6FF]/40">
                {isAiChatOpen ? 'Thu gọn' : 'Mở AI'}
              </span>
            </button>
          </div>
          <div className="flex flex-col gap-1.5 mt-2">
            <button
              onClick={() => {
                setIsAiChatOpen(true);
                setAiInput('MÓN NÀO NGON NHẤT?');
              }}
              className="w-full bg-[#FFFFFF] dark:bg-[#090D16] hover:bg-[#3AA6FF] hover:text-[#FFFFFF] text-[#000000] dark:text-[#FFFFFF] text-[9px] font-black uppercase tracking-wider py-1.5 px-2 rounded border border-[#E2E8F0] dark:border-[#222732] transition-colors text-center"
            >
              MÓN NÀO NGON NHẤT?
            </button>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                onClick={() => {
                  setIsAiChatOpen(true);
                  setAiInput('GIỜ MỞ CỬA?');
                }}
                className="bg-[#FFFFFF] dark:bg-[#090D16] hover:bg-[#3AA6FF] hover:text-[#FFFFFF] text-[#000000] dark:text-[#FFFFFF] text-[9px] font-black uppercase tracking-wider py-1.5 px-1.5 rounded border border-[#E2E8F0] dark:border-[#222732] transition-colors text-center truncate"
              >
                GIỜ MỞ CỬA?
              </button>
              <button
                onClick={() => {
                  setIsAiChatOpen(true);
                  setAiInput('CÓ WIFI KHÔNG?');
                }}
                className="bg-[#FFFFFF] dark:bg-[#090D16] hover:bg-[#3AA6FF] hover:text-[#FFFFFF] text-[#000000] dark:text-[#FFFFFF] text-[9px] font-black uppercase tracking-wider py-1.5 px-1.5 rounded border border-[#E2E8F0] dark:border-[#222732] transition-colors text-center truncate"
              >
                CÓ WIFI KHÔNG?
              </button>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};
