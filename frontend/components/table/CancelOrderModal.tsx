'use client';
import { AppIcon } from '@/components/common/DashboardIcon';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

type Lang = 'vi' | 'en' | 'zh';

export interface CancelOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  orderCode?: string;
  orderTotal?: number;
  itemCount?: number;
  tableName?: string;
  isCancelling?: boolean;
  lang?: Lang;
}

export const CancelOrderModal: React.FC<CancelOrderModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  orderCode,
  orderTotal,
  itemCount,
  tableName,
  isCancelling = false,
  lang = 'vi',
}) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(lang === 'vi' ? 'vi-VN' : 'en-US', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 font-sans select-none">
          {/* Backdrop with Glassmorphism */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={!isCancelling ? onClose : undefined}
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-md"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 16 }}
            transition={{ type: 'spring', damping: 26, stiffness: 360 }}
            className="relative w-full max-w-sm bg-white dark:bg-[#0E121B] border border-slate-200/80 dark:border-rose-500/20 rounded-3xl p-5 sm:p-6 shadow-2xl z-10 text-center overflow-hidden"
          >
            {/* Ambient Background Glow */}
            <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-48 h-32 bg-rose-500/10 dark:bg-rose-500/15 rounded-full blur-2xl pointer-events-none" />

            {/* Warning Icon Badge */}
            <div className="relative mx-auto w-14 h-14 rounded-2xl bg-rose-500/10 dark:bg-rose-500/15 border border-rose-500/25 flex items-center justify-center text-rose-500 shadow-inner mb-3.5">
              <AppIcon name="warning" className="text-3xl animate-pulse" />
            </div>

            {/* Title */}
            <h3 className="text-lg font-black tracking-tight text-slate-900 dark:text-white">
              {lang === 'en'
                ? 'Cancel this order?'
                : lang === 'zh'
                ? '取消此订单？'
                : 'Xác nhận hủy đơn hàng'}
            </h3>

            {/* Order Snippet Info Box (if available) */}
            {(orderCode || orderTotal !== undefined || tableName) && (
              <div className="mt-3 py-2.5 px-3.5 bg-slate-50 dark:bg-white/5 border border-slate-200/70 dark:border-white/10 rounded-2xl flex items-center justify-between text-xs">
                <div className="text-left">
                  {orderCode && (
                    <span className="font-mono font-black text-rose-600 dark:text-rose-400 block text-xs">
                      {orderCode}
                    </span>
                  )}
                  {tableName && (
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 font-normal">
                      {tableName}
                    </span>
                  )}
                </div>

                <div className="text-right">
                  {orderTotal !== undefined && (
                    <span className="font-mono font-black text-slate-900 dark:text-white block text-xs">
                      {formatCurrency(orderTotal)}
                    </span>
                  )}
                  {itemCount !== undefined && itemCount > 0 && (
                    <span className="text-[10.5px] text-slate-400 font-normal">
                      {itemCount} {lang === 'en' ? 'items' : lang === 'zh' ? '件商品' : 'món'}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Description */}
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-3 leading-relaxed font-normal">
              {lang === 'en'
                ? 'Are you sure you want to cancel this order? Kitchen and service staff will be notified to stop preparation.'
                : lang === 'zh'
                ? '您确定要取消此订单吗？厨房和服务人员将收到通知停止准备。'
                : 'Bạn có chắc chắn muốn hủy đơn hàng này không? Yêu cầu sẽ thông báo đến nhân viên phục vụ để dừng phục vụ món.'}
            </p>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-2.5 mt-5">
              <button
                type="button"
                onClick={onClose}
                disabled={isCancelling}
                className="h-10 px-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-black rounded-xl text-xs transition-all active:scale-95 cursor-pointer disabled:opacity-50"
              >
                {lang === 'en' ? 'Keep Order' : lang === 'zh' ? '保留订单' : 'Giữ lại đơn'}
              </button>

              <button
                type="button"
                id="btn-confirm-cancel-order"
                onClick={onConfirm}
                disabled={isCancelling}
                className="h-10 px-3 bg-rose-500 hover:bg-rose-600 text-white font-black rounded-xl text-xs shadow-md shadow-rose-500/25 transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {isCancelling ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>{lang === 'en' ? 'Cancelling...' : 'Đang hủy...'}</span>
                  </>
                ) : (
                  <>
                    <AppIcon name="close" className="text-[15px]" />
                    <span>{lang === 'en' ? 'Cancel Order' : lang === 'zh' ? '确认取消' : 'Hủy đơn'}</span>
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
