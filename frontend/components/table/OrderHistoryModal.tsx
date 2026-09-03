'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  onOpenBankPayModal?: (order: any) => void;
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
  onOpenBankPayModal,
}) => {
  const [reviewingOrder, setReviewingOrder] = useState<any | null>(null);

  return (
    <AnimatePresence>
      {isOrderHistoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 select-none">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOrderHistoryModalOpen(false)}
            className="fixed inset-0 bg-slate-950/60 dark:bg-slate-950/80 backdrop-blur-sm transition-opacity"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ scale: 0.96, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.96, opacity: 0, y: 10 }}
            transition={{ type: 'spring', stiffness: 450, damping: 32 }}
            className="relative w-full max-w-xl bg-white dark:bg-[#0D111A] border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 sm:p-7 shadow-2xl z-10 max-h-[90vh] flex flex-col font-sans text-left"
          >
            {/* Header */}
            <div className="flex items-start justify-between pb-4 border-b border-slate-100 dark:border-slate-800/80 shrink-0">
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white font-heading tracking-tight">
                  {lang === 'en' ? 'Order History' : lang === 'zh' ? '订单历史' : 'Lịch sử đơn hàng'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-2 font-medium">
                  <span>{table?.tableName ? (lang === 'en' ? `Table ${table.tableName}` : lang === 'zh' ? `桌号 ${table.tableName}` : `Bàn số ${table.tableName}`) : (lang === 'en' ? 'Table' : lang === 'zh' ? '桌号' : 'Bàn')}</span>
                  <span>•</span>
                  <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    {lang === 'en' ? 'Live updates' : lang === 'zh' ? '实时更新' : 'Cập nhật trực tiếp'}
                  </span>
                </p>
              </div>

              <button
                onClick={() => setIsOrderHistoryModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white flex items-center justify-center transition-all cursor-pointer active:scale-95"
                title="Đóng lịch sử đơn hàng"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto py-4 space-y-4 scrollbar-none pr-1">
              {activeOrders.length === 0 ? (
                <div className="py-12 text-center text-slate-400 dark:text-slate-500">
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {lang === 'en' ? 'No orders placed yet' : lang === 'zh' ? '暂无订单' : 'Chưa có đơn đặt nào'}
                  </p>
                  <p className="text-xs font-normal max-w-xs mx-auto">
                    {lang === 'en'
                      ? 'Select items from the menu to place an order.'
                      : lang === 'zh'
                      ? '请从菜单选择商品下单。'
                      : 'Hãy chọn món từ menu và bấm gọi món nhé!'}
                  </p>
                </div>
              ) : (
                <>
                  {/* Group Members Summary */}
                  {(() => {
                    const nameCounts: Record<string, number> = {};
                    activeOrders.forEach((o) => {
                      const name = o.customerName || (lang === 'en' ? 'Guest' : lang === 'zh' ? '顾客' : 'Khách');
                      const count = o.items?.reduce((s: number, i: any) => s + (i.quantity || 1), 0) || 0;
                      nameCounts[name] = (nameCounts[name] || 0) + count;
                    });
                    return (
                      <div className="flex flex-wrap items-center gap-2 pb-2 text-xs font-medium text-slate-500 dark:text-slate-400">
                        <span className="font-bold text-slate-700 dark:text-slate-300">
                          {lang === 'en' ? 'Group:' : lang === 'zh' ? '同桌:' : 'Thành viên:'}
                        </span>
                        {Object.entries(nameCounts).map(([name, count]) => (
                          <span
                            key={name}
                            className="px-2.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-full text-[11px] font-bold"
                          >
                            {name} <span className="text-slate-400 font-normal">({count} món)</span>
                          </span>
                        ))}
                      </div>
                    );
                  })()}

                  {/* Orders List */}
                  {activeOrders.map((order, idx) => {
                    const statusInfo = getOrderStatusInfo(order.status);
                    const isPaid = order.status === 'paid';
                    return (
                      <div
                        key={order._id || idx}
                        className="bg-slate-50/70 dark:bg-[#131824] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 space-y-3 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all"
                      >
                        {/* Order Card Header */}
                        <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-slate-200/60 dark:border-slate-800/80">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200 font-sans">
                                {lang === 'en' ? 'Order' : lang === 'zh' ? '订单' : 'Mã đơn'}: #{order._id ? order._id.slice(-6).toUpperCase() : idx + 1}
                              </span>
                              {order.customerName && (
                                <span className="px-2 py-0.5 bg-sky-500/10 text-[#0284c7] dark:text-[#38BDF8] text-[10.5px] font-extrabold rounded-md font-sans">
                                  {order.customerName}
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 block font-sans">
                              {order.createdAt
                                ? new Date(order.createdAt).toLocaleTimeString(lang === 'zh' ? 'zh-CN' : lang === 'en' ? 'en-US' : 'vi-VN', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })
                                : (lang === 'en' ? 'Just created' : lang === 'zh' ? '刚刚' : 'Vừa tạo')}
                            </span>
                          </div>

                          {/* Status Badges Group */}
                          <div className="flex items-center gap-2">
                            {/* Payment Status Badge */}
                            {isPaid ? (
                              <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[11px] font-bold border border-emerald-500/20 rounded-full font-sans">
                                {lang === 'en' ? 'Paid' : lang === 'zh' ? '已结账' : 'Đã thanh toán'}
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 bg-rose-500/10 text-rose-600 dark:text-rose-400 text-[11px] font-bold border border-rose-500/20 rounded-full font-sans">
                                {lang === 'en' ? 'Unpaid' : lang === 'zh' ? '未支付' : 'Chưa thanh toán'}
                              </span>
                            )}

                            {/* Kitchen Status Badge */}
                            <div className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${statusInfo.color} flex items-center gap-1.5 font-sans`}>
                              {statusInfo.step === 2 && (
                                <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-spin" />
                              )}
                              <span>{statusInfo.label}</span>
                            </div>
                          </div>
                        </div>

                        {/* Order Items */}
                        <div className="space-y-1.5">
                          {order.items?.map((item: any, i: number) => {
                            const itemName = item.food?.name || (typeof item.foodId === 'object' && item.foodId?.name) || item.foodName || (lang === 'en' ? 'Item' : lang === 'zh' ? '商品' : 'Món ăn');
                            const unitPrice = item.unitPrice || item.price || (typeof item.foodId === 'object' && item.foodId?.price) || item.food?.price || 0;
                            return (
                              <div key={i} className="flex justify-between items-start text-xs text-slate-800 dark:text-slate-200 font-sans">
                                <div>
                                  <span className="font-bold">{itemName}</span>
                                  <span className="text-slate-400 font-medium ml-2">x{item.quantity}</span>
                                  {item.note && (
                                    <p className="text-[11px] text-slate-400 italic">
                                      {lang === 'en' ? 'Note:' : lang === 'zh' ? '备注:' : 'Ghi chú:'} {item.note}
                                    </p>
                                  )}
                                </div>
                                <span className="font-bold text-slate-900 dark:text-white font-sans">
                                  {formatPrice(unitPrice * item.quantity, lang)}
                                </span>
                              </div>
                            );
                          })}
                        </div>

                        {/* Order Footer & Standard Action Buttons */}
                        <div className="pt-2.5 border-t border-slate-200/60 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <span className="text-[11px] text-slate-400 block font-medium font-sans">
                              {lang === 'en' ? 'Subtotal:' : lang === 'zh' ? '小计:' : 'Tổng đợt:'}
                            </span>
                            <span className="text-sm font-black text-[#0284c7] dark:text-[#38BDF8] font-sans">
                              {formatPrice(order.totalAmount || 0, lang)}
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-2">
                            {/* Track Progress Button */}
                            <button
                              onClick={() => {
                                setIsOrderHistoryModalOpen(false);
                                router.push(`/table/${tableId}/order-status/${order._id}`);
                              }}
                              className="h-8 px-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl transition-all active:scale-95 cursor-pointer inline-flex items-center gap-1.5 font-sans"
                            >
                              <span className="material-symbols-outlined text-[15px]">schedule</span>
                              <span>{lang === 'en' ? 'Track' : lang === 'zh' ? '进度' : 'Theo dõi tiến độ'}</span>
                            </button>

                            {/* Pay Button (if unpaid) */}
                            {!isPaid && (
                              <button
                                onClick={() => {
                                  if (onOpenBankPayModal) {
                                    onOpenBankPayModal(order);
                                  } else {
                                    router.push(`/table/${tableId}/order-status/${order._id}`);
                                  }
                                }}
                                className="h-8 px-3.5 bg-[#0284c7] hover:bg-[#0369a1] dark:bg-[#38BDF8] dark:hover:bg-[#0284c7] text-white dark:text-slate-950 text-xs font-extrabold rounded-xl transition-all active:scale-95 cursor-pointer shadow-sm inline-flex items-center gap-1.5 font-sans"
                              >
                                <span className="material-symbols-outlined text-[15px]">payments</span>
                                <span>{lang === 'en' ? 'Pay Now' : lang === 'zh' ? 'Lines' : 'Thanh toán'}</span>
                              </button>
                            )}

                            {/* Review Button */}
                            {['ready', 'served', 'completed', 'paid'].includes(order.status) && (
                              <button
                                onClick={() => setReviewingOrder(order)}
                                className="h-8 px-3 bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-bold rounded-xl transition-all active:scale-95 cursor-pointer inline-flex items-center gap-1.5 font-sans border border-amber-500/20"
                              >
                                <span className="material-symbols-outlined text-[15px]">star</span>
                                <span>{lang === 'en' ? 'Review' : lang === 'zh' ? '评价' : 'Đánh giá'}</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </>
              )}
            </div>

            {/* Total & Bottom Modal Footer */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-3 shrink-0">
              <div>
                <span className="text-xs text-slate-400 block font-medium font-sans">
                  {lang === 'en' ? 'Total Session Balance:' : lang === 'zh' ? '本桌累计:' : 'Tổng cộng cả buổi:'}
                </span>
                <span className="text-lg sm:text-xl font-black text-[#0284c7] dark:text-[#38BDF8] tracking-tight font-sans">
                  {formatPrice(
                    activeOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0),
                    lang
                  )}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {(() => {
                  const unpaidOrders = activeOrders.filter((o) => o.status !== 'paid');
                  const isAllPaid = activeOrders.length > 0 && unpaidOrders.length === 0;

                  if (isAllPaid) {
                    return (
                      <span className="px-3.5 py-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl text-xs font-bold border border-emerald-500/20 font-sans inline-flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[15px]">check_circle</span>
                        {lang === 'en' ? 'All Paid' : lang === 'zh' ? '已全额结账' : 'Đã thanh toán đủ'}
                      </span>
                    );
                  }

                  if (unpaidOrders.length > 0) {
                    const latestUnpaid = unpaidOrders[0];
                    return (
                      <button
                        onClick={() => {
                          if (onOpenBankPayModal) {
                            onOpenBankPayModal(latestUnpaid);
                          } else {
                            router.push(`/table/${tableId}/order-status/${latestUnpaid._id}`);
                          }
                        }}
                        className="h-10 px-5 bg-[#0284c7] hover:bg-[#0369a1] dark:bg-[#38BDF8] dark:hover:bg-[#0284c7] text-white dark:text-slate-950 font-black rounded-xl text-xs tracking-wide transition-all shadow-md active:scale-95 cursor-pointer inline-flex items-center gap-1.5 font-sans"
                      >
                        <span className="material-symbols-outlined text-base">payments</span>
                        <span>{lang === 'en' ? 'Pay Now' : lang === 'zh' ? '立即支付' : 'Thanh toán'}</span>
                      </button>
                    );
                  }

                  return null;
                })()}

                <button
                  onClick={() => setIsOrderHistoryModalOpen(false)}
                  className="h-10 px-5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-xl text-xs tracking-wide transition-all active:scale-95 cursor-pointer font-sans"
                >
                  {lang === 'en' ? 'Close' : lang === 'zh' ? '关闭' : 'Đóng'}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

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
