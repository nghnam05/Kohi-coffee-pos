'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Table {
  _id: string;
  tableName: string;
  status: string;
}

interface SplitBillModalProps {
  isOpen: boolean;
  onClose: () => void;
  table: Table | null;
  activeOrders: any[];
  formatPrice: (price: number, lang: any) => string;
  lang?: any;
}

export const SplitBillModal: React.FC<SplitBillModalProps> = ({
  isOpen,
  onClose,
  table,
  activeOrders,
  formatPrice,
  lang = 'vi',
}) => {
  const [splitMode, setSplitMode] = useState<'all' | 'by_member' | 'equal' | 'custom'>('by_member');
  const [equalPeopleCount, setEqualPeopleCount] = useState<number>(2);
  const [selectedItemKeys, setSelectedItemKeys] = useState<string[]>([]);
  const [copiedText, setCopiedText] = useState(false);
  const [activePaymentData, setActivePaymentData] = useState<{ name: string; amount: number; method: 'momo' | 'cash' } | null>(null);

  // Track paid members per table
  const [paidMembers, setPaidMembers] = useState<string[]>([]);

  // Load paid members state from localStorage
  useEffect(() => {
    if (table?._id) {
      const saved = localStorage.getItem(`kohi_paid_members_${table._id}`);
      if (saved) {
        try {
          setPaidMembers(JSON.parse(saved));
        } catch (e) {
          console.error(e);
        }
      }
    }
  }, [table?._id, isOpen]);

  // Send realtime staff call notification when customer opens split bill payment modal
  useEffect(() => {
    if (isOpen && table?._id) {
      const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
      fetch(`${API_BASE}/staff-calls`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tableId: table._id,
          message: `Yêu cầu thanh toán — ${table.tableName || 'Bàn đặt'}`,
        }),
      }).catch(() => {});
    }
  }, [isOpen, table?._id]);

  // Mark a member as paid
  const handleMarkPaid = (memberName: string) => {
    setPaidMembers((prev) => {
      if (prev.includes(memberName)) return prev;
      const updated = [...prev, memberName];
      if (table?._id) {
        localStorage.setItem(`kohi_paid_members_${table._id}`, JSON.stringify(updated));
      }
      return updated;
    });
  };

  if (!isOpen) return null;

  // Check if ALL active orders have completed preparation/serving
  const isReadyForPayment = activeOrders.length > 0 && activeOrders.every(
    (o) => ['ready', 'served', 'completed', 'paid'].includes(o.status)
  );

  // Infer payment method from order history (selected prior to ordering)
  const primaryPaymentMethod = activeOrders.length > 0
    ? (activeOrders[0].paymentMethod || 'momo')
    : 'momo';
  const isMomo = primaryPaymentMethod === 'momo' || primaryPaymentMethod === 'qr';

  // Helper to extract food name reliably from various backend populate structures
  const getItemName = (item: any): string => {
    if (item.food?.name) return item.food.name;
    if (typeof item.foodId === 'object' && item.foodId?.name) return item.foodId.name;
    if (item.foodName) return item.foodName;
    if (item.name) return item.name;
    return 'Món ăn';
  };

  // Helper to extract unit price reliably
  const getItemUnitPrice = (item: any): number => {
    if (typeof item.unitPrice === 'number' && item.unitPrice > 0) return item.unitPrice;
    if (typeof item.price === 'number' && item.price > 0) return item.price;
    if (typeof item.foodId === 'object' && typeof item.foodId?.price === 'number') return item.foodId.price;
    if (typeof item.food?.price === 'number') return item.food.price;
    return 0;
  };

  // Helper to extract specific member name for an item from note or addedBy
  const getMemberForItem = (item: any, orderCustomerName: string): string => {
    if (item.addedBy && typeof item.addedBy === 'string' && item.addedBy.trim()) {
      return item.addedBy.trim();
    }
    if (item.note && typeof item.note === 'string') {
      const match = item.note.match(/^\[([^\]]+)\]/);
      if (match && match[1] && match[1].trim()) {
        return match[1].trim();
      }
    }
    if (orderCustomerName && !orderCustomerName.includes(',')) {
      return orderCustomerName.trim();
    }
    return 'Khách tại bàn';
  };

  // Helper to clean note for clean display (removes [MemberName] prefix)
  const getCleanNote = (note?: string): string => {
    if (!note) return '';
    return note.replace(/^\[[^\]]+\]\s*/, '').trim();
  };

  // Total session amount for the table
  const totalTableAmount = activeOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);

  // Group items INDIVIDUALLY by member (extracting [Member] from note/addedBy)
  const memberGroupMap: Record<string, { items: any[]; total: number }> = {};
  activeOrders.forEach((o) => {
    const defaultCustName = o.customerName || 'Khách tại bàn';
    const orderItems = o.items || [];
    orderItems.forEach((item: any) => {
      const memberName = getMemberForItem(item, defaultCustName);
      if (!memberGroupMap[memberName]) {
        memberGroupMap[memberName] = { items: [], total: 0 };
      }
      const uPrice = getItemUnitPrice(item);
      const itemTotal = uPrice * item.quantity;
      const resolvedName = getItemName(item);
      const cleanNote = getCleanNote(item.note);
      memberGroupMap[memberName].items.push({
        ...item,
        resolvedName,
        cleanNote,
        resolvedUnitPrice: uPrice,
        resolvedTotal: itemTotal,
      });
      memberGroupMap[memberName].total += itemTotal;
    });
  });

  const memberEntries = Object.entries(memberGroupMap);

  // Flatten all items for custom selection mode
  const allFlattenedItems: { key: string; name: string; quantity: number; price: number; customerName: string }[] = [];
  activeOrders.forEach((o, oIdx) => {
    (o.items || []).forEach((item: any, iIdx: number) => {
      const key = `${o._id || oIdx}-${iIdx}`;
      const uPrice = getItemUnitPrice(item);
      const price = uPrice * item.quantity;
      const memberName = getMemberForItem(item, o.customerName || 'Khách tại bàn');
      allFlattenedItems.push({
        key,
        name: getItemName(item),
        quantity: item.quantity,
        price,
        customerName: memberName,
      });
    });
  });

  // Calculate custom selection total
  const customSelectedTotal = allFlattenedItems
    .filter((item) => selectedItemKeys.includes(item.key))
    .reduce((sum, item) => sum + item.price, 0);

  // Toggle item selection
  const toggleSelectItem = (key: string) => {
    setSelectedItemKeys((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  // Trigger Payment (MoMo or Cash)
  const handleInitiatePayment = (name: string, amount: number, method: 'momo' | 'cash' = 'momo') => {
    if (!isReadyForPayment) return;
    setActivePaymentData({ name, amount, method });
  };

  // Generate copy text for group chat (Zalo / Messenger)
  const handleCopyBreakdown = () => {
    let text = `KOHI COFFEE - ${table?.tableName || 'Bàn đặt'}\n`;
    text += `-----------------------------\n`;
    text += `TỔNG HÓA ĐƠN BÀN: ${formatPrice(totalTableAmount, lang)}\n\n`;

    if (memberEntries.length > 0) {
      text += `CHIA THEO THÀNH VIÊN:\n`;
      memberEntries.forEach(([name, data]) => {
        const isPaid = paidMembers.includes(name);
        text += `• Khách ${name}: ${formatPrice(data.total, lang)} ${isPaid ? '[ĐÃ THANH TOÁN]' : '[CHƯA THANH TOÁN]'}\n`;
        data.items.forEach((item) => {
          text += `   - ${item.quantity}x ${item.resolvedName}\n`;
        });
      });
      text += `\n`;
    }

    const equalAmount = Math.ceil(totalTableAmount / Math.max(1, equalPeopleCount));
    text += `CHIA ĐỀU (${equalPeopleCount} người): ${formatPrice(equalAmount, lang)} / người\n`;
    text += `-----------------------------\n`;
    text += `STK Chuyển Khoản: 0123456789 (MBBank - Kohi Coffee)\n`;
    text += `Nội dung: ${table?.tableName || 'Ban'} chia bill`;

    navigator.clipboard.writeText(text);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2500);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 select-none">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/75 backdrop-blur-sm"
        />

        {/* Modal Card */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          className="relative w-full max-w-xl bg-[#FFFFFF] dark:bg-[#181B21] border border-[var(--border-color)] rounded-[var(--radius-lg)] p-5 sm:p-6 shadow-2xl z-10 max-h-[90vh] flex flex-col font-sans overflow-hidden text-left"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-4 mb-3 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center border border-emerald-500/20">
                <span className="material-symbols-outlined text-xl">payments</span>
              </div>
              <div>
                <h3 className="text-lg font-bold text-[var(--text-primary)] leading-tight">
                  Thanh toán — {table?.tableName || 'Bàn đặt'}
                </h3>
                <p className="text-xs font-medium text-[var(--text-secondary)] mt-0.5">
                  Thanh toán toàn bộ, theo từng người hoặc chia đều dễ dàng
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-[var(--bg-primary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-color)] flex items-center justify-center transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-base">close</span>
            </button>
          </div>

          {/* Kitchen Order Status Warning Banner if not ready */}
          {!isReadyForPayment && (
            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-start gap-2.5 text-xs text-amber-500 mb-3 shrink-0">
              <span className="material-symbols-outlined text-lg shrink-0 mt-0.5">hourglass_top</span>
              <div>
                <span className="font-bold block">Đơn hàng đang được Bếp / Barista chế biến</span>
                <span className="text-[11px] opacity-90 leading-tight block mt-0.5">
                  Bạn có thể tính tiền riêng từng người, chia đều hoặc sao chép nội dung Zalo / Mess bên dưới để chuyển khoản trước hoặc sau khi món ra xong.
                </span>
              </div>
            </div>
          )}

          {/* Cash Payment Notice Box on Customer Side (No button when cash) */}
          {!isMomo && (
            <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-start gap-3 text-xs text-amber-500 mb-3 shrink-0">
              <span className="material-symbols-outlined text-xl shrink-0 mt-0.5">payments</span>
              <div>
                <span className="font-bold block text-amber-500">Thanh toán bằng Tiền Mặt</span>
                <span className="text-[11px] text-[var(--text-secondary)] opacity-90 leading-relaxed block mt-0.5">
                  Đơn hàng đăng ký thanh toán bằng <strong>Tiền mặt</strong>. Vui lòng thanh toán trực tiếp tại quầy thu ngân cho nhân viên để hoàn tất.
                </span>
              </div>
            </div>
          )}

          {/* Mode Selector Tabs */}
          <div className="grid grid-cols-4 gap-1.5 bg-[var(--bg-primary)] p-1.5 rounded-xl border border-[var(--border-color)] mb-4 shrink-0 text-xs font-bold">
            <button
              onClick={() => setSplitMode('by_member')}
              className={`py-2 px-1.5 rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer ${
                splitMode === 'by_member'
                  ? 'bg-[var(--brand-primary)] text-white shadow-md'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <span className="material-symbols-outlined text-base">person</span>
              <span className="truncate">Theo người</span>
            </button>
            <button
              onClick={() => setSplitMode('all')}
              className={`py-2 px-1.5 rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer ${
                splitMode === 'all'
                  ? 'bg-[var(--brand-primary)] text-white shadow-md'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <span className="material-symbols-outlined text-base">receipt_long</span>
              <span className="truncate">Tất cả</span>
            </button>
            <button
              onClick={() => setSplitMode('equal')}
              className={`py-2 px-1.5 rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer ${
                splitMode === 'equal'
                  ? 'bg-[var(--brand-primary)] text-white shadow-md'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <span className="material-symbols-outlined text-base">group</span>
              <span className="truncate">Chia đều</span>
            </button>
            <button
              onClick={() => setSplitMode('custom')}
              className={`py-2 px-1.5 rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer ${
                splitMode === 'custom'
                  ? 'bg-[var(--brand-primary)] text-white shadow-md'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <span className="material-symbols-outlined text-base">checklist</span>
              <span className="truncate">Tự chọn</span>
            </button>
          </div>

          {/* Modal Content Body */}
          <div className="flex-1 overflow-y-auto scrollbar-none space-y-4 pr-1">
            {/* MODE 1: BY MEMBER ("Của ai trả của người đó" - INDIVIDUAL CARDS) */}
            {splitMode === 'by_member' && (
              <div className="space-y-3">
                <p className="text-xs font-semibold text-[var(--text-secondary)]">
                  Danh sách món ăn & số tiền riêng biệt của từng thành viên:
                </p>
                {memberEntries.length === 0 ? (
                  <p className="text-xs text-center py-6 text-[var(--text-secondary)]">
                    Chưa có thành viên nào đặt món.
                  </p>
                ) : (
                  memberEntries.map(([name, data]) => {
                    const isPaid = paidMembers.includes(name);
                    return (
                      <div
                        key={name}
                        className={`border rounded-xl p-4 shadow-sm space-y-2.5 transition-all ${
                          isPaid
                            ? 'bg-emerald-500/5 border-emerald-500/30'
                            : 'bg-[var(--bg-primary)] border-[var(--border-color)]'
                        }`}
                      >
                        <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-2">
                          <div className="flex items-center gap-2">
                            <span className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${
                              isPaid ? 'bg-emerald-500 text-white' : 'bg-[var(--brand-primary)]/10 text-[var(--brand-primary)]'
                            }`}>
                              <span className="material-symbols-outlined text-sm">
                                {isPaid ? 'check' : 'person'}
                              </span>
                            </span>
                            <span className="text-xs font-bold text-[var(--text-primary)]">
                              {name}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            {isPaid ? (
                              <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-500 border border-emerald-500/30 rounded-lg text-xs font-extrabold flex items-center gap-1">
                                <span className="material-symbols-outlined text-sm">check_circle</span>
                                Đã thanh toán
                              </span>
                            ) : (
                              <span className="text-sm font-extrabold text-[var(--brand-primary)]">
                                {formatPrice(data.total, lang)}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Items listed specifically for this member */}
                        <div className="space-y-1.5 pt-1">
                          {data.items.map((item: any, i: number) => (
                            <div key={i} className="flex justify-between items-center text-xs">
                              <div className="truncate pr-2">
                                <span className="text-[var(--text-primary)] font-medium">
                                  • {item.quantity}x {item.resolvedName}
                                </span>
                                {item.cleanNote && (
                                  <span className="text-[11px] text-[var(--text-secondary)] italic block pl-3">
                                    Ghi chú: {item.cleanNote}
                                  </span>
                                )}
                              </div>
                              <span className="font-semibold text-[var(--text-primary)] shrink-0">
                                {formatPrice(item.resolvedTotal, lang)}
                              </span>
                            </div>
                          ))}
                        </div>

                        {/* Action Buttons for this member */}
                        <div className="pt-2 flex gap-2">
                          {isPaid ? (
                            <button
                              disabled
                              className="w-full py-2 bg-emerald-500/20 text-emerald-500 border border-emerald-500/30 rounded-lg text-xs font-extrabold flex items-center justify-center gap-1.5 opacity-90 cursor-default"
                            >
                              <span className="material-symbols-outlined text-base">verified</span>
                              <span>Thành viên này đã hoàn tất thanh toán</span>
                            </button>
                          ) : (
                            <>
                              <button
                                disabled={!isReadyForPayment}
                                onClick={() => handleInitiatePayment(name, data.total, 'momo')}
                                className={`flex-1 py-2 border rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                                  !isReadyForPayment
                                    ? 'bg-gray-500/10 text-gray-400 border-gray-500/20 cursor-not-allowed opacity-60'
                                    : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 border-emerald-500/30 cursor-pointer active:scale-95'
                                }`}
                              >
                                <span className="material-symbols-outlined text-base">
                                  {!isReadyForPayment ? 'hourglass_empty' : 'qr_code_2'}
                                </span>
                                <span>
                                  {!isReadyForPayment
                                    ? 'Bếp đang làm...'
                                    : `MoMo QR ${formatPrice(data.total, lang)}`}
                                </span>
                              </button>

                              <button
                                disabled={!isReadyForPayment}
                                onClick={() => handleInitiatePayment(name, data.total, 'cash')}
                                className={`px-3 py-2 border rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-all ${
                                  !isReadyForPayment
                                    ? 'bg-gray-500/10 text-gray-400 border-gray-500/20 cursor-not-allowed opacity-60'
                                    : 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 border-amber-500/30 cursor-pointer active:scale-95'
                                }`}
                              >
                                <span className="material-symbols-outlined text-base">payments</span>
                                <span>Tiền mặt</span>
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* MODE 0: PAY ALL ("Thanh toán tất cả toàn bàn") */}
            {splitMode === 'all' && (
              <div className="space-y-4 py-1">
                <div className="bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl p-4 space-y-4 shadow-sm">
                  <div className="flex justify-between items-center border-b border-[var(--border-color)] pb-3">
                    <div>
                      <p className="text-xs text-[var(--text-secondary)] font-semibold uppercase tracking-wider">
                        Tổng tiền thanh toán tất cả toàn bàn:
                      </p>
                      <p className="text-2xl font-black text-emerald-500 mt-0.5">
                        {formatPrice(totalTableAmount, lang)}
                      </p>
                    </div>
                    <span className="px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-500 text-xs font-bold border border-emerald-500/20 flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">receipt_long</span>
                      {activeOrders.length} đợt gọi
                    </span>
                  </div>

                  {/* List of active order rounds */}
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {activeOrders.map((o, idx) => (
                      <div key={o._id || idx} className="p-3 rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)] text-xs space-y-1.5">
                        <div className="flex justify-between font-bold text-[var(--text-primary)] border-b border-[var(--border-color)] pb-1">
                          <span className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-sm text-[var(--brand-primary)]">label</span>
                            Đợt #{idx + 1} ({o.customerName || 'Khách tại bàn'})
                          </span>
                          <span className="text-[var(--brand-primary)] font-extrabold">{formatPrice(o.totalAmount || 0, lang)}</span>
                        </div>
                        <div className="text-[12px] text-[var(--text-secondary)] space-y-1 pt-0.5">
                          {(o.items || []).map((it: any, i: number) => {
                            const uPrice = getItemUnitPrice(it);
                            return (
                              <div key={i} className="flex justify-between items-center">
                                <span>• {it.quantity}x {getItemName(it)}</span>
                                <span className="font-semibold text-[var(--text-primary)]">{formatPrice(uPrice * it.quantity, lang)}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Payment button only when MoMo */}
                  {isMomo && (
                    <button
                      disabled={!isReadyForPayment}
                      onClick={() => handleInitiatePayment('Thanh toán tất cả toàn bàn', totalTableAmount)}
                      className={`w-full py-3 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-2 transition-all ${
                        !isReadyForPayment
                          ? 'bg-gray-500/40 opacity-70 cursor-not-allowed'
                          : 'bg-emerald-500 hover:bg-emerald-600 cursor-pointer'
                      }`}
                    >
                      <span className="material-symbols-outlined text-lg">
                        {!isReadyForPayment ? 'hourglass_empty' : 'qr_code_scanner'}
                      </span>
                      <span>
                        {!isReadyForPayment
                          ? 'Chờ Bếp hoàn tất ra món mới được thanh toán'
                          : `Tạo QR MoMo Thanh Toán Tất Cả (${formatPrice(totalTableAmount, lang)})`}
                      </span>
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* MODE 2: EQUAL SPLIT ("Chia đều") */}
            {splitMode === 'equal' && (
              <div className="space-y-4 py-2">
                <div className="bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl p-5 text-center space-y-4 shadow-sm">
                  <p className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                    Nhập số người cùng chia bill bàn này:
                  </p>

                  <div className="flex items-center justify-center gap-4">
                    <button
                      onClick={() => setEqualPeopleCount((p) => Math.max(1, p - 1))}
                      className="w-10 h-10 rounded-full bg-[var(--bg-card)] border border-[var(--border-color)] hover:border-[var(--brand-primary)] text-lg font-bold flex items-center justify-center text-[var(--text-primary)] transition-all cursor-pointer active:scale-95"
                    >
                      -
                    </button>
                    <span className="text-3xl font-black text-[var(--brand-primary)] w-16 text-center">
                      {equalPeopleCount}
                    </span>
                    <button
                      onClick={() => setEqualPeopleCount((p) => p + 1)}
                      className="w-10 h-10 rounded-full bg-[var(--bg-card)] border border-[var(--border-color)] hover:border-[var(--brand-primary)] text-lg font-bold flex items-center justify-center text-[var(--text-primary)] transition-all cursor-pointer active:scale-95"
                    >
                      +
                    </button>
                  </div>

                  <div className="pt-3 border-t border-[var(--border-color)]">
                    <p className="text-xs text-[var(--text-secondary)]">Số tiền mỗi người cần trả:</p>
                    <p className="text-2xl font-black text-emerald-500 mt-1">
                      {formatPrice(Math.ceil(totalTableAmount / Math.max(1, equalPeopleCount)), lang)}
                    </p>
                    <p className="text-[11px] text-[var(--text-secondary)] italic mt-0.5">
                      (Tổng tiền bàn: {formatPrice(totalTableAmount, lang)})
                    </p>
                  </div>

                  {isMomo && (
                    <button
                      disabled={!isReadyForPayment}
                      onClick={() =>
                        handleInitiatePayment(
                          `Chia đều (${equalPeopleCount} người)`,
                          Math.ceil(totalTableAmount / Math.max(1, equalPeopleCount))
                        )
                      }
                      className={`w-full py-2.5 font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-2 transition-all ${
                        !isReadyForPayment
                          ? 'bg-gray-500/40 text-gray-300 cursor-not-allowed opacity-70'
                          : 'bg-emerald-500 hover:bg-emerald-600 text-white cursor-pointer'
                      }`}
                    >
                      <span className="material-symbols-outlined text-base">
                        {!isReadyForPayment ? 'hourglass_empty' : 'qr_code_scanner'}
                      </span>
                      <span>
                        {!isReadyForPayment
                          ? 'Chờ Bếp hoàn tất món ăn mới được thanh toán'
                          : `Tạo QR chuyển khoản ${formatPrice(Math.ceil(totalTableAmount / Math.max(1, equalPeopleCount)), lang)}`}
                      </span>
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* MODE 3: CUSTOM ITEM SELECTION ("Tự chọn món") */}
            {splitMode === 'custom' && (
              <div className="space-y-3">
                <p className="text-xs font-semibold text-[var(--text-secondary)]">
                  Tích chọn các món bạn muốn thanh toán:
                </p>

                <div className="space-y-2">
                  {allFlattenedItems.map((item) => {
                    const isChecked = selectedItemKeys.includes(item.key);
                    return (
                      <div
                        key={item.key}
                        onClick={() => toggleSelectItem(item.key)}
                        className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 text-xs ${
                          isChecked
                            ? 'border-[var(--brand-primary)] bg-[var(--brand-primary)]/10 ring-1 ring-[var(--brand-primary)]/30'
                            : 'border-[var(--border-color)] bg-[var(--bg-primary)] hover:border-[var(--brand-primary)]/50'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 flex-1 min-w-0">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {}}
                            className="w-4 h-4 rounded text-[var(--brand-primary)] accent-[var(--brand-primary)] cursor-pointer"
                          />
                          <div className="truncate">
                            <p className="font-bold text-[var(--text-primary)] truncate">{item.name}</p>
                            <p className="text-[11px] text-[var(--text-secondary)]">
                              Gọi bởi: {item.customerName} • SL: {item.quantity}
                            </p>
                          </div>
                        </div>

                        <span className="font-bold text-[var(--brand-primary)] shrink-0">
                          {formatPrice(item.price, lang)}
                        </span>
                      </div>
                    );
                  })}
                </div>

                <div className="p-4 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl flex items-center justify-between text-xs mt-3">
                  <div>
                    <p className="text-[var(--text-secondary)]">Tổng các món đã chọn:</p>
                    <p className="text-lg font-bold text-emerald-500">{formatPrice(customSelectedTotal, lang)}</p>
                  </div>
                  {isMomo && (
                    <button
                      disabled={customSelectedTotal === 0 || !isReadyForPayment}
                      onClick={() => handleInitiatePayment('Món tự chọn', customSelectedTotal)}
                      className={`px-4 py-2 text-white font-bold rounded-xl flex items-center gap-1.5 transition-all ${
                        !isReadyForPayment || customSelectedTotal === 0
                          ? 'bg-gray-500/40 opacity-70 cursor-not-allowed'
                          : 'bg-emerald-500 hover:bg-emerald-600 cursor-pointer'
                      }`}
                    >
                      <span className="material-symbols-outlined text-base">
                        {!isReadyForPayment ? 'hourglass_empty' : 'qr_code_2'}
                      </span>
                      <span>
                        {!isReadyForPayment ? 'Chờ Bếp hoàn tất' : 'Tạo QR MoMo'}
                      </span>
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* DYNAMIC MOMO QR DISPLAY OVERLAY */}
            {activePaymentData && activePaymentData.method === 'momo' && (
              <div className="p-4 border rounded-xl text-center space-y-3 my-2 animate-fadeIn bg-emerald-500/10 border-emerald-500/30">
                <div className="flex justify-between items-center border-b pb-2 border-emerald-500/20">
                  <span className="text-xs font-bold flex items-center gap-1.5 text-emerald-500">
                    <span className="material-symbols-outlined text-base">qr_code_scanner</span>
                    Mã QR MoMo / Chuyển khoản — {activePaymentData.name}
                  </span>
                  <button
                    onClick={() => setActivePaymentData(null)}
                    className="text-xs text-gray-400 hover:text-gray-600 font-bold flex items-center gap-0.5 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-sm">close</span>
                    <span>Đóng</span>
                  </button>
                </div>

                <div className="bg-white p-3 rounded-xl inline-block border border-slate-200 shadow-sm">
                  <img
                    src={`https://img.vietqr.io/image/MB-0123456789-compact2.png?amount=${activePaymentData.amount}&addInfo=${encodeURIComponent(
                      `${table?.tableName || 'Ban'} ${activePaymentData.name}`
                    )}`}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
                        `STK: 0123456789 - MBBank - KOHI COFFEE - ${table?.tableName || 'Ban'} - ${activePaymentData.name}: ${activePaymentData.amount}VND`
                      )}`;
                    }}
                    alt="MoMo / VietQR Split Bill"
                    className="w-44 h-44 mx-auto object-contain"
                  />
                </div>

                <p className="text-xs text-[var(--text-secondary)] font-medium">
                  Số tiền cần chuyển cho <strong className="text-[var(--text-primary)]">{activePaymentData.name}</strong>: <span className="font-extrabold text-emerald-500 text-sm">{formatPrice(activePaymentData.amount, lang)}</span>
                </p>
              </div>
            )}

            {/* DYNAMIC CASH NOTICE DISPLAY OVERLAY */}
            {activePaymentData && activePaymentData.method === 'cash' && (
              <div className="p-4 border rounded-xl text-center space-y-3 my-2 animate-fadeIn bg-amber-500/10 border-amber-500/30 text-amber-500">
                <div className="flex justify-between items-center border-b pb-2 border-amber-500/20">
                  <span className="text-xs font-bold flex items-center gap-1.5 text-amber-500">
                    <span className="material-symbols-outlined text-base">payments</span>
                    Thanh toán Tiền mặt — {activePaymentData.name}
                  </span>
                  <button
                    onClick={() => setActivePaymentData(null)}
                    className="text-xs text-amber-500/70 hover:text-amber-500 font-bold flex items-center gap-0.5 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-sm">close</span>
                    <span>Đóng</span>
                  </button>
                </div>

                <div className="py-2 space-y-2">
                  <p className="text-sm font-bold text-amber-500">
                    Số tiền cần trả tại quầy: {formatPrice(activePaymentData.amount, lang)}
                  </p>
                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed max-w-sm mx-auto">
                    Khách hàng <strong>{activePaymentData.name}</strong> vui lòng đến quầy thu ngân báo số <strong>{table?.tableName || 'bàn'}</strong> để nhân viên nhận tiền mặt ({formatPrice(activePaymentData.amount, lang)}) và xác nhận hoàn tất.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Footer Action */}
          <div className="pt-4 border-t border-[var(--border-color)] mt-4 flex items-center justify-between shrink-0 gap-3">
            <button
              onClick={handleCopyBreakdown}
              className="flex-1 py-2.5 bg-[var(--bg-primary)] hover:bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--brand-primary)] rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95"
            >
              <span className="material-symbols-outlined text-base">content_copy</span>
              <span>{copiedText ? 'Đã sao chép tin nhắn!' : 'Sao chép chi tiết Zalo / Mess'}</span>
            </button>

            <button
              onClick={onClose}
              className="px-5 py-2.5 bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-md transition-all active:scale-95 cursor-pointer"
            >
              Đóng
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
