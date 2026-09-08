'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import Image from 'next/image';
import { io, Socket } from 'socket.io-client';
import { playCashChime, playAlertPing, playMomoChime } from '@/app/utils/sound';
import { ThemeToggleSwitch } from '@/components/table/ThemeToggleSwitch';
import { LanguageToggleSwitch, Lang } from '@/components/table/LanguageToggleSwitch';
import { BrandLogo } from '@/components/table/BrandLogo';
import { BankPayModal } from '@/components/table/BankPayModal';
import { formatTableName } from '@/utils/format';
import { toast } from 'react-hot-toast';
import { LeaveTableModal } from '@/components/table/LeaveTableModal';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
const SOCKET_BASE = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';

const DICTIONARY = {
  vi: {
    title: 'Theo Dõi Đơn Hàng',
    table: 'Bàn',
    orderCode: 'Mã đơn hàng',
    status: 'Trạng thái',
    total: 'Tổng thanh toán',
    backToMenu: 'Quay lại Menu',
    loading: 'Đang tải thông tin đơn hàng...',
    error: 'Không tìm thấy đơn hàng hoặc đơn hàng đã hoàn tất.',
    steps: {
      pending: 'Đã gửi',
      confirmed: 'Đã duyệt',
      cooking: 'Pha chế',
      ready: 'Sẵn sàng',
      completed: 'Đã ra món',
      paid: 'Thanh toán',
      cancelled: 'Đã hủy',
    },
    stepDesc: {
      pending: 'Đơn hàng của bạn đã gửi lên hệ thống. Phục vụ đang xác nhận.',
      confirmed: 'Nhân viên phục vụ đã duyệt đơn và chuyển xuống Quầy pha chế.',
      cooking: 'Barista đang chuẩn bị và pha chế thức uống tươi ngon cho bạn.',
      ready: 'Đồ uống đã làm xong! Nhân viên đang mang ra bàn cho bạn.',
      completed: 'Thức uống & bánh đã phục vụ tại bàn. Chúc bạn ngon miệng!',
      paid: 'Cảm ơn bạn đã thưởng thức tại Kohi Coffee!',
      cancelled: 'Đơn hàng đã bị hủy. Vui lòng liên hệ nhân viên.',
    },
  },
  en: {
    title: 'Order Status',
    table: 'Table',
    orderCode: 'Order ID',
    status: 'Status',
    total: 'Total Amount',
    backToMenu: 'Back to Menu',
    loading: 'Loading order details...',
    error: 'Order not found or already completed.',
    steps: {
      pending: 'Sent',
      confirmed: 'Confirmed',
      cooking: 'Brewing',
      ready: 'Ready',
      completed: 'Served',
      paid: 'Paid',
      cancelled: 'Cancelled',
    },
    stepDesc: {
      pending: 'Order submitted. Service staff is confirming your order.',
      confirmed: 'Order confirmed and sent to the Barista.',
      cooking: 'The Barista is preparing your fresh drinks.',
      ready: 'Drinks ready! Service staff is bringing them to your table.',
      completed: 'Served at your table. Enjoy!',
      paid: 'Thank you for visiting Kohi Coffee!',
      cancelled: 'Order has been cancelled. Please contact staff.',
    },
  },
  zh: {
    title: '订单状态',
    table: '桌号',
    orderCode: '订单编号',
    status: '状态',
    total: '总计金额',
    backToMenu: '返回菜单',
    loading: '正在加载订单详情...',
    error: '未找到订单或订单已结账。',
    steps: {
      pending: '已发送',
      confirmed: '已确认',
      cooking: '制作中',
      ready: '已完成',
      completed: '已送达',
      paid: '已结账',
      cancelled: '已取消',
    },
    stepDesc: {
      pending: '订单已提交，服务员正在确认中。',
      confirmed: '服务员已确认订单并转交吧台制作。',
      cooking: '调饮师正在为您制作新鲜饮品。',
      ready: '饮品已制作完成，正送往您的餐桌。',
      completed: '您的美食已送达桌前，请慢用！',
      paid: '感谢您光临 Kohi Coffee！',
      cancelled: '订单已被取消。请联系服务员。',
    },
  },
};

interface FoodItem {
  foodId: {
    _id: string;
    name: string;
    price: number;
    image?: string;
  };
  quantity: number;
  note?: string;
  orderedBy?: string;
  deviceId?: string;
  isPaid?: boolean;
  paidBy?: string;
  paidAt?: string;
}

interface Order {
  _id: string;
  tableId: {
    tableName: string;
  };
  customerName?: string;
  items: FoodItem[];
  totalAmount: number;
  paidAmount?: number;
  partialPayments?: Array<{
    amount: number;
    payerName: string;
    paymentMethod: string;
    paidAt: string;
    itemIndexes: number[];
  }>;
  status: 'pending' | 'confirmed' | 'cooking' | 'ready' | 'completed' | 'cancelled' | 'paid';
  paymentMethod?: 'cash' | 'momo' | 'bank_transfer' | string;
  rewardedVoucherCode?: string;
  createdAt: string;
}

