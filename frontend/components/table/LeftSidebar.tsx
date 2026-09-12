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
}

const getCategoryIcon = (cat: string) => {
  const lower = (cat || '').toLowerCase();
  if (!cat || lower === 'all' || lower === 'tất cả') return 'apps';
  if (lower.includes('cà phê') || lower.includes('coffee')) return 'local_cafe';
  if (lower.includes('trà') || lower.includes('tea')) return 'emoji_food_beverage';
  if (lower.includes('đá xay') || lower.includes('smoothie') || lower.includes('frappe')) return 'icecream';
  if (lower.includes('nhẹ') || lower.includes('snack')) return 'cookie';
  if (lower.includes('bánh') || lower.includes('cake') || lower.includes('pastry')) return 'cake';
  return 'restaurant_menu';
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
}) => {
  return (
    <aside
      data-lenis-prevent
      className="hidden md:flex flex-col h-full py-4 px-3.5 xl:px-4 w-64 xl:w-72 flex-shrink-0 bg-white/95 dark:bg-[#0F172A]/75 backdrop-blur-xl text-slate-900 dark:text-white border-r border-slate-200 dark:border-white/10 overflow-hidden transition-colors font-sans"
    >
      {/* Top Fixed Section */}
      <div className="shrink-0">
        {/* Brand Header */}
        <div className="mb-4">
          <BrandLogo />
        </div>

        {/* Table Location Badge Box (Clickable to open Table QR Modal) */}
        <button
          onClick={onOpenQRModal}
          className="w-full text-left relative mb-2.5 group cursor-pointer active:scale-[0.98] transition-all"
          title={lang === 'en' ? 'Click to view QR code for this table' : lang === 'zh' ? '点击查看此桌位的二维码' : 'Bấm vào để xem mã QR đặt món của bàn này'}
        >
          <div className="bg-slate-100 dark:bg-slate-900/60 hover:bg-gradient-to-r hover:from-blue-600 hover:to-sky-500 text-slate-900 dark:text-white hover:text-white border border-slate-200 dark:border-white/10 hover:border-transparent rounded-2xl px-3.5 py-2.5 flex items-center justify-between shadow-xs hover:shadow-lg hover:shadow-blue-500/25 transition-all duration-300 gap-2">
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 group-hover:text-white/80 uppercase tracking-[0.08em] mb-0.5 font-sans transition-colors truncate">
                {lang === 'en' ? 'Current Table' : lang === 'zh' ? '当前位置' : 'Vị trí hiện tại'}
              </p>
              <span className="text-xs xl:text-sm font-semibold tracking-tight flex items-center gap-1.5 font-sans text-slate-900 dark:text-white group-hover:text-white transition-colors truncate">
                <span className="material-symbols-outlined text-base text-sky-500 dark:text-sky-400 group-hover:text-white transition-colors shrink-0">location_on</span>
                <span className="truncate">{isLoading ? (lang === 'en' ? 'Loading...' : lang === 'zh' ? '加载中...' : 'Đang tải...') : formatTableLocation(table?.tableName, lang)}</span>
              </span>
            </div>
            <div className="shrink-0 flex items-center gap-1 bg-slate-200/80 dark:bg-white/10 group-hover:bg-white/20 text-slate-700 dark:text-slate-300 group-hover:text-white px-2 py-1 rounded-xl backdrop-blur-xs transition-colors">
              <span className="material-symbols-outlined text-xs animate-pulse">qr_code_scanner</span>
              <span className="text-[10px] font-medium font-sans whitespace-nowrap">{lang === 'en' ? 'QR Code' : lang === 'zh' ? '二维码' : 'Mã QR'}</span>
            </div>
          </div>
        </button>

        {/* High Visibility Call Staff Button - Vibrant Amber/Orange on both Light & Dark */}
        <div className="relative mb-2.5">
          <button
            onClick={handleCallStaff}
            disabled={callStaffCooldown > 0 || isCallingStaff}
            className="w-full group py-2.5 px-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white border border-amber-400/30 rounded-xl flex items-center justify-center gap-2 transition-all duration-300 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-orange-500/25 hover:shadow-lg hover:shadow-orange-500/35 font-bold text-[13px] font-sans tracking-wide cursor-pointer"
          >
            <span className="material-symbols-outlined text-[19px] text-white transition-transform group-hover:scale-110 animate-bounce">notifications_active</span>
            <span className="drop-shadow-xs">
              {callStaffCooldown > 0
                ? (lang === 'en' ? `WAIT ${callStaffCooldown}S...` : lang === 'zh' ? `请稍等 ${callStaffCooldown} 秒...` : `CHỜ ${callStaffCooldown}S...`)
                : (lang === 'en' ? 'CALL STAFF' : lang === 'zh' ? '呼叫服务员' : 'GỌI NHÂN VIÊN')}
            </span>
          </button>
        </div>

        {/* Search Input Box */}
        <div className="relative mb-2">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-base pointer-events-none">
            search
          </span>
          <input
            type="text"
            placeholder={lang === 'en' ? 'Search coffee, tea, pastry...' : lang === 'zh' ? '搜索咖啡、水果茶、糕点...' : 'Tìm kiếm món ăn, cà phê...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 rounded-xl py-2 pl-9 pr-3 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 transition-colors placeholder-slate-400 font-sans font-normal"
          />
        </div>
      </div>

      {/* Category Navigation Menu with Icons (Independently Scrollable) */}
      <nav className="flex-1 min-h-0 flex flex-col gap-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700 hover:scrollbar-thumb-slate-400 dark:hover:scrollbar-thumb-slate-600 pr-1 py-1 my-1">
        <button
          onClick={() => setActiveCategory('')}
          className={`w-full px-3.5 py-2.5 rounded-xl text-[13px] transition-all text-left font-sans cursor-pointer shrink-0 flex items-center gap-2.5 ${
            activeCategory === ''
              ? 'bg-[#3B82F6] text-white font-semibold shadow-[0_4px_14px_rgba(59,130,246,0.35)]'
              : 'text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <span className="material-symbols-outlined text-[18px] shrink-0 opacity-85">apps</span>
          <span className="truncate font-sans">{lang === 'en' ? 'All' : lang === 'zh' ? '全部' : 'Tất cả'}</span>
        </button>
        {categories.map((cat) => {
          const isActive = activeCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`w-full px-3.5 py-2.5 rounded-xl text-[13px] transition-all text-left font-sans cursor-pointer shrink-0 flex items-center gap-2.5 ${
                isActive
                  ? 'bg-[#3B82F6] text-white font-semibold shadow-[0_4px_14px_rgba(59,130,246,0.35)]'
                  : 'text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span className="material-symbols-outlined text-[18px] shrink-0 opacity-85">{getCategoryIcon(cat)}</span>
              <span className="truncate font-sans">{translateCategory(cat)}</span>
            </button>
          );
        })}
      </nav>

      {/* Divider */}
      <div className="shrink-0 border-t border-slate-200 dark:border-white/10 my-2" />

      {/* Utilities Stack (Fixed at Bottom) */}
      <div className="shrink-0 flex flex-col gap-2 mt-auto">
        {/* Settings: Theme & Language Segmented Controls */}
        <div className="flex items-center justify-between gap-2 p-1.5 bg-slate-100/80 dark:bg-slate-900/50 border border-slate-200/90 dark:border-white/10 rounded-2xl shadow-xs">
          <ThemeToggleSwitch isDark={isDark} setTheme={setTheme} />
          <LanguageToggleSwitch lang={lang} setLang={setLang} />
        </div>

        {/* Button: Yêu cầu đổi bàn */}
        <button
          onClick={() => setIsTransferModalOpen(true)}
          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/60 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-white/10 text-xs font-medium text-slate-700 dark:text-slate-200 transition-all flex items-center justify-center font-sans cursor-pointer active:scale-95 shadow-xs group"
        >
          <span>{lang === 'en' ? 'Change Table' : lang === 'zh' ? '更换桌号' : 'Yêu cầu đổi bàn'}</span>
        </button>

        {/* Button: Rời bàn - Gentle Neutral Ghost Button with subtle Rose Hover (Issue L1) */}
        {handleLeaveTable && (
          <button
            onClick={handleLeaveTable}
            className="w-full px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-rose-500/10 dark:bg-slate-800/50 dark:hover:bg-rose-500/15 border border-slate-200/90 hover:border-rose-500/30 dark:border-white/10 dark:hover:border-rose-500/30 text-xs font-medium text-slate-600 hover:text-rose-500 dark:text-slate-300 dark:hover:text-rose-400 transition-all flex items-center justify-center gap-1.5 font-sans cursor-pointer active:scale-95 shadow-2xs group"
          >
            <span className="material-symbols-outlined text-[16px] text-slate-400 group-hover:text-rose-500 dark:group-hover:text-rose-400 transition-colors">logout</span>
            <span>{lang === 'en' ? 'Leave Table' : lang === 'zh' ? '离开餐桌' : 'Rời bàn / Thoát'}</span>
          </button>
        )}

        {/* AI Chat Bot Widget Box - Bento Glass Card */}
        <motion.div
          whileHover={{ y: -2 }}
          transition={{ duration: 0.2 }}
          className="relative rounded-2xl p-[1px] bg-gradient-to-b from-blue-500/40 via-slate-300/40 dark:via-white/10 to-blue-500/20 shadow-sm mt-2 group"
        >
          <div className="bg-slate-50/90 dark:bg-slate-900/80 rounded-[15px] p-3.5 backdrop-blur-md relative overflow-hidden border border-slate-200/80 dark:border-white/5">
            {/* Background Glow Effect */}
            <div className="absolute -top-10 -right-10 w-24 h-24 bg-blue-500/15 rounded-full blur-xl pointer-events-none group-hover:bg-blue-500/25 transition-all duration-500" />

            {/* Header: AI Avatar + Title + Status */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                {/* Glowing Avatar Icon */}
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-sky-400 flex items-center justify-center text-white shadow-[0_0_12px_rgba(59,130,246,0.4)] flex-shrink-0">
                  <span className="material-symbols-outlined text-[17px] animate-pulse">auto_awesome</span>
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h4 className="text-[12.5px] font-semibold text-slate-900 dark:text-white leading-tight font-sans tracking-tight">
                      Kohi AI Concierge
                    </h4>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  </div>
                  <p className="text-[10px] font-normal text-slate-500 dark:text-slate-400 font-sans mt-0.5">
                    {lang === 'en' ? 'Smart Menu & Store Guide' : lang === 'zh' ? '智能点餐与门店助手' : 'Trợ lý gọi món & tư vấn quán'}
                  </p>
                </div>
              </div>

              {/* Toggle / Open Button */}
              <button
                onClick={() => setIsAiChatOpen(!isAiChatOpen)}
                className="px-2 py-1 rounded-lg bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30 text-[10px] font-medium hover:bg-blue-600 hover:text-white transition-all font-sans cursor-pointer active:scale-95 flex items-center gap-1"
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
                className="w-full bg-white dark:bg-slate-800/60 hover:bg-blue-600 dark:hover:bg-blue-600 text-slate-700 dark:text-slate-200 hover:text-white dark:hover:text-white text-[10.5px] font-medium py-1.5 px-2.5 rounded-xl border border-slate-200 dark:border-white/10 hover:border-blue-500 transition-all duration-200 text-left flex items-center justify-between font-sans group/chip cursor-pointer shadow-xs"
              >
                <span className="truncate flex items-center gap-1">
                  <span className="material-symbols-outlined text-[13px] text-amber-500 dark:text-amber-400">local_fire_department</span>
                  <span>{lang === 'en' ? 'Best Sellers?' : lang === 'zh' ? '招牌推荐？' : 'Món nào ngon nhất?'}</span>
                </span>
                <span className="material-symbols-outlined text-[13px] opacity-0 group-hover/chip:opacity-100 transition-opacity">arrow_forward</span>
              </button>

              <div className="grid grid-cols-2 gap-1.5">
                <button
                  onClick={() => {
                    setIsAiChatOpen(true);
                    setAiInput(lang === 'en' ? 'OPENING HOURS?' : lang === 'zh' ? '营业时间？' : 'GIỜ MỞ CỬA?');
                  }}
                  className="bg-white dark:bg-slate-800/60 hover:bg-blue-600 dark:hover:bg-blue-600 text-slate-700 dark:text-slate-200 hover:text-white dark:hover:text-white text-[10px] font-medium py-1.5 px-2 rounded-xl border border-slate-200 dark:border-white/10 hover:border-blue-500 transition-all duration-200 text-center truncate font-sans cursor-pointer shadow-xs flex items-center justify-center gap-1"
                >
                  <span className="material-symbols-outlined text-[12px]">schedule</span>
                  <span>{lang === 'en' ? 'Hours?' : lang === 'zh' ? '营业时间？' : 'Giờ mở cửa?'}</span>
                </button>

                <button
                  onClick={() => {
                    setIsAiChatOpen(true);
                    setAiInput(lang === 'en' ? 'WIFI PASSWORD?' : lang === 'zh' ? 'WiFi 密码？' : 'CÓ WIFI KHÔNG?');
                  }}
                  className="bg-white dark:bg-slate-800/60 hover:bg-blue-600 dark:hover:bg-blue-600 text-slate-700 dark:text-slate-200 hover:text-white dark:hover:text-white text-[10px] font-medium py-1.5 px-2 rounded-xl border border-slate-200 dark:border-white/10 hover:border-blue-500 transition-all duration-200 text-center truncate font-sans cursor-pointer shadow-xs flex items-center justify-center gap-1"
                >
                  <span className="material-symbols-outlined text-[12px]">wifi</span>
                  <span>{lang === 'en' ? 'WiFi?' : lang === 'zh' ? 'WiFi 密码？' : 'Mật khẩu WiFi?'}</span>
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </aside>
  );
};
