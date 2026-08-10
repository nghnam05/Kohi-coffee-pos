'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Table {
  _id: string;
  tableName: string;
  status: string;
}

interface NamePromptModalProps {
  mounted: boolean;
  isNamePromptOpen: boolean;
  nameInputRef: React.RefObject<HTMLInputElement>;
  nameInput: string;
  setNameInput: (val: string) => void;
  handleConfirmName: () => void;
  table: Table | null;
}

export const NamePromptModal: React.FC<NamePromptModalProps> = ({
  mounted,
  isNamePromptOpen,
  nameInputRef,
  nameInput,
  setNameInput,
  handleConfirmName,
  table,
}) => {
  return (
    <AnimatePresence>
      {mounted && isNamePromptOpen && (
        <motion.div
          key="name-prompt-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-md p-4"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 24 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-md bg-white dark:bg-[#181B21] rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden"
          >
            {/* Top accent bar */}
            <div className="h-1 w-full bg-gradient-to-r from-[#3AA6FF] via-[#5B9EFF] to-[#3AA6FF]" />

            <div className="p-8 flex flex-col gap-6">
              {/* Branding */}
              <div>
                <p className="text-[11px] font-semibold tracking-[0.12em] uppercase text-[var(--brand-primary)] font-sans mb-2">
                  Kohi Coffee &amp; Pastry
                </p>
                <h2 className="text-[24px] font-bold text-[var(--text-primary)] leading-tight font-sans">
                  Bạn tên gì?
                </h2>
                <p className="text-[13.5px] text-[var(--text-secondary)] mt-2 leading-relaxed font-sans">
                  Nhập tên để nhân viên gọi món dễ phân biệt khi phục vụ theo nhóm. Không bắt buộc.
                </p>
              </div>

              {/* Input */}
              <div className="flex flex-col gap-3">
                <input
                  ref={nameInputRef}
                  id="customer-name-input"
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleConfirmName()}
                  placeholder="Ví dụ: Anh Minh, Nhóm A, Cô Lan..."
                  maxLength={40}
                  className="w-full px-4 py-3 text-[15px] font-normal bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-[var(--text-primary)] placeholder-gray-400 outline-none focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[var(--brand-primary)]/20 transition-all font-sans"
                />

                {/* Action buttons */}
                <button
                  id="confirm-name-btn"
                  onClick={handleConfirmName}
                  className="w-full h-[52px] uiverse-btn text-white text-[14px] font-bold uppercase tracking-[0.04em] rounded-xl transition-all active:scale-[0.98] shadow-md shadow-[#3AA6FF]/30 font-sans"
                >
                  {nameInput.trim() ? `Xác nhận — ${nameInput.trim()}` : 'Bắt đầu gọi món'}
                </button>

                <button
                  id="skip-name-btn"
                  onClick={handleConfirmName}
                  className="w-full h-10 text-[13px] font-medium text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors font-sans"
                >
                  Bỏ qua
                </button>
              </div>

              {/* Table info */}
              {table && (
                <p className="text-[11px] text-[var(--text-tertiary)] text-center font-sans border-t border-gray-100 dark:border-gray-800 pt-4">
                  {table.tableName}
                </p>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
