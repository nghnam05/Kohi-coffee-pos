'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { playMomoChime } from '../../app/utils/sound';
import { toast } from 'react-hot-toast';
import { CancelOrderModal } from './CancelOrderModal';

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
  apiBase = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1').trim().replace(/[\r\n\t]+/g, '').replace(/\/+$/, ''),
  orderStatus,
  selectedItemIndexes,
  payerName,
  selectedItemNames,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasNotified, setHasNotified] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isCancelConfirmOpen, setIsCancelConfirmOpen] = useState(false);

  const handleCancelOrder = async (confirmed?: boolean | React.MouseEvent) => {
    if (isCancelling || !orderId) return;
    if (confirmed !== true) {
      setIsCancelConfirmOpen(true);
      return;
    }
    setIsCancelling(true);
    try {
      const res = await fetch(`${apiBase}/orders/${orderId}/cancel`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Không thể hủy đơn hàng.');
      }
      toast.success('Đã hủy đơn hàng thành công!');
      setIsCancelConfirmOpen(false);
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Lỗi khi hủy đơn hàng.');
    } finally {
      setIsCancelling(false);
    }
  };

  // Bank Info (Default MB Bank, customizable via ENV)
  const bankId = process.env.NEXT_PUBLIC_BANK_ID || 'MB';
  const bankName = process.env.NEXT_PUBLIC_BANK_NAME || 'MB Bank (NHTMCP Quân Đội)';
  const accountNo = process.env.NEXT_PUBLIC_BANK_ACCOUNT_NO || '0336218760';
  const accountName = process.env.NEXT_PUBLIC_BANK_ACCOUNT_NAME || 'NGUYEN HOAI NAM';
  const customQrImage = process.env.NEXT_PUBLIC_BANK_CUSTOM_QR_IMAGE || '/images/qr.jpg';

  // Format table name cleanly to avoid duplicates like "Bàn Bàn số 1"
  const displayTableName = tableName
    ? tableName.replace(/^Bàn\s+Bàn\s*/i, 'Bàn ').replace(/^Table\s+Table\s*/i, 'Table ').trim()
    : 'Bàn';

  // Sanitize Vietnamese diacritics for bank transfer memo
  const sanitizeBankMemo = (str: string) => {
    return str
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D')
      .replace(/[^a-zA-Z0-9]/g, '')
      .toUpperCase();
  };

  const memoTable = sanitizeBankMemo(displayTableName.replace(/^(Bàn|Table)\s*/i, 'BAN '));
  const shortCode = orderId ? `#${orderId.slice(-6).toUpperCase()}` : '';
  const effectivePayer = (payerName || customerName || '').trim();
  const payerMemo = effectivePayer ? ` ${sanitizeBankMemo(effectivePayer)}` : '';
  const transferMemo = `KOHI ${memoTable} ${shortCode}${payerMemo}`.trim();

  const qrUrl = customQrImage || `https://img.vietqr.io/image/${bankId}-${accountNo}-compact2.png?amount=${totalAmount}&addInfo=${encodeURIComponent(
    transferMemo
  )}&accountName=${encodeURIComponent(accountName)}`;

  // Monitor orderStatus prop for paid update via real-time socket
  useEffect(() => {
    if (orderStatus === 'paid' && isOpen) {
      try {
        playMomoChime();
      } catch (e) { }
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

  const [showManualDetails, setShowManualDetails] = useState(true);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center font-sans select-none overflow-y-auto sm:p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm"
        />

        {/* Modal / Bottom Sheet Window */}
        <motion.div
          initial={{ y: '100%', opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 28, stiffness: 350 }}
          className="relative w-full max-w-sm sm:max-w-xl lg:max-w-3xl bg-[#F9FAFB] dark:bg-[#0E121B] border-t sm:border border-slate-200/80 dark:border-white/10 rounded-t-3xl sm:rounded-3xl shadow-2xl z-10 overflow-hidden text-slate-900 dark:text-slate-100 max-h-[94vh] flex flex-col"
        >
          {/* Mobile Drag Indicator */}
          <div className="sm:hidden flex justify-center pt-2.5 pb-1 shrink-0">
            <span className="w-10 h-1 rounded-full bg-slate-300 dark:bg-slate-700" />
          </div>

          {/* Header */}
          <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-200/80 dark:border-white/10 flex items-center justify-between bg-white dark:bg-[#0E121B] shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-[#0284c7] dark:text-[#38BDF8]">
                <span className="material-symbols-outlined text-lg">qr_code_scanner</span>
              </div>
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#0284c7] dark:text-[#38BDF8] block font-mono">
                  Chuyển khoản Ngân hàng
                </span>
                <h3 className="text-base sm:text-lg font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
                  Thanh toán hóa đơn • {displayTableName}
                </h3>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white flex items-center justify-center transition-all cursor-pointer font-extrabold text-lg"
              title="Đóng"
            >
              ×
            </button>
          </div>

          {/* Body (Scrollable with Desktop 2-Column Split) */}
          <div className="p-4 sm:p-6 overflow-y-auto scrollbar-thin flex-1">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 items-start">
              {/* Left Column: VietQR Hub (lg:col-span-5) */}
              <div className="lg:col-span-5 bg-white dark:bg-[#131929] rounded-2xl border border-slate-200/80 dark:border-white/10 p-4 text-center shadow-xs flex flex-col items-center justify-center gap-3">
                <div className="relative inline-block bg-white p-2.5 rounded-2xl border border-slate-200/80 shadow-xs">
                  <img
                    src={qrUrl}
                    alt="VietQR Payment Code"
                    className="w-48 sm:w-56 h-auto max-h-60 mx-auto object-contain rounded-xl"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = `https://img.vietqr.io/image/${bankId}-${accountNo}-compact2.png?amount=${totalAmount}&addInfo=${encodeURIComponent(
                        transferMemo
                      )}&accountName=${encodeURIComponent(accountName)}`;
                    }}
                  />
                </div>

                <div className="space-y-1 max-w-xs">
                  <p className="text-xs font-extrabold text-slate-800 dark:text-slate-200">
                    Quét bằng ứng dụng Ngân hàng
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-normal">
                    Tự động điền số tài khoản, số tiền và nội dung hóa đơn chính xác 100%.
                  </p>
                </div>


              </div>

              {/* Right Column: Order & Transfer Details (lg:col-span-7) */}
              <div className="lg:col-span-7 space-y-3.5">
                {/* Amount Banner */}
                <div className="p-4 bg-gradient-to-r from-sky-500/15 via-cyan-500/10 to-transparent border border-sky-500/30 rounded-2xl flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-normal text-slate-500 dark:text-slate-400 block uppercase tracking-wider">
                      {selectedItemIndexes && selectedItemIndexes.length > 0
                        ? `Thanh toán phần chọn (${selectedItemIndexes.length} món)`
                        : 'Tổng tiền thanh toán'}
                    </span>
                    <span className="text-2xl sm:text-3xl font-extrabold text-[#0284c7] dark:text-[#38BDF8] font-mono tracking-tight">
                      {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(totalAmount)}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="px-3 py-1 bg-[#38BDF8] text-slate-950 font-extrabold text-xs rounded-xl shadow-xs font-mono inline-block">
                      {displayTableName}
                    </span>
                    {shortCode && (
                      <span className="text-[10px] font-mono text-slate-400 block mt-1 font-normal">
                        Đơn: {shortCode}
                      </span>
                    )}
                  </div>
                </div>

                {/* Selected Items preview */}
                {selectedItemNames && selectedItemNames.length > 0 && (
                  <div className="p-3 rounded-2xl bg-white dark:bg-[#131929] border border-slate-200/80 dark:border-white/10 text-xs">
                    <span className="text-[10px] font-normal uppercase tracking-wider text-slate-400 block mb-1">
                      Món trong đợt thanh toán này:
                    </span>
                    <p className="font-normal text-slate-800 dark:text-slate-200 line-clamp-2 leading-relaxed">
                      {selectedItemNames.join(', ')}
                    </p>
                  </div>
                )}

                {/* Manual Transfer Details Card */}
                <div className="bg-white dark:bg-[#131929] rounded-2xl border border-slate-200/80 dark:border-white/10 overflow-hidden text-xs shadow-xs">
                  <div className="px-3.5 py-2.5 bg-slate-50 dark:bg-white/5 border-b border-slate-200/60 dark:border-white/10 flex items-center justify-between">
                    <span className="text-[10.5px] font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                      Thông tin chuyển khoản thủ công
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowManualDetails((prev) => !prev)}
                      className="text-[10px] text-[#0284c7] dark:text-[#38BDF8] font-extrabold cursor-pointer"
                    >
                      {showManualDetails ? 'Thu gọn ▲' : 'Mở rộng ▼'}
                    </button>
                  </div>

                  {showManualDetails && (
                    <div className="p-3.5 space-y-2.5">
                      <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-2">
                        <span className="text-slate-500 dark:text-slate-400 font-normal text-[11px]">Ngân hàng</span>
                        <span className="font-extrabold text-slate-900 dark:text-white text-xs">{bankName}</span>
                      </div>

                      <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-2">
                        <span className="text-slate-500 dark:text-slate-400 font-normal text-[11px]">Chủ tài khoản</span>
                        <span className="font-extrabold text-slate-900 dark:text-white uppercase text-xs">{accountName}</span>
                      </div>

                      <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-2">
                        <span className="text-slate-500 dark:text-slate-400 font-normal text-[11px]">Số tài khoản</span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-extrabold text-slate-900 dark:text-white text-sm">{accountNo}</span>
                          <button
                            type="button"
                            onClick={() => handleCopy(accountNo, 'Số tài khoản')}
                            className="h-8 px-3 bg-slate-100 hover:bg-[#0284c7] dark:bg-slate-800 dark:hover:bg-[#38BDF8] text-slate-700 hover:text-white dark:text-slate-300 dark:hover:text-slate-950 font-extrabold rounded-lg text-xs transition-all active:scale-95 cursor-pointer flex items-center gap-1 shrink-0"
                            title="Sao chép số tài khoản"
                          >
                            <span className="material-symbols-outlined text-sm">
                              {copiedField === 'Số tài khoản' ? 'check' : 'content_copy'}
                            </span>
                            <span>{copiedField === 'Số tài khoản' ? 'Đã chép' : 'Sao chép'}</span>
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-0.5">
                        <span className="text-slate-500 dark:text-slate-400 font-normal text-[11px]">Nội dung CK</span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-extrabold text-[#0284c7] dark:text-[#38BDF8] uppercase text-xs">
                            {transferMemo}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopy(transferMemo, 'Nội dung')}
                            className="h-8 px-3 bg-slate-100 hover:bg-[#0284c7] dark:bg-slate-800 dark:hover:bg-[#38BDF8] text-slate-700 hover:text-white dark:text-slate-300 dark:hover:text-slate-950 font-extrabold rounded-lg text-xs transition-all active:scale-95 cursor-pointer flex items-center gap-1 shrink-0"
                            title="Sao chép nội dung chuyển khoản"
                          >
                            <span className="material-symbols-outlined text-sm">
                              {copiedField === 'Nội dung' ? 'check' : 'content_copy'}
                            </span>
                            <span>{copiedField === 'Nội dung' ? 'Đã chép' : 'Sao chép'}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Status Bar */}
                {orderStatus === 'pending' ? (
                  <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-center">
                    <span className="text-xs font-extrabold text-amber-600 dark:text-amber-400 block">
                      Đơn hàng đang chờ phục vụ duyệt. Vui lòng thanh toán sau khi đơn được duyệt.
                    </span>
                  </div>
                ) : (
                  <div className="p-3 bg-amber-500/10 border border-amber-500/25 rounded-2xl text-center">
                    <span className="text-xs font-extrabold text-amber-700 dark:text-amber-300 flex items-center justify-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                      Đang chờ Nhân viên phục vụ xác nhận tiền về...
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sticky Footer: Always Visible Above the Fold */}
          <div className="px-4 sm:px-6 py-3 sm:py-4 bg-white dark:bg-[#0E121B] border-t border-slate-200/80 dark:border-white/10 shrink-0 space-y-2 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-lg">
            {/* Confirm Payment Notification Button */}
            <button
              type="button"
              onClick={handleNotifyPayment}
              disabled={isProcessing || hasNotified || orderStatus === 'pending'}
              className={`w-full h-12 text-white font-extrabold rounded-2xl text-xs sm:text-sm uppercase tracking-wider transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2 shadow-md ${orderStatus === 'pending'
                  ? 'bg-slate-400 dark:bg-slate-700 opacity-60 cursor-not-allowed'
                  : hasNotified
                    ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/20'
                    : 'bg-[#0284c7] hover:bg-[#0369a1] shadow-sky-500/20'
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
                <>
                  <span className="material-symbols-outlined text-lg">check_circle</span>
                  <span>Xác nhận Đã chuyển khoản</span>
                </>
              )}
            </button>

            {/* Cancel Pending Order Button */}
            {orderStatus === 'pending' && (
              <button
                type="button"
                onClick={handleCancelOrder}
                disabled={isCancelling}
                className="w-full h-10 bg-rose-500/10 hover:bg-rose-500/20 active:bg-rose-500/30 text-rose-600 dark:text-rose-400 font-extrabold rounded-xl text-xs transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1.5 border border-rose-500/20 disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-base">close</span>
                <span>{isCancelling ? 'Đang hủy đơn...' : 'Hủy đơn hàng này'}</span>
              </button>
            )}
          </div>
        </motion.div>
      </div>

      {/* Cancel Order Confirmation Modal */}
      <CancelOrderModal
        isOpen={isCancelConfirmOpen}
        onClose={() => setIsCancelConfirmOpen(false)}
        onConfirm={() => handleCancelOrder(true)}
        orderCode={shortCode}
        orderTotal={totalAmount}
        tableName={displayTableName}
        isCancelling={isCancelling}
      />
    </AnimatePresence>
  );
};
