'use client';
import { AppIcon } from '@/components/common/DashboardIcon';

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
  const lower = (cat || '').toLowerCase().normalize('NFC');
  if (!cat || lower === 'all' || lower === 'tất cả') return 'apps';
  if (lower.includes('cà phê') || lower.includes('coffee') || lower.includes('cafe')) return 'local_cafe';
  if (lower.includes('trà') || lower.includes('tea')) return 'emoji_food_beverage';
  if (lower.includes('đá xay') || lower.includes('smoothie') || lower.includes('frappe')) return 'icecream';
  if (lower.includes('nhẹ') || lower.includes('snack') || lower.includes('ăn vặt')) return 'cookie';
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
      className="hidden md:flex flex-col justify-between h-full py-2.5 px-2.5 xl:px-3.5 w-64 xl:w-72 flex-shrink-0 bg-white/95 dark:bg-[#111622]/90 backdrop-blur-xl text-slate-900 dark:text-slate-100 border-r border-slate-200/80 dark:border-white/10 overflow-hidden transition-colors font-sans"
    >
      {/* Top Fixed Section: Brand, Table Box, Call Staff, Search */}
      <div className="shrink-0 space-y-1.5 xl:space-y-2">
        {/* Brand Header */}
        <div className="px-1 pt-0.5">
          <BrandLogo />
        </div>

        {/* Table Location Badge Box (Clickable to open Table QR Modal) */}
        <button
          onClick={onOpenQRModal}
          className="w-full text-left relative group cursor-pointer active:scale-[0.98] transition-all"
          title={lang === 'en' ? 'Click to view QR code for this table' : lang === 'zh' ? '点击查看此桌位的二维码' : 'Bấm vào để xem mã QR đặt món của bàn này'}
        >
          <div className="bg-slate-100/90 dark:bg-slate-900/60 hover:bg-gradient-to-r hover:from-blue-600 hover:to-sky-500 text-slate-900 dark:text-white hover:text-white border border-slate-200 dark:border-white/10 hover:border-transparent rounded-2xl px-3 py-2.5 xl:py-3.5 flex items-center justify-between shadow-xs hover:shadow-lg hover:shadow-blue-500/25 transition-all duration-300 gap-2">
            <div className="min-w-0 flex-1">
              <p className="text-[9.5px] xl:text-[10px] font-semibold text-slate-500 dark:text-slate-400 group-hover:text-white/80 uppercase tracking-[0.08em] font-sans transition-colors truncate">
                {lang === 'en' ? 'Current Table' : lang === 'zh' ? '当前位置' : 'Vị trí hiện tại'}
              </p>
              <span className="text-[13px] xl:text-[14px] font-bold tracking-tight flex items-center gap-1.5 font-sans text-slate-900 dark:text-white group-hover:text-white transition-colors truncate mt-0.5">
                <AppIcon name="location_on" className="text-[15px] text-sky-500 dark:text-sky-400 group-hover:text-white transition-colors shrink-0" />
                <span className="truncate">{isLoading ? (lang === 'en' ? 'Loading...' : lang === 'zh' ? '加载中...' : 'Đang tải...') : formatTableLocation(table?.tableName, lang)}</span>
              </span>
            </div>
            <div className="shrink-0 flex items-center gap-1 bg-slate-200/80 dark:bg-white/10 group-hover:bg-white/20 text-slate-700 dark:text-slate-300 group-hover:text-white px-2.5 py-1 rounded-lg backdrop-blur-xs transition-colors">
              <AppIcon name="qr_code_scanner" className="text-[12px] animate-pulse" />
              <span className="text-[10px] xl:text-[10.5px] font-bold font-sans whitespace-nowrap">{lang === 'en' ? 'QR Code' : lang === 'zh' ? '二维码' : 'Mã QR'}</span>
            </div>
          </div>
        </button>

        {/* High Visibility Call Staff Button */}
        <div>
          <button
            onClick={handleCallStaff}
            disabled={callStaffCooldown > 0 || isCallingStaff}
            className="w-full group py-2.5 xl:py-3.5 px-4 min-h-[44px] xl:min-h-[48px] bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white border border-amber-400/30 rounded-xl flex items-center justify-center gap-2 transition-all duration-300 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm shadow-orange-500/25 hover:shadow-md hover:shadow-orange-500/35 font-extrabold text-xs xl:text-[13px] font-sans tracking-wide cursor-pointer"
          >
            <AppIcon name="notifications_active" className="text-[18px] text-white transition-transform group-hover:scale-110" />
            <span className="drop-shadow-xs">
              {callStaffCooldown > 0
                ? (lang === 'en' ? `WAIT ${callStaffCooldown}S...` : lang === 'zh' ? `请稍等 ${callStaffCooldown} 秒...` : `CHỜ ${callStaffCooldown}S...`)
                : (lang === 'en' ? 'CALL STAFF' : lang === 'zh' ? '呼叫服务员' : 'GỌI NHÂN VIÊN')}
            </span>
          </button>
        </div>

        {/* Search Input Box */}
        <div className="relative">
          <AppIcon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none" />
          <input
            type="text"
            placeholder={lang === 'en' ? 'Search coffee, tea, pastry...' : lang === 'zh' ? '搜索咖啡、水果茶、糕点...' : 'Tìm kiếm món ăn, cà phê...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 rounded-xl py-2 xl:py-2.5 pl-9 pr-3 min-h-[38px] xl:min-h-[42px] text-xs xl:text-[13px] text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 transition-colors placeholder-slate-400 font-sans font-medium"
          />
        </div>
      </div>

      {/* Middle Section: Category Navigation Menu (No scrollbar on desktop, fits comfortably) */}
      <div className="shrink-0 flex flex-col my-1 xl:my-1.5 overflow-hidden">
        {/* Category Header Label */}
        <div className="flex items-center justify-between px-1 pb-1 shrink-0">
          <span className="text-[9.5px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            {lang === 'en' ? 'Menu Categories' : lang === 'zh' ? '菜品分类' : 'Danh mục món'}
          </span>
          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-slate-400">
            {categories.length + 1}
          </span>
        </div>

        {/* Categories List (Proportional sizing, fits all 5 items with 0 scrollbar) */}
        <nav className="flex flex-col gap-1 overflow-hidden pr-0.5 py-0.5">
          {/* All Category Button */}
          <button
            onClick={() => setActiveCategory('')}
            className={`w-full px-2.5 py-1.5 xl:py-2 rounded-xl text-xs xl:text-[12.5px] transition-all text-left font-sans cursor-pointer shrink-0 flex items-center justify-between gap-2 ${
              activeCategory === ''
                ? 'bg-slate-900 text-white dark:bg-sky-400 dark:text-slate-950 font-bold shadow-xs'
                : 'text-slate-600 dark:text-slate-300 font-semibold hover:bg-slate-100/90 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <div className="flex items-center gap-2 min-w-0">
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                  activeCategory === ''
                    ? 'bg-white/20 dark:bg-slate-950/20 text-white dark:text-slate-950'
                    : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300'
                }`}
              >
                <AppIcon name="apps" className="text-[15px]" />
              </div>
              <span className="truncate font-sans font-semibold">
                {lang === 'en' ? 'All Items' : lang === 'zh' ? '全部' : 'Tất cả món'}
              </span>
            </div>
            <AppIcon
              name="chevron_right"
              className={`text-xs transition-opacity ${activeCategory === '' ? 'opacity-100' : 'opacity-25'}`}
            />
          </button>

          {/* Individual Category Buttons */}
          {categories.map((cat) => {
            const isActive = activeCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`w-full px-2.5 py-1.5 xl:py-2 rounded-xl text-xs xl:text-[12.5px] transition-all text-left font-sans cursor-pointer shrink-0 flex items-center justify-between gap-2 ${
                  isActive
                    ? 'bg-slate-900 text-white dark:bg-sky-400 dark:text-slate-950 font-bold shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 font-semibold hover:bg-slate-100/90 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                      isActive
                        ? 'bg-white/20 dark:bg-slate-950/20 text-white dark:text-slate-950'
                        : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    <AppIcon name={getCategoryIcon(cat)} className="text-[15px]" />
                  </div>
                  <span className="truncate font-sans font-semibold">{translateCategory(cat)}</span>
                </div>
                <AppIcon
                  name="chevron_right"
                  className={`text-xs transition-opacity ${isActive ? 'opacity-100' : 'opacity-25'}`}
                />
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Utilities Stack: AI Concierge, Settings & Action Buttons */}
      <div className="shrink-0 flex flex-col gap-2 pt-2 border-t border-slate-200/80 dark:border-white/10">
        {/* AI Chat Bot Widget Box - Compact Bento Card */}
        <motion.div
          whileHover={{ y: -1 }}
          transition={{ duration: 0.15 }}
          className="relative rounded-2xl p-[1px] bg-gradient-to-b from-blue-500/40 via-slate-300/40 dark:via-white/10 to-blue-500/20 shadow-xs group"
        >
          <div className="bg-slate-50/90 dark:bg-slate-900/80 rounded-[15px] p-2.5 xl:p-3 backdrop-blur-md relative overflow-hidden border border-slate-200/80 dark:border-white/5">
            {/* Header: AI Avatar + Title + Button */}
            <div className="flex items-center justify-between gap-2">
              <div
                onClick={() => setIsAiChatOpen(true)}
                className="flex items-center gap-2 cursor-pointer min-w-0 flex-1"
              >
                <div className="w-7 h-7 xl:w-8 xl:h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-sky-400 flex items-center justify-center text-white shadow-xs flex-shrink-0">
                  <AppIcon name="auto_awesome" className="text-[14px] xl:text-[15px]" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1">
                    <h4 className="text-xs xl:text-[13px] font-extrabold text-slate-900 dark:text-white leading-tight font-sans truncate">
                      Kohi AI Concierge
                    </h4>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                  </div>
                  <p className="text-[9px] xl:text-[9.5px] font-medium text-slate-500 dark:text-slate-400 font-sans truncate leading-tight mt-0.5">
                    {lang === 'en' ? 'Smart Store Guide' : lang === 'zh' ? '智能助手' : 'Trợ lý gọi món & quán'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsAiChatOpen(!isAiChatOpen)}
                className="px-2.5 py-1 rounded-lg bg-blue-500/15 hover:bg-blue-600 text-blue-600 dark:text-blue-400 hover:text-white border border-blue-500/30 text-[10px] xl:text-[10.5px] font-bold transition-all font-sans cursor-pointer active:scale-95 flex items-center gap-1 shrink-0"
                title={isAiChatOpen ? 'Thu gọn' : 'Hỏi AI'}
              >
                <span>{isAiChatOpen ? (lang === 'en' ? 'Hide' : lang === 'zh' ? 'Ẩn' : 'Thu gọn') : (lang === 'en' ? 'Chat' : lang === 'zh' ? 'Chat' : 'Hỏi AI')}</span>
                <AppIcon name={isAiChatOpen ? 'expand_more' : 'chat_bubble'} className="text-[11px]" />
              </button>
            </div>

            {/* Quick Prompt Chips: Single Compact 2-column Row */}
            <div className="grid grid-cols-2 gap-1.5 mt-2">
              <button
                type="button"
                onClick={() => {
                  setIsAiChatOpen(true);
                  setAiInput(lang === 'en' ? 'WHAT IS THE BEST SELLER?' : lang === 'zh' ? '招牌推荐是什么？' : 'MÓN NÀO NGON NHẤT?');
                }}
                className="bg-white dark:bg-slate-800/70 hover:bg-blue-600 dark:hover:bg-blue-600 text-slate-700 dark:text-slate-200 hover:text-white dark:hover:text-white text-[9.5px] xl:text-[10px] font-bold py-1.5 xl:py-2 px-2 rounded-lg border border-slate-200/90 dark:border-white/10 hover:border-blue-500 transition-all text-center truncate font-sans cursor-pointer shadow-xs flex items-center justify-center gap-1 min-h-[28px] xl:min-h-[32px]"
                title="Món nào ngon nhất?"
              >
                <AppIcon name="local_fire_department" className="text-[12px] text-amber-500 shrink-0" />
                <span className="truncate">{lang === 'en' ? 'Best Seller' : lang === 'zh' ? '招牌推荐' : 'Món ngon nhất'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsAiChatOpen(true);
                  setAiInput(lang === 'en' ? 'WIFI PASSWORD?' : lang === 'zh' ? 'WiFi 密码？' : 'CÓ WIFI KHÔNG?');
                }}
                className="bg-white dark:bg-slate-800/70 hover:bg-blue-600 dark:hover:bg-blue-600 text-slate-700 dark:text-slate-200 hover:text-white dark:hover:text-white text-[9.5px] xl:text-[10px] font-bold py-1.5 xl:py-2 px-2 rounded-lg border border-slate-200/90 dark:border-white/10 hover:border-blue-500 transition-all text-center truncate font-sans cursor-pointer shadow-xs flex items-center justify-center gap-1 min-h-[28px] xl:min-h-[32px]"
                title="Mật khẩu WiFi?"
              >
                <AppIcon name="wifi" className="text-[12px] text-sky-500 shrink-0" />
                <span className="truncate">{lang === 'en' ? 'WiFi Pass' : lang === 'zh' ? 'WiFi密码' : 'Mật khẩu WiFi'}</span>
              </button>
            </div>
          </div>
        </motion.div>

        {/* Settings: Theme & Language Segmented Controls */}
        <div className="flex items-center justify-between gap-1.5 p-1.5 bg-slate-100/80 dark:bg-slate-900/50 border border-slate-200/90 dark:border-white/10 rounded-xl shadow-xs min-h-[38px] xl:min-h-[42px]">
          <ThemeToggleSwitch isDark={isDark} setTheme={setTheme} />
          <LanguageToggleSwitch lang={lang} setLang={setLang} />
        </div>

        {/* Action Buttons: Combined 2 in 1 Row (Đổi bàn + Rời bàn) */}
        <div className="grid grid-cols-2 gap-1.5">
          <button
            type="button"
            onClick={() => setIsTransferModalOpen(true)}
            className="w-full px-2 py-2 xl:py-2.5 min-h-[40px] xl:min-h-[44px] rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/60 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-white/10 text-xs xl:text-[13px] font-bold text-slate-700 dark:text-slate-200 transition-all flex items-center justify-center gap-1.5 font-sans cursor-pointer active:scale-95 shadow-xs"
            title={lang === 'en' ? 'Change Table' : lang === 'zh' ? '更换桌号' : 'Yêu cầu đổi bàn'}
          >
            <AppIcon name="swap_horiz" className="text-[16px]" />
            <span className="truncate">{lang === 'en' ? 'Change' : lang === 'zh' ? '换桌' : 'Đổi bàn'}</span>
          </button>

          {handleLeaveTable && (
            <button
              type="button"
              onClick={isLeaveDisabled ? undefined : handleLeaveTable}
              disabled={isLeaveDisabled}
              title={isLeaveDisabled ? (leaveDisabledReason || 'Đơn hàng đã duyệt, không thể rời bàn.') : undefined}
              className={`w-full px-2 py-2 xl:py-2.5 min-h-[40px] xl:min-h-[44px] rounded-xl border text-xs xl:text-[13px] font-bold transition-all flex items-center justify-center gap-1.5 font-sans shadow-2xs ${
                isLeaveDisabled
                  ? 'bg-slate-100/60 dark:bg-slate-800/30 border-slate-200/50 dark:border-white/5 text-slate-400 cursor-not-allowed opacity-60'
                  : 'bg-slate-100 hover:bg-rose-500/10 dark:bg-slate-800/50 dark:hover:bg-rose-500/15 border-slate-200/90 hover:border-rose-500/30 dark:border-white/10 text-slate-600 hover:text-rose-500 dark:text-slate-300 dark:hover:text-rose-400 cursor-pointer active:scale-95'
              }`}
            >
              <AppIcon name="logout" className="text-[16px]" />
              <span className="truncate">{lang === 'en' ? 'Leave' : lang === 'zh' ? '离开' : 'Rời bàn'}</span>
            </button>
          )}
        </div>
      </div>
    </aside>
  );
};
