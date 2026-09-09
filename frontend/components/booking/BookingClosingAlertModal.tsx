'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface BookingClosingAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  reservationTimeStr: string;
  closingTimeStr: string;
  minutesUntilClosing: number;
  isSubmitting?: boolean;
  lang?: 'vi' | 'en' | 'zh';
}

export const BookingClosingAlertModal: React.FC<BookingClosingAlertModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  reservationTimeStr,
  closingTimeStr,
  minutesUntilClosing,
  isSubmitting = false,
  lang = 'vi',
}) => {
  if (!isOpen) return null;

  const content = {
    vi: {
      title: 'Thông Báo Giờ Đóng Cửa',
      subtitle: 'Thời gian nhận bàn gần sát giờ quán nghỉ',
      bookingTimeLabel: 'GIỜ BẠN CHỌN',
      closingTimeLabel: 'GIỜ ĐÓNG CỬA',
      remainingLabel: 'THỜI GIAN TRẢI NGHIỆM',
      remainingValue: `Còn khoảng ${minutesUntilClosing} phút`,
      warningText: `Kohi Coffee sẽ đóng cửa vào lúc ${closingTimeStr}. Thời gian nhận bàn bạn đã chọn (${reservationTimeStr}) cách giờ đóng cửa dưới 30 phút, do đó thời gian phục vụ và thưởng thức món sẽ có phần hạn chế.`,
      questionText: 'Bạn có muốn tiếp tục xác nhận đặt bàn ở khung giờ này không?',
      btnChangeTime: 'Chọn giờ khác',
      btnProceed: 'Tiếp tục đặt bàn',
      btnSubmitting: 'Đang gửi...',
    },
    en: {
      title: 'Store Closing Notice',
      subtitle: 'Reservation time is close to closing hours',
      bookingTimeLabel: 'YOUR TIME',
      closingTimeLabel: 'CLOSING TIME',
      remainingLabel: 'TIME REMAINING',
      remainingValue: `Approx. ${minutesUntilClosing} mins`,
      warningText: `Kohi Coffee will close at ${closingTimeStr}. Your chosen reservation time (${reservationTimeStr}) is less than 30 minutes before closing, so your dining and service time will be limited.`,
      questionText: 'Would you like to proceed with this booking time?',
      btnChangeTime: 'Choose Another Time',
      btnProceed: 'Proceed With Booking',
      btnSubmitting: 'Submitting...',
    },
    zh: {
      title: '打烊时间提示',
      subtitle: '入座时间临近本店打烊时间',
      bookingTimeLabel: '所选时间',
      closingTimeLabel: '打烊时间',
      remainingLabel: '剩余体验时间',
      remainingValue: `约剩余 ${minutesUntilClosing} 分钟`,
      warningText: `Kohi Coffee 将于 ${closingTimeStr} 正式打烊。您选择的入座时间 (${reservationTimeStr}) 距离打烊时间不足 30 分钟，堂食与点单时间将较为紧张。`,
      questionText: '您是否仍要在此时间段确认预订？',
      btnChangeTime: '更换其他时间',
      btnProceed: '继续确认预订',
      btnSubmitting: '提交中...',
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

        {/* Modal Card */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 15 }}
          transition={{ type: 'spring', stiffness: 380, damping: 28 }}
          className="relative w-full max-w-md rounded-3xl bg-white dark:bg-[#090D16] border border-amber-500/30 dark:border-amber-500/40 p-6 sm:p-7 shadow-2xl z-10 overflow-hidden"
        >
          {/* Subtle Top Accent Gradient */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-500 via-[#38BDF8] to-amber-500" />

          {/* Header */}
          <div className="flex items-start gap-4 mb-5">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/15 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/30 shadow-inner">
              <span className="material-symbols-outlined text-2xl animate-pulse">schedule</span>
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight leading-snug font-heading">
                {content.title}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-normal">
                {content.subtitle}
              </p>
            </div>
          </div>

          {/* Time Comparison Badges */}
          <div className="grid grid-cols-2 gap-2.5 mb-4 text-xs font-sans">
            <div className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-1">
                {content.bookingTimeLabel}
              </span>
              <span className="text-base font-black text-[#0284c7] dark:text-[#38BDF8] font-mono">
                {reservationTimeStr}
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-600 dark:text-amber-400 block mb-1">
                {content.closingTimeLabel}
              </span>
              <span className="text-base font-black text-amber-600 dark:text-amber-400 font-mono">
                {closingTimeStr}
              </span>
            </div>
          </div>

          {/* Remaining Warning Banner */}
          <div className="p-3.5 mb-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300 text-xs leading-relaxed">
            <div className="flex items-center gap-1.5 font-black text-amber-700 dark:text-amber-300 mb-1">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
              <span>{content.remainingValue}</span>
            </div>
            <p className="font-normal text-[12.5px] opacity-95">
              {content.warningText}
            </p>
            <p className="font-bold text-[12px] mt-2 text-slate-800 dark:text-white">
              {content.questionText}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 h-11 rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs uppercase tracking-wider transition-all cursor-pointer active:scale-95 disabled:opacity-50"
            >
              {content.btnChangeTime}
            </button>

            <button
              type="button"
              onClick={onConfirm}
              disabled={isSubmitting}
              className="flex-1 h-11 rounded-xl bg-[#38BDF8] hover:bg-sky-400 text-slate-950 font-black text-xs uppercase tracking-wider transition-all shadow-lg shadow-sky-500/20 active:scale-95 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1"
            >
              {isSubmitting ? content.btnSubmitting : content.btnProceed}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
