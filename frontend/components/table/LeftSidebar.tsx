'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ThemeToggleSwitch } from './ThemeToggleSwitch';
import { LanguageToggleSwitch } from './LanguageToggleSwitch';
import { BrandLogo } from './BrandLogo';
import { formatTableLocation } from '@/utils/format';

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
  isLeaveDisabled?: boolean;
  leaveDisabledReason?: string;
}

const getCategoryIcon = (cat: string) => {
  const lower = (cat || '').toLowerCase();
  if (!cat || lower === 'all' || lower === 'tất cả') return 'apps';
  if (lower.includes('cà phê') || lower.includes('coffee')) return 'local_cafe';
  if (lower.includes('trà') || lower.includes('tea')) return 'emoji_food_beverage';
  if (lower.includes('đá xay') || lower.includes('smoothie') || lower.includes('frappe')) return 'icecream';
  if (lower.includes('nhẹ') || lower.includes('snack')) return 'cookie';
  if (lower.includes('bánh') || lower.includes('cake') || lower.includes('pastry')) return 'cake';
  return 'menu_book';
};

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
  isLeaveDisabled = false,
  leaveDisabledReason,
}) => {
  return (
    <aside
      data-lenis-prevent
      className="hidden md:flex flex-col h-full py-3 px-3 xl:px-3.5 w-64 xl:w-72 flex-shrink-0 bg-white/95 dark:bg-[#111622]/90 backdrop-blur-xl text-slate-900 dark:text-slate-100 border-r border-slate-200/80 dark:border-white/10 overflow-hidden transition-colors font-sans"
    >
      {/* Top Fixed Section */}
      <div className="shrink-0">
        {/* Brand Header */}
        <div className="mb-3 px-1">
          <BrandLogo />
        </div>

        {/* Table Location Badge Box (Clickable to open Table QR Modal) */}
        <button
          onClick={onOpenQRModal}
          className="w-full text-left relative mb-2 group cursor-pointer active:scale-[0.98] transition-all"
          title={lang === 'en' ? 'Click to view QR code for this table' : lang === 'zh' ? '点击查看此桌位的二维码' : 'Bấm vào để xem mã QR đặt món của bàn này'}
        >
          <div className="bg-slate-100 dark:bg-slate-900/60 hover:bg-gradient-to-r hover:from-blue-600 hover:to-sky-500 text-slate-900 dark:text-white hover:text-white border border-slate-200 dark:border-white/10 hover:border-transparent rounded-xl px-3 py-2 flex items-center justify-between shadow-xs hover:shadow-lg hover:shadow-blue-500/25 transition-all duration-300 gap-2">
            <div className="min-w-0 flex-1">
              <p className="text-[9.5px] font-medium text-slate-500 dark:text-slate-400 group-hover:text-white/80 uppercase tracking-[0.08em] font-sans transition-colors truncate">
                {lang === 'en' ? 'Current Table' : lang === 'zh' ? '当前位置' : 'Vị trí hiện tại'}
              </p>
              <span className="text-xs xl:text-[13px] font-bold tracking-tight flex items-center gap-1 font-sans text-slate-900 dark:text-white group-hover:text-white transition-colors truncate">
                <span className="material-symbols-outlined text-[15px] text-sky-500 dark:text-sky-400 group-hover:text-white transition-colors shrink-0">location_on</span>
                <span className="truncate">{isLoading ? (lang === 'en' ? 'Loading...' : lang === 'zh' ? '加载中...' : 'Đang tải...') : formatTableLocation(table?.tableName, lang)}</span>
              </span>
            </div>
            <div className="shrink-0 flex items-center gap-1 bg-slate-200/80 dark:bg-white/10 group-hover:bg-white/20 text-slate-700 dark:text-slate-300 group-hover:text-white px-2 py-0.5 rounded-lg backdrop-blur-xs transition-colors">
              <span className="material-symbols-outlined text-[11px] animate-pulse">qr_code_scanner</span>
              <span className="text-[9.5px] font-medium font-sans whitespace-nowrap">{lang === 'en' ? 'QR Code' : lang === 'zh' ? '二维码' : 'Mã QR'}</span>
            </div>
          </div>
        </button>

        {/* High Visibility Call Staff Button */}
        <div className="relative mb-2">
          <button
            onClick={handleCallStaff}
            disabled={callStaffCooldown > 0 || isCallingStaff}
            className="w-full group py-2 px-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white border border-amber-400/30 rounded-xl flex items-center justify-center gap-1.5 transition-all duration-300 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm shadow-orange-500/25 hover:shadow-md hover:shadow-orange-500/35 font-bold text-xs font-sans tracking-wide cursor-pointer"
          >
            <span className="material-symbols-outlined text-[17px] text-white transition-transform group-hover:scale-110">notifications_active</span>
            <span className="drop-shadow-xs">
              {callStaffCooldown > 0
                ? (lang === 'en' ? `WAIT ${callStaffCooldown}S...` : lang === 'zh' ? `请稍等 ${callStaffCooldown} 秒...` : `CHỜ ${callStaffCooldown}S...`)
                : (lang === 'en' ? 'CALL STAFF' : lang === 'zh' ? '呼叫服务员' : 'GỌI NHÂN VIÊN')}
            </span>
          </button>
        </div>

        {/* Search Input Box */}
        <div className="relative mb-1.5">
          <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none">
            search
          </span>
          <input
            type="text"
            placeholder={lang === 'en' ? 'Search coffee, tea, pastry...' : lang === 'zh' ? '搜索咖啡、水果茶、糕点...' : 'Tìm kiếm món ăn, cà phê...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 rounded-xl py-1.5 pl-8 pr-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 transition-colors placeholder-slate-400 font-sans font-normal"
          />
        </div>
      </div>

      {/* Category Navigation Menu with Icons */}
      <nav className="flex-1 min-h-0 flex flex-col gap-0.5 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700 pr-1 py-0.5 my-1">
        <button
          onClick={() => setActiveCategory('')}
          className={`w-full px-3 py-1.5 rounded-xl text-xs transition-all text-left font-sans cursor-pointer shrink-0 flex items-center gap-2 ${
            activeCategory === ''
              ? 'bg-slate-900 text-white dark:bg-sky-400 dark:text-slate-950 font-bold shadow-xs'
              : 'text-slate-600 dark:text-slate-300 font-medium hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <span className="material-symbols-outlined text-[16px] shrink-0 opacity-85">apps</span>
          <span className="truncate font-sans">{lang === 'en' ? 'All' : lang === 'zh' ? '全部' : 'Tất cả'}</span>
        </button>
        {categories.map((cat) => {
          const isActive = activeCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`w-full px-3 py-1.5 rounded-xl text-xs transition-all text-left font-sans cursor-pointer shrink-0 flex items-center gap-2 ${
                isActive
                  ? 'bg-slate-900 text-white dark:bg-sky-400 dark:text-slate-950 font-bold shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 font-medium hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span className="material-symbols-outlined text-[16px] shrink-0 opacity-85">{getCategoryIcon(cat)}</span>
              <span className="truncate font-sans">{translateCategory(cat)}</span>
            </button>
          );
        })}
      </nav>

      {/* Divider */}
      <div className="shrink-0 border-t border-slate-200 dark:border-white/10 my-1" />

      {/* Utilities Stack (Fixed at Bottom) */}
      <div className="shrink-0 flex flex-col gap-1.5 mt-auto">
        {/* AI Chat Bot Widget Box - Compact Bento Card */}
        <motion.div
          whileHover={{ y: -1 }}
          transition={{ duration: 0.15 }}
          className="relative rounded-2xl p-[1px] bg-gradient-to-b from-blue-500/40 via-slate-300/40 dark:via-white/10 to-blue-500/20 shadow-xs group"
        >
          <div className="bg-slate-50/90 dark:bg-slate-900/80 rounded-[15px] p-2.5 backdrop-blur-md relative overflow-hidden border border-slate-200/80 dark:border-white/5">
            {/* Header: AI Avatar + Title + Button */}
            <div className="flex items-center justify-between gap-1.5">
              <div
                onClick={() => setIsAiChatOpen(true)}
                className="flex items-center gap-2 cursor-pointer min-w-0 flex-1"
              >
                <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-blue-600 to-sky-400 flex items-center justify-center text-white shadow-xs flex-shrink-0">
                  <span className="material-symbols-outlined text-[15px]">auto_awesome</span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1">
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white leading-tight font-sans truncate">
                      Kohi AI Concierge
                    </h4>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                  </div>
                  <p className="text-[9px] font-normal text-slate-500 dark:text-slate-400 font-sans truncate leading-tight">
                    {lang === 'en' ? 'Smart Store Guide' : lang === 'zh' ? '智能助手' : 'Trợ lý gọi món & quán'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsAiChatOpen(!isAiChatOpen)}
                className="px-2 py-1 rounded-lg bg-blue-500/15 hover:bg-blue-600 text-blue-600 dark:text-blue-400 hover:text-white border border-blue-500/30 text-[10px] font-bold transition-all font-sans cursor-pointer active:scale-95 flex items-center gap-0.5 shrink-0"
                title={isAiChatOpen ? 'Thu gọn' : 'Hỏi AI'}
              >
                <span>{isAiChatOpen ? (lang === 'en' ? 'Hide' : lang === 'zh' ? 'Ẩn' : 'Thu gọn') : (lang === 'en' ? 'Chat' : lang === 'zh' ? 'Chat' : 'Hỏi AI')}</span>
                <span className="material-symbols-outlined text-[11px]">
                  {isAiChatOpen ? 'expand_more' : 'chat_bubble'}
                </span>
              </button>
            </div>

            {/* Quick Prompt Chips: Single Compact 2-column Row */}
            <div className="grid grid-cols-2 gap-1 mt-2">
              <button
                type="button"
                onClick={() => {
                  setIsAiChatOpen(true);
                  setAiInput(lang === 'en' ? 'WHAT IS THE BEST SELLER?' : lang === 'zh' ? '招牌推荐是什么？' : 'MÓN NÀO NGON NHẤT?');
                }}
                className="bg-white dark:bg-slate-800/70 hover:bg-blue-600 dark:hover:bg-blue-600 text-slate-700 dark:text-slate-200 hover:text-white dark:hover:text-white text-[9.5px] font-semibold py-1 px-1.5 rounded-lg border border-slate-200/90 dark:border-white/10 hover:border-blue-500 transition-all text-center truncate font-sans cursor-pointer shadow-xs flex items-center justify-center gap-1"
                title="Món nào ngon nhất?"
              >
                <span className="material-symbols-outlined text-[12px] text-amber-500 shrink-0">local_fire_department</span>
                <span className="truncate">{lang === 'en' ? 'Best Seller' : lang === 'zh' ? '招牌推荐' : 'Món ngon nhất'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsAiChatOpen(true);
                  setAiInput(lang === 'en' ? 'WIFI PASSWORD?' : lang === 'zh' ? 'WiFi 密码？' : 'CÓ WIFI KHÔNG?');
                }}
                className="bg-white dark:bg-slate-800/70 hover:bg-blue-600 dark:hover:bg-blue-600 text-slate-700 dark:text-slate-200 hover:text-white dark:hover:text-white text-[9.5px] font-semibold py-1 px-1.5 rounded-lg border border-slate-200/90 dark:border-white/10 hover:border-blue-500 transition-all text-center truncate font-sans cursor-pointer shadow-xs flex items-center justify-center gap-1"
                title="Mật khẩu WiFi?"
              >
                <span className="material-symbols-outlined text-[12px] text-sky-500 shrink-0">wifi</span>
                <span className="truncate">{lang === 'en' ? 'WiFi Pass' : lang === 'zh' ? 'WiFi密码' : 'Mật khẩu WiFi'}</span>
              </button>
            </div>
          </div>
        </motion.div>

        {/* Settings: Theme & Language Segmented Controls */}
        <div className="flex items-center justify-between gap-1 p-1 bg-slate-100/80 dark:bg-slate-900/50 border border-slate-200/90 dark:border-white/10 rounded-xl shadow-xs">
          <ThemeToggleSwitch isDark={isDark} setTheme={setTheme} />
          <LanguageToggleSwitch lang={lang} setLang={setLang} />
        </div>

        {/* Action Buttons: Combined 2 in 1 Row (Đổi bàn + Rời bàn) */}
        <div className="grid grid-cols-2 gap-1.5">
          <button
            type="button"
            onClick={() => setIsTransferModalOpen(true)}
            className="w-full px-2 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/60 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-all flex items-center justify-center gap-1 font-sans cursor-pointer active:scale-95 shadow-xs"
            title={lang === 'en' ? 'Change Table' : lang === 'zh' ? '更换桌号' : 'Yêu cầu đổi bàn'}
          >
            <span className="material-symbols-outlined text-[15px]">swap_horiz</span>
            <span className="truncate">{lang === 'en' ? 'Change' : lang === 'zh' ? '换桌' : 'Đổi bàn'}</span>
          </button>

          {handleLeaveTable && (
            <button
              type="button"
              onClick={isLeaveDisabled ? undefined : handleLeaveTable}
              disabled={isLeaveDisabled}
              title={isLeaveDisabled ? (leaveDisabledReason || 'Đơn hàng đã duyệt, không thể rời bàn.') : undefined}
              className={`w-full px-2 py-1.5 rounded-xl border text-xs font-semibold transition-all flex items-center justify-center gap-1 font-sans shadow-2xs ${
                isLeaveDisabled
                  ? 'bg-slate-100/60 dark:bg-slate-800/30 border-slate-200/50 dark:border-white/5 text-slate-400 cursor-not-allowed opacity-60'
                  : 'bg-slate-100 hover:bg-rose-500/10 dark:bg-slate-800/50 dark:hover:bg-rose-500/15 border-slate-200/90 hover:border-rose-500/30 dark:border-white/10 text-slate-600 hover:text-rose-500 dark:text-slate-300 dark:hover:text-rose-400 cursor-pointer active:scale-95'
              }`}
            >
              <span className="material-symbols-outlined text-[15px]">logout</span>
              <span className="truncate">{lang === 'en' ? 'Leave' : lang === 'zh' ? '离开' : 'Rời bàn'}</span>
            </button>
          )}
        </div>
      </div>
    </aside>
  );
};
