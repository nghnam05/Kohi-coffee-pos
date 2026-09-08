'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface OrderSuccessModalProps {
  isOrderSuccessModalOpen: boolean;
  setIsOrderSuccessModalOpen: (open: boolean) => void;
  latestCreatedOrder: any;
  tableId: string;
  router: any;
  lang?: 'vi' | 'en' | 'zh';
  onOpenBankPayModal?: (order: any) => void;
}

export const OrderSuccessModal: React.FC<OrderSuccessModalProps> = ({
  isOrderSuccessModalOpen,
  setIsOrderSuccessModalOpen,
  latestCreatedOrder,
  tableId,
  router,
  lang = 'vi',
  onOpenBankPayModal,
}) => {
  return (
    <AnimatePresence>
      {isOrderSuccessModalOpen && latestCreatedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOrderSuccessModalOpen(false)}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          />
          <motion.div
            initial={{ scale: 0.92, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.92, opacity: 0, y: 20 }}
            transition={{ type: 'spring', stiffness: 400, damping: 28 }}
            className="relative w-full max-w-sm bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl z-10 overflow-hidden text-center font-sans"
          >
            {/* Top accent bar */}
            <div className="h-1 w-full bg-gradient-to-r from-blue-600 via-sky-400 to-blue-600" />

            <div className="p-7 flex flex-col gap-5 text-center">
              {/* Status pill */}
              <div className="flex justify-center">
                <span className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-blue-500/15 border border-blue-500/30 rounded-full text-[11px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-[0.06em]">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 dark:bg-blue-400 animate-pulse" />
                  {lang === 'en' ? 'Order Placed' : lang === 'zh' ? '下单成功' : 'Đặt hàng thành công'}
                </span>
              </div>

              {/* Main content */}
              <div className="space-y-2">
                <h3 className="text-[20px] font-black text-slate-900 dark:text-white leading-tight font-heading">
                  {lang === 'en' ? 'Order Received!' : lang === 'zh' ? '订单已收到！' : 'Đơn hàng đã được ghi nhận!'}
                </h3>
                <p className="text-[13px] font-medium text-slate-500 dark:text-slate-400 leading-relaxed">
                  {lang === 'en'
                    ? 'Your order has been sent to the barista station and will be served shortly.'
                    : lang === 'zh'
                    ? '您的订单已发送至水吧，将尽快为您服务。'
                    : 'Đơn hàng của bạn đã được chuyển xuống quầy pha chế và sẽ sớm được phục vụ.'}
                </p>
              </div>

              {/* Divider */}
              <div className="border-t border-slate-200 dark:border-white/10" />

              {/* Action buttons */}
              <div className="flex flex-col gap-2.5">
                {onOpenBankPayModal && latestCreatedOrder?.status && latestCreatedOrder.status !== 'pending' && latestCreatedOrder.status !== 'paid' && (latestCreatedOrder?.paymentMethod === 'bank_transfer' || latestCreatedOrder?.paymentMethod === 'momo') && (
                  <button
                    onClick={() => {
                      setIsOrderSuccessModalOpen(false);
                      onOpenBankPayModal(latestCreatedOrder);
                    }}
                    className="w-full py-3 bg-[#3B82F6] hover:bg-blue-600 text-white rounded-xl text-[13.5px] font-bold transition-all active:scale-95 shadow-lg cursor-pointer flex items-center justify-center"
                  >
                    <span>{lang === 'en' ? 'Pay via VietQR' : lang === 'zh' ? '扫码银行转账' : 'Thanh toán VietQR'}</span>
                  </button>
                )}

                <button
                  onClick={() => {
                    setIsOrderSuccessModalOpen(false);
                    router.push(`/table/${tableId}/order-status/${latestCreatedOrder._id}`);
                  }}
                  className="w-full py-3 uiverse-btn text-white rounded-xl text-[13.5px] font-bold transition-all active:scale-95 shadow-lg shadow-blue-500/25 cursor-pointer flex items-center justify-center"
                >
                  <span>{lang === 'en' ? 'Track Order Status' : lang === 'zh' ? '追踪订单进度' : 'Theo dõi tiến độ'}</span>
                </button>

                <button
                  onClick={() => setIsOrderSuccessModalOpen(false)}
                  className="w-full py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-xl text-[13px] font-bold transition-all cursor-pointer"
                >
                  {lang === 'en' ? 'Order More Items' : lang === 'zh' ? '加点其他商品' : 'Chọn thêm món khác'}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
