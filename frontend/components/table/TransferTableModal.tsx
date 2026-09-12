'use client';

import React, { useState, useMemo, useEffect } from 'react';
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

const ITEMS_PER_PAGE = 8; // 2 hàng x 4 cột chuẩn tỷ lệ vàng 2026

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
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [statusFilter, setStatusFilter] = useState<'all' | 'empty' | 'occupied'>('all');

  // Đếm số lượng theo trạng thái
  const emptyCount = useMemo(
    () => tablesList.filter((t) => t.status === 'empty' && t._id !== tableId).length,
    [tablesList, tableId]
  );
  const occupiedCount = useMemo(
    () => tablesList.filter((t) => t.status !== 'empty' && t._id !== tableId).length,
    [tablesList, tableId]
  );

  // Lọc danh sách bàn
  const filteredTables = useMemo(() => {
    return tablesList.filter((tItem) => {
      const isCurrentTable = tItem._id === tableId;
      const isEmpty = tItem.status === 'empty';

      if (statusFilter === 'empty') return isEmpty && !isCurrentTable;
      if (statusFilter === 'occupied') return !isEmpty && !isCurrentTable;
      return true;
    });
  }, [tablesList, statusFilter, tableId]);

  const totalPages = Math.max(1, Math.ceil(filteredTables.length / ITEMS_PER_PAGE));
  const validPage = Math.min(Math.max(1, currentPage), totalPages);

  // Tự động nhảy sang trang có bàn đang chọn khi mở modal hoặc thay đổi bàn chọn
  useEffect(() => {
    if (isTransferModalOpen && selectedTransferTableId) {
      const targetIndex = filteredTables.findIndex((t) => t._id === selectedTransferTableId);
      if (targetIndex !== -1) {
        const targetPage = Math.floor(targetIndex / ITEMS_PER_PAGE) + 1;
        setCurrentPage(targetPage);
      }
    } else if (isTransferModalOpen) {
      setCurrentPage(1);
    }
  }, [isTransferModalOpen, selectedTransferTableId, filteredTables]);

  // Danh sách bàn hiển thị trên trang hiện tại
  const paginatedTables = useMemo(() => {
    const startIndex = (validPage - 1) * ITEMS_PER_PAGE;
    return filteredTables.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredTables, validPage]);

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
            className="fixed inset-0 bg-slate-950/70 dark:bg-slate-950/85 backdrop-blur-sm transition-opacity"
          />

          {/* Minimalist Modal Card */}
          <motion.div
            initial={{ scale: 0.96, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.96, opacity: 0, y: 10 }}
            transition={{ type: 'spring', stiffness: 450, damping: 32 }}
            className="relative w-full max-w-xl bg-white dark:bg-[#131929] border border-slate-200 dark:border-white/10 rounded-3xl p-5 sm:p-7 shadow-2xl z-10 max-h-[92vh] flex flex-col font-sans text-left"
          >
            {/* Header */}
            <div className="flex items-start justify-between pb-4 border-b border-slate-200 dark:border-white/10 shrink-0">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white font-heading tracking-tight">
                  {lang === 'en' ? 'Select New Table' : lang === 'zh' ? '选择新桌位' : 'Chuyển sang bàn mới'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-normal">
                  {lang === 'en'
                    ? 'Select an available table to move your current order.'
                    : lang === 'zh'
                    ? '选择空桌以转移当前订单。'
                    : 'Chọn bàn trống để chuyển đơn hàng hiện tại.'}
                </p>
              </div>

              <button
                onClick={() => setIsTransferModalOpen(false)}
                className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white flex items-center justify-center font-extrabold text-sm transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-[#38BDF8] focus-visible:outline-none"
                title="Đóng"
                aria-label="Đóng modal"
              >
                ✕
              </button>
            </div>

            {/* Filter & Legend Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 py-3 border-b border-slate-200 dark:border-white/10 shrink-0 text-xs text-slate-500 dark:text-slate-400">
              {/* Status Filter Tabs */}
              <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-white/5 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => {
                    setStatusFilter('all');
                    setCurrentPage(1);
                  }}
                  className={`px-2.5 py-1 rounded-lg font-extrabold text-[11px] transition-all cursor-pointer ${
                    statusFilter === 'all'
                      ? 'bg-white dark:bg-[#090D16] text-[#0284c7] dark:text-[#38BDF8] shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {lang === 'en' ? 'All' : lang === 'zh' ? '全部' : 'Tất cả'} ({tablesList.length})
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setStatusFilter('empty');
                    setCurrentPage(1);
                  }}
                  className={`px-2.5 py-1 rounded-lg font-extrabold text-[11px] transition-all cursor-pointer ${
                    statusFilter === 'empty'
                      ? 'bg-white dark:bg-[#090D16] text-emerald-600 dark:text-emerald-400 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {lang === 'en' ? 'Available' : lang === 'zh' ? '空桌' : 'Bàn trống'} ({emptyCount})
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setStatusFilter('occupied');
                    setCurrentPage(1);
                  }}
                  className={`px-2.5 py-1 rounded-lg font-extrabold text-[11px] transition-all cursor-pointer ${
                    statusFilter === 'occupied'
                      ? 'bg-white dark:bg-[#090D16] text-slate-900 dark:text-slate-200 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {lang === 'en' ? 'Occupied' : lang === 'zh' ? '使用中' : 'Đang bận'} ({occupiedCount})
                </button>
              </div>

              {/* Minimal Legend Indicators */}
              <div className="flex items-center gap-4 text-[11px] font-normal">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  {lang === 'en' ? 'Available' : lang === 'zh' ? '空桌' : 'Trống'}
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  {lang === 'en' ? 'Current' : lang === 'zh' ? '当前' : 'Hiện tại'}
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-slate-400 dark:bg-slate-600" />
                  {lang === 'en' ? 'Busy' : lang === 'zh' ? '占' : 'Bận'}
                </span>
              </div>
            </div>

            {/* Table Grid (Custom Smooth Scrollbar & Responsive) */}
            <div className="flex-1 overflow-y-auto py-3 pr-1 max-h-[300px] sm:max-h-[340px] scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700 hover:scrollbar-thumb-slate-400 dark:hover:scrollbar-thumb-slate-600 scrollbar-track-transparent">
              {paginatedTables.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-400 dark:text-slate-500 font-normal">
                  {lang === 'en' ? 'No matching tables found.' : 'Không có bàn nào phù hợp với bộ lọc.'}
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {paginatedTables.map((tItem) => {
                    const isCurrentTable = tItem._id === tableId;
                    const isSelected = selectedTransferTableId === tItem._id;
                    const isEmpty = tItem.status === 'empty';
                    const isOccupied = !isEmpty && !isCurrentTable;

                    return (
                      <button
                        key={tItem._id}
                        type="button"
                        disabled={isOccupied || isCurrentTable}
                        onClick={() => {
                          if (isEmpty) setSelectedTransferTableId(tItem._id);
                        }}
                        className={`p-3.5 rounded-2xl border transition-all flex flex-col items-center justify-center gap-1.5 min-h-[92px] focus-visible:ring-2 focus-visible:ring-[#38BDF8] focus-visible:outline-none ${
                          isCurrentTable
                            ? 'bg-amber-500/10 border-amber-500/40 text-amber-500 dark:text-amber-400 cursor-not-allowed'
                            : isSelected
                            ? 'bg-[#38BDF8]/15 border-[#38BDF8] text-[#0284c7] dark:text-[#38BDF8] ring-2 ring-[#38BDF8]/40 shadow-sm shadow-[#38BDF8]/20'
                            : isEmpty
                            ? 'bg-slate-50 hover:bg-slate-100 dark:bg-white/5 dark:hover:bg-white/10 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white hover:border-[#38BDF8]/50 active:scale-[0.98] cursor-pointer'
                            : 'bg-slate-100/60 dark:bg-white/[0.02] border-slate-200/50 dark:border-white/5 text-slate-400 dark:text-slate-500 cursor-not-allowed opacity-50'
                        }`}
                      >
                        <span className="text-sm font-extrabold tracking-tight">
                          {formatTableName(tItem.tableName, lang)}
                        </span>

                        <span
                          className={`text-[11px] font-extrabold ${
                            isCurrentTable
                              ? 'text-amber-500 dark:text-amber-400'
                              : isSelected
                              ? 'text-[#0284c7] dark:text-[#38BDF8]'
                              : isEmpty
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-slate-400 dark:text-slate-500'
                          }`}
                        >
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
              )}
            </div>

            {/* Pagination Controls (Khi có nhiều hơn 1 trang) */}
            {totalPages > 1 && (
              <div className="pt-3 pb-1 border-t border-slate-200 dark:border-white/10 flex items-center justify-between shrink-0 text-xs">
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-normal">
                  {lang === 'en'
                    ? `Showing ${(validPage - 1) * ITEMS_PER_PAGE + 1}-${Math.min(
                        validPage * ITEMS_PER_PAGE,
                        filteredTables.length
                      )} of ${filteredTables.length} tables`
                    : `Hiển thị ${(validPage - 1) * ITEMS_PER_PAGE + 1}-${Math.min(
                        validPage * ITEMS_PER_PAGE,
                        filteredTables.length
                      )} / ${filteredTables.length} bàn`}
                </span>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={validPage === 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 rounded-lg font-extrabold text-xs transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer focus-visible:ring-2 focus-visible:ring-[#38BDF8] focus-visible:outline-none"
                  >
                    ‹ {lang === 'en' ? 'Prev' : 'Trước'}
                  </button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                    <button
                      key={pageNum}
                      type="button"
                      onClick={() => setCurrentPage(pageNum)}
                      className={`w-7 h-7 rounded-lg font-extrabold text-xs transition-all cursor-pointer flex items-center justify-center focus-visible:ring-2 focus-visible:ring-[#38BDF8] focus-visible:outline-none ${
                        validPage === pageNum
                          ? 'bg-[#38BDF8] text-[#090D16] shadow-xs'
                          : 'bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {pageNum}
                    </button>
                  ))}

                  <button
                    type="button"
                    disabled={validPage === totalPages}
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 rounded-lg font-extrabold text-xs transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer focus-visible:ring-2 focus-visible:ring-[#38BDF8] focus-visible:outline-none"
                  >
                    {lang === 'en' ? 'Next' : 'Sau'} ›
                  </button>
                </div>
              </div>
            )}

            {/* Footer Buttons */}
            <div className="pt-3.5 border-t border-slate-200 dark:border-white/10 flex items-center justify-end gap-2.5 shrink-0">
              <button
                type="button"
                onClick={() => setIsTransferModalOpen(false)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-medium transition-all cursor-pointer min-h-[44px] focus-visible:ring-2 focus-visible:ring-[#38BDF8] focus-visible:outline-none"
              >
                {lang === 'en' ? 'Cancel' : lang === 'zh' ? '取消' : 'Hủy bỏ'}
              </button>

              <button
                type="button"
                onClick={handleTransferTable}
                disabled={!selectedTransferTableId || isTransferring}
                className="px-5 py-2.5 bg-[#38BDF8] hover:bg-[#0284c7] text-[#090D16] hover:text-white font-bold rounded-xl text-xs tracking-wide transition-all shadow-md active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer min-h-[44px] focus-visible:ring-2 focus-visible:ring-[#38BDF8] focus-visible:outline-none"
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