export default function OrderStatusPage() {
  const params = useParams();
  const router = useRouter();
  const { setTheme, resolvedTheme } = useTheme();

  const tableId = params.tableId as string;
  const orderId = params.orderId as string;

  const [mounted, setMounted] = useState(false);
  const [lang, setLang] = useState<Lang>('vi');
  const [order, setOrder] = useState<Order | null>(null);
  const [tableOrders, setTableOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isBankModalOpen, setIsBankModalOpen] = useState(false);
  const [isCallingStaff, setIsCallingStaff] = useState(false);
  const [callStaffCooldown, setCallStaffCooldown] = useState(0);
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  // Split Payment states
  const [paymentMode, setPaymentMode] = useState<'all' | 'mine' | 'custom'>('all');
  const [selectedItemIndexes, setSelectedItemIndexes] = useState<number[]>([]);
  const [callerName, setCallerName] = useState<string>('');
  const [deviceId, setDeviceId] = useState<string>('');
  const [isPayingSplitCash, setIsPayingSplitCash] = useState(false);

  // Review state
  const [hasReviewed, setHasReviewed] = useState(false);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [overallStar, setOverallStar] = useState(5);
  const [overallComment, setOverallComment] = useState('');
  const [foodStars, setFoodStars] = useState<Record<string, number>>({});

  const t = DICTIONARY[lang];

  useEffect(() => {
    setMounted(true);
    try {
      const dev = localStorage.getItem('kohi_device_id') || '';
      setDeviceId(dev);
      const name = localStorage.getItem(`chika_name_${tableId}`) || '';
      setCallerName(name);
    } catch (e) {}
  }, [tableId]);

  const handleExecuteLeaveTable = async () => {
    if (order && order.status !== 'paid') {
      toast('Bàn còn đơn hàng chưa thanh toán. Vui lòng thanh toán trước khi rời bàn.', { icon: null });
      setIsLeaveModalOpen(false);
      return;
    }

    setIsLeaving(true);
    try {
      let devId = localStorage.getItem('kohi_device_id');
      if (!devId) {
        devId = 'dev_' + Math.random().toString(36).substring(2, 9);
        localStorage.setItem('kohi_device_id', devId);
      }
      const res = await fetch(`${API_BASE}/tables/${tableId}/leave-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceId: devId }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || 'Không thể rời bàn lúc này.');
      }
      localStorage.removeItem(`chika_name_${tableId}`);
      localStorage.removeItem(`chika_name_dismissed_${tableId}`);
      router.push('/');
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Không thể rời bàn lúc này.', { icon: null });
    } finally {
      setIsLeaving(false);
      setIsLeaveModalOpen(false);
    }
  };

  const handleCallStaff = async () => {
    if (callStaffCooldown > 0 || isCallingStaff) return;
    setIsCallingStaff(true);
    try {
      const res = await fetch(`${API_BASE}/staff-calls`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tableId }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Không thể gửi yêu cầu.');
      }
      setCallStaffCooldown(30);
      const timer = setInterval(() => {
        setCallStaffCooldown((prev) => {
          if (prev <= 1) { clearInterval(timer); return 0; }
          return prev - 1;
        });
      }, 1000);
      toast('Đã gửi yêu cầu gọi nhân viên!', { icon: null });
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Lỗi khi gọi nhân viên.', { icon: null });
    } finally {
      setIsCallingStaff(false);
    }
  };

  useEffect(() => {
    if (!orderId || !order || order.status !== 'paid') return;
    fetch(`${API_BASE}/reviews/order/${orderId}`)
      .then((r) => r.json())
      .then((data) => { if (data?._id) setHasReviewed(true); })
      .catch(() => {});
  }, [orderId, order]);

  const handleSubmitReview = async () => {
    if (!order || isSubmittingReview) return;
    setIsSubmittingReview(true);
    try {
      const ratings = order.items
        .filter((item) => item.foodId?._id)
        .map((item) => ({
          foodId: item.foodId._id,
          star: foodStars[item.foodId._id] ?? 5,
          comment: '',
        }));
      const res = await fetch(`${API_BASE}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: order._id,
          tableId,
          ratings,
          overallStar,
          overallComment,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Gửi đánh giá thất bại.');
      }
      setHasReviewed(true);
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Lỗi gửi đánh giá.', { icon: null });
    } finally {
      setIsSubmittingReview(false);
    }
  };

  useEffect(() => {
    if (!orderId || !tableId) return;

    const fetchOrderDetails = async () => {
      try {
        setIsLoading(true);
        const res = await fetch(`${API_BASE}/orders/table/${tableId}`);
        if (!res.ok) throw new Error(t.error);
        const data: Order[] = await res.json();
        setTableOrders(data);

        const currentOrder = data.find((o) => o._id === orderId);
        if (currentOrder) {
          setOrder(currentOrder);
        } else {
          throw new Error(t.error);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : t.error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrderDetails();

    socketRef.current = io(SOCKET_BASE);

    socketRef.current.on('statusUpdated', ({ orderId: updatedId, status }: { orderId: string; status: Order['status'] }) => {
      if (updatedId === orderId) {
        setOrder((prev) => (prev ? { ...prev, status } : null));
        if (status === 'paid') playMomoChime();
        else if (status === 'completed') playCashChime();
        else playAlertPing();
      }
      setTableOrders((prev) => prev.map((o) => (o._id === updatedId ? { ...o, status } : o)));
    });

    socketRef.current.on('tableTransferred', ({ fromTableId, toTableId }: { fromTableId: string; toTableId: string }) => {
      if (fromTableId === tableId) {
        router.push(`/table/${toTableId}/order-status/${orderId}`);
      }
    });

    socketRef.current.on('ordersMerged', ({ tableId: evtTableId }: { tableId: string }) => {
      if (evtTableId === tableId) {
        fetchOrderDetails();
      }
    });

    socketRef.current.on('rewardVoucherIssued', ({ orderId: rewardOrderId, voucherCode }: { orderId: string; voucherCode: string }) => {
      if (rewardOrderId === orderId) {
        setOrder((prev) => (prev ? { ...prev, rewardedVoucherCode: voucherCode } : null));
        toast('Bạn vừa nhận được Mã giảm 10% cho đơn hàng trên 300k!', { icon: null });
      }
    });

    socketRef.current.on('splitPaymentUpdated', ({ orderId: updatedId, order: updatedOrder }: { orderId: string; order: Order }) => {
      if (updatedId === orderId) {
        setOrder(updatedOrder);
        if (updatedOrder.status === 'paid') {
          try { playMomoChime(); } catch (e) {}
          toast('Đơn hàng đã được thanh toán toàn tất!', { icon: null });
        } else {
          try { playCashChime(); } catch (e) {}
          toast(`Đã cập nhật thanh toán! Đã thu: ${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(updatedOrder.paidAmount || 0)}`, { icon: null });
        }
      }
      setTableOrders((prev) => prev.map((o) => (o._id === updatedId ? { ...o, ...updatedOrder } : o)));
    });

    return () => {
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, [orderId, tableId, router, t.error]);

  // Synchronization of selectedItemIndexes based on paymentMode
  useEffect(() => {
    if (!order || !order.items) return;
    const unpaidIndices = order.items
      .map((item, idx) => (!item.isPaid ? idx : -1))
      .filter((idx) => idx !== -1);

    if (paymentMode === 'all') {
      setSelectedItemIndexes(unpaidIndices);
    } else if (paymentMode === 'mine') {
      const myIndices = order.items
        .map((item, idx) => {
          if (item.isPaid) return -1;
          const cName = item.orderedBy || (() => {
            if (item.note && item.note.startsWith('[')) {
              const match = item.note.match(/^\[(.*?)\]/);
              if (match) return match[1];
            }
            return null;
          })();
          const matchDev = deviceId && item.deviceId === deviceId;
          const matchName = callerName && cName && cName.trim().toLowerCase() === callerName.trim().toLowerCase();
          return matchDev || matchName ? idx : -1;
        })
        .filter((idx) => idx !== -1);

      setSelectedItemIndexes(myIndices.length > 0 ? myIndices : unpaidIndices);
    }
  }, [order, paymentMode, callerName, deviceId]);

  const toggleItemSelection = (idx: number) => {
    if (order?.items[idx]?.isPaid) return;
    setPaymentMode('custom');
    setSelectedItemIndexes((prev) =>
      prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
    );
  };

  const remainingTableAmount = Math.max(0, (order?.totalAmount || 0) - (order?.paidAmount || 0));
  const selectedItems = (order?.items || []).filter((item, idx) => selectedItemIndexes.includes(idx) && !item.isPaid);
  const selectedItemsAmount = selectedItems.reduce((sum, item) => sum + (item.foodId?.price || 0) * item.quantity, 0);
  const paymentAmountToPay = paymentMode === 'all' ? remainingTableAmount : selectedItemsAmount;
  const isTableFullyPaid = order?.status === 'paid' || remainingTableAmount <= 0;

  const handleSplitCashPayment = async () => {
    if (isPayingSplitCash) return;
    setIsPayingSplitCash(true);
    try {
      const isSplit = paymentMode !== 'all';
      const amount = paymentAmountToPay;
      if (amount <= 0) {
        toast('Không có món nào cần thanh toán.', { icon: null });
        return;
      }

      if (order?.status === 'pending') {
        toast('Đơn hàng đang chờ phục vụ duyệt. Vui lòng đợi nhân viên xác nhận trước khi thanh toán.', { icon: null });
        return;
      }

      if (!isSplit) {
        await handleCallStaff();
        return;
      }

      const res = await fetch(`${API_BASE}/orders/${orderId}/notify-split-payment`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          payerName: callerName || order?.customerName || 'Khách',
          deviceId,
          itemIndexes: selectedItemIndexes,
          paymentMethod: 'cash',
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || 'Không thể gửi yêu cầu thanh toán tiền mặt.');
      }

      toast(`Đã báo nhân viên thu tiền mặt (${formatPrice(amount)}) cho phần của bạn!`, { icon: null });
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Có lỗi xảy ra.', { icon: null });
    } finally {
      setIsPayingSplitCash(false);
    }
  };

  if (!mounted) return null;

  const stepsList: string[] = ['pending', 'confirmed', 'cooking', 'ready', 'completed', 'paid'];
  const currentStepIndex = order ? stepsList.indexOf(order.status) : -1;
  const isDark = resolvedTheme === 'dark';

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);

  return (
    <div className="fixed inset-0 w-full h-full flex flex-col overflow-hidden bg-[var(--bg-primary)] text-[var(--text-primary)] transition-colors duration-300 font-sans selection:bg-[#0284c7] selection:text-white">
      {/* ── Standardized Responsive Header (Pinned Stationary) ─────────────── */}
      <header className="shrink-0 z-40 bg-[var(--bg-card)]/95 backdrop-blur-md border-b border-[var(--border-color)] transition-colors shadow-xs">
        <div className="max-w-6xl mx-auto px-3 sm:px-6 h-14 sm:h-16 flex items-center justify-between font-sans">
          <div className="flex items-center gap-2 sm:gap-3">
            <BrandLogo onClick={() => router.push(`/table/${tableId}`)} />
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <ThemeToggleSwitch isDark={isDark} setTheme={setTheme} />
            <LanguageToggleSwitch lang={lang} setLang={setLang} />
          </div>
        </div>
      </header>

      {/* ── Main Responsive Content Container (Scrollable Only) ─────────────── */}
      <main
        data-lenis-prevent
        className="flex-1 min-h-0 overflow-y-auto overscroll-contain w-full scrollbar-thin"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        <div className="w-full max-w-6xl mx-auto px-3 sm:px-6 py-4 sm:py-6 pb-32 sm:pb-12 font-sans">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-9 h-9 border-4 border-[#0284c7] dark:border-[#38BDF8] border-t-transparent rounded-full animate-spin" />
            <p className="text-xs font-bold text-[var(--text-secondary)]">{t.loading}</p>
          </div>
        ) : error ? (
          <div className="text-center py-12 bg-[var(--bg-card)] rounded-2xl p-5 shadow-md border border-[var(--border-color)] max-w-md mx-auto">
            <h2 className="text-sm font-bold text-[var(--text-primary)] mb-4">{t.error}</h2>
            <button
              onClick={() => router.push(`/table/${tableId}`)}
              className="px-4 py-2 bg-[#0284c7] text-white font-bold rounded-xl text-xs active:scale-95 cursor-pointer"
            >
              {t.backToMenu}
            </button>
          </div>
        ) : order ? (
          <div className="space-y-4 sm:space-y-6">
            {order.status === 'paid' ? (
              /* ── PAID STATUS VIEW ────────────────────────────────────── */
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                <div className="lg:col-span-6 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-lg relative overflow-hidden">
                  <div className="text-center pb-4 border-b border-dashed border-[var(--border-color)]">
                    <span className="inline-block px-3.5 py-1 bg-emerald-500/10 text-emerald-500 border border-emerald-500/30 rounded-full text-[11px] font-black uppercase tracking-wider mb-2">
                      ✓ ĐÃ THANH TOÁN HOÀN TẤT
                    </span>
                    <h2 className="text-lg sm:text-xl font-black text-[var(--text-primary)] tracking-tight">HÓA ĐƠN XÁC NHẬN</h2>
                    <p className="text-xs font-semibold text-[var(--text-secondary)] mt-0.5">
                      #{order._id.slice(-8).toUpperCase()} • {formatTableName(order.tableId?.tableName, lang)}
                    </p>
                  </div>

                  <div className="py-3.5 space-y-2.5 border-b border-dashed border-[var(--border-color)] max-h-52 overflow-y-auto">
                    {order.items.map((item, idx) => {
                      const callerName = item.orderedBy || (() => {
                        if (item.note && item.note.startsWith('[')) {
                          const match = item.note.match(/^\[(.*?)\]/);
                          if (match) return match[1];
                        }
                        return null;
                      })();
                      return (
                        <div key={idx} className="flex justify-between items-center text-xs">
                          <div className="flex items-center gap-1.5 min-w-0 pr-2">
                            <span className="font-semibold text-[var(--text-primary)] truncate">
                              {item.foodId?.name} <strong className="text-[#0284c7] dark:text-[#38BDF8] ml-0.5 font-mono">x{item.quantity}</strong>
                            </span>
                            {callerName && (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/30 font-mono shrink-0">
                                {callerName}
                              </span>
                            )}
                          </div>
                          <span className="font-bold font-mono shrink-0">{formatPrice((item.foodId?.price || 0) * item.quantity)}</span>
                        </div>
                      );
                    })}
                  </div>

                  <div className="pt-3.5 flex justify-between items-center">
                    <span className="text-xs font-bold text-[var(--text-secondary)] uppercase">{t.total}</span>
                    <span className="text-lg sm:text-xl font-black text-emerald-500">{formatPrice(order.totalAmount)}</span>
                  </div>

                  {order.rewardedVoucherCode && (
                    <div className="mt-4 p-4 bg-gradient-to-r from-sky-500/10 via-cyan-500/10 to-blue-500/10 border border-sky-500/30 rounded-2xl space-y-2 text-center">
                      <div className="text-xs font-black uppercase text-[#0284c7] dark:text-[#38BDF8] tracking-wider">
                        Quà Tặng Đơn Hàng &gt; 300.000đ
                      </div>
                      <p className="text-[11px] text-[var(--text-secondary)]">
                        Kohi Coffee xin dành tặng bạn Mã giảm 10% cho lần sử dụng dịch vụ tiếp theo:
                      </p>
                      <div className="flex items-center justify-center gap-2 pt-1">
                        <span className="font-mono text-base sm:text-lg font-black text-[#0284c7] dark:text-[#38BDF8] bg-[var(--bg-primary)] px-3 py-1 rounded-xl border border-sky-500/30 tracking-widest">
                          {order.rewardedVoucherCode}
                        </span>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(order.rewardedVoucherCode || '');
                            toast('Đã sao chép mã giảm giá!', { icon: null });
                          }}
                          className="px-3 py-1.5 bg-[#0284c7] hover:bg-[#0369a1] text-white font-bold text-xs rounded-xl transition-all cursor-pointer shadow-xs active:scale-95"
                        >
                          Sao chép
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2.5 mt-5 pt-3.5 border-t border-[var(--border-color)]">
                    <button
                      onClick={() => setIsLeaveModalOpen(true)}
                      className="py-3 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-xl text-xs uppercase tracking-wider active:scale-95 transition-all cursor-pointer text-center"
                    >
                      {lang === 'en' ? 'LEAVE TABLE' : 'RỜI BÀN'}
                    </button>
                    <button
                      onClick={() => router.push(`/table/${tableId}`)}
                      className="py-3 bg-[#0284c7] hover:bg-[#0369a1] text-white font-bold rounded-xl text-xs uppercase tracking-wider active:scale-95 transition-all cursor-pointer text-center"
                    >
                      {lang === 'en' ? 'MENU' : 'MENU HÔM NAY'}
                    </button>
                  </div>
                </div>

                <div className="lg:col-span-6 bg-[var(--bg-card)] rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-lg border border-[var(--border-color)]">
                  <h3 className="text-sm sm:text-base font-bold text-[var(--text-primary)] mb-1">
                    {lang === 'vi' ? 'Đánh giá trải nghiệm' : lang === 'zh' ? '评价您的体验' : 'Rate your experience'}
                  </h3>
                  <p className="text-xs text-[var(--text-secondary)] mb-4">
                    {lang === 'vi' ? 'Ý kiến của bạn giúp Kohi nâng cao chất lượng phục vụ' : 'Your feedback helps us improve'}
                  </p>

                  {hasReviewed ? (
                    <div className="text-center py-6 bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4">
                      <span className="text-xs font-bold text-emerald-500">
                        {lang === 'vi' ? 'Cảm ơn bạn đã gửi đánh giá!' : 'Thank you for your review!'}
                      </span>
                    </div>
                  ) : (
                    <div className="space-y-3.5">
                      <div className="flex gap-2 justify-center py-1">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <button
                            key={s}
                            onClick={() => setOverallStar(s)}
                            className={`text-2xl sm:text-3xl transition-transform hover:scale-125 cursor-pointer ${
                              s <= overallStar ? 'text-amber-400' : 'text-slate-300 dark:text-slate-700'
                            }`}
                          >★</button>
                        ))}
                      </div>
                      <textarea
                        value={overallComment}
                        onChange={(e) => setOverallComment(e.target.value)}
                        placeholder={lang === 'vi' ? 'Nhận xét về thức uống, không gian, thái độ phục vụ...' : 'Your comments...'}
                        rows={3}
                        maxLength={250}
                        className="w-full text-xs bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl px-3.5 py-2.5 outline-none focus:border-[#0284c7] resize-none text-[var(--text-primary)] font-sans"
                      />
                      <button
                        onClick={handleSubmitReview}
                        disabled={isSubmittingReview}
                        className="w-full py-3 bg-[#0284c7] hover:bg-[#0369a1] text-white font-bold rounded-xl text-xs uppercase disabled:opacity-50 cursor-pointer active:scale-95 transition-all shadow-md"
                      >
                        {isSubmittingReview ? 'Đang gửi...' : 'Gửi đánh giá'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* ── LIVE ORDER TRACKER (MOBILE-OPTIMIZED RESPONSIVE) ─────── */
              <div className="space-y-4 sm:space-y-6">
                {/* Top Card: Live Progress Header & Stepper */}
                <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl sm:rounded-3xl p-4 sm:p-7 shadow-lg space-y-4 sm:space-y-6">
                  {/* Row 1: Status Title & Meta Badges */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 sm:pb-4 border-b border-[var(--border-color)]">
                    <div>
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="w-2 h-2 rounded-full bg-[#0284c7] dark:bg-[#38BDF8] animate-ping inline-block" />
                        <span className="text-[10px] sm:text-[11px] font-black text-[#0284c7] dark:text-[#38BDF8] uppercase tracking-widest">
                          TRẠNG THÁI TRỰC TUYẾN
                        </span>
                      </div>
                      <h1 className="text-lg sm:text-2xl font-black text-[var(--text-primary)] tracking-tight">
                        {(t.steps as any)[order.status]}
                      </h1>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                      <div className="px-2.5 sm:px-3.5 py-1 sm:py-1.5 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl sm:rounded-2xl text-[11px] sm:text-xs font-bold">
                        <span className="text-[var(--text-tertiary)] mr-1">Mã đơn:</span>
                        <span className="text-[#0284c7] dark:text-[#38BDF8] uppercase font-extrabold">#{order._id.slice(-6).toUpperCase()}</span>
                      </div>

                      <div className="px-2.5 sm:px-3.5 py-1 sm:py-1.5 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl sm:rounded-2xl text-[11px] sm:text-xs font-bold">
                        <span className="text-[var(--text-tertiary)] mr-1">Vị trí:</span>
                        <span>{formatTableName(order.tableId?.tableName, lang)}</span>
                        {order.customerName && <span className="text-[var(--text-secondary)] font-normal ml-1">({order.customerName})</span>}
                      </div>

                      {order.status !== 'cancelled' && (
                        <div className="px-2.5 sm:px-3.5 py-1 sm:py-1.5 bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20 rounded-xl sm:rounded-2xl text-[11px] sm:text-xs font-bold">
                          ~{new Date(new Date(order.createdAt).getTime() + 20 * 60 * 1000).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Row 2: Responsive Stepper (Scrollable horizontally on mobile to prevent text collision) */}
                  <div className="pt-1 overflow-x-auto scrollbar-none">
                    <div className="relative min-w-[460px] sm:min-w-0 sm:max-w-4xl mx-auto px-2 py-2">
                      {/* Background connecting track line */}
                      <div className="absolute left-6 right-6 top-5 -translate-y-1/2 h-1 bg-[var(--border-color)] z-0 rounded-full" />
                      {/* Active progress fill line */}
                      <div
                        className="absolute left-6 top-5 -translate-y-1/2 h-1 bg-gradient-to-r from-[#0284c7] via-cyan-400 to-emerald-500 transition-all duration-700 z-0 rounded-full"
                        style={{ width: `${Math.max(0, (currentStepIndex / (stepsList.length - 1)) * 92)}%` }}
                      />

                      <div className="flex items-center justify-between relative z-10">
                        {stepsList.map((stepKey, idx) => {
                          const isCompleted = idx < currentStepIndex;
                          const isCurrent = idx === currentStepIndex;

                          return (
                            <div key={stepKey} className="flex flex-col items-center shrink-0 w-16 sm:w-auto">
                              {/* Step Node Circle */}
                              <div
                                className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-xs font-black transition-all ${
                                  isCompleted
                                    ? 'bg-emerald-500 text-white shadow-sm'
                                    : isCurrent
                                    ? 'bg-[#0284c7] dark:bg-[#38BDF8] text-white dark:text-slate-950 ring-4 ring-[#0284c7]/30 dark:ring-sky-500/40 font-black scale-105 sm:scale-110 shadow-md'
                                    : 'bg-[var(--bg-card)] border-2 border-[var(--border-color)] text-[var(--text-tertiary)]'
                                }`}
                              >
                                {isCompleted ? '✓' : idx + 1}
                              </div>

                              {/* Step Label */}
                              <span
                                className={`text-[10.5px] sm:text-xs font-bold mt-1.5 text-center whitespace-nowrap ${
                                  isCurrent
                                    ? 'text-[#0284c7] dark:text-[#38BDF8]'
                                    : isCompleted
                                    ? 'text-[var(--text-primary)] font-semibold'
                                    : 'text-[var(--text-tertiary)] font-normal'
                                }`}
                              >
                                {(t.steps as any)[stepKey]}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Step Description Banner */}
                  <div className="p-3 bg-gradient-to-r from-[#0284c7]/10 via-[#0284c7]/5 to-transparent border border-[#0284c7]/20 rounded-xl sm:rounded-2xl text-center">
                    <p className="text-xs font-medium text-[var(--text-primary)]">
                      {(t.stepDesc as any)[order.status]}
                    </p>
                  </div>
                </div>

                {/* Bottom Section: Responsive Grid with Split Payment Support */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 items-stretch">
                  {/* Left Column: Order Items Details & Selection */}
                  <div className="lg:col-span-7 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-md flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between pb-2.5 border-b border-[var(--border-color)] mb-3">
                        <div>
                          <h2 className="text-xs font-black uppercase tracking-wider text-[var(--text-primary)]">
                            Chi tiết món ăn ({order.items.reduce((s, i) => s + i.quantity, 0)} món)
                          </h2>
                          <p className="text-[10.5px] text-[var(--text-secondary)] mt-0.5">
                            {paymentMode === 'all'
                              ? 'Đang chọn toàn bộ món chưa thanh toán'
                              : paymentMode === 'mine'
                              ? `Đang lọc món của ${callerName || 'bạn'}`
                              : 'Chọn từng món bạn muốn thanh toán'}
                          </p>
                        </div>

                        {/* Multi-round Switcher */}
                        {tableOrders.length > 1 && (
                          <div className="flex items-center gap-1">
                            <span className="text-[10px] font-bold text-[var(--text-tertiary)]">Lượt:</span>
                            {tableOrders.map((tOrder, idx) => (
                              <button
                                key={tOrder._id}
                                onClick={() => router.push(`/table/${tableId}/order-status/${tOrder._id}`)}
                                className={`px-2 py-0.5 text-[10px] font-bold rounded-lg transition-all cursor-pointer ${
                                  tOrder._id === orderId
                                    ? 'bg-[#0284c7] text-white shadow-xs'
                                    : 'bg-[var(--bg-primary)] text-[var(--text-secondary)] hover:bg-slate-200 dark:hover:bg-slate-800'
                                }`}
                              >
                                #{tableOrders.length - idx}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Items List with Split Checkboxes */}
                      <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                        {order.items.map((item, idx) => {
                          const itemCaller = item.orderedBy || (() => {
                            if (item.note && item.note.startsWith('[')) {
                              const match = item.note.match(/^\[(.*?)\]/);
                              if (match) return match[1];
                            }
                            return null;
                          })();
                          const cleanNote = item.note ? item.note.replace(/^\[.*?\]\s*/, '') : '';
                          const isPaidItem = Boolean(item.isPaid);
                          const isSelected = selectedItemIndexes.includes(idx) && !isPaidItem;

                          return (
                            <div
                              key={idx}
                              onClick={() => !isPaidItem && toggleItemSelection(idx)}
                              className={`flex items-center justify-between p-2.5 sm:p-3 rounded-xl sm:rounded-2xl border text-xs transition-all ${
                                isPaidItem
                                  ? 'bg-emerald-500/5 border-emerald-500/20 opacity-80 cursor-default'
                                  : isSelected
                                  ? 'bg-[#0284c7]/10 dark:bg-sky-500/15 border-[#0284c7]/40 dark:border-sky-500/40 cursor-pointer shadow-xs'
                                  : 'bg-[var(--bg-primary)] border-[var(--border-color)] hover:border-[#0284c7]/30 cursor-pointer'
                              }`}
                            >
                              <div className="flex items-center gap-2.5 min-w-0 pr-2">
                                {/* Selection Checkbox / Paid Badge */}
                                {isPaidItem ? (
                                  <span className="w-5 h-5 rounded-md bg-emerald-500 text-white font-black text-[10px] flex items-center justify-center shrink-0">
                                    ✓
                                  </span>
                                ) : (
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => toggleItemSelection(idx)}
                                    onClick={(e) => e.stopPropagation()}
                                    className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 text-[#0284c7] focus:ring-[#0284c7] cursor-pointer shrink-0"
                                  />
                                )}

                                <span className="px-2 py-0.5 bg-[#0284c7]/15 text-[#0284c7] dark:text-[#38BDF8] font-black rounded-lg shrink-0 font-mono">
                                  x{item.quantity}
                                </span>

                                <div className="min-w-0">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <p className={`font-bold truncate ${isPaidItem ? 'line-through text-slate-400 dark:text-slate-500' : 'text-[var(--text-primary)]'}`}>
                                      {item.foodId?.name || 'Món ăn'}
                                    </p>

                                    {itemCaller && (
                                      <span className="px-1.5 py-0.2 rounded text-[10px] font-black uppercase tracking-wider bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/30 font-mono shrink-0">
                                        {itemCaller}
                                      </span>
                                    )}

                                    {isPaidItem && (
                                      <span className="px-1.5 py-0.2 rounded text-[10px] font-extrabold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 font-mono shrink-0">
                                        ✓ Đã trả {item.paidBy ? `(${item.paidBy})` : ''}
                                      </span>
                                    )}
                                  </div>
                                  {cleanNote && <p className="text-[10px] text-[var(--text-secondary)] italic truncate mt-0.5">{cleanNote}</p>}
                                </div>
                              </div>

                              <span className={`font-extrabold shrink-0 font-mono ${isPaidItem ? 'text-slate-400 dark:text-slate-500' : 'text-[var(--text-primary)]'}`}>
                                {formatPrice((item.foodId?.price || 0) * item.quantity)}
                              </span>
                            </div>
                          );
                        })}
                      </div>

                      {/* Per-person summary breakdown */}
                      {(() => {
                        const personMap = new Map<string, { count: number; total: number; paidTotal: number }>();
                        order.items.forEach((item) => {
                          let person = item.orderedBy;
                          if (!person && item.note && item.note.startsWith('[')) {
                            const match = item.note.match(/^\[(.*?)\]/);
                            if (match) person = match[1];
                          }
                          const name = person || order.customerName || 'Khách';
                          const current = personMap.get(name) || { count: 0, total: 0, paidTotal: 0 };
                          const itemTotal = (item.foodId?.price || 0) * item.quantity;
                          current.count += item.quantity;
                          current.total += itemTotal;
                          if (item.isPaid) current.paidTotal += itemTotal;
                          personMap.set(name, current);
                        });

                        if (personMap.size > 1) {
                          return (
                            <div className="pt-2.5 mt-2.5 border-t border-dashed border-[var(--border-color)]">
                              <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5 font-mono">
                                {lang === 'en' ? 'Summary by member' : lang === 'zh' ? '同桌分账明细' : 'Tổng kết theo người gọi'}:
                              </p>
                              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                {Array.from(personMap.entries()).map(([person, data]) => {
                                  const isPersonAllPaid = data.paidTotal >= data.total;
                                  return (
                                    <div
                                      key={person}
                                      onClick={() => {
                                        setPaymentMode('custom');
                                        const indices = order.items
                                          .map((it, idx) => {
                                            if (it.isPaid) return -1;
                                            const p = it.orderedBy || (it.note?.match(/^\[(.*?)\]/)?.[1]);
                                            return (p || order.customerName || 'Khách') === person ? idx : -1;
                                          })
                                          .filter((i) => i !== -1);
                                        setSelectedItemIndexes(indices);
                                      }}
                                      className={`p-2 rounded-xl border text-xs flex flex-col justify-between cursor-pointer transition-all ${
                                        isPersonAllPaid
                                          ? 'bg-emerald-500/5 border-emerald-500/20 opacity-80'
                                          : 'bg-[var(--bg-primary)] border-[var(--border-color)] hover:border-[#0284c7]'
                                      }`}
                                    >
                                      <div className="flex items-center justify-between">
                                        <span className="font-bold text-[var(--text-primary)] truncate">{person}</span>
                                        {isPersonAllPaid && (
                                          <span className="text-[9px] font-black text-emerald-500">✓ Xong</span>
                                        )}
                                      </div>
                                      <div className="flex justify-between items-baseline mt-1">
                                        <span className="text-[10px] text-[var(--text-secondary)] font-mono">{data.count} món</span>
                                        <span className="font-mono font-bold text-sky-600 dark:text-sky-400 text-[11px]">
                                          {formatPrice(data.total)}
                                        </span>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        }
                        return null;
                      })()}
                    </div>

                    {/* Left Column Bottom Summary */}
                    <div className="pt-3 mt-3 border-t border-[var(--border-color)] flex flex-col sm:flex-row items-center justify-between gap-3">
                      <div className="flex items-center justify-between w-full sm:w-auto gap-3">
                        <span className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Tổng hóa đơn bàn</span>
                        <span className="text-lg sm:text-xl font-black text-[#0284c7] dark:text-[#38BDF8]">
                          {formatPrice(order.totalAmount)}
                        </span>
                      </div>

                      {Boolean(order.paidAmount && order.paidAmount > 0) && (
                        <div className="text-xs font-bold text-emerald-500 font-mono">
                          Đã thu: {formatPrice(order.paidAmount || 0)}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Column: Payment Mode Switcher & Actions */}
                  <div className="lg:col-span-5 flex flex-col justify-between gap-3 sm:gap-4">
                    <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-lg flex flex-col justify-between h-full space-y-4">
                      <div>
                        {/* Section Header */}
                        <div className="flex items-center justify-between pb-2.5 border-b border-[var(--border-color)]">
                          <span className="text-[10.5px] font-black uppercase tracking-wider text-[#0284c7] dark:text-sky-400 font-mono">
                            HÌNH THỨC THANH TOÁN
                          </span>
                          <span className="text-xs font-bold text-[var(--text-secondary)]">
                            {formatTableName(order.tableId?.tableName, lang)}
                          </span>
                        </div>

                        {/* Split Payment Mode Switcher (Pill tabs) */}
                        <div className="pt-3">
                          <div className="grid grid-cols-3 p-1 bg-[var(--bg-primary)] rounded-xl border border-[var(--border-color)] gap-1">
                            <button
                              type="button"
                              onClick={() => setPaymentMode('all')}
                              className={`py-2 text-[11px] font-black rounded-lg transition-all cursor-pointer text-center ${
                                paymentMode === 'all'
                                  ? 'bg-[#0284c7] text-white shadow-xs'
                                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                              }`}
                            >
                              Bao cả bàn
                            </button>
                            <button
                              type="button"
                              onClick={() => setPaymentMode('mine')}
                              className={`py-2 text-[11px] font-black rounded-lg transition-all cursor-pointer text-center ${
                                paymentMode === 'mine'
                                  ? 'bg-[#0284c7] text-white shadow-xs'
                                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                              }`}
                            >
                              Phần của bạn
                            </button>
                            <button
                              type="button"
                              onClick={() => setPaymentMode('custom')}
                              className={`py-2 text-[11px] font-black rounded-lg transition-all cursor-pointer text-center ${
                                paymentMode === 'custom'
                                  ? 'bg-[#0284c7] text-white shadow-xs'
                                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                              }`}
                            >
                              Tự chọn món
                            </button>
                          </div>

                          <p className="text-[10.5px] text-[var(--text-secondary)] mt-1.5 text-center font-medium">
                            {paymentMode === 'all'
                              ? 'Thanh toán toàn bộ số tiền còn lại của cả bàn'
                              : paymentMode === 'mine'
                              ? `Thanh toán các món do ${callerName || 'bạn'} gọi`
                              : `Đã chọn ${selectedItems.reduce((s, i) => s + i.quantity, 0)} món từ danh sách`}
                          </p>
                        </div>

                        {/* Payment Progress Bar (If partial payments exist) */}
                        {Boolean(order.paidAmount && order.paidAmount > 0) && (
                          <div className="mt-3.5 p-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-color)] space-y-2">
                            <div className="flex justify-between items-center text-[10.5px] font-bold">
                              <span className="text-[var(--text-secondary)]">Tiến độ thanh toán bàn</span>
                              <span className="text-emerald-500 font-mono">
                                {Math.round(((order.paidAmount || 0) / order.totalAmount) * 100)}%
                              </span>
                            </div>
                            <div className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-emerald-500 transition-all duration-500 rounded-full"
                                style={{
                                  width: `${Math.min(100, Math.round(((order.paidAmount || 0) / order.totalAmount) * 100))}%`,
                                }}
                              />
                            </div>
                            <div className="flex justify-between items-center text-[10px] font-mono text-[var(--text-secondary)] pt-0.5">
                              <span>Đã thu: {formatPrice(order.paidAmount || 0)}</span>
                              <span>Còn lại: {formatPrice(remainingTableAmount)}</span>
                            </div>
                          </div>
                        )}

                        {/* Amount Due Banner */}
                        <div className="mt-3.5 p-4 rounded-2xl bg-gradient-to-br from-[#0284c7]/15 via-sky-500/10 to-transparent border border-[#0284c7]/30 text-center space-y-1">
                          <span className="text-[10px] font-black uppercase tracking-wider text-[var(--text-secondary)] block">
                            Số tiền thanh toán đợt này
                          </span>
                          <div className="text-2xl sm:text-3xl font-black text-[#0284c7] dark:text-[#38BDF8] font-mono">
                            {formatPrice(paymentAmountToPay)}
                          </div>
                          <span className="text-[11px] font-semibold text-[var(--text-secondary)] block">
                            {paymentMode === 'all'
                              ? `Toàn bộ bàn (${order.items.filter((i) => !i.isPaid).reduce((s, i) => s + i.quantity, 0)} món còn lại)`
                              : `${selectedItems.reduce((s, i) => s + i.quantity, 0)} món đã chọn`}
                          </span>
                        </div>
                      </div>

                      {/* Desktop In-Card Payment Trigger Buttons (Hidden on mobile to avoid duplication with sticky footer) */}
                      <div className="hidden sm:block space-y-2 pt-2">
                        {order.status === 'pending' ? (
                          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-center space-y-1">
                            <span className="text-xs font-black uppercase text-amber-600 dark:text-amber-400 block tracking-wide">
                              Đang chờ phục vụ duyệt đơn
                            </span>
                            <p className="text-[11px] font-medium text-[var(--text-secondary)]">
                              Quý khách vui lòng đợi nhân viên xác nhận đơn trước khi thực hiện thanh toán.
                            </p>
                          </div>
                        ) : isTableFullyPaid ? (
                          <div className="py-3 text-center bg-emerald-500/15 border border-emerald-500/30 rounded-xl text-emerald-500 font-black text-xs">
                            ✓ Bàn đã thanh toán hoàn tất
                          </div>
                        ) : (
                          <>
                            {/* Bank / VietQR button */}
                            <button
                              onClick={() => {
                                if (paymentAmountToPay <= 0) {
                                  toast('Vui lòng chọn ít nhất một món để thanh toán.', { icon: null });
                                  return;
                                }
                                setIsBankModalOpen(true);
                              }}
                              disabled={paymentAmountToPay <= 0}
                              className="w-full py-3.5 bg-[#0284c7] hover:bg-[#0369a1] disabled:opacity-50 text-white font-black text-xs uppercase tracking-wider rounded-xl sm:rounded-2xl shadow-md active:scale-95 transition-all cursor-pointer text-center"
                            >
                              Chuyển khoản Ngân hàng (VietQR)
                            </button>

                            {/* Cash payment button */}
                            <button
                              onClick={handleSplitCashPayment}
                              disabled={callStaffCooldown > 0 || isCallingStaff || isPayingSplitCash || paymentAmountToPay <= 0}
                              className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 disabled:opacity-50 text-white font-black text-xs uppercase tracking-wider rounded-xl sm:rounded-2xl shadow-sm active:scale-95 transition-all cursor-pointer text-center"
                            >
                              {isPayingSplitCash
                                ? 'Đang gửi...'
                                : callStaffCooldown > 0
                                ? `Đã gọi phục vụ (${callStaffCooldown}s)`
                                : `Thanh toán Tiền mặt (${formatPrice(paymentAmountToPay)})`}
                            </button>
                          </>
                        )}
                      </div>

                      {/* Service Action Buttons (Visible across all screens) */}
                      <div className="grid grid-cols-2 gap-2.5 pt-2 border-t border-[var(--border-color)]">
                        <button
                          onClick={handleCallStaff}
                          disabled={callStaffCooldown > 0 || isCallingStaff}
                          className="py-2.5 bg-[var(--bg-primary)] hover:bg-slate-200 dark:hover:bg-slate-800 text-[var(--text-primary)] font-bold rounded-xl text-xs uppercase tracking-wider transition-all active:scale-95 cursor-pointer text-center border border-[var(--border-color)] shadow-xs"
                        >
                          {callStaffCooldown > 0 ? `Gọi NV (${callStaffCooldown}s)` : isCallingStaff ? 'Đang gửi...' : 'Gọi nhân viên'}
                        </button>

                        <button
                          onClick={() => {
                            if (order.status !== 'paid') {
                              toast('Bàn còn đơn hàng chưa thanh toán. Vui lòng thanh toán trước khi rời bàn.', { icon: null });
                              return;
                            }
                            setIsLeaveModalOpen(true);
                          }}
                          className="py-2.5 bg-[var(--bg-primary)] hover:bg-slate-200 dark:hover:bg-slate-800 text-[var(--text-primary)] font-bold rounded-xl text-xs uppercase tracking-wider transition-all active:scale-95 cursor-pointer text-center border border-[var(--border-color)] shadow-xs"
                        >
                          Rời bàn
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ── Phần Quay Lại Menu Ở Cuối Trang (Desktop, Tablet, Mobile) ── */}
                <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 transition-all">
                  <div className="min-w-0 flex-1 text-center sm:text-left">
                    <h3 className="text-xs sm:text-sm font-black uppercase tracking-wide text-[var(--text-primary)]">
                      {lang === 'vi' ? 'Bạn muốn gọi thêm món?' : lang === 'zh' ? '您想加点其他饮品吗？' : 'Want to order more?'}
                    </h3>
                    <p className="text-[11px] sm:text-xs text-[var(--text-secondary)] mt-0.5">
                      {lang === 'vi'
                        ? 'Tiếp tục xem thực đơn để gọi thêm đồ uống & bánh ngọt'
                        : lang === 'zh'
                        ? '继续浏览菜单加点饮品与甜点'
                        : 'Explore our menu to add more drinks & pastries'}
                    </p>
                  </div>

                  <button
                    onClick={() => router.push(`/table/${tableId}`)}
                    className="w-full sm:w-auto px-5 py-2.5 sm:py-3 bg-sky-500/10 hover:bg-sky-500/20 text-[#0284c7] dark:text-[#38BDF8] border border-sky-500/30 font-extrabold text-xs uppercase tracking-wider rounded-xl sm:rounded-2xl shadow-xs active:scale-95 transition-all cursor-pointer text-center shrink-0"
                  >
                    {t.backToMenu}
                  </button>
                </div>
              </div>
            )}
            </div>
          ) : null}
        </div>
      </main>

      {/* Sticky Mobile Floating Action Bar (Optimized for Mobile Ergonomics) */}
      {order && order.status !== 'paid' && (
        <div className="sm:hidden fixed bottom-0 inset-x-0 z-40 px-3.5 py-2.5 pb-[max(0.65rem,env(safe-area-inset-bottom))] bg-[var(--bg-card)]/95 backdrop-blur-md border-t border-[var(--border-color)] shadow-2xl flex items-center justify-between gap-2.5">
          {/* Left: Summary Amount */}
          <div className="flex flex-col justify-center min-w-0 pr-1 shrink-0">
            <span className="text-[10px] uppercase font-bold text-[var(--text-secondary)] tracking-wider truncate">
              {paymentMode === 'all'
                ? 'Toàn bộ bàn'
                : paymentMode === 'mine'
                ? 'Phần của bạn'
                : `${selectedItems.reduce((s, i) => s + i.quantity, 0)} món chọn`}
            </span>
            <span className="text-base font-black font-mono text-[#0284c7] dark:text-[#38BDF8] leading-tight truncate">
              {formatPrice(paymentAmountToPay)}
            </span>
          </div>

          {/* Right: Payment Actions */}
          <div className="flex items-center gap-2 flex-1 justify-end">
            {order.status === 'pending' ? (
              <div className="h-10 px-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-black flex items-center justify-center text-center flex-1 max-w-[210px]">
                <span>Chờ phục vụ duyệt đơn...</span>
              </div>
            ) : (
              <>
                {/* Split Cash Button */}
                <button
                  onClick={handleSplitCashPayment}
                  disabled={callStaffCooldown > 0 || isCallingStaff || isPayingSplitCash || paymentAmountToPay <= 0}
                  className="h-10 px-3.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 disabled:opacity-50 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-xs active:scale-95 transition-all cursor-pointer text-center shrink-0 whitespace-nowrap"
                >
                  {isPayingSplitCash ? 'Đang gửi...' : 'Tiền mặt'}
                </button>

                {/* Split VietQR Button */}
                <button
                  onClick={() => {
                    if (paymentAmountToPay <= 0) {
                      toast('Vui lòng chọn ít nhất một món để thanh toán.', { icon: null });
                      return;
                    }
                    setIsBankModalOpen(true);
                  }}
                  disabled={paymentAmountToPay <= 0}
                  className="h-10 px-4 bg-[#0284c7] hover:bg-[#0369a1] disabled:opacity-50 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-md active:scale-95 transition-all cursor-pointer text-center flex-1 max-w-[155px] truncate whitespace-nowrap"
                >
                  Chuyển khoản
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Bank Payment Modal */}
      {order && (
        <BankPayModal
          isOpen={isBankModalOpen}
          onClose={() => setIsBankModalOpen(false)}
          orderId={order._id}
          tableName={order.tableId?.tableName || 'Bàn'}
          totalAmount={paymentAmountToPay}
          customerName={callerName || order.customerName}
          orderStatus={order.status}
          selectedItemIndexes={paymentMode === 'all' ? undefined : selectedItemIndexes}
          payerName={callerName || order.customerName || 'Khách'}
          selectedItemNames={selectedItems.map((i) => `${i.foodId?.name} (x${i.quantity})`)}
          onSuccess={() => {
            setOrder((prev) => (prev ? { ...prev, status: 'paid' } : null));
          }}
        />
      )}

      {/* Leave Table Confirmation Modal */}
      <LeaveTableModal
        isOpen={isLeaveModalOpen}
        onClose={() => setIsLeaveModalOpen(false)}
        onConfirm={handleExecuteLeaveTable}
        tableName={order?.tableId?.tableName ? (lang === 'vi' ? `Bàn ${order.tableId.tableName}` : `Table ${order.tableId.tableName}`) : 'Bàn'}
        lang={lang}
        isLeaving={isLeaving}
      />
    </div>
  );
}
