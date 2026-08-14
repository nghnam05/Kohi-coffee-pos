'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SplitBillModal } from './SplitBillModal';
import { FoodReviewModal } from './FoodReviewModal';

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
  const [isSplitBillOpen, setIsSplitBillOpen] = useState(false);
  const [reviewingOrder, setReviewingOrder] = useState<any | null>(null);

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
                className="w-8 h-8 rounded-full bg-[var(--bg-primary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-color)] flex items-center justify-center transition-colors cursor-pointer"
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
                <>
                  {/* Group Members Summary Banner */}
                  {(() => {
                    const nameCounts: Record<string, number> = {};
                    activeOrders.forEach((o) => {
                      const name = o.customerName || 'Khách tại bàn';
                      const count = o.items?.reduce((s: number, i: any) => s + (i.quantity || 1), 0) || 0;
                      nameCounts[name] = (nameCounts[name] || 0) + count;
                    });
                    return (
                      <div className="p-3 bg-[var(--brand-primary)]/10 border border-[var(--brand-primary)]/20 rounded-[var(--radius-md)] flex flex-wrap items-center justify-between gap-2 text-xs">
                        <div className="flex items-center gap-1.5 font-bold text-[var(--text-primary)]">
                          <span className="material-symbols-outlined text-[var(--brand-primary)] text-base">groups</span>
                          <span>Đơn nhóm theo thành viên ({Object.keys(nameCounts).length} người):</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {Object.entries(nameCounts).map(([name, count]) => (
                            <span key={name} className="px-2 py-0.5 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-full text-[11px] font-bold text-[var(--brand-primary)] flex items-center gap-1 shadow-xs">
                              <span className="material-symbols-outlined text-[13px]">person</span>
                              <span>{name}</span>
                              <span className="text-[var(--text-secondary)]">({count} món)</span>
                            </span>
                          ))}
                        </div>
                      </div>
                    );
                  })()}

                  {activeOrders.map((order, idx) => {
                    const statusInfo = getOrderStatusInfo(order.status);
                    return (
                      <div
                        key={order._id || idx}
                        className="bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-[var(--radius-md)] p-4 shadow-sm space-y-3"
                      >
                        {/* Order Sub-header */}
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border-color)] pb-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-[var(--text-tertiary)] uppercase tracking-wider block">
                                Mã đơn: #{order._id ? order._id.slice(-6).toUpperCase() : `Lượt ${idx + 1}`}
                              </span>
                              {order.customerName && (
                                <span className="px-2 py-0.5 bg-[var(--brand-primary)]/10 text-[var(--brand-primary)] border border-[var(--brand-primary)]/20 text-[11px] font-extrabold rounded-md flex items-center gap-1">
                                  <span className="material-symbols-outlined text-[13px]">person</span>
                                  {order.customerName}
                                </span>
                              )}
                            </div>
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
                          {order.items?.map((item: any, i: number) => {
                            const itemName = item.food?.name || (typeof item.foodId === 'object' && item.foodId?.name) || item.foodName || 'Món ăn';
                            const unitPrice = item.unitPrice || item.price || (typeof item.foodId === 'object' && item.foodId?.price) || item.food?.price || 0;
                            return (
                              <div
                                key={i}
                                className="flex justify-between items-start text-xs text-[var(--text-primary)]"
                              >
                                <div className="flex-1">
                                  <span className="font-bold">
                                    {itemName}
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
                                  {formatPrice(unitPrice * item.quantity, lang)}
                                </span>
                              </div>
                            );
                          })}
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
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setIsOrderHistoryModalOpen(false);
                              router.push(`/table/${tableId}/order-status/${order._id}`);
                            }}
                            className="flex-1 py-2 bg-[var(--bg-card)] border border-[var(--border-color)] hover:border-[var(--brand-primary)] text-[var(--brand-primary)] text-xs font-semibold rounded-[var(--radius-sm)] transition-all flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer"
                          >
                            <span>{order.status === 'paid' ? 'Xem hóa đơn & Chi tiết' : 'Theo dõi tiến độ chi tiết'}</span>
                          </button>

                          {['ready', 'served', 'completed', 'paid'].includes(order.status) && (
                            <button
                              onClick={() => setReviewingOrder(order)}
                              className="px-3 py-2 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-500 text-xs font-bold rounded-[var(--radius-sm)] transition-all flex items-center justify-center gap-1 active:scale-95 cursor-pointer shrink-0"
                            >
                              <span className="material-symbols-outlined text-sm">star</span>
                              <span>Đánh giá món</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </>
              )}
            </div>

            {/* Session Cumulative Total */}
            <div className="pt-4 border-t border-[var(--border-color)] mt-4 flex flex-wrap items-center justify-between gap-3 shrink-0">
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

              <div className="flex items-center gap-2">
                {(() => {
                  const isAllPaid = activeOrders.length > 0 && activeOrders.every((o) => o.status === 'paid');
                  const isReadyForPayment = activeOrders.length > 0 && activeOrders.every(
                    (o) => ['ready', 'served', 'completed', 'paid'].includes(o.status)
                  );

                  if (isAllPaid) {
                    return (
                      <div className="flex items-center gap-2">
                        <span className="px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 rounded-full text-xs font-bold flex items-center gap-1">
                          <span className="material-symbols-outlined text-sm">check_circle</span>
                          Đã thanh toán
                        </span>
                      </div>
                    );
                  }

                  return (
                    <button
                      disabled={!isReadyForPayment}
                      onClick={() => setIsSplitBillOpen(true)}
                      title={!isReadyForPayment ? 'Vui lòng chờ Bếp/Barista hoàn tất ra món để tiến hành thanh toán' : ''}
                      className={`px-4 py-2.5 rounded-[var(--radius-sm)] text-xs font-bold transition-all flex items-center gap-1.5 ${
                        isReadyForPayment
                          ? 'bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-500 cursor-pointer active:scale-95'
                          : 'bg-gray-500/10 border border-gray-500/20 text-gray-400 cursor-not-allowed opacity-60'
                      }`}
                    >
                      <span className="material-symbols-outlined text-base">
                        {isReadyForPayment ? 'payments' : 'hourglass_top'}
                      </span>
                      <span>{isReadyForPayment ? 'Thanh toán' : 'Chờ hoàn tất món'}</span>
                    </button>
                  );
                })()}

                <button
                  onClick={() => setIsOrderHistoryModalOpen(false)}
                  className="px-5 py-2.5 bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] text-white rounded-[var(--radius-sm)] text-xs font-semibold uppercase tracking-wider shadow-md transition-all active:scale-95 cursor-pointer"
                >
                  Đóng
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Split Bill Modal */}
      <SplitBillModal
        isOpen={isSplitBillOpen}
        onClose={() => setIsSplitBillOpen(false)}
        table={table}
        activeOrders={activeOrders}
        formatPrice={formatPrice}
        lang={lang}
      />

      {/* Food Review Modal */}
      <FoodReviewModal
        isOpen={Boolean(reviewingOrder)}
        onClose={() => setReviewingOrder(null)}
        order={reviewingOrder}
        tableId={tableId}
        formatPrice={formatPrice}
        lang={lang}
      />
    </AnimatePresence>
  );
};
