'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { playMomoChime } from '../../app/utils/sound';
import { toast } from 'react-hot-toast';

interface BankPayModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  tableName?: string;
  totalAmount: number;
  customerName?: string;
  onSuccess?: () => void;
  apiBase?: string;
  orderStatus?: string;
  selectedItemIndexes?: number[];
  payerName?: string;
  selectedItemNames?: string[];
}

export const BankPayModal: React.FC<BankPayModalProps> = ({
  isOpen,
  onClose,
  orderId,
  tableName = 'Bàn',
  totalAmount,
  customerName,
  onSuccess,
  apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1',
  orderStatus,
  selectedItemIndexes,
  payerName,
  selectedItemNames,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasNotified, setHasNotified] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Bank Info (Default MB Bank, customizable via ENV)
  const bankId = process.env.NEXT_PUBLIC_BANK_ID || 'MB';
  const bankName = process.env.NEXT_PUBLIC_BANK_NAME || 'MB Bank (NHTMCP Quân Đội)';
  const accountNo = process.env.NEXT_PUBLIC_BANK_ACCOUNT_NO || '0123456789';
  const accountName = process.env.NEXT_PUBLIC_BANK_ACCOUNT_NAME || 'KOHI COFFEE';

  const shortCode = orderId ? `#${orderId.slice(-6).toUpperCase()}` : '';
  const effectivePayer = (payerName || customerName || '').trim();
  const payerMemo = effectivePayer ? ` ${effectivePayer.replace(/[^a-zA-Z0-9]/g, '')}`.toUpperCase() : '';
  const transferMemo = `KOHI ${tableName.replace(/\s+/g, '')} ${shortCode}${payerMemo}`.trim();

  const qrUrl = `https://img.vietqr.io/image/${bankId}-${accountNo}-compact2.png?amount=${totalAmount}&addInfo=${encodeURIComponent(
    transferMemo
  )}&accountName=${encodeURIComponent(accountName)}`;

  // Monitor orderStatus prop for paid update via real-time socket
  useEffect(() => {
    if (orderStatus === 'paid' && isOpen) {
      try {
        playMomoChime();
      } catch (e) {}
      toast.success('Xác nhận đã nhận tiền! Cảm ơn quý khách.');
      onClose();
      if (onSuccess) onSuccess();
    }
  }, [orderStatus, isOpen, onClose, onSuccess]);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(label);
    toast.success(`Đã sao chép ${label}!`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleNotifyPayment = async () => {
    if (orderStatus === 'pending') {
      toast.error('Đơn hàng đang chờ phục vụ duyệt. Vui lòng thanh toán sau khi đơn được duyệt.');
      return;
    }
    if (isProcessing || hasNotified) return;
    setIsProcessing(true);
    try {
      const isSplit = Array.isArray(selectedItemIndexes) && selectedItemIndexes.length > 0;
      const url = isSplit
        ? `${apiBase}/orders/${orderId}/notify-split-payment`
        : `${apiBase}/orders/${orderId}/notify-payment`;

      const body = isSplit
        ? JSON.stringify({
            amount: totalAmount,
            payerName: effectivePayer || 'Khách',
            itemIndexes: selectedItemIndexes,
            paymentMethod: 'bank_transfer',
          })
        : undefined;

      const res = await fetch(url, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        ...(body ? { body } : {}),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || 'Không thể gửi thông báo chuyển khoản.');
      }

      toast.success('Đã gửi thông báo chuyển khoản tới Nhân viên phục vụ!');
      setHasNotified(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Có lỗi xảy ra.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 font-sans select-none overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 15 }}
          transition={{ type: 'spring', stiffness: 380, damping: 26 }}
          className="relative w-full max-w-sm sm:max-w-md bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl z-10 overflow-hidden text-slate-900 dark:text-slate-100 my-auto"
        >
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-white/10 flex items-center justify-between bg-white dark:bg-[#0F172A]">
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-[#0284c7] dark:text-sky-400 block font-mono">
                Chuyển khoản Ngân hàng (VietQR)
              </span>
              <h3 className="text-base sm:text-lg font-black tracking-tight text-slate-900 dark:text-white">
                Thanh toán đơn hàng
              </h3>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white flex items-center justify-center transition-all cursor-pointer font-bold text-lg"
            >
              ×
            </button>
          </div>

          {/* Body */}
          <div className="p-4 sm:p-5 space-y-4">
            {/* Amount Banner */}
            <div className="p-3.5 bg-sky-500/15 border border-sky-500/30 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-[10.5px] font-extrabold text-slate-500 dark:text-slate-400 block uppercase">
                  {selectedItemIndexes && selectedItemIndexes.length > 0
                    ? `Thanh toán phần chọn (${selectedItemIndexes.length} món)`
                    : 'Tổng tiền thanh toán'}
                </span>
                <span className="text-xl sm:text-2xl font-black text-[#0284c7] dark:text-sky-400 font-mono">
                  {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(totalAmount)}
                </span>
              </div>
              <span className="px-2.5 py-1 bg-[#38BDF8] text-slate-950 font-black text-xs rounded-xl shadow-xs font-mono">
                {tableName}
              </span>
            </div>

            {/* Selected Items preview */}
            {selectedItemNames && selectedItemNames.length > 0 && (
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 text-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Món trong đợt thanh toán này:
                </span>
                <p className="font-semibold text-slate-800 dark:text-slate-200 line-clamp-2">
                  {selectedItemNames.join(', ')}
                </p>
              </div>
            )}

            {/* QR Code Container */}
            <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-white/10 text-center shadow-xs space-y-2">
              <div className="relative inline-block bg-white p-2 rounded-xl">
                <img
                  src={qrUrl}
                  alt="VietQR Payment Code"
                  className="w-44 h-44 sm:w-52 sm:h-52 mx-auto object-contain rounded-lg"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
                      `STK: ${accountNo} - NH: ${bankId} - TEN: ${accountName} - SOTIEN: ${totalAmount} - NOIDUNG: ${transferMemo}`
                    )}`;
                  }}
                />
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                Quét mã QR bằng ứng dụng ngân hàng bất kỳ để tự động điền số tiền và nội dung
              </p>
            </div>

            {/* Transfer Details Card */}
            <div className="p-3.5 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-white/10 space-y-2.5 text-xs">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/10 pb-2">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Ngân hàng</span>
                <span className="font-extrabold text-slate-900 dark:text-white">{bankName}</span>
              </div>

              <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/10 pb-2">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Chủ tài khoản</span>
                <span className="font-extrabold text-slate-900 dark:text-white uppercase">{accountName}</span>
              </div>

              <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/10 pb-2">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Số tài khoản</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-black text-slate-900 dark:text-white">{accountNo}</span>
                  <button
                    onClick={() => handleCopy(accountNo, 'Số tài khoản')}
                    className="px-2 py-0.5 bg-slate-200 hover:bg-[#3B82F6] dark:bg-slate-800 dark:hover:bg-[#3B82F6] text-slate-700 hover:text-white dark:text-slate-300 font-bold rounded-lg text-[10px] transition-all cursor-pointer"
                  >
                    {copiedField === 'Số tài khoản' ? 'Đã chép' : 'Sao chép'}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-0.5">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Nội dung CK</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-black text-[#0284c7] dark:text-sky-400 uppercase">
                    {transferMemo}
                  </span>
                  <button
                    onClick={() => handleCopy(transferMemo, 'Nội dung')}
                    className="px-2 py-0.5 bg-slate-200 hover:bg-[#3B82F6] dark:bg-slate-800 dark:hover:bg-[#3B82F6] text-slate-700 hover:text-white dark:text-slate-300 font-bold rounded-lg text-[10px] transition-all cursor-pointer"
                  >
                    {copiedField === 'Nội dung' ? 'Đã chép' : 'Sao chép'}
                  </button>
                </div>
              </div>
            </div>

            {/* Status Bar */}
            {orderStatus === 'pending' ? (
              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-center">
                <span className="text-[11px] font-extrabold text-amber-500 dark:text-amber-400 block">
                  Đơn hàng đang chờ phục vụ duyệt. Vui lòng thanh toán sau khi đơn được duyệt.
                </span>
              </div>
            ) : (
              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-center">
                <span className="text-[11px] font-extrabold text-amber-500 dark:text-amber-400 flex items-center justify-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                  Đang chờ Nhân viên phục vụ xác nhận tiền về...
                </span>
              </div>
            )}

            {/* Confirm Payment Notification Button */}
            <button
              onClick={handleNotifyPayment}
              disabled={isProcessing || hasNotified || orderStatus === 'pending'}
              className={`w-full py-3 text-white font-extrabold rounded-xl text-xs transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2 ${
                orderStatus === 'pending'
                  ? 'bg-slate-400 dark:bg-slate-700 opacity-60 cursor-not-allowed'
                  : hasNotified
                  ? 'bg-amber-500 hover:bg-amber-600 shadow-xs'
                  : 'bg-[#3B82F6] hover:bg-blue-600 disabled:opacity-50'
              }`}
            >
              {orderStatus === 'pending' ? (
                'Chờ phục vụ duyệt đơn...'
              ) : isProcessing ? (
                'Đang gửi...'
              ) : hasNotified ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                  Đã báo chuyển khoản • Chờ nhân viên xác nhận...
                </>
              ) : (
                'Xác nhận Đã chuyển khoản'
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
