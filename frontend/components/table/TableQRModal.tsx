'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Table {
  _id?: string;
  tableName?: string;
  qrToken?: string;
}

interface TableQRModalProps {
  isOpen: boolean;
  onClose: () => void;
  table: Table | null;
  lang?: 'vi' | 'en' | 'zh';
}

export const TableQRModal: React.FC<TableQRModalProps> = ({
  isOpen,
  onClose,
  table,
  lang = 'vi',
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !table) return null;

  const tableId = table._id || '';
  const tableUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/table/${tableId}${table.qrToken ? `?token=${table.qrToken}` : ''}`
    : `http://localhost:3000/table/${tableId}`;

  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(tableUrl)}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(tableUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="table-qr-modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/75 backdrop-blur-md p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-sm bg-white dark:bg-[#131929] rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-800 overflow-hidden relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Accent Gradient */}
            <div className="h-1.5 w-full bg-gradient-to-r from-[#3AA6FF] via-[#5B9EFF] to-[#3AA6FF]" />

            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-30 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white flex items-center justify-center transition-all cursor-pointer active:scale-95"
              title={lang === 'en' ? 'Close' : lang === 'zh' ? '关闭' : 'Đóng'}
            >
              <span className="material-symbols-outlined text-lg">close</span>
            </button>

            <div className="p-6 sm:p-7 flex flex-col items-center text-center">
              {/* Header Badge */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#3AA6FF]/10 text-[#3AA6FF] text-xs font-bold uppercase tracking-wider mb-2">
                <span className="material-symbols-outlined text-sm">qr_code_2</span>
                <span>{lang === 'en' ? 'Table Location QR' : lang === 'zh' ? '桌位二维码' : 'Mã QR Vị trí Bàn'}</span>
              </div>

              {/* Table Name */}
              <h2 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white font-heading">
                {table.tableName || (lang === 'en' ? 'Reserved Table' : lang === 'zh' ? '预订桌位' : 'Bàn đặt')}
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 font-sans">
                {lang === 'en'
                  ? 'Scan the QR code below to view menu and order directly'
                  : lang === 'zh'
                  ? '扫描下方二维码打开菜单并直接点餐'
                  : 'Quét mã bên dưới để mở thực đơn và gọi món trực tiếp'}
              </p>

              {/* QR Code Display Container */}
              <div className="my-5 p-4 bg-white rounded-2xl border border-gray-200 dark:border-gray-700 shadow-inner flex flex-col items-center justify-center relative group">
                <img
                  src={qrImageUrl}
                  alt={`Mã QR ${table.tableName}`}
                  className="w-52 h-52 object-contain rounded-lg"
                />
                <span className="text-[10px] font-mono text-gray-400 mt-2 font-medium">
                  {table.tableName} • Kohi Coffee
                </span>
              </div>

              {/* Helper notice */}
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-sans mb-5 px-2">
                {lang === 'en'
                  ? 'Friends at your table can scan this QR code to order together in real-time.'
                  : lang === 'zh'
                  ? '同桌好友可扫描此二维码实时共同加购商品。'
                  : 'Bạn bè cùng bàn có thể quét mã QR này để cùng chọn món vào giỏ hàng nhóm realtime.'}
              </p>

              {/* Action Buttons */}
              <div className="w-full space-y-2.5">
                <button
                  onClick={handleCopy}
                  className="w-full py-3 px-4 bg-[#3AA6FF] hover:bg-[#2892eb] text-white text-xs font-bold rounded-xl shadow-md transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer font-sans"
                >
                  <span className="material-symbols-outlined text-base">
                    {copied ? 'check' : 'content_copy'}
                  </span>
                  <span>
                    {copied
                      ? (lang === 'en' ? 'Link Copied!' : lang === 'zh' ? '已复制链接！' : 'Đã sao chép liên kết!')
                      : (lang === 'en' ? 'Copy Table Link' : lang === 'zh' ? '复制桌位链接' : 'Sao chép liên kết bàn')}
                  </span>
                </button>

                <button
                  onClick={onClose}
                  className="w-full py-2.5 px-4 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs font-bold rounded-xl transition-all active:scale-95 cursor-pointer font-sans"
                >
                  {lang === 'en' ? 'Close' : lang === 'zh' ? '关闭' : 'Đóng'}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
