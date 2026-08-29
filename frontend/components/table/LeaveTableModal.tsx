'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

type Lang = 'vi' | 'en' | 'zh';

interface LeaveTableModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  tableName?: string;
  lang?: Lang;
  isLeaving?: boolean;
}

export const LeaveTableModal: React.FC<LeaveTableModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  tableName = 'Bàn',
  lang = 'vi',
  isLeaving = false,
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 font-sans">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Modal Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="relative w-full max-w-sm bg-white dark:bg-[#131929] border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-2xl z-10 text-center"
          >
            {/* Content */}
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight">
              {lang === 'en'
                ? 'Leave table?'
                : lang === 'zh'
                ? '确认离开餐桌？'
                : 'Xác nhận rời bàn?'}
            </h3>

            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
              {lang === 'en'
                ? `Are you sure you want to leave ${tableName}?`
                : lang === 'zh'
                ? `您确定要离开 ${tableName} 吗？`
                : `Bạn có chắc chắn muốn rời ${tableName} không?`}
            </p>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-2.5 mt-6">
              <button
                type="button"
                onClick={onClose}
                disabled={isLeaving}
                className="w-full h-10 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-300 font-bold rounded-2xl text-xs transition-all active:scale-95 cursor-pointer disabled:opacity-50"
              >
                {lang === 'en' ? 'Cancel' : lang === 'zh' ? '取消' : 'Hủy'}
              </button>

              <button
                type="button"
                onClick={onConfirm}
                disabled={isLeaving}
                className="w-full h-10 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-2xl text-xs shadow-sm transition-all active:scale-95 cursor-pointer flex items-center justify-center disabled:opacity-50"
              >
                {isLeaving ? (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <span>{lang === 'en' ? 'Leave' : lang === 'zh' ? '离开' : 'Rời bàn'}</span>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
