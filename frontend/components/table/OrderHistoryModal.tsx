'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Table {
  _id: string;
  tableName: string;
  status: string;
}

interface OrderHistoryModalProps {
  isOrderHistoryModalOpen: boolean;
  setIsOrderHistoryModalOpen: (open: boolean) => void;
  table: Table | null;
  activeOrders: any[];
  getOrderStatusInfo: (status: string) => { label: string; color: string; step: number };
  formatPrice: (price: number, lang: any) => string;
  lang: any;
  tableId: string;
  router: any;
}

export const OrderHistoryModal: React.FC<OrderHistoryModalProps> = ({
  isOrderHistoryModalOpen,
  setIsOrderHistoryModalOpen,
  table,
  activeOrders,
  getOrderStatusInfo,
  formatPrice,
  lang,
  tableId,
  router,
}) => {
  return (
    <AnimatePresence>
      {isOrderHistoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 select-none">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOrderHistoryModalOpen(false)}
            className="absolute inset-0 bg-black/75 backdrop-blur-sm"
          />

          {/* Modal Card */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="relative w-full max-w-2xl bg-[#FFFFFF] dark:bg-[#181B21] border border-[var(--border-color)] rounded-[var(--radius-lg)] p-5 sm:p-6 shadow-2xl z-10 max-h-[90vh] flex flex-col font-sans overflow-hidden"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-4 mb-4 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[var(--brand-primary)]/10 text-[var(--brand-primary)] flex items-center justify-center border border-[var(--brand-primary)]/20">
                  <span className="material-symbols-outlined text-xl">receipt_long</span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[var(--text-primary)] leading-tight">
                    Lịch sử & Trạng thái đơn hàng
                  </h3>
                  <p className="text-xs font-medium text-[var(--text-secondary)] mt-0.5 flex items-center gap-2">
                    <span>{table?.tableName ?? 'Bàn 05'}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1 text-emerald-500 font-semibold">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      Cập nhật thời gian thực
                    </span>
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsOrderHistoryModalOpen(false)}
                className="w-8 h-8 rounded-full bg-[var(--bg-primary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-color)] flex items-center justify-center transition-colors"
              >
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto scrollbar-none space-y-4 pr-1">
              {activeOrders.length === 0 ? (
                <div className="py-12 text-center text-[var(--text-secondary)]">
                  <div className="w-14 h-14 rounded-full bg-[var(--bg-primary)] text-[var(--text-tertiary)] flex items-center justify-center mx-auto mb-3 border border-[var(--border-color)]">
                    <span className="material-symbols-outlined text-2xl">receipt_long</span>
                  </div>
                  <h4 className="text-base font-bold text-[var(--text-primary)] mb-1">
                    Chưa có đơn đặt nào
                  </h4>
                  <p className="text-xs font-normal text-[var(--text-secondary)] max-w-sm mx-auto">
                    Bàn của bạn chưa gửi đơn hàng nào. Hãy chọn món từ thực đơn và bấm "Xác nhận gọi món" nhé!
                  </p>
                </div>
              ) : (
                activeOrders.map((order, idx) => {
                  const statusInfo = getOrderStatusInfo(order.status);
                  return (
                    <div
                      key={order._id || idx}
                      className="bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-[var(--radius-md)] p-4 shadow-sm space-y-3"
                    >
                      {/* Order Sub-header */}
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border-color)] pb-3">
                        <div>
                          <span className="text-xs font-bold text-[var(--text-tertiary)] uppercase tracking-wider block">
                            Mã đơn: #{order._id ? order._id.slice(-6).toUpperCase() : `Lượt ${idx + 1}`}
                          </span>
                          <span className="text-[11px] text-[var(--text-secondary)]">
                            {order.createdAt
                              ? new Date(order.createdAt).toLocaleTimeString('vi-VN', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })
                              : 'Vừa tạo'}
                          </span>
                        </div>

                        {/* Status Badge */}
                        <div
                          className={`px-3 py-1 rounded-full text-xs font-bold border ${statusInfo.color} flex items-center gap-1.5`}
                        >
                          {statusInfo.step === 2 && (
                            <span className="w-2 h-2 rounded-full bg-[var(--brand-primary)] animate-spin" />
                          )}
                          <span>{statusInfo.label}</span>
                        </div>
                      </div>

                      {/* Items */}
                      <div className="space-y-2">
                        {order.items?.map((item: any, i: number) => (
                          <div
                            key={i}
                            className="flex justify-between items-start text-xs text-[var(--text-primary)]"
                          >
                            <div className="flex-1">
                              <span className="font-bold">
                                {item.food?.name || item.foodName}
                              </span>
                              <span className="text-[var(--text-secondary)] font-normal ml-2">
                                x{item.quantity}
                              </span>
                              {item.note && (
                                <p className="text-[11px] text-[var(--text-secondary)] italic font-normal">
                                  Ghi chú: {item.note}
                                </p>
                              )}
                            </div>
                            <span className="font-semibold text-[var(--text-primary)]">
                              {formatPrice(
                                (item.unitPrice || item.food?.price || 0) * item.quantity,
                                lang
                              )}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Footer & Total */}
                      <div className="pt-2 border-t border-[var(--border-color)] flex items-center justify-between">
                        <span className="text-xs font-medium text-[var(--text-secondary)]">
                          Tổng đợt gọi món:
                        </span>
                        <span className="text-sm font-bold text-[var(--brand-primary)]">
                          {formatPrice(order.totalAmount || 0, lang)}
                        </span>
                      </div>

                      {/* Action */}
                      <button
                        onClick={() => {
                          setIsOrderHistoryModalOpen(false);
                          router.push(`/table/${tableId}/order-status/${order._id}`);
                        }}
                        className="w-full py-2 bg-[var(--bg-card)] border border-[var(--border-color)] hover:border-[var(--brand-primary)] text-[var(--brand-primary)] text-xs font-semibold rounded-[var(--radius-sm)] transition-all flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer"
                      >
                        <span>{order.status === 'paid' ? 'Xem hóa đơn & Chi tiết thanh toán' : 'Theo dõi tiến độ chi tiết'}</span>
                      </button>
                    </div>
                  );
                })
              )}
            </div>

            {/* Session Cumulative Total */}
            <div className="pt-4 border-t border-[var(--border-color)] mt-4 flex items-center justify-between shrink-0">
              <div>
                <span className="text-xs font-medium text-[var(--text-secondary)] block">
                  Tổng cộng cả buổi tại bàn:
                </span>
                <span className="text-lg font-bold text-[var(--brand-primary)]">
                  {formatPrice(
                    activeOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0),
                    lang
                  )}
                </span>
              </div>

              <button
                onClick={() => setIsOrderHistoryModalOpen(false)}
                className="px-5 py-2.5 bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] text-white rounded-[var(--radius-sm)] text-xs font-semibold uppercase tracking-wider shadow-md transition-all active:scale-95"
              >
                Đóng
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
