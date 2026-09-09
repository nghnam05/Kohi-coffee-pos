'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface TableClosingAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenPayment?: () => void;
  isClosed: boolean;
  minutesUntilClosing: number;
  closingTimeStr: string;
  tableName?: string;
  lang?: 'vi' | 'en' | 'zh';
}

export const TableClosingAlertModal: React.FC<TableClosingAlertModalProps> = ({
  isOpen,
  onClose,
  onOpenPayment,
  isClosed,
  minutesUntilClosing,
  closingTimeStr = '22:00',
  tableName = '',
  lang = 'vi',
}) => {
  if (!isOpen) return null;

  const content = {
    vi: {
      nearClosingTitle: 'Quán Sắp Đến Giờ Đóng Cửa',
      closedTitle: 'Quán Đã Đến Giờ Đóng Cửa',
      nearClosingSubtitle: `Kohi Coffee sẽ đóng cửa vào lúc ${closingTimeStr}`,
      closedSubtitle: 'Cảm ơn quý khách đã ghé thăm và ủng hộ quán',
      remainingText: `Quán sẽ đóng cửa sau khoảng ${minutesUntilClosing} phút nữa`,
      closedNoticeText: `Hiện tại quán đã đến giờ nghỉ (${closingTimeStr}). Quý khách vui lòng thanh toán và chuẩn bị rời bàn.`,
      nearClosingNoticeText: `Quầy pha chế và bếp chuẩn bị ngưng nhận order mới. Quý khách vui lòng lưu ý gọi thêm món (nếu có nhu cầu) và tiến hành thanh toán trước giờ đóng cửa để nhân viên kịp phục vụ chu đáo nhất.`,
      tableBadge: tableName ? `Bàn: ${tableName}` : 'Tại bàn',
      btnPayNow: 'Xem đơn & Thanh toán',
      btnAcknowledge: 'Tôi đã hiểu',
      btnClose: 'Đóng thông báo',
    },
    en: {
      nearClosingTitle: 'Store Closing Soon',
      closedTitle: 'Store Is Now Closed',
      nearClosingSubtitle: `Kohi Coffee closes at ${closingTimeStr}`,
      closedSubtitle: 'Thank you for visiting Kohi Coffee today',
      remainingText: `The cafe will close in approx. ${minutesUntilClosing} minutes`,
      closedNoticeText: `The cafe is now officially closed (${closingTimeStr}). Please complete your payment and prepare to depart.`,
      nearClosingNoticeText: `Our bar and kitchen will soon stop taking new orders. Please finish your final orders and request checkout before closing time.`,
      tableBadge: tableName ? `Table: ${tableName}` : 'At table',
      btnPayNow: 'Review & Pay Now',
      btnAcknowledge: 'I Understand',
      btnClose: 'Dismiss',
    },
    zh: {
      nearClosingTitle: '本店即将打烊',
      closedTitle: '本店已到打烊时间',
      nearClosingSubtitle: `Kohi Coffee 将于 ${closingTimeStr} 正式打烊`,
      closedSubtitle: '感谢您今天的莅临与支持',
      remainingText: `距离打烊时间约剩余 ${minutesUntilClosing} 分钟`,
      closedNoticeText: `本店现已到达打烊时间 (${closingTimeStr})。请您完成结账并做好离店准备。`,
      nearClosingNoticeText: `水吧与厨房即将停止接收新订单。如有需要请尽快加点，并在打烊前完成结账以便员工为您周到服务。`,
      tableBadge: tableName ? `桌位: ${tableName}` : '当前桌位',
      btnPayNow: '查看账单并结账',
      btnAcknowledge: '我知道了',
      btnClose: '关闭提示',
    },
  }[lang];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 select-none font-sans">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-950/75 backdrop-blur-md"
        />

        {/* Modal Box */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 15 }}
          transition={{ type: 'spring', stiffness: 380, damping: 28 }}
          className={`relative w-full max-w-md rounded-3xl bg-white dark:bg-[#090D16] border p-6 sm:p-7 shadow-2xl z-10 overflow-hidden ${
            isClosed
              ? 'border-rose-500/30 dark:border-rose-500/40'
              : 'border-amber-500/30 dark:border-amber-500/40'
          }`}
        >
          {/* Top Bar Accent */}
          <div
            className={`absolute top-0 left-0 right-0 h-1.5 ${
              isClosed
                ? 'bg-gradient-to-r from-rose-500 via-amber-500 to-rose-500'
                : 'bg-gradient-to-r from-amber-500 via-[#38BDF8] to-amber-500'
            }`}
          />

          {/* Header */}
          <div className="flex items-start gap-3.5 mb-4">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border shadow-inner ${
                isClosed
                  ? 'bg-rose-500/15 text-rose-500 border-rose-500/30'
                  : 'bg-amber-500/15 text-amber-500 border-amber-500/30'
              }`}
            >
              <span className="material-symbols-outlined text-2xl animate-pulse">
                {isClosed ? 'storefront' : 'alarm'}
              </span>
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  {content.tableBadge}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-[#38BDF8]/10 text-[#0284c7] dark:text-[#38BDF8]">
                  {closingTimeStr}
                </span>
              </div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight font-heading leading-snug">
                {isClosed ? content.closedTitle : content.nearClosingTitle}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-normal">
                {isClosed ? content.closedSubtitle : content.nearClosingSubtitle}
              </p>
            </div>
          </div>

          {/* Time & Notice Box */}
          <div
            className={`p-4 rounded-2xl border mb-5 text-xs leading-relaxed ${
              isClosed
                ? 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/50 text-rose-900 dark:text-rose-200'
                : 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/50 text-amber-900 dark:text-amber-200'
            }`}
          >
            {!isClosed && (
              <div className="flex items-center gap-2 font-black text-amber-700 dark:text-amber-300 mb-1.5 text-xs">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                <span>{content.remainingText}</span>
              </div>
            )}
            <p className="text-[12.5px] font-normal opacity-95">
              {isClosed ? content.closedNoticeText : content.nearClosingNoticeText}
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-11 rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs uppercase tracking-wider transition-all cursor-pointer active:scale-95"
            >
              {isClosed ? content.btnClose : content.btnAcknowledge}
            </button>

            {onOpenPayment && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenPayment();
                }}
                className="flex-1 h-11 rounded-xl bg-[#38BDF8] hover:bg-sky-400 text-slate-950 font-black text-xs uppercase tracking-wider transition-all shadow-lg shadow-sky-500/20 active:scale-95 cursor-pointer flex items-center justify-center gap-1"
              >
                {content.btnPayNow}
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
