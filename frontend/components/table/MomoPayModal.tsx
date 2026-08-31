'use client';

import React, { useState, useEffect } from 'react';
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
  const [timeLeft, setTimeLeft] = useState(900); // 15:00 minutes countdown
  const [step, setStep] = useState<'scan' | 'verifying' | 'ipn' | 'done'>('scan');

  // Countdown timer for MoMo QR session expiration
  useEffect(() => {
    if (!isOpen || isSuccess) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen, isSuccess]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSimulatePayment = async () => {
    if (isProcessing || isSuccess) return;
    setIsProcessing(true);
    setStep('verifying');

    try {
      // 1. Simulate user confirming transaction on MoMo app
      await new Promise((resolve) => setTimeout(resolve, 800));
      setStep('ipn');

      // 2. Simulate MoMo server firing Instant Payment Notification (IPN Webhook) to Backend
      await new Promise((resolve) => setTimeout(resolve, 1000));
      const res = await fetch(`${apiBase}/orders/${orderId}/pay`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentMethod: 'momo', status: 'paid' }),
      });

      if (!res.ok) {
        throw new Error('Không thể kết nối với cổng thanh toán MoMo.');
      }

      setStep('done');
      setIsSuccess(true);

      // 3. Play signature MoMo chime
      try {
        playMomoChime();
      } catch (e) {}

      toast.success('Thanh toán Ví MoMo thành công! Đơn hàng đã được xác nhận.');

      setTimeout(() => {
        setIsProcessing(false);
        setIsSuccess(false);
        setStep('scan');
        onClose();
        if (onSuccess) onSuccess();
      }, 2000);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Lỗi khi kết nối cổng MoMo.');
      setIsProcessing(false);
      setStep('scan');
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
          className="absolute inset-0 bg-black/80 backdrop-blur-md"
        />

        {/* Modal Card */}
        <motion.div
          initial={{ scale: 0.92, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.92, opacity: 0, y: 20 }}
          transition={{ type: 'spring', stiffness: 400, damping: 28 }}
          className="relative w-full max-w-md bg-white dark:bg-[#121620] border border-pink-500/30 rounded-3xl shadow-2xl z-10 overflow-hidden text-center"
        >
          {/* Top Magenta Bar & MoMo Header */}
          <div className="bg-gradient-to-r from-[#A50064] via-[#D82D8B] to-[#A50064] p-5 text-white relative">
            <button
              onClick={onClose}
              disabled={isProcessing}
              aria-label="Đóng cửa sổ thanh toán"
              className="absolute top-3.5 right-3.5 w-8 h-8 rounded-full bg-black/20 hover:bg-black/40 text-white flex items-center justify-center transition-colors cursor-pointer disabled:opacity-30"
            >
              <span className="material-symbols-outlined text-base">close</span>
            </button>

            <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center mx-auto mb-2 shadow-lg shadow-pink-900/30">
              <span className="text-[#D82D8B] font-black text-2xl tracking-tighter">momo</span>
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 bg-white/20 backdrop-blur-sm rounded-full text-[10px] font-bold uppercase tracking-wider mb-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              Capture Wallet — Thanh toán bằng Ví MoMo
            </div>

            <h3 className="text-lg font-black tracking-tight">CỔNG THANH TOÁN MOMO</h3>
            <p className="text-xs text-pink-100/90 font-medium">
              Kohi Coffee POS • Đơn hàng {tableName} ({shortCode})
            </p>
          </div>

          {/* Body Content */}
          <div className="p-6 space-y-4 text-left">
            {isSuccess ? (
              <motion.div
                initial={{ scale: 0.85, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="py-8 text-center space-y-3"
              >
                <div className="w-20 h-20 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto border-2 border-emerald-500/30 shadow-xl animate-bounce">
                  <span className="material-symbols-outlined text-5xl">check_circle</span>
                </div>
                <h4 className="text-xl font-black text-emerald-500 tracking-tight">THANH TOÁN THÀNH CÔNG!</h4>
                <p className="text-xs text-slate-600 dark:text-slate-300 font-medium max-w-xs mx-auto">
                  MoMo đã gửi Webhook IPN phản hồi giao dịch thành công. Đơn hàng đã chuyển sang trạng thái <b>Đã thanh toán</b>.
                </p>
              </motion.div>
            ) : (
              <>
                {/* Order & Amount Header */}
                <div className="bg-pink-50 dark:bg-pink-950/20 border border-pink-200 dark:border-pink-900/40 p-4 rounded-2xl flex justify-between items-center">
                  <div>
                    <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block uppercase">Số tiền thanh toán</span>
                    <span className="text-2xl font-black text-[#D82D8B]">
                      {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(totalAmount)}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="inline-block text-[11px] font-extrabold px-2.5 py-1 bg-[#D82D8B] text-white rounded-lg shadow-sm">
                      {tableName}
                    </span>
                    <span className="text-xs font-mono text-slate-500 dark:text-slate-400 block mt-1">
                      Thời gian còn lại: <strong className="text-pink-600 dark:text-pink-400">{formatTime(timeLeft)}</strong>
                    </span>
                  </div>
                </div>

                {/* MoMo QR Code Box */}
                <div className="relative bg-white p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-inner text-center">
                  <div className="relative inline-block">
                    <img
                      src={qrUrl}
                      alt="MoMo Capture Wallet QR Code"
                      className="w-48 h-48 mx-auto object-contain rounded-lg"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
                          `MOMO KOHI COFFEE - ${tableName} - ${shortCode} - ${totalAmount} VND`
                        )}`;
                      }}
                    />
                    {/* Center MoMo Logo Overlay */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="w-9 h-9 bg-white border-2 border-[#D82D8B] rounded-xl flex items-center justify-center shadow-md">
                        <span className="text-[#D82D8B] font-black text-xs">momo</span>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-400 font-semibold mt-2.5 flex items-center justify-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-pink-500 animate-pulse" />
                    Quét mã bằng Ví MoMo trên điện thoại để hoàn tất
                  </p>
                </div>

                {/* Deep Link Button for Mobile */}
                <a
                  href={`momo://app?action=pay&amount=${totalAmount}&orderId=${orderId}`}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-2.5 bg-pink-100 hover:bg-pink-200 dark:bg-pink-950/40 dark:hover:bg-pink-950/60 text-[#D82D8B] dark:text-pink-300 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 border border-pink-300 dark:border-pink-800/50 transition-colors"
                >
                  <span className="material-symbols-outlined text-base">open_in_new</span>
                  <span>Mở ứng dụng Ví MoMo trên máy này</span>
                </a>

                {/* Status indicator during simulation */}
                {isProcessing && (
                  <div className="p-3 bg-slate-100 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-xs space-y-1.5">
                    <div className="flex items-center justify-between font-semibold text-slate-700 dark:text-slate-300">
                      <span>Tiến trình xử lý MoMo Gateway:</span>
                      <span className="text-[#D82D8B]">
                        {step === 'verifying' && '1. Xác thực giao dịch...'}
                        {step === 'ipn' && '2. MoMo gửi IPN Webhook...'}
                        {step === 'done' && '3. Hoàn tất!'}
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-gradient-to-r from-[#D82D8B] to-pink-400"
                        initial={{ width: '0%' }}
                        animate={{
                          width: step === 'verifying' ? '35%' : step === 'ipn' ? '75%' : '100%',
                        }}
                        transition={{ duration: 0.5 }}
                      />
                    </div>
                  </div>
                )}

                {/* Primary Simulation Button */}
                <button
                  onClick={handleSimulatePayment}
                  disabled={isProcessing}
                  className="w-full py-3.5 bg-gradient-to-r from-[#D82D8B] via-[#c2247b] to-[#A50064] hover:from-[#b82273] hover:to-[#8c0054] text-white font-black rounded-2xl shadow-lg shadow-pink-500/25 transition-all active:scale-95 text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isProcessing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Đang nhận tín hiệu MoMo IPN...</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-lg">bolt</span>
                      <span>Giả lập Khách Thanh Toán MoMo (Kích hoạt IPN)</span>
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
