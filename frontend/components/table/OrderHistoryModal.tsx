'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { formatTableName } from '@/utils/format';
import { FoodReviewModal } from './FoodReviewModal';
import { CancelOrderModal } from './CancelOrderModal';

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
  const [selectedCashOrder, setSelectedCashOrder] = useState<any | null>(null);
  const [isCallingCashStaff, setIsCallingCashStaff] = useState(false);
  const [cancellingOrderId, setCancellingOrderId] = useState<string | null>(null);
  const [orderToCancel, setOrderToCancel] = useState<any | null>(null);

  // Keyboard accessibility: Escape key handling
  React.useEffect(() => {
    if (!isOrderHistoryModalOpen && !selectedCashOrder) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (selectedCashOrder) {
          setSelectedCashOrder(null);
        } else if (isOrderHistoryModalOpen) {
          setIsOrderHistoryModalOpen(false);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOrderHistoryModalOpen, selectedCashOrder, setIsOrderHistoryModalOpen]);

  const handleCancelOrder = async (order: any, confirmed = false) => {
    if (!order?._id || cancellingOrderId) return;
    if (!confirmed) {
      setOrderToCancel(order);
      return;
    }

    setCancellingOrderId(order._id);
    try {
      const API_BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1')
        .trim()
        .replace(/[\r\n\t]+/g, '')
        .replace(/\/+$/, '');
      const res = await fetch(`${API_BASE}/orders/${order._id}/cancel`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Không thể hủy đơn hàng.');
      }

      toast.success(
        lang === 'en'
          ? 'Order cancelled successfully!'
          : lang === 'zh'
          ? '订单已成功取消！'
          : 'Đã hủy đơn hàng thành công!'
      );
      if (selectedCashOrder?._id === order._id) {
        setSelectedCashOrder(null);
      }
      setOrderToCancel(null);
    } catch (err: any) {
      toast.error(err.message || (lang === 'en' ? 'Error cancelling order' : 'Lỗi khi hủy đơn hàng.'));
    } finally {
      setCancellingOrderId(null);
    }
  };

  const handleNotifyStaffCash = async (order: any) => {
    if (isCallingCashStaff) return;
    setIsCallingCashStaff(true);
    try {
      const devId = typeof window !== 'undefined' ? localStorage.getItem('kohi_device_id') || 'dev_guest' : 'dev_guest';
      const cName = order?.customerName || 'Khách';
      const API_BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1')
        .trim()
        .replace(/[\r\n\t]+/g, '')
        .replace(/\/+$/, '');

      const res = await fetch(`${API_BASE}/staff-calls`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tableId,
          tableName: table?.tableName || 'Bàn',
          customerName: cName,
          deviceId: devId,
          type: 'bill',
          message: `Khách yêu cầu thanh toán tiền mặt (${formatPrice(order.totalAmount || 0, lang)})`,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to notify');
      }

      toast.success(
        lang === 'en'
          ? 'Staff notified! A waiter will come to collect cash.'
          : 'Đã báo nhân viên! Phục vụ sẽ đến bàn nhận tiền mặt ngay.'
      );
      setSelectedCashOrder(null);
    } catch {
      toast.error(
        lang === 'en'
          ? 'Unable to notify staff. Please call waiter directly.'
          : 'Không thể gửi yêu cầu lúc này. Vui lòng gọi trực tiếp nhân viên.'
      );
    } finally {
      setIsCallingCashStaff(false);
    }
  };

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
            role="dialog"
            aria-modal="true"
            aria-labelledby="order-history-title"
            initial={{ scale: 0.96, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.96, opacity: 0, y: 10 }}
            transition={{ type: 'spring', stiffness: 450, damping: 32 }}
            className="relative w-full max-w-xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-white/10 rounded-2xl p-4 sm:p-7 shadow-2xl z-10 max-h-[90vh] flex flex-col font-sans text-left"
          >
            {/* Header */}
            <div className="flex items-start justify-between pb-4 border-b border-slate-200 dark:border-white/10 shrink-0">
              <div>
                <h3 id="order-history-title" className="text-lg font-bold text-slate-900 dark:text-white font-heading tracking-tight">
                  {lang === 'en' ? 'Order History' : lang === 'zh' ? '订单历史' : 'Lịch sử đơn hàng'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-2 font-medium">
                  <span>{table?.tableName ? (lang === 'en' ? `Table ${table.tableName}` : lang === 'zh' ? `桌号 ${table.tableName}` : `Bàn số ${table.tableName}`) : (lang === 'en' ? 'Table' : lang === 'zh' ? '桌号' : 'Bàn')}</span>
                  <span>•</span>
                  <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" aria-hidden="true" />
                    {lang === 'en' ? 'Live updates' : lang === 'zh' ? '实时更新' : 'Cập nhật trực tiếp'}
                  </span>
                </p>
              </div>

              <button
                onClick={() => setIsOrderHistoryModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white flex items-center justify-center transition-all cursor-pointer active:scale-95"
                title={lang === 'en' ? 'Close order history' : lang === 'zh' ? '关闭订单历史' : 'Đóng lịch sử đơn hàng'}
                aria-label={lang === 'en' ? 'Close order history' : lang === 'zh' ? '关闭订单历史' : 'Đóng lịch sử đơn hàng'}
              >
                <span className="material-symbols-outlined text-lg" aria-hidden="true">close</span>
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto py-4 space-y-4 scrollbar-none pr-1">
              {activeOrders.length === 0 ? (
                <div className="py-12 text-center text-slate-500">
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {lang === 'en' ? 'No orders placed yet' : lang === 'zh' ? '暂无订单' : 'Chưa có đơn đặt nào'}
                  </p>
                  <p className="text-xs font-normal max-w-xs mx-auto text-slate-500">
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
                        <span className="font-bold text-slate-700 dark:text-slate-200">
                          {lang === 'en' ? 'Group:' : lang === 'zh' ? '同桌:' : 'Thành viên:'}
                        </span>
                        {Object.entries(nameCounts).map(([name, count]) => (
                          <span
                            key={name}
                            className="px-2.5 py-0.5 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 rounded-full text-[11px] font-bold"
                          >
                            {name} <span className="text-slate-500 dark:text-slate-400 font-normal">({count} món)</span>
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
                        className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 rounded-xl p-4 space-y-3 shadow-xs hover:border-blue-500/40 transition-all"
                      >
                        {/* Order Card Header */}
                        <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-slate-200 dark:border-white/10">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-extrabold text-slate-900 dark:text-slate-200 font-sans">
                                {lang === 'en' ? 'Order' : lang === 'zh' ? '订单' : 'Mã đơn'}: #{order._id ? order._id.slice(-6).toUpperCase() : idx + 1}
                              </span>
                              {order.customerName && (
                                <span className="px-2 py-0.5 bg-blue-500/15 text-blue-600 dark:text-blue-400 text-[10.5px] font-extrabold rounded-md font-sans">
                                  {order.customerName}
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 block font-sans">
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
                              <span className="px-2.5 py-1 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[11px] font-bold border border-emerald-500/30 rounded-full font-sans">
                                {lang === 'en' ? 'Paid' : lang === 'zh' ? '已结账' : 'Đã thanh toán'}
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 bg-rose-500/15 text-rose-600 dark:text-rose-400 text-[11px] font-bold border border-rose-500/30 rounded-full font-sans">
                                {lang === 'en' ? 'Unpaid' : lang === 'zh' ? '未支付' : 'Chưa thanh toán'}
                              </span>
                            )}

                            {/* Kitchen Status Badge */}
                            <div className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${statusInfo.color} flex items-center gap-1.5 font-sans`}>
                              {statusInfo.step === 2 && (
                                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-spin" />
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
                              <div key={i} className="flex justify-between items-start text-xs text-slate-700 dark:text-slate-200 font-sans">
                                <div>
                                  <span className="font-bold">{itemName}</span>
                                  <span className="text-slate-500 dark:text-slate-400 font-medium ml-2">x{item.quantity}</span>
                                  {item.note && (
                                    <p className="text-[11px] text-slate-500 dark:text-slate-400 italic">
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
                        <div className="pt-2.5 border-t border-slate-200 dark:border-white/10 flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-medium font-sans">
                              {lang === 'en' ? 'Subtotal:' : lang === 'zh' ? '小计:' : 'Tổng đợt:'}
                            </span>
                            <span className="text-sm font-bold text-[#0284c7] dark:text-sky-400 font-sans font-mono">
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

                            {/* Pay Button or Pending Status (if unpaid) */}
                            {!isPaid && (
                              order.status === 'pending' ? (
                                <div className="flex items-center gap-1.5">
                                  <span className="h-8 px-3 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-bold inline-flex items-center font-sans border border-amber-500/20">
                                    {lang === 'en' ? 'Pending Approval' : lang === 'zh' ? '等待确认' : 'Chờ phục vụ duyệt'}
                                  </span>
                                  <button
                                    id={`btn-cancel-order-${order._id}`}
                                    onClick={() => handleCancelOrder(order)}
                                    disabled={cancellingOrderId === order._id}
                                    className="h-8 px-2.5 bg-rose-500/10 hover:bg-rose-500/20 active:bg-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-bold rounded-xl transition-all active:scale-95 cursor-pointer inline-flex items-center gap-1 font-sans border border-rose-500/20 disabled:opacity-50"
                                    title={lang === 'en' ? 'Cancel this order' : 'Hủy đơn hàng này'}
                                  >
                                    <span className="material-symbols-outlined text-[15px]">close</span>
                                    <span>{cancellingOrderId === order._id ? (lang === 'en' ? 'Cancelling...' : 'Đang hủy...') : (lang === 'en' ? 'Cancel' : lang === 'zh' ? '取消' : 'Hủy')}</span>
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => {
                                    if (order.paymentMethod === 'bank_transfer' || order.paymentMethod === 'momo') {
                                      if (onOpenBankPayModal) {
                                        onOpenBankPayModal(order);
                                      } else {
                                        router.push(`/table/${tableId}/order-status/${order._id}`);
                                      }
                                    } else {
                                      // Cash payment: open cash guidance modal
                                      setSelectedCashOrder(order);
                                    }
                                  }}
                                  className={`h-8 px-3.5 text-white text-xs font-bold rounded-xl transition-all active:scale-95 cursor-pointer shadow-sm inline-flex items-center gap-1 font-sans ${
                                    order.paymentMethod === 'cash'
                                      ? 'bg-amber-600 hover:bg-amber-700'
                                      : 'bg-[#3B82F6] hover:bg-blue-600'
                                  }`}
                                >
                                  <span className="material-symbols-outlined text-[15px]">
                                    {order.paymentMethod === 'cash' ? 'payments' : 'qr_code_2'}
                                  </span>
                                  <span>
                                    {order.paymentMethod === 'cash'
                                      ? (lang === 'en' ? 'Pay Cash' : lang === 'zh' ? '现金支付' : 'Tiền mặt')
                                      : (lang === 'en' ? 'Pay QR' : lang === 'zh' ? '扫码支付' : 'Chuyển khoản')}
                                  </span>
                                </button>
                              )
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
            <div className="pt-4 border-t border-slate-200 dark:border-white/10 flex items-center justify-between gap-3 shrink-0">
              <div>
                <span className="text-xs text-slate-500 dark:text-slate-400 block font-medium font-sans">
                  {lang === 'en' ? 'Total Session Balance:' : lang === 'zh' ? '本桌累计:' : 'Tổng cộng cả buổi:'}
                </span>
                <span className="text-lg sm:text-xl font-bold text-[#0284c7] dark:text-sky-400 tracking-tight font-sans font-mono">
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
                    const isCash = latestUnpaid.paymentMethod === 'cash';

                    return (
                      <button
                        onClick={() => {
                          if (isCash) {
                            setSelectedCashOrder(latestUnpaid);
                          } else {
                            if (onOpenBankPayModal) {
                              onOpenBankPayModal(latestUnpaid);
                            } else {
                              router.push(`/table/${tableId}/order-status/${latestUnpaid._id}`);
                            }
                          }
                        }}
                        className={`h-10 px-5 text-white font-bold rounded-xl text-xs tracking-wide transition-all shadow-md active:scale-95 cursor-pointer inline-flex items-center gap-1.5 font-sans ${
                          isCash ? 'bg-amber-600 hover:bg-amber-700' : 'bg-[#3B82F6] hover:bg-blue-600'
                        }`}
                      >
                        <span className="material-symbols-outlined text-base">
                          {isCash ? 'payments' : 'qr_code_2'}
                        </span>
                        <span>
                          {isCash
                            ? (lang === 'en' ? 'Pay Cash' : lang === 'zh' ? '现金支付' : 'Thanh toán Tiền mặt')
                            : (lang === 'en' ? 'Pay QR' : lang === 'zh' ? '扫码支付' : 'Thanh toán VietQR')}
                        </span>
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

      {/* Cash Payment Guidance & Confirmation Dialog */}
      <AnimatePresence>
        {selectedCashOrder && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 sm:p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedCashOrder(null)}
              className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs"
            />
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="cash-guidance-title"
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              transition={{ type: 'spring', stiffness: 450, damping: 30 }}
              className="relative w-full max-w-md bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-white/10 rounded-2xl p-6 shadow-2xl z-10 font-sans text-left space-y-4"
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-white/10">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center" aria-hidden="true">
                    <span className="material-symbols-outlined text-xl">payments</span>
                  </div>
                  <div>
                    <h4 id="cash-guidance-title" className="text-sm font-bold text-slate-900 dark:text-white">
                      {lang === 'en' ? 'Cash Payment' : lang === 'zh' ? '现金支付' : 'Thanh toán Tiền mặt'}
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      #{selectedCashOrder._id ? selectedCashOrder._id.slice(-6).toUpperCase() : ''} • {formatTableName(table?.tableName, lang)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedCashOrder(null)}
                  className="w-8 h-8 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-white flex items-center justify-center text-lg cursor-pointer"
                  aria-label={lang === 'en' ? 'Close cash payment modal' : lang === 'zh' ? '关闭现金支付窗口' : 'Đóng cửa sổ thanh toán tiền mặt'}
                >
                  ×
                </button>
              </div>

              {/* Amount Box */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-white/10 flex items-center justify-between">
                <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                  {lang === 'en' ? 'Amount to pay:' : 'Tổng tiền cần thanh toán:'}
                </span>
                <span className="text-lg font-bold text-[#0284c7] dark:text-sky-400 font-mono">
                  {formatPrice(selectedCashOrder.totalAmount || 0, lang)}
                </span>
              </div>

              {/* Status & Instructions */}
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-800 dark:text-amber-300 space-y-1">
                <p className="font-semibold flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-base">info</span>
                  <span>
                    {selectedCashOrder.status === 'pending'
                      ? (lang === 'en' ? 'Order is pending approval' : 'Đơn hàng đang chờ duyệt')
                      : (lang === 'en' ? 'Please pay with cash' : 'Thanh toán tiền mặt')}
                  </span>
                </p>
                <p className="text-[11.5px] leading-relaxed text-slate-600 dark:text-slate-300">
                  {selectedCashOrder.status === 'pending'
                    ? (lang === 'en'
                        ? 'Your order is being reviewed by staff. You can pay cash at table once served or at the cashier counter.'
                        : 'Đơn hàng đang chờ phục vụ duyệt. Nhân viên sẽ mang món ra bàn và quý khách có thể thanh toán tiền mặt trực tiếp hoặc tại quầy thu ngân.')
                    : (lang === 'en'
                        ? 'Please pay cash to staff at your table or at the cashier counter.'
                        : 'Quý khách vui lòng thanh toán trực tiếp tại quầy thu ngân hoặc bấm gọi nhân viên để thanh toán tiền mặt tại bàn.')}
                </p>
              </div>

              {/* Actions */}
              <div className="space-y-2 pt-1">
                {selectedCashOrder.status === 'pending' && (
                  <button
                    onClick={() => handleCancelOrder(selectedCashOrder)}
                    disabled={cancellingOrderId === selectedCashOrder._id}
                    className="w-full py-2.5 bg-rose-500/10 hover:bg-rose-500/20 active:bg-rose-500/30 text-rose-600 dark:text-rose-400 font-bold text-xs rounded-xl transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1.5 border border-rose-500/20 disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined text-base">close</span>
                    <span>
                      {cancellingOrderId === selectedCashOrder._id
                        ? (lang === 'en' ? 'Cancelling...' : 'Đang hủy đơn...')
                        : (lang === 'en' ? 'Cancel this order' : 'Hủy đơn hàng này')}
                    </span>
                  </button>
                )}

                <button
                  onClick={() => handleNotifyStaffCash(selectedCashOrder)}
                  disabled={isCallingCashStaff}
                  className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold text-xs rounded-xl transition-all shadow-sm active:scale-95 cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-base">notifications_active</span>
                  <span>
                    {isCallingCashStaff
                      ? (lang === 'en' ? 'Sending...' : 'Đang gửi...')
                      : (lang === 'en' ? 'Call staff to collect cash' : 'Báo nhân viên thu tiền mặt tại bàn')}
                  </span>
                </button>

                <button
                  onClick={() => {
                    const orderToPay = selectedCashOrder;
                    setSelectedCashOrder(null);
                    if (onOpenBankPayModal) {
                      onOpenBankPayModal(orderToPay);
                    }
                  }}
                  className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1.5 border border-slate-200 dark:border-white/10"
                >
                  <span className="material-symbols-outlined text-base">qr_code_2</span>
                  <span>{lang === 'en' ? 'Switch to VietQR bank transfer' : 'Đổi sang Chuyển khoản VietQR'}</span>
                </button>

                <button
                  onClick={() => {
                    const orderId = selectedCashOrder._id;
                    setSelectedCashOrder(null);
                    setIsOrderHistoryModalOpen(false);
                    router.push(`/table/${tableId}/order-status/${orderId}`);
                  }}
                  className="w-full py-2 text-center text-xs font-semibold text-sky-600 dark:text-sky-400 hover:underline cursor-pointer"
                >
                  {lang === 'en' ? 'View order details & status' : 'Xem chi tiết đơn hàng & tiến độ'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Food Review Modal */}
      <FoodReviewModal
        isOpen={Boolean(reviewingOrder)}
        onClose={() => setReviewingOrder(null)}
        order={reviewingOrder}
        tableId={tableId}
        formatPrice={formatPrice}
        lang={lang}
      />

      {/* Cancel Order Confirmation Modal */}
      <CancelOrderModal
        isOpen={Boolean(orderToCancel)}
        onClose={() => setOrderToCancel(null)}
        onConfirm={() => {
          if (orderToCancel) {
            handleCancelOrder(orderToCancel, true);
          }
        }}
        orderCode={orderToCancel?._id ? `#${orderToCancel._id.slice(-6).toUpperCase()}` : ''}
        orderTotal={orderToCancel?.totalAmount}
        itemCount={orderToCancel?.items?.length}
        tableName={table ? formatTableName(table.tableName, lang) : undefined}
        isCancelling={cancellingOrderId === orderToCancel?._id}
        lang={lang}
      />
    </AnimatePresence>
  );
};
