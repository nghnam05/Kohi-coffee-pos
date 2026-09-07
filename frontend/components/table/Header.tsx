'use client';

import React, { useState } from 'react';
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
  const [isFloatingPopupOpen, setIsFloatingPopupOpen] = useState(false);

  const togglePopup = () => {
    setIsFloatingPopupOpen((prev) => !prev);
  };

  const closePopup = () => {
    setIsFloatingPopupOpen(false);
  };

  return (
    <>
      {/* ── Mobile Top App Bar ──────────────────────────────────────────────── */}
      <header className="fixed top-0 left-0 right-0 z-40 h-16 px-4 bg-white/90 dark:bg-[#0B0F17]/90 backdrop-blur-xl border-b border-slate-200 dark:border-white/10 flex justify-between items-center md:hidden shadow-xs transition-colors">
        <BrandLogo />
        <div className="flex items-center gap-2">
          {/* Notification Button */}
          <button
            type="button"
            onClick={onOpenNotifications || handleOpenOrderHistory}
            className="relative w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-900/80 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 flex items-center justify-center shadow-xs active:scale-95 transition-all cursor-pointer"
            title="Xem danh sách thông báo"
          >
            <span className="material-symbols-outlined text-xl">notifications</span>
            {unreadNotificationCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 flex items-center justify-center text-[10px] font-black bg-[#3B82F6] text-white rounded-full shadow-xs leading-none animate-pulse">
                {unreadNotificationCount}
              </span>
            )}
          </button>

          {/* 3-Dots Dropdown Menu Button */}
          <button
            type="button"
            onClick={togglePopup}
            className={`relative w-10 h-10 rounded-xl border flex items-center justify-center shadow-xs active:scale-95 transition-all cursor-pointer ${
              isFloatingPopupOpen
                ? 'bg-[#3B82F6] text-white border-[#3B82F6] shadow-blue-500/30'
                : 'bg-slate-100 dark:bg-slate-900/80 border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400'
            }`}
            title="Danh mục tùy chọn"
          >
            <span className="material-symbols-outlined text-2xl transition-transform duration-200">
              {isFloatingPopupOpen ? 'close' : 'more_vert'}
            </span>

            {/* Notification Dot Badge */}
            {!isFloatingPopupOpen && (totalQuantity > 0 || activeOrders.length > 0) && (
              <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-rose-500 rounded-full border-2 border-white dark:border-[#0B0F17]" />
            )}
          </button>
        </div>
      </header>

      {/* ── Mobile Crisp Bottom Sheet Modal ─────────────────────────────────── */}
      <AnimatePresence>
        {isFloatingPopupOpen && (
          <>
            {/* Backdrop overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closePopup}
              className="fixed inset-0 z-40 bg-black/75 backdrop-blur-xs md:hidden"
            />

            {/* Bottom Sheet Container (Bento Grid Dark Theme) */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 26, stiffness: 300 }}
              className="fixed inset-x-0 bottom-0 z-50 bg-white dark:bg-[#0F172A] border-t border-slate-200 dark:border-white/10 rounded-t-[28px] p-5 pt-3 shadow-2xl md:hidden font-sans space-y-4 max-h-[85vh] overflow-y-auto"
            >
              {/* Drag Handle Indicator */}
              <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto opacity-70 mb-2" />

              {/* High Contrast Header: Table Info & QR Button */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-white/10">
                <div>
                  <p className="text-[10px] uppercase tracking-wider font-extrabold text-slate-500 dark:text-slate-400">
                    {lang === 'en' ? 'CURRENT TABLE' : lang === 'zh' ? '当前桌位' : 'VỊ TRÍ BÀN'}
                  </p>
                  <h4 className="text-base font-black text-slate-900 dark:text-white mt-0.5">
                    {table?.tableName ?? (lang === 'en' ? 'Table 01' : lang === 'zh' ? '01号桌' : 'Bàn 01')}{' '}
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                      {lang === 'en' ? '(1st Floor)' : lang === 'zh' ? '(1层)' : '(Tầng 1)'}
                    </span>
                  </h4>
                </div>

                <div className="flex items-center gap-2">
                  {onOpenQRModal && (
                    <button
                      type="button"
                      onClick={() => {
                        closePopup();
                        onOpenQRModal();
                      }}
                      className="px-3 py-1.5 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 text-xs font-bold transition-all active:scale-95 border border-blue-500/30 cursor-pointer"
                    >
                      {lang === 'en' ? 'QR Code' : lang === 'zh' ? '二维码' : 'Mã QR'}
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={closePopup}
                    className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white flex items-center justify-center transition-all active:scale-95 cursor-pointer"
                    title={lang === 'en' ? 'Close' : lang === 'zh' ? '关闭' : 'Đóng'}
                  >
                    <span className="material-symbols-outlined text-lg">close</span>
                  </button>
                </div>
              </div>

              {/* 1. Primary Actions (Modern Inset Grouped List - Clean Typography & Badges) */}
              <div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 rounded-2xl overflow-hidden divide-y divide-slate-200/80 dark:divide-white/5 shadow-xs">
                {/* 1.1 Menu Thực Đơn */}
                <button
                  type="button"
                  onClick={() => {
                    closePopup();
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="w-full px-4 py-3.5 flex items-center justify-between text-left hover:bg-slate-100/80 dark:hover:bg-slate-800/60 transition-colors active:scale-[0.99] cursor-pointer group"
                >
                  <div>
                    <h5 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {lang === 'en' ? 'Menu' : lang === 'zh' ? '完整菜单' : 'Thực đơn'}
                    </h5>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {lang === 'en' ? 'Browse coffee & food' : lang === 'zh' ? '浏览咖啡与点心' : 'Xem danh sách món ăn'}
                    </p>
                  </div>
                  <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 group-hover:text-blue-600 dark:group-hover:text-blue-400 group-hover:translate-x-0.5 transition-all">
                    →
                  </span>
                </button>

                {/* 1.2 Giỏ Hàng */}
                <button
                  type="button"
                  onClick={() => {
                    closePopup();
                    if (setIsCartOpen) setIsCartOpen(true);
                  }}
                  className="w-full px-4 py-3.5 flex items-center justify-between text-left hover:bg-slate-100/80 dark:hover:bg-slate-800/60 transition-colors active:scale-[0.99] cursor-pointer group"
                >
                  <div>
                    <h5 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                      {lang === 'en' ? 'Your Cart' : lang === 'zh' ? '购物车' : 'Giỏ hàng'}
                    </h5>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {totalQuantity > 0
                        ? (lang === 'en' ? `${totalQuantity} items selected` : lang === 'zh' ? `已选择 ${totalQuantity} 件商品` : `Đã chọn ${totalQuantity} món`)
                        : (lang === 'en' ? 'No items selected' : lang === 'zh' ? '尚未选择商品' : 'Chưa có món nào')}
                    </p>
                  </div>
                  {totalQuantity > 0 ? (
                    <span className="px-2.5 py-1 text-xs font-black bg-emerald-500 text-white rounded-lg shadow-2xs">
                      {totalQuantity} {lang === 'en' ? 'items' : lang === 'zh' ? '件' : 'món'}
                    </span>
                  ) : (
                    <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">
                      {lang === 'en' ? 'Empty' : lang === 'zh' ? '空' : 'Trống'}
                    </span>
                  )}
                </button>

                {/* 1.3 Lịch Sử Đơn Hàng */}
                <button
                  type="button"
                  onClick={() => {
                    closePopup();
                    handleOpenOrderHistory();
                  }}
                  className="w-full px-4 py-3.5 flex items-center justify-between text-left hover:bg-slate-100/80 dark:hover:bg-slate-800/60 transition-colors active:scale-[0.99] cursor-pointer group"
                >
                  <div>
                    <h5 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {lang === 'en' ? 'Orders' : lang === 'zh' ? '点单记录' : 'Đơn hàng'}
                    </h5>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {activeOrders.length > 0
                        ? (lang === 'en' ? `${activeOrders.length} active orders` : lang === 'zh' ? `${activeOrders.length} 笔订单进行中` : `${activeOrders.length} đơn đang theo dõi`)
                        : (lang === 'en' ? 'No active orders' : lang === 'zh' ? '暂无进行中订单' : 'Chưa có đơn nào')}
                    </p>
                  </div>
                  {activeOrders.length > 0 ? (
                    <span className="px-2.5 py-1 text-xs font-black bg-blue-500 text-white rounded-lg shadow-2xs">
                      {activeOrders.length} {lang === 'en' ? 'orders' : lang === 'zh' ? '单' : 'đơn'}
                    </span>
                  ) : (
                    <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 group-hover:text-blue-600 dark:group-hover:text-blue-400 group-hover:translate-x-0.5 transition-all">
                      →
                    </span>
                  )}
                </button>
              </div>

              {/* 2. High Visibility Call Staff Banner (No Decorative Icon) */}
              <button
                type="button"
                onClick={handleCallStaff}
                disabled={callStaffCooldown > 0 || isCallingStaff}
                className={`w-full p-4 rounded-2xl border text-left transition-all flex items-center justify-between cursor-pointer active:scale-[0.99] shadow-xs ${
                  callStaffCooldown > 0
                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400 opacity-80 cursor-not-allowed'
                    : 'bg-amber-500/15 hover:bg-amber-500/25 border-amber-500/35 text-amber-700 dark:text-amber-300'
                }`}
              >
                <div>
                  <h5 className="text-sm font-extrabold leading-tight">
                    {callStaffCooldown > 0
                      ? (lang === 'en' ? `Please wait (${callStaffCooldown}s)` : lang === 'zh' ? `请稍候 (${callStaffCooldown}秒)` : `Đang gọi (Chờ ${callStaffCooldown}s)`)
                      : (lang === 'en' ? 'Call Staff' : lang === 'zh' ? '呼叫服务员' : 'Gọi nhân viên')}
                  </h5>
                  <p className="text-xs opacity-80 mt-0.5 font-medium">
                    {callStaffCooldown > 0
                      ? (lang === 'en' ? 'Staff is being notified' : lang === 'zh' ? '服务员正在前往' : 'Nhân viên đang tiếp nhận thông tin')
                      : (lang === 'en' ? 'Request table assistance' : lang === 'zh' ? '需要餐桌协助与服务' : 'Yêu cầu phục vụ tại bàn')}
                  </p>
                </div>
                <span className="px-3 py-1.5 rounded-xl bg-amber-500 text-white text-xs font-black shadow-xs shrink-0">
                  {callStaffCooldown > 0
                    ? `${callStaffCooldown}s`
                    : (lang === 'en' ? 'Request' : lang === 'zh' ? '立即呼叫' : 'Gửi yêu cầu')}
                </span>
              </button>

              {/* 3. Secondary Table Actions (Change Table / Leave Table) */}
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    closePopup();
                    setIsTransferModalOpen(true);
                  }}
                  className="px-3.5 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-900/80 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 transition-all cursor-pointer border border-slate-200 dark:border-white/10 text-center truncate shadow-2xs active:scale-95"
                >
                  {lang === 'en' ? 'Change Table' : lang === 'zh' ? '更换桌位' : 'Yêu cầu đổi bàn'}
                </button>

                {handleLeaveTable && (
                  <button
                    type="button"
                    onClick={() => {
                      closePopup();
                      handleLeaveTable();
                    }}
                    className="px-3.5 py-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-xs font-bold text-rose-600 dark:text-rose-400 transition-all cursor-pointer border border-rose-500/30 text-center truncate shadow-2xs active:scale-95"
                  >
                    {lang === 'en' ? 'Leave Table' : lang === 'zh' ? '离开桌位' : 'Rời bàn'}
                  </button>
                )}
              </div>

              {/* 4. Footer Settings: Theme & Language */}
              <div className="pt-2 border-t border-slate-200 dark:border-white/10 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                  {lang === 'en' ? 'Theme & Language' : lang === 'zh' ? '主题与语言' : 'Giao diện & Ngôn ngữ'}
                </span>
                <div className="flex items-center gap-2">
                  <ThemeToggleSwitch isDark={isDark} setTheme={setTheme} />
                  <LanguageToggleSwitch lang={lang} setLang={setLang} />
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};
