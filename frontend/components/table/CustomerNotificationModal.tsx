'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  type: 'order' | 'staff' | 'system' | 'promo';
  read: boolean;
  orderId?: string;
}

interface CustomerNotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: NotificationItem[];
  onMarkAllAsRead: () => void;
  onClearAll: () => void;
  lang?: 'vi' | 'en' | 'zh';
  onNotificationClick?: (item: NotificationItem) => void;
}

export const CustomerNotificationModal: React.FC<CustomerNotificationModalProps> = ({
  isOpen,
  onClose,
  notifications,
  onMarkAllAsRead,
  onClearAll,
  lang = 'vi',
  onNotificationClick,
}) => {
  const unreadCount = notifications.filter((n) => !n.read).length;

  const getIcon = (type: NotificationItem['type']) => {
    switch (type) {
      case 'order':
        return { icon: 'restaurant', color: 'bg-sky-500/10 text-[#0284c7] dark:text-[#38BDF8]' };
      case 'staff':
        return { icon: 'notifications_active', color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400' };
      case 'promo':
        return { icon: 'local_offer', color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' };
      default:
        return { icon: 'info', color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400' };
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 select-none font-sans">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/60 dark:bg-slate-950/80 backdrop-blur-sm transition-opacity"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 15 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 15 }}
            transition={{ type: 'spring', stiffness: 420, damping: 30 }}
            className="relative w-full max-w-md bg-white dark:bg-[#0D111A] border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl z-10 max-h-[85vh] flex flex-col font-sans text-left overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 dark:border-slate-800/80 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-[#3AA6FF]/10 text-[#3AA6FF] flex items-center justify-center font-bold">
                  <span className="material-symbols-outlined text-xl">notifications</span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-black text-slate-900 dark:text-white tracking-tight">
                      {lang === 'en' ? 'Notifications' : lang === 'zh' ? '通知消息' : 'Thông báo'}
                    </h3>
                    {unreadCount > 0 && (
                      <span className="px-2 py-0.5 text-[10px] font-black bg-[#3AA6FF] text-white rounded-full leading-none">
                        {unreadCount} {lang === 'en' ? 'new' : lang === 'zh' ? '新' : 'mới'}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                    {lang === 'en' ? 'Live updates from Kohi Coffee' : lang === 'zh' ? 'Kohi Coffee 实时动态' : 'Cập nhật trực tiếp từ Kohi Coffee'}
                  </p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white flex items-center justify-center transition-all cursor-pointer active:scale-95"
                title="Đóng"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            {/* Quick Actions Bar */}
            {notifications.length > 0 && (
              <div className="flex items-center justify-between py-2 px-1 border-b border-slate-100 dark:border-slate-800/50 text-[11px]">
                <button
                  onClick={onMarkAllAsRead}
                  disabled={unreadCount === 0}
                  className="text-[#0284c7] dark:text-[#38BDF8] hover:underline font-bold disabled:opacity-40 disabled:no-underline cursor-pointer"
                >
                  {lang === 'en' ? 'Mark all as read' : lang === 'zh' ? '全部标为已读' : 'Đánh dấu đã đọc tất cả'}
                </button>
                <button
                  onClick={onClearAll}
                  className="text-slate-400 hover:text-red-500 font-medium transition-colors cursor-pointer"
                >
                  {lang === 'en' ? 'Clear all' : lang === 'zh' ? '清空通知' : 'Xóa tất cả'}
                </button>
              </div>
            )}

            {/* Notification List Body */}
            <div className="flex-1 overflow-y-auto py-3 space-y-2.5 scrollbar-none pr-0.5">
              {notifications.length === 0 ? (
                <div className="py-12 flex flex-col items-center justify-center text-center text-slate-400 dark:text-slate-500 space-y-2">
                  <div className="w-14 h-14 rounded-full bg-slate-100 dark:bg-slate-800/60 flex items-center justify-center">
                    <span className="material-symbols-outlined text-3xl text-slate-300 dark:text-slate-600">
                      notifications_off
                    </span>
                  </div>
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    {lang === 'en' ? 'No notifications yet' : lang === 'zh' ? '暂无通知' : 'Chưa có thông báo nào'}
                  </p>
                  <p className="text-[11px] max-w-xs text-slate-400">
                    {lang === 'en'
                      ? 'Status updates and system announcements will appear here.'
                      : lang === 'zh'
                      ? '订单状态更新与系统消息将在此显示。'
                      : 'Các cập nhật đơn hàng và tin nhắn hỗ trợ sẽ hiển thị tại đây.'}
                  </p>
                </div>
              ) : (
                notifications.map((item) => {
                  const style = getIcon(item.type);
                  return (
                    <div
                      key={item.id}
                      onClick={() => onNotificationClick && onNotificationClick(item)}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer relative ${
                        item.read
                          ? 'bg-slate-50/50 dark:bg-[#121724]/50 border-slate-100 dark:border-slate-800/60 opacity-85'
                          : 'bg-white dark:bg-[#151c2d] border-[#3AA6FF]/30 dark:border-[#3AA6FF]/40 shadow-xs'
                      }`}
                    >
                      {!item.read && (
                        <span className="absolute top-3.5 right-3.5 w-2 h-2 rounded-full bg-[#3AA6FF] ring-4 ring-[#3AA6FF]/20" />
                      )}
                      <div className="flex items-start gap-3">
                        <div className={`w-9 h-9 rounded-xl ${style.color} flex items-center justify-center shrink-0 mt-0.5`}>
                          <span className="material-symbols-outlined text-lg">{style.icon}</span>
                        </div>
                        <div className="flex-1 min-w-0 pr-4">
                          <div className="flex items-center justify-between gap-2">
                            <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                              {item.title}
                            </h4>
                            <span className="text-[10px] text-slate-400 shrink-0 font-mono">
                              {item.timestamp}
                            </span>
                          </div>
                          <p className="text-[11.5px] text-slate-600 dark:text-slate-300 mt-1 leading-relaxed line-clamp-2">
                            {item.message}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-end shrink-0">
              <button
                onClick={onClose}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-xl text-xs transition-all active:scale-95 cursor-pointer"
              >
                {lang === 'en' ? 'Close' : lang === 'zh' ? '关闭' : 'Đóng'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
