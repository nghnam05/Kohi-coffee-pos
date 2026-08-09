'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

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
}) => {
  return (
    <AnimatePresence>
      {isTransferModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 select-none">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsTransferModalOpen(false)}
            className="absolute inset-0 bg-black/75 backdrop-blur-sm"
          />

          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="relative w-full max-w-2xl bg-[#FFFFFF] dark:bg-[#181B21] border border-[var(--border-color)] rounded-[var(--radius-lg)] p-5 sm:p-6 shadow-2xl z-10 max-h-[90vh] flex flex-col font-sans overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-4 mb-4 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[var(--brand-primary)]/10 text-[var(--brand-primary)] flex items-center justify-center border border-[var(--brand-primary)]/20">
                  <span className="material-symbols-outlined text-xl">table_restaurant</span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[var(--text-primary)] leading-tight">
                    Sơ đồ & Chọn bàn đổi
                  </h3>
                  <p className="text-xs font-medium text-[var(--text-secondary)] mt-0.5">
                    Chọn bàn trống bạn muốn chuyển đến. Hệ thống sẽ giữ nguyên giỏ hàng.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsTransferModalOpen(false)}
                className="w-8 h-8 rounded-full bg-[var(--bg-primary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-color)] flex items-center justify-center transition-colors"
              >
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            </div>

            {/* Minimap Legend */}
            <div className="flex flex-wrap items-center gap-4 text-xs mb-4 pb-3 border-b border-[var(--border-color)] shrink-0">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-emerald-500/20 border border-emerald-500/50 inline-block" />
                <span className="text-[var(--text-secondary)]">Bàn trống (Có thể chọn)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/40 inline-block" />
                <span className="text-[var(--text-secondary)]">Bàn đang có khách</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-[var(--accent)] inline-block shadow-sm" />
                <span className="text-[var(--text-primary)] font-semibold">
                  Bàn hiện tại của bạn
                </span>
              </div>
            </div>

            {/* Minimap Floor Grid Container */}
            <div className="flex-1 overflow-y-auto scrollbar-none space-y-4 pr-1">
              <div>
                <div className="flex items-center gap-2 mb-2.5">
                  <span className="material-symbols-outlined text-sm text-[var(--brand-primary)]">
                    storefront
                  </span>
                  <span className="text-[12px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                    Khu vực Trong Nhà (Main Hall)
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
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
                        className={`relative group p-3.5 rounded-[var(--radius-sm)] border flex flex-col items-center justify-between min-h-[96px] transition-all duration-200 ${
                          isCurrentTable
                            ? 'bg-[var(--accent)]/10 border-[var(--accent)] text-[var(--accent)] cursor-not-allowed opacity-90'
                            : isSelected
                            ? 'bg-[var(--brand-primary)]/15 border-[var(--brand-primary)] text-[var(--brand-primary)] ring-2 ring-[var(--brand-primary)]/30 scale-[1.02] shadow-md'
                            : isEmpty
                            ? 'bg-[var(--bg-primary)] border-[var(--border-color)] text-[var(--text-primary)] hover:border-[var(--brand-primary)] hover:bg-[var(--brand-primary)]/5 cursor-pointer'
                            : 'bg-red-500/5 border-red-500/20 text-red-400 opacity-60 cursor-not-allowed'
                        }`}
                      >
                        <div className="flex gap-1 mb-1 opacity-70">
                          <span className="w-1.5 h-1.5 rounded-full bg-current" />
                          <span className="w-1.5 h-1.5 rounded-full bg-current" />
                        </div>

                        <div className="text-center my-1">
                          <span className="text-[14px] font-bold block font-sans leading-tight">
                            {tItem.tableName}
                          </span>
                          <span className="text-[10px] font-medium block mt-0.5 opacity-80">
                            {isCurrentTable
                              ? 'Bàn của bạn'
                              : isEmpty
                              ? 'Trống'
                              : 'Đang có khách'}
                          </span>
                        </div>

                        <div className="flex gap-1 mt-1 opacity-70">
                          <span className="w-1.5 h-1.5 rounded-full bg-current" />
                          <span className="w-1.5 h-1.5 rounded-full bg-current" />
                        </div>

                        {isSelected && (
                          <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-[var(--brand-primary)] text-white flex items-center justify-center text-[10px] font-bold shadow-sm">
                            ✓
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Minimap Footer Actions */}
            <div className="pt-4 border-t border-[var(--border-color)] mt-4 flex items-center justify-end gap-3 shrink-0">
              <button
                onClick={() => setIsTransferModalOpen(false)}
                className="px-4 py-2.5 bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-[var(--radius-sm)] text-[13px] font-semibold transition-colors"
              >
                Hủy
              </button>

              <button
                onClick={handleTransferTable}
                disabled={!selectedTransferTableId || isTransferring}
                className="px-5 py-2.5 bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] text-white rounded-[var(--radius-sm)] text-[13px] font-semibold uppercase tracking-[0.02em] shadow-md transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2"
              >
                <span>{isTransferring ? 'Đang chuyển bàn...' : 'Xác nhận chuyển bàn'}</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
