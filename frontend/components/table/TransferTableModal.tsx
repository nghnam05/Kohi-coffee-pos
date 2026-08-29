'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatTableName } from '@/utils/format';

interface TableItem {
  _id: string;
  tableName: string;
  status: string;
}

interface TransferTableModalProps {
  isTransferModalOpen: boolean;
  setIsTransferModalOpen: (open: boolean) => void;
  tablesList: TableItem[];
  tableId: string;
  selectedTransferTableId: string;
  setSelectedTransferTableId: React.Dispatch<React.SetStateAction<string>>;
  handleTransferTable: () => void;
  isTransferring: boolean;
  lang?: 'vi' | 'en' | 'zh';
}

export const TransferTableModal: React.FC<TransferTableModalProps> = ({
  isTransferModalOpen,
  setIsTransferModalOpen,
  tablesList,
  tableId,
  selectedTransferTableId,
  setSelectedTransferTableId,
  handleTransferTable,
  isTransferring,
  lang = 'vi',
}) => {
  return (
    <AnimatePresence>
      {isTransferModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 select-none">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsTransferModalOpen(false)}
            className="fixed inset-0 bg-slate-950/60 dark:bg-slate-950/80 backdrop-blur-sm transition-opacity"
          />

          {/* Minimalist Modal Card */}
          <motion.div
            initial={{ scale: 0.96, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.96, opacity: 0, y: 10 }}
            transition={{ type: 'spring', stiffness: 450, damping: 32 }}
            className="relative w-full max-w-xl bg-white dark:bg-[#0D111A] border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 sm:p-7 shadow-2xl z-10 max-h-[90vh] flex flex-col font-sans text-left"
          >
            {/* Header */}
            <div className="flex items-start justify-between pb-4 border-b border-slate-100 dark:border-slate-800/80 shrink-0">
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white font-heading tracking-tight">
                  {lang === 'en' ? 'Select New Table' : lang === 'zh' ? '选择新桌位' : 'Chuyển sang bàn mới'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {lang === 'en'
                    ? 'Select an available table to move your current order.'
                    : lang === 'zh'
                    ? '选择空桌以转移当前订单。'
                    : 'Chọn bàn trống để chuyển đơn hàng hiện tại.'}
                </p>
              </div>

              <button
                onClick={() => setIsTransferModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-700 dark:hover:text-white flex items-center justify-center font-bold text-sm transition-all cursor-pointer"
                title="Đóng"
              >
                ✕
              </button>
            </div>

            {/* Minimal Legend Bar */}
            <div className="flex items-center gap-5 text-xs py-3 border-b border-slate-100 dark:border-slate-800/80 shrink-0 text-slate-600 dark:text-slate-400 font-medium">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                {lang === 'en' ? 'Available' : lang === 'zh' ? '空桌' : 'Bàn trống'}
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                {lang === 'en' ? 'Current Table' : lang === 'zh' ? '当前桌' : 'Bàn hiện tại'}
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-700" />
                {lang === 'en' ? 'Occupied' : lang === 'zh' ? '使用中' : 'Đang bận'}
              </span>
            </div>

            {/* Table Grid */}
            <div className="flex-1 overflow-y-auto py-4 scrollbar-none">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {tablesList.map((tItem) => {
                  const isCurrentTable = tItem._id === tableId;
                  const isSelected = selectedTransferTableId === tItem._id;
                  const isEmpty = tItem.status === 'empty';
                  const isOccupied = !isEmpty && !isCurrentTable;

                  return (
                    <button
                      key={tItem._id}
                      disabled={isOccupied || isCurrentTable}
                      onClick={() => {
                        if (isEmpty) setSelectedTransferTableId(tItem._id);
                      }}
                      className={`p-4 rounded-2xl border transition-all flex flex-col items-center justify-center gap-1.5 min-h-[92px] ${
                        isCurrentTable
                          ? 'bg-amber-50 dark:bg-amber-950/20 border-amber-300 dark:border-amber-800/60 text-amber-700 dark:text-amber-400 cursor-not-allowed'
                          : isSelected
                          ? 'bg-sky-50 dark:bg-sky-950/30 border-[#0284c7] dark:border-[#38BDF8] text-[#0284c7] dark:text-[#38BDF8] ring-2 ring-[#0284c7]/20 shadow-sm'
                          : isEmpty
                          ? 'bg-slate-50/60 hover:bg-white dark:bg-[#131824] dark:hover:bg-[#182030] border-slate-200/80 dark:border-slate-800 text-slate-800 dark:text-slate-200 hover:border-slate-300 dark:hover:border-slate-700 cursor-pointer'
                          : 'bg-slate-100/50 dark:bg-slate-900/40 border-slate-200/40 dark:border-slate-800/40 text-slate-400 dark:text-slate-600 cursor-not-allowed opacity-60'
                      }`}
                    >
                      <span className="text-sm font-extrabold tracking-tight">
                        {formatTableName(tItem.tableName, lang)}
                      </span>

                      <span className={`text-[11px] font-semibold ${
                        isCurrentTable
                          ? 'text-amber-600 dark:text-amber-400'
                          : isSelected
                          ? 'text-[#0284c7] dark:text-[#38BDF8]'
                          : isEmpty
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-slate-400 dark:text-slate-500'
                      }`}>
                        {isCurrentTable
                          ? (lang === 'en' ? 'Current Table' : lang === 'zh' ? '当前桌' : 'Bàn hiện tại')
                          : isSelected
                          ? (lang === 'en' ? 'Selected' : lang === 'zh' ? '已选择' : 'Đã chọn')
                          : isEmpty
                          ? (lang === 'en' ? 'Available' : lang === 'zh' ? '可选' : 'Có thể chọn')
                          : (lang === 'en' ? 'Occupied' : lang === 'zh' ? '使用中' : 'Đang bận')}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-end gap-2.5 shrink-0">
              <button
                onClick={() => setIsTransferModalOpen(false)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                {lang === 'en' ? 'Cancel' : lang === 'zh' ? '取消' : 'Hủy'}
              </button>

              <button
                onClick={handleTransferTable}
                disabled={!selectedTransferTableId || isTransferring}
                className="px-5 py-2.5 bg-[#0284c7] hover:bg-[#0369a1] dark:bg-[#38BDF8] dark:hover:bg-[#0284c7] text-white dark:text-slate-950 font-black rounded-xl text-xs tracking-wide transition-all shadow-md active:scale-95 disabled:opacity-40 cursor-pointer"
              >
                {isTransferring
                  ? (lang === 'en' ? 'Transferring...' : lang === 'zh' ? '正在换桌...' : 'Đang chuyển...')
                  : (lang === 'en' ? 'Confirm Transfer' : lang === 'zh' ? '确认换桌' : 'Xác nhận chuyển bàn')}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
