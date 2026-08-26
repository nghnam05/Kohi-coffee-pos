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
}

export const OrderSuccessModal: React.FC<OrderSuccessModalProps> = ({
  isOrderSuccessModalOpen,
  setIsOrderSuccessModalOpen,
  latestCreatedOrder,
  tableId,
  router,
  lang = 'vi',
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
            className="relative w-full max-w-sm bg-[#FFFFFF] dark:bg-[#181B21] border border-[#E2E8F0] dark:border-[#222732] rounded-2xl shadow-2xl z-10 overflow-hidden text-center font-sans"
          >
            {/* Top accent bar */}
            <div className="h-1 w-full bg-gradient-to-r from-[#3AA6FF] via-[#5B9EFF] to-[#3AA6FF]" />

            <div className="p-7 flex flex-col gap-5 text-center">
              {/* Status pill */}
              <div className="flex justify-center">
                <span className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-[#3AA6FF]/10 dark:bg-[#5B9EFF]/15 border border-[#3AA6FF]/25 dark:border-[#5B9EFF]/30 rounded-full text-[11px] font-[600] text-[#3AA6FF] dark:text-[#5B9EFF] uppercase tracking-[0.06em]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#3AA6FF] dark:bg-[#5B9EFF] animate-pulse" />
                  {lang === 'en' ? 'Order Placed' : lang === 'zh' ? '下单成功' : 'Đặt hàng thành công'}
                </span>
              </div>

              {/* Main content */}
              <div className="space-y-2">
                <h3 className="text-[20px] font-[700] text-[#0F172A] dark:text-[#F1F5F9] leading-tight font-heading">
                  {lang === 'en' ? 'Order Received!' : lang === 'zh' ? '订单已收到！' : 'Đơn hàng đã được ghi nhận!'}
                </h3>
                <p className="text-[13px] font-[400] text-[#64748B] dark:text-[#9CA3AF] leading-relaxed">
                  {lang === 'en'
                    ? 'Your order has been sent to the barista station and will be served shortly.'
                    : lang === 'zh'
                    ? '您的订单已发送至水吧，将尽快为您服务。'
                    : 'Đơn hàng của bạn đã được chuyển xuống quầy pha chế và sẽ sớm được phục vụ.'}
                </p>
              </div>

              {/* Divider */}
              <div className="border-t border-[#E2E8F0] dark:border-[#222732]" />

              {/* Action buttons */}
              <div className="flex flex-col gap-2.5">
                {latestCreatedOrder?.paymentMethod === 'momo' && (
                  <button
                    onClick={() => {
                      setIsOrderSuccessModalOpen(false);
                      router.push(`/table/${tableId}/order-status/${latestCreatedOrder._id}`);
                    }}
                    className="w-full py-3 bg-gradient-to-r from-[#D82D8B] to-[#A50064] text-white rounded-xl text-[13px] font-[700] transition-all active:scale-95 shadow-lg shadow-pink-500/25 cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-base">bolt</span>
                    <span>{lang === 'en' ? 'Pay with MoMo Now' : lang === 'zh' ? '立即 MoMo 支付' : 'Thanh toán MoMo ngay (Giả lập)'}</span>
                  </button>
                )}
                <button
                  onClick={() => {
                    setIsOrderSuccessModalOpen(false);
                    router.push(`/table/${tableId}/order-status/${latestCreatedOrder._id}`);
                  }}
                  className="w-full py-3 uiverse-btn text-white rounded-xl text-[13px] font-[600] transition-all active:scale-95 shadow-lg shadow-[#3AA6FF]/25 cursor-pointer"
                >
                  {lang === 'en' ? 'Track Order Status' : lang === 'zh' ? '追踪订单进度' : 'Theo dõi tiến độ'}
                </button>
                <button
                  onClick={() => setIsOrderSuccessModalOpen(false)}
                  className="w-full py-3 bg-transparent border border-[#E2E8F0] dark:border-[#222732] text-[#64748B] dark:text-[#9CA3AF] hover:text-[#3AA6FF] dark:hover:text-[#5B9EFF] hover:border-[#3AA6FF]/40 dark:hover:border-[#5B9EFF]/40 rounded-xl text-[13px] font-[500] transition-all cursor-pointer"
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
