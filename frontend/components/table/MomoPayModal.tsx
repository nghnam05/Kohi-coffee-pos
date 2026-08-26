'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { playMomoChime } from '../../app/utils/sound';
import { toast } from 'react-hot-toast';

interface MomoPayModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  tableName?: string;
  totalAmount: number;
  customerName?: string;
  onSuccess?: () => void;
  apiBase?: string;
}

export const MomoPayModal: React.FC<MomoPayModalProps> = ({
  isOpen,
  onClose,
  orderId,
  tableName = 'Bàn',
  totalAmount,
  customerName = 'Khách',
  onSuccess,
  apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1',
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSimulatePayment = async () => {
    if (isProcessing || isSuccess) return;
    setIsProcessing(true);

    try {
      // 1. Simulate 1.2s API / network response delay
      await new Promise((resolve) => setTimeout(resolve, 1200));

      const res = await fetch(`${apiBase}/orders/${orderId}/pay`, {
        method: 'PATCH',
      });

      if (!res.ok) {
        throw new Error('Không thể kết nối cổng giả lập MoMo.');
      }

      setIsSuccess(true);
      try {
        playMomoChime();
      } catch (e) {}

      toast.success('Thanh toán MoMo thành công! Đơn hàng đã được xác nhận.');

      setTimeout(() => {
        setIsProcessing(false);
        setIsSuccess(false);
        onClose();
        if (onSuccess) onSuccess();
      }, 1800);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Lỗi khi thanh toán giả lập.');
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  const shortCode = orderId ? `#${orderId.slice(-6).toUpperCase()}` : '';
  const qrUrl = `https://img.vietqr.io/image/MB-0123456789-compact2.png?amount=${totalAmount}&addInfo=${encodeURIComponent(
    `KOHI MOMO ${tableName} ${shortCode}`
  )}`;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 font-sans select-none">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={isProcessing ? undefined : onClose}
          className="absolute inset-0 bg-black/75 backdrop-blur-sm"
        />

        {/* Modal Card */}
        <motion.div
          initial={{ scale: 0.92, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.92, opacity: 0, y: 20 }}
          transition={{ type: 'spring', stiffness: 400, damping: 28 }}
          className="relative w-full max-w-sm bg-[#FFFFFF] dark:bg-[#121620] border border-pink-500/20 dark:border-pink-500/30 rounded-3xl shadow-2xl z-10 overflow-hidden text-center"
        >
          {/* Header MoMo Pink */}
          <div className="bg-gradient-to-r from-[#A50064] via-[#D82D8B] to-[#A50064] p-5 text-white relative">
            <button
              onClick={onClose}
              disabled={isProcessing}
              className="absolute top-3.5 right-3.5 w-7 h-7 rounded-full bg-black/20 hover:bg-black/40 text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-base">close</span>
            </button>

            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center mx-auto mb-2.5 shadow-md">
              <span className="text-[#D82D8B] font-black text-xl tracking-tighter">momo</span>
            </div>

            <h3 className="text-base font-black tracking-tight">CỔNG THANH TOÁN MOMO</h3>
            <p className="text-[11px] text-pink-100/90 font-medium mt-0.5">
              Giả lập thanh toán tức thì — Kohi Coffee
            </p>
          </div>

          {/* Body */}
          <div className="p-6 space-y-4 text-left">
            {isSuccess ? (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="py-8 text-center space-y-3"
              >
                <div className="w-16 h-16 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto border-2 border-emerald-500/30 shadow-lg animate-bounce">
                  <span className="material-symbols-outlined text-4xl">check_circle</span>
                </div>
                <h4 className="text-lg font-black text-emerald-500">THANH TOÁN THÀNH CÔNG!</h4>
                <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                  Hệ thống đã nhận tiền giả lập MoMo thành công. Đơn hàng đang được thực hiện.
                </p>
              </motion.div>
            ) : (
              <>
                {/* Amount info */}
                <div className="bg-pink-50 dark:bg-pink-950/20 border border-pink-200 dark:border-pink-900/40 p-3.5 rounded-2xl flex justify-between items-center">
                  <div>
                    <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block uppercase">Số tiền thanh toán</span>
                    <span className="text-xl font-black text-[#D82D8B]">
                      {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(totalAmount)}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-bold px-2 py-0.5 bg-[#D82D8B]/10 text-[#D82D8B] rounded-full border border-[#D82D8B]/20">
                      {tableName}
                    </span>
                    <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 block mt-1">
                      {shortCode}
                    </span>
                  </div>
                </div>

                {/* QR Code Container */}
                <div className="bg-white p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-inner text-center">
                  <img
                    src={qrUrl}
                    alt="MoMo QR Code"
                    className="w-44 h-44 mx-auto object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
                        `MOMO KOHI COFFEE - ${tableName} - ${shortCode} - ${totalAmount} VND`
                      )}`;
                    }}
                  />
                  <p className="text-[11px] text-slate-500 font-medium mt-2">
                    Quét QR bằng app MoMo hoặc bấm nút chuyển ngay bên dưới
                  </p>
                </div>

                {/* Action CTA */}
                <button
                  onClick={handleSimulatePayment}
                  disabled={isProcessing}
                  className="w-full py-3.5 bg-gradient-to-r from-[#D82D8B] to-[#A50064] hover:from-[#c2247b] hover:to-[#8c0054] text-white font-black rounded-2xl shadow-lg shadow-pink-500/25 transition-all active:scale-95 text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isProcessing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Đang kiểm tra MoMo...</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-lg">bolt</span>
                      <span>Xác nhận Chuyển MoMo (Giả Lập)</span>
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
