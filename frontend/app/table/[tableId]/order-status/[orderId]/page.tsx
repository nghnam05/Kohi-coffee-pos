'use client';
import { AppIcon } from '@/components/common/DashboardIcon';

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
import { CancelOrderModal } from '@/components/table/CancelOrderModal';

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1')
  .trim()
  .replace(/[\r\n\t]+/g, '')
  .replace(/\/+$/, '');
const SOCKET_BASE = (process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001')
  .trim()
  .replace(/[\r\n\t]+/g, '')
  .replace(/\/+$/, '');

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
  discountAmount?: number;
  couponCode?: string;
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

  const [isCancellingOrder, setIsCancellingOrder] = useState(false);
  const [isCancelConfirmOpen, setIsCancelConfirmOpen] = useState(false);

  const handleCancelOrder = async (confirmed?: boolean | React.MouseEvent) => {
    if (isCancellingOrder || !order?._id) return;
    if (confirmed !== true) {
      setIsCancelConfirmOpen(true);
      return;
    }

    setIsCancellingOrder(true);
    try {
      const res = await fetch(`${API_BASE}/orders/${order._id}/cancel`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || 'Không thể hủy đơn hàng.');
      }
      toast(
        lang === 'en'
          ? 'Order cancelled successfully!'
          : 'Đã hủy đơn hàng thành công!',
        { icon: null }
      );
      setIsCancelConfirmOpen(false);
      setOrder((prev) => (prev ? { ...prev, status: 'cancelled' } : null));
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Lỗi khi hủy đơn hàng.', { icon: null });
    } finally {
      setIsCancellingOrder(false);
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

    socketRef.current.on('forceLeaveTable', ({ tableId: evtTableId, message }: { tableId: string; message?: string }) => {
      if (evtTableId === tableId) {
        toast(message || 'Bàn đã được nhân viên cập nhật về trạng thái Trống. Cảm ơn quý khách!', { icon: null });
        setTimeout(() => router.push('/'), 2000);
      }
    });

    socketRef.current.on('tableCleared', ({ tableId: evtTableId, message }: { tableId: string; message?: string }) => {
      if (evtTableId === tableId) {
        toast(message || 'Bàn đã được giải phóng sang trạng thái trống.', { icon: null });
        setTimeout(() => router.push('/'), 2000);
      }
    });

    socketRef.current.on('tableUpdated', ({ tableId: evtTableId, status }: { tableId: string; status: string }) => {
      if (evtTableId === tableId && (status === 'empty' || status === 'reserved')) {
        toast('Bàn đã được nhân viên cập nhật trạng thái. Quý khách đã rời bàn.', { icon: null });
        setTimeout(() => router.push('/'), 2000);
      }
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
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between font-sans">
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
        <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-5 sm:py-8 pb-32 sm:pb-16 font-sans">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <div className="w-10 h-10 border-4 border-[#0284c7] dark:border-[#38BDF8] border-t-transparent rounded-full animate-spin" />
            <p className="text-xs font-extrabold text-[var(--text-secondary)]">{t.loading}</p>
          </div>
        ) : error ? (
          <div className="text-center py-12 bg-[var(--bg-card)] rounded-3xl p-6 shadow-xl border border-[var(--border-color)] max-w-md mx-auto">
            <h2 className="text-sm font-extrabold text-[var(--text-primary)] mb-4">{t.error}</h2>
            <button
              onClick={() => router.push(`/table/${tableId}`)}
              className="px-5 py-2.5 bg-[#0284c7] text-white font-extrabold rounded-2xl text-xs uppercase tracking-wider active:scale-95 cursor-pointer shadow-md shadow-sky-500/20"
            >
              {t.backToMenu}
            </button>
          </div>
        ) : order ? (
          <div className="space-y-5 sm:space-y-6">
            {order.status === 'paid' ? (
              /* ── PAID STATUS VIEW ────────────────────────────────────── */
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                <div className="lg:col-span-6 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl p-5 sm:p-7 shadow-xl shadow-black/5 dark:shadow-black/30 relative overflow-hidden">
                  <div className="text-center pb-4 border-b border-dashed border-[var(--border-color)]">
                    <span className="inline-block px-3.5 py-1 bg-emerald-500/10 text-emerald-500 border border-emerald-500/30 rounded-full text-[11px] font-extrabold uppercase tracking-wider mb-2">
                      ✓ ĐÃ THANH TOÁN HOÀN TẤT
                    </span>
                    <h2 className="text-xl font-extrabold text-[var(--text-primary)] tracking-tight">HÓA ĐƠN XÁC NHẬN</h2>
                    <p className="text-xs font-normal text-[var(--text-secondary)] mt-0.5">
                      #{order._id.slice(-8).toUpperCase()} • {formatTableName(order.tableId?.tableName, lang)}
                    </p>
                  </div>

                  <div className="py-4 space-y-2.5 border-b border-dashed border-[var(--border-color)] max-h-56 overflow-y-auto scrollbar-thin">
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
                            <span className="font-normal text-[var(--text-primary)] truncate">
                              {item.foodId?.name} <strong className="text-[#0284c7] dark:text-[#38BDF8] ml-0.5 font-mono font-extrabold">x{item.quantity}</strong>
                            </span>
                            {callerName && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/30 font-mono shrink-0">
                                {callerName}
                              </span>
                            )}
                          </div>
                          <span className="font-extrabold font-mono shrink-0">{formatPrice((item.foodId?.price || 0) * item.quantity)}</span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Bill Subtotal & Discount breakdown */}
                  {order.discountAmount && order.discountAmount > 0 ? (
                    <div className="py-3 space-y-1.5 border-b border-dashed border-[var(--border-color)]">
                      <div className="flex justify-between items-center text-xs text-[var(--text-secondary)] font-normal">
                        <span>{lang === 'en' ? 'Subtotal' : lang === 'zh' ? '小计' : 'Tạm tính'}</span>
                        <span className="font-mono font-extrabold">
                          {formatPrice(order.totalAmount + order.discountAmount)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-xs text-emerald-600 dark:text-emerald-400 font-extrabold">
                        <span>
                          {order.couponCode === 'KOHI10'
                            ? (lang === 'en' ? 'Discount 10% (Order > 300k)' : lang === 'zh' ? '满30万立减10%' : 'Tặng mã giảm 10% (Đơn > 300k)')
                            : `${lang === 'en' ? 'Discount' : 'Giảm giá'} (${order.couponCode || 'Ưu đãi'})`}
                        </span>
                        <span className="font-mono">-{formatPrice(order.discountAmount)}</span>
                      </div>
                    </div>
                  ) : null}

                  <div className="pt-4 flex justify-between items-center">
                    <span className="text-xs font-normal text-[var(--text-secondary)] uppercase tracking-wider">{t.total}</span>
                    <span className="text-xl sm:text-2xl font-extrabold font-mono text-emerald-500">{formatPrice(order.totalAmount)}</span>
                  </div>

                  {/* Voucher Notice */}
                  {((order.discountAmount && order.discountAmount > 0) || order.rewardedVoucherCode) && (
                    <div className="mt-4 p-4 bg-sky-500/10 dark:bg-sky-400/10 border border-sky-500/30 rounded-2xl space-y-2 text-center">
                      <div className="text-xs font-extrabold uppercase text-[#0284c7] dark:text-[#38BDF8] tracking-wider">
                        Ưu Đãi Đơn Hàng &gt; 300.000đ
                      </div>
                      <p className="text-xs text-[var(--text-secondary)] font-normal">
                        {order.discountAmount && order.discountAmount > 0
                          ? 'Kohi Coffee đã tự động tặng và áp dụng ưu đãi giảm 10% trực tiếp vào hóa đơn của bạn!'
                          : 'Kohi Coffee xin dành tặng bạn Mã giảm 10% cho lần sử dụng dịch vụ tiếp theo:'}
                      </p>
                      <div className="flex items-center justify-center gap-2 pt-1">
                        <span className="font-mono text-base sm:text-lg font-extrabold text-[#0284c7] dark:text-[#38BDF8] bg-[var(--bg-primary)] px-3 py-1 rounded-xl border border-sky-500/30 tracking-widest">
                          {order.couponCode || order.rewardedVoucherCode || 'KOHI10'}
                        </span>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(order.couponCode || order.rewardedVoucherCode || 'KOHI10');
                            toast('Đã sao chép mã giảm giá!', { icon: null });
                          }}
                          className="px-3.5 py-1.5 bg-[#0284c7] hover:bg-[#0369a1] text-white font-extrabold text-xs uppercase rounded-xl transition-all cursor-pointer shadow-xs active:scale-95"
                        >
                          Sao chép
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2.5 mt-5 pt-4 border-t border-[var(--border-color)]">
                    <button
                      onClick={handleExecuteLeaveTable}
                      disabled={isLeaving}
                      className="py-3 bg-rose-500 hover:bg-rose-600 disabled:opacity-50 text-white font-extrabold rounded-2xl text-xs uppercase tracking-wider active:scale-95 transition-all cursor-pointer text-center flex items-center justify-center gap-1.5 shadow-sm"
                    >
                      {isLeaving ? (
                        <>
                          <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>{lang === 'en' ? 'LEAVING...' : 'ĐANG RỜI BÀN...'}</span>
                        </>
                      ) : (
                        <span>{lang === 'en' ? 'LEAVE TABLE' : 'RỜI BÀN'}</span>
                      )}
                    </button>
                    <button
                      onClick={() => router.push(`/table/${tableId}`)}
                      className="py-3 bg-[#0284c7] hover:bg-[#0369a1] text-white font-extrabold rounded-2xl text-xs uppercase tracking-wider active:scale-95 transition-all cursor-pointer text-center shadow-md shadow-sky-500/20"
                    >
                      {lang === 'en' ? 'MENU' : 'MENU HÔM NAY'}
                    </button>
                  </div>
                </div>

                <div className="lg:col-span-6 bg-[var(--bg-card)] rounded-3xl p-5 sm:p-7 shadow-xl shadow-black/5 dark:shadow-black/30 border border-[var(--border-color)]">
                  <h3 className="text-base font-extrabold text-[var(--text-primary)] mb-1">
                    {lang === 'vi' ? 'Đánh giá trải nghiệm' : lang === 'zh' ? '评价您的体验' : 'Rate your experience'}
                  </h3>
                  <p className="text-xs text-[var(--text-secondary)] mb-4 font-normal">
                    {lang === 'vi' ? 'Ý kiến của bạn giúp Kohi nâng cao chất lượng phục vụ' : 'Your feedback helps us improve'}
                  </p>

                  {hasReviewed ? (
                    <div className="py-6 px-4 bg-emerald-500/10 border border-emerald-500/25 rounded-2xl text-center space-y-3.5">
                      <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center mx-auto border border-emerald-500/30">
                        <AppIcon name="verified" className="text-2xl font-extrabold" />
                      </div>
                      <div>
                        <h4 className="text-sm font-extrabold text-[var(--text-primary)]">
                          {lang === 'vi' ? 'Cảm ơn bạn đã gửi đánh giá!' : 'Thank you for your feedback!'}
                        </h4>
                        <p className="text-xs text-[var(--text-secondary)] mt-1 font-normal">
                          {lang === 'vi' ? 'Ý kiến quý giá của bạn giúp Kohi ngày càng hoàn thiện hơn.' : 'Your review helps Kohi continually improve.'}
                        </p>
                      </div>

                      {/* Gamification Loyalty Voucher Banner */}
                      <div className="p-3.5 bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-amber-500/15 border border-amber-500/30 rounded-2xl text-left flex items-center justify-between gap-2.5">
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <AppIcon name="redeem" className="text-amber-500 text-sm" />
                            <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                              Quà tặng tri ân
                            </span>
                          </div>
                          <p className="text-xs font-extrabold text-[var(--text-primary)] mt-0.5">
                            MÃ: <span className="font-mono text-[#0284c7] dark:text-[#38BDF8]">KOHICARE10</span>
                          </p>
                          <p className="text-[10px] text-[var(--text-secondary)] font-normal">Giảm 10% cho lần ghé tiếp theo (HSD: 30 ngày)</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText('KOHICARE10');
                            toast('Đã sao chép mã ưu đãi KOHICARE10!', { icon: null });
                          }}
                          className="px-3.5 py-1.5 bg-[#0284c7] hover:bg-[#0369a1] text-white font-extrabold text-[10px] uppercase tracking-wider rounded-xl shadow-xs active:scale-95 transition-all cursor-pointer shrink-0"
                        >
                          Sao chép
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Interactive Star Rating with Dynamic Emotion */}
                      <div className="text-center py-1">
                        <div className="flex gap-2.5 justify-center">
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
                        <p className="text-xs font-extrabold text-amber-600 dark:text-amber-400 mt-1.5">
                          {overallStar === 1 && 'Rất thất vọng 😞'}
                          {overallStar === 2 && 'Chưa hài lòng 🙁'}
                          {overallStar === 3 && 'Tạm ổn 😐'}
                          {overallStar === 4 && 'Hài lòng 😊'}
                          {overallStar === 5 && 'Tuyệt vời! 🤩'}
                        </p>
                      </div>

                      {/* Quick-Feedback Chips */}
                      <div className="flex flex-wrap gap-1.5 justify-center">
                        {(overallStar >= 4
                          ? ['Đồ uống ngon ☕', 'Phục vụ nhanh ⚡', 'Không gian đẹp 🌿', 'Nhân viên nhiệt tình 🥰', 'Rất đáng tiền 💰']
                          : ['Đồ uống hơi ngọt 🍬', 'Phục vụ chậm ⏳', 'Không gian ồn ào 📢', 'Món ra chưa đủ ⚠️', 'Cần cải thiện thái độ 💬']
                        ).map((chip) => {
                          const isSelected = overallComment.includes(chip);
                          return (
                            <button
                              key={chip}
                              type="button"
                              onClick={() => {
                                if (isSelected) {
                                  setOverallComment((prev) =>
                                    prev.replace(chip, '').replace(/,\s*,/g, ',').trim().replace(/^,\s*|,\s*$/g, '')
                                  );
                                } else {
                                  setOverallComment((prev) => (prev ? `${prev}, ${chip}` : chip));
                                }
                              }}
                              className={`px-3 py-1 rounded-full text-[11px] font-extrabold border transition-all cursor-pointer ${
                                isSelected
                                  ? 'bg-[#0284c7] text-white border-[#0284c7] shadow-xs'
                                  : 'bg-[var(--bg-primary)] hover:bg-slate-100 dark:hover:bg-slate-800 text-[var(--text-secondary)] border-[var(--border-color)]'
                              }`}
                            >
                              {chip}
                            </button>
                          );
                        })}
                      </div>

                      <textarea
                        value={overallComment}
                        onChange={(e) => setOverallComment(e.target.value)}
                        placeholder={lang === 'vi' ? 'Nhận xét về thức uống, không gian, thái độ phục vụ...' : 'Your comments...'}
                        rows={3}
                        maxLength={250}
                        className="w-full text-xs bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-2xl px-3.5 py-2.5 outline-none focus:border-[#0284c7] resize-none text-[var(--text-primary)] font-sans"
                      />
                      <button
                        onClick={handleSubmitReview}
                        disabled={isSubmittingReview}
                        className="w-full py-3 bg-[#0284c7] hover:bg-[#0369a1] text-white font-extrabold rounded-2xl text-xs uppercase disabled:opacity-50 cursor-pointer active:scale-95 transition-all shadow-md shadow-sky-500/20"
                      >
                        {isSubmittingReview ? 'Đang gửi...' : 'Gửi đánh giá'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* ── LIVE ORDER TRACKER (RESPONSIVE MULTI-DEVICE OPTIMIZED) ─────── */
              <div className="space-y-5 sm:space-y-6">
                {/* Top Card: Live Progress Header & Stepper */}
                <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl p-5 sm:p-7 shadow-xl shadow-black/5 dark:shadow-black/30 relative overflow-hidden backdrop-blur-sm space-y-5 sm:space-y-6">
                  {/* Subtle ambient decorative light */}
                  <div className="absolute -top-24 -right-24 w-60 h-60 bg-sky-500/10 dark:bg-sky-400/10 rounded-full blur-3xl pointer-events-none" />

                  {/* Row 1: Status Title & Meta Badges */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[var(--border-color)] relative z-10">
                    <div>
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 dark:bg-sky-400/10 border border-sky-500/20 text-sky-600 dark:text-[#38BDF8] text-[11px] font-extrabold uppercase tracking-wide mb-1.5">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-500 dark:bg-[#38BDF8]"></span>
                        </span>
                        <span>TRẠNG THÁI TRỰC TUYẾN</span>
                      </div>
                      <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--text-primary)] tracking-tight">
                        {(t.steps as any)[order.status]}
                      </h1>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
                      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-2xl text-xs font-normal">
                        <span className="text-[var(--text-tertiary)]">Mã:</span>
                        <span className="font-extrabold text-[#0284c7] dark:text-[#38BDF8] font-mono uppercase tracking-wide">#{order._id.slice(-6).toUpperCase()}</span>
                      </div>

                      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-2xl text-xs font-normal">
                        <span className="text-[var(--text-tertiary)]">Vị trí:</span>
                        <span className="font-extrabold text-[var(--text-primary)]">{formatTableName(order.tableId?.tableName, lang)}</span>
                        {order.customerName && <span className="text-[var(--text-secondary)] font-normal ml-0.5">({order.customerName})</span>}
                      </div>

                      {order.status !== 'cancelled' && (
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-sky-500/10 text-sky-600 dark:text-[#38BDF8] border border-sky-500/25 rounded-2xl text-xs font-extrabold">
                          <span className="w-2 h-2 rounded-full bg-sky-500 dark:bg-[#38BDF8] animate-pulse shrink-0" />
                          <span>
                            {order.status === 'completed'
                              ? 'Đã phục vụ tại bàn'
                              : order.status === 'ready'
                              ? 'Đang mang ra bàn'
                              : `Dự kiến: ~${new Date(new Date(order.createdAt).getTime() + 15 * 60 * 1000).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Row 2: Ergonomic Adaptive Stepper */}
                  {/* Mobile Compact Progress View (sm:hidden) */}
                  <div className="sm:hidden space-y-3 pt-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[var(--text-secondary)] font-normal">Tiến trình đơn:</span>
                      <span className="text-[#0284c7] dark:text-[#38BDF8] font-extrabold">
                        Bước <span className="font-mono">{Math.max(1, currentStepIndex + 1)}/{stepsList.length}</span>: {(t.steps as any)[order.status]}
                      </span>
                    </div>

                    <div className="w-full h-2.5 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-full overflow-hidden p-0.5">
                      <div
                        className="h-full bg-gradient-to-r from-[#0284c7] via-cyan-400 to-emerald-400 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, Math.max(12, ((currentStepIndex + 1) / stepsList.length) * 100))}%` }}
                      />
                    </div>

                    <div className="flex justify-between items-center px-1 text-[10px] text-[var(--text-tertiary)] font-normal">
                      <span>Đã gửi</span>
                      <span>Pha chế</span>
                      <span>Ra món</span>
                      <span>Thanh toán</span>
                    </div>
                  </div>

                  {/* Desktop Full Timeline View (hidden sm:block) */}
                  <div className="hidden sm:block py-2">
                    <div className="relative max-w-3xl mx-auto px-6 py-2">
                      {/* Background connecting track line */}
                      <div className="absolute left-11 right-11 top-7 -translate-y-1/2 h-1 bg-[var(--border-color)] z-0 rounded-full overflow-hidden">
                        {/* Active progress fill line */}
                        <div
                          className="h-full bg-gradient-to-r from-emerald-500 via-[#0284c7] to-[#38BDF8] transition-all duration-700 rounded-full"
                          style={{ width: `${Math.max(0, (currentStepIndex / (stepsList.length - 1)) * 100)}%` }}
                        />
                      </div>

                      <div className="flex items-center justify-between relative z-10">
                        {stepsList.map((stepKey, idx) => {
                          const isCompleted = idx < currentStepIndex;
                          const isCurrent = idx === currentStepIndex;

                          return (
                            <div key={stepKey} className="flex flex-col items-center shrink-0">
                              {/* Step Node Circle */}
                              <div
                                className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-extrabold transition-all duration-300 ${
                                  isCompleted
                                    ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
                                    : isCurrent
                                    ? 'bg-[#0284c7] dark:bg-[#38BDF8] text-white dark:text-[#090D16] font-extrabold ring-4 ring-sky-500/25 shadow-lg shadow-sky-500/30 scale-105'
                                    : 'bg-[var(--bg-primary)] border-2 border-[var(--border-color)] text-[var(--text-tertiary)] font-normal'
                                }`}
                              >
                                {isCompleted ? (
                                  <AppIcon name="check" className="text-base" />
                                ) : (
                                  idx + 1
                                )}
                              </div>

                              {/* Step Label */}
                              <span
                                className={`text-xs mt-2.5 text-center whitespace-nowrap transition-colors ${
                                  isCurrent
                                    ? 'text-[#0284c7] dark:text-[#38BDF8] font-extrabold'
                                    : isCompleted
                                    ? 'text-[var(--text-primary)] font-extrabold'
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
                  <div className="flex items-center gap-3 p-3.5 sm:p-4 bg-sky-500/5 dark:bg-sky-500/10 border border-sky-500/20 rounded-2xl">
                    <div className="w-8 h-8 rounded-xl bg-sky-500/15 text-[#0284c7] dark:text-[#38BDF8] flex items-center justify-center shrink-0">
                      <AppIcon name="info" className="text-lg" />
                    </div>
                    <p className="text-xs sm:text-sm font-normal text-[var(--text-secondary)] leading-relaxed">
                      {(t.stepDesc as any)[order.status]}
                    </p>
                  </div>
                </div>

                {/* Bottom Section: Responsive Grid with Split Payment Support */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-start">
                  {/* Left Column: Order Items Details & Selection */}
                  <div className="lg:col-span-7 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl p-5 sm:p-6 shadow-xl shadow-black/5 dark:shadow-black/30 flex flex-col">
                    <div>
                      <div className="flex items-center justify-between pb-3 border-b border-[var(--border-color)] mb-4">
                        <div>
                          <h2 className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-[var(--text-primary)]">
                            Chi tiết món ăn ({order.items.reduce((s, i) => s + i.quantity, 0)} món)
                          </h2>
                          <p className="text-[11px] text-[var(--text-secondary)] mt-0.5 font-normal">
                            {paymentMode === 'all'
                              ? 'Đang chọn toàn bộ món chưa thanh toán'
                              : paymentMode === 'mine'
                              ? `Đang lọc món của ${callerName || 'bạn'}`
                              : 'Chọn từng món bạn muốn thanh toán'}
                          </p>
                        </div>

                        {/* Multi-round Switcher */}
                        {tableOrders.length > 1 && (
                          <div className="flex items-center gap-1.5">
                            <span className="text-[11px] font-normal text-[var(--text-tertiary)]">Lượt:</span>
                            {tableOrders.map((tOrder, idx) => (
                              <button
                                key={tOrder._id}
                                onClick={() => router.push(`/table/${tableId}/order-status/${tOrder._id}`)}
                                className={`px-2.5 py-1 text-xs font-extrabold rounded-xl transition-all cursor-pointer ${
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

                      {/* Items List with Split Checkboxes (Selectable Card Pattern) */}
                      <div className="space-y-2.5 max-h-none lg:max-h-[480px] lg:overflow-y-auto pr-1 scrollbar-thin">
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
                              className={`flex items-center justify-between p-3.5 rounded-2xl border text-xs transition-all select-none ${
                                isPaidItem
                                  ? 'bg-emerald-500/5 border-emerald-500/20 opacity-75 cursor-default'
                                  : isSelected
                                  ? 'bg-[#0284c7]/10 dark:bg-sky-500/15 border-[#0284c7] dark:border-[#38BDF8] ring-1 ring-[#0284c7]/30 shadow-xs cursor-pointer'
                                  : 'bg-[var(--bg-primary)] border-[var(--border-color)] hover:border-[#0284c7]/40 hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer'
                              }`}
                            >
                              <div className="flex items-center gap-3 min-w-0 pr-2">
                                {/* Selection Checkbox / Paid Badge */}
                                {isPaidItem ? (
                                  <span className="w-5 h-5 rounded-lg bg-emerald-500 text-white font-extrabold text-xs flex items-center justify-center shrink-0 shadow-xs">
                                    ✓
                                  </span>
                                ) : (
                                  <div className="relative flex items-center justify-center shrink-0">
                                    <input
                                      type="checkbox"
                                      checked={isSelected}
                                      onChange={() => toggleItemSelection(idx)}
                                      onClick={(e) => e.stopPropagation()}
                                      className="w-5 h-5 rounded-md border-slate-300 dark:border-slate-600 text-[#0284c7] focus:ring-[#0284c7] cursor-pointer"
                                    />
                                  </div>
                                )}

                                <span className="px-2 py-0.5 bg-sky-500/15 text-[#0284c7] dark:text-[#38BDF8] font-extrabold rounded-lg shrink-0 font-mono text-xs">
                                  x{item.quantity}
                                </span>

                                <div className="min-w-0">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <p className={`font-extrabold text-xs sm:text-sm truncate ${isPaidItem ? 'line-through text-slate-400 dark:text-slate-500' : 'text-[var(--text-primary)]'}`}>
                                      {item.foodId?.name || 'Món ăn'}
                                    </p>

                                    {itemCaller && (
                                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/30 font-mono shrink-0">
                                        {itemCaller}
                                      </span>
                                    )}

                                    {isPaidItem && (
                                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 font-mono shrink-0">
                                        ✓ Đã trả {item.paidBy ? `(${item.paidBy})` : ''}
                                      </span>
                                    )}
                                  </div>
                                  {cleanNote && <p className="text-[11px] text-[var(--text-secondary)] italic truncate mt-0.5 font-normal">{cleanNote}</p>}
                                </div>
                              </div>

                              <span className={`font-extrabold shrink-0 font-mono text-xs sm:text-sm ${isPaidItem ? 'text-slate-400 dark:text-slate-500' : 'text-[#0284c7] dark:text-[#38BDF8]'}`}>
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
                            <div className="pt-3 mt-3 border-t border-dashed border-[var(--border-color)]">
                              <p className="text-[11px] font-normal uppercase tracking-wider text-[var(--text-secondary)] mb-2">
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
                                      className={`p-2.5 rounded-2xl border text-xs flex flex-col justify-between cursor-pointer transition-all ${
                                        isPersonAllPaid
                                          ? 'bg-emerald-500/5 border-emerald-500/20 opacity-80'
                                          : 'bg-[var(--bg-primary)] border-[var(--border-color)] hover:border-[#0284c7]'
                                      }`}
                                    >
                                      <div className="flex items-center justify-between">
                                        <span className="font-extrabold text-[var(--text-primary)] truncate">{person}</span>
                                        {isPersonAllPaid && (
                                          <span className="text-[9px] font-extrabold text-emerald-500">✓ Xong</span>
                                        )}
                                      </div>
                                      <div className="flex justify-between items-baseline mt-1.5">
                                        <span className="text-[11px] text-[var(--text-secondary)] font-mono font-normal">{data.count} món</span>
                                        <span className="font-mono font-extrabold text-sky-600 dark:text-sky-400 text-xs">
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
                    <div className="pt-4 mt-4 border-t border-[var(--border-color)] flex flex-col sm:flex-row items-center justify-between gap-3">
                      <div className="flex items-center justify-between w-full sm:w-auto gap-3">
                        <span className="text-xs font-normal text-[var(--text-secondary)] uppercase tracking-wider">Tổng hóa đơn bàn</span>
                        <span className="text-xl sm:text-2xl font-extrabold font-mono text-[#0284c7] dark:text-[#38BDF8]">
                          {formatPrice(order.totalAmount)}
                        </span>
                      </div>

                      {Boolean(order.paidAmount && order.paidAmount > 0) && (
                        <div className="text-xs font-extrabold text-emerald-500 font-mono">
                          Đã thu: {formatPrice(order.paidAmount || 0)}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Column: Payment Mode Switcher & Actions */}
                  <div className="lg:col-span-5 flex flex-col gap-4">
                    <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl p-5 sm:p-6 shadow-xl shadow-black/5 dark:shadow-black/30 flex flex-col space-y-4">
                      <div>
                        {/* Section Header */}
                        <div className="flex items-center justify-between pb-3 border-b border-[var(--border-color)]">
                          <span className="text-xs font-extrabold uppercase tracking-wider text-[#0284c7] dark:text-[#38BDF8] font-mono">
                            HÌNH THỨC THANH TOÁN
                          </span>
                          <span className="text-xs font-extrabold text-[var(--text-secondary)]">
                            {formatTableName(order.tableId?.tableName, lang)}
                          </span>
                        </div>

                        {/* Split Payment Mode Switcher (Pill tabs) */}
                        <div className="pt-3.5">
                          <div className="grid grid-cols-3 p-1 bg-[var(--bg-primary)] rounded-2xl border border-[var(--border-color)] gap-1">
                            <button
                              type="button"
                              onClick={() => setPaymentMode('all')}
                              className={`py-2 text-xs font-extrabold rounded-xl transition-all cursor-pointer text-center ${
                                paymentMode === 'all'
                                  ? 'bg-[#0284c7] text-white shadow-xs'
                                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-normal'
                              }`}
                            >
                              Bao cả bàn
                            </button>
                            <button
                              type="button"
                              onClick={() => setPaymentMode('mine')}
                              className={`py-2 text-xs font-extrabold rounded-xl transition-all cursor-pointer text-center ${
                                paymentMode === 'mine'
                                  ? 'bg-[#0284c7] text-white shadow-xs'
                                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-normal'
                              }`}
                            >
                              Phần của bạn
                            </button>
                            <button
                              type="button"
                              onClick={() => setPaymentMode('custom')}
                              className={`py-2 text-xs font-extrabold rounded-xl transition-all cursor-pointer text-center ${
                                paymentMode === 'custom'
                                  ? 'bg-[#0284c7] text-white shadow-xs'
                                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-normal'
                              }`}
                            >
                              Tự chọn món
                            </button>
                          </div>

                          <p className="text-[11px] text-[var(--text-secondary)] mt-2 text-center font-normal">
                            {paymentMode === 'all'
                              ? 'Thanh toán toàn bộ số tiền còn lại của cả bàn'
                              : paymentMode === 'mine'
                              ? `Thanh toán các món do ${callerName || 'bạn'} gọi`
                              : `Đã chọn ${selectedItems.reduce((s, i) => s + i.quantity, 0)} món từ danh sách`}
                          </p>
                        </div>

                        {/* Payment Progress Bar (If partial payments exist) */}
                        {Boolean(order.paidAmount && order.paidAmount > 0) && (
                          <div className="mt-4 p-3.5 rounded-2xl bg-[var(--bg-primary)] border border-[var(--border-color)] space-y-2">
                            <div className="flex justify-between items-center text-xs">
                              <span className="text-[var(--text-secondary)] font-normal">Tiến độ thanh toán bàn</span>
                              <span className="text-emerald-500 font-mono font-extrabold">
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
                            <div className="flex justify-between items-center text-[10px] text-[var(--text-secondary)] pt-0.5">
                              <span>Đã thu: <span className="font-mono">{formatPrice(order.paidAmount || 0)}</span></span>
                              <span>Còn lại: <span className="font-mono">{formatPrice(remainingTableAmount)}</span></span>
                            </div>
                          </div>
                        )}

                        {/* Amount Due Banner */}
                        <div className="mt-4 p-5 rounded-2xl bg-gradient-to-br from-sky-500/15 via-sky-500/5 to-transparent border border-sky-500/25 text-center space-y-1">
                          <span className="text-[11px] font-extrabold uppercase tracking-wider text-[var(--text-secondary)] block">
                            Số tiền thanh toán đợt này
                          </span>
                          <div className="text-3xl sm:text-4xl font-extrabold text-[#0284c7] dark:text-[#38BDF8] font-mono tracking-tight my-1">
                            {formatPrice(paymentAmountToPay)}
                          </div>
                          <span className="text-xs font-normal text-[var(--text-secondary)] block">
                            {paymentMode === 'all'
                              ? `Toàn bộ bàn (${order.items.filter((i) => !i.isPaid).reduce((s, i) => s + i.quantity, 0)} món còn lại)`
                              : `${selectedItems.reduce((s, i) => s + i.quantity, 0)} món đã chọn`}
                          </span>
                        </div>
                      </div>

                      {/* Desktop In-Card Payment Trigger Buttons (Hidden on mobile to avoid duplication with sticky footer) */}
                      <div className="hidden sm:block space-y-2.5 pt-1">
                        {order.status === 'pending' ? (
                          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-center space-y-3">
                            <div className="space-y-1">
                              <span className="text-xs font-extrabold uppercase text-amber-600 dark:text-amber-400 block tracking-wide">
                                Đang chờ phục vụ duyệt đơn
                              </span>
                              <p className="text-xs font-normal text-[var(--text-secondary)]">
                                Quý khách vui lòng đợi nhân viên xác nhận đơn trước khi thực hiện thanh toán.
                              </p>
                            </div>
                            <button
                              id="btn-cancel-pending-order-desktop"
                              onClick={handleCancelOrder}
                              disabled={isCancellingOrder}
                              className="w-full py-2.5 bg-rose-500/10 hover:bg-rose-500/20 active:bg-rose-500/30 text-rose-600 dark:text-rose-400 font-extrabold text-xs uppercase tracking-wider rounded-xl border border-rose-500/20 transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
                            >
                              <AppIcon name="close" className="text-base" />
                              <span>{isCancellingOrder ? 'Đang hủy...' : 'Hủy đơn hàng này'}</span>
                            </button>
                          </div>
                        ) : isTableFullyPaid ? (
                          <div className="py-3.5 text-center bg-emerald-500/15 border border-emerald-500/30 rounded-2xl text-emerald-500 font-extrabold text-xs">
                            ✓ Bàn đã thanh toán hoàn tất
                          </div>
                        ) : (
                          <>
                            {/* Bank / VietQR button (Primary Solid High-Emphasis) */}
                            <button
                              onClick={() => {
                                if (paymentAmountToPay <= 0) {
                                  toast('Vui lòng chọn ít nhất một món để thanh toán.', { icon: null });
                                  return;
                                }
                                setIsBankModalOpen(true);
                              }}
                              disabled={paymentAmountToPay <= 0}
                              className="w-full py-3.5 bg-[#0284c7] hover:bg-[#0369a1] disabled:opacity-50 text-white font-extrabold text-xs uppercase tracking-wider rounded-2xl shadow-lg shadow-sky-500/25 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2 text-center"
                            >
                              <AppIcon name="qr_code_2" className="text-lg" />
                              <span>Chuyển khoản Ngân hàng (VietQR)</span>
                            </button>

                            {/* Cash payment button (Secondary Tinted / Outlined) */}
                            <button
                              onClick={handleSplitCashPayment}
                              disabled={callStaffCooldown > 0 || isCallingStaff || isPayingSplitCash || paymentAmountToPay <= 0}
                              className="w-full py-3 bg-amber-500/10 hover:bg-amber-500/20 active:bg-amber-500/30 disabled:opacity-50 text-amber-700 dark:text-amber-300 border border-amber-500/30 font-extrabold text-xs uppercase tracking-wider rounded-2xl shadow-xs active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2 text-center"
                            >
                              <AppIcon name="payments" className="text-lg" />
                              <span>
                                {isPayingSplitCash
                                  ? 'Đang gửi...'
                                  : callStaffCooldown > 0
                                  ? `Đã gọi phục vụ (${callStaffCooldown}s)`
                                  : `Thanh toán Tiền mặt (${formatPrice(paymentAmountToPay)})`}
                              </span>
                            </button>
                          </>
                        )}
                      </div>

                      {/* Service Action Buttons (Visible across all screens) */}
                      <div className="grid grid-cols-2 gap-2.5 pt-2 border-t border-[var(--border-color)]">
                        <button
                          onClick={handleCallStaff}
                          disabled={callStaffCooldown > 0 || isCallingStaff}
                          className="py-2.5 bg-[var(--bg-primary)] hover:bg-slate-200 dark:hover:bg-slate-800 text-[var(--text-primary)] font-extrabold rounded-2xl text-xs uppercase tracking-wider transition-all active:scale-95 cursor-pointer text-center border border-[var(--border-color)] shadow-xs"
                        >
                          {callStaffCooldown > 0 ? `Gọi NV (${callStaffCooldown}s)` : isCallingStaff ? 'Đang gửi...' : 'Gọi nhân viên'}
                        </button>

                        <button
                          onClick={() => {
                            if (order.status !== 'paid') {
                              toast('Bàn còn đơn hàng chưa thanh toán. Vui lòng thanh toán trước khi rời bàn.', { icon: null });
                              return;
                            }
                            handleExecuteLeaveTable();
                          }}
                          disabled={isLeaving}
                          className="py-2.5 bg-[var(--bg-primary)] hover:bg-slate-200 dark:hover:bg-slate-800 disabled:opacity-50 text-[var(--text-primary)] font-extrabold rounded-2xl text-xs uppercase tracking-wider transition-all active:scale-95 cursor-pointer text-center border border-[var(--border-color)] shadow-xs"
                        >
                          {isLeaving ? 'Đang rời bàn...' : 'Rời bàn'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ── Phần Quay Lại Menu Ở Cuối Trang (Desktop, Tablet, Mobile) ── */}
                <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4 transition-all">
                  <div className="min-w-0 flex-1 text-center sm:text-left">
                    <h3 className="text-xs sm:text-sm font-extrabold uppercase tracking-wide text-[var(--text-primary)]">
                      {lang === 'vi' ? 'Bạn muốn gọi thêm món?' : lang === 'zh' ? '您想加点其他饮品吗？' : 'Want to order more?'}
                    </h3>
                    <p className="text-xs text-[var(--text-secondary)] mt-1 font-normal">
                      {lang === 'vi'
                        ? 'Tiếp tục xem thực đơn để gọi thêm đồ uống & bánh ngọt'
                        : lang === 'zh'
                        ? '继续浏览菜单加点饮品与甜点'
                        : 'Explore our menu to add more drinks & pastries'}
                    </p>
                  </div>

                  <button
                    onClick={() => router.push(`/table/${tableId}`)}
                    className="w-full sm:w-auto px-6 py-3 bg-sky-500/10 hover:bg-sky-500/20 text-[#0284c7] dark:text-[#38BDF8] border border-sky-500/30 font-extrabold text-xs uppercase tracking-wider rounded-2xl shadow-xs active:scale-95 transition-all cursor-pointer text-center shrink-0 flex items-center justify-center"
                  >
                    <span>{t.backToMenu}</span>
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
        <div className="sm:hidden fixed bottom-0 inset-x-0 z-40 px-3 py-2.5 pb-[max(0.75rem,env(safe-area-inset-bottom))] bg-[var(--bg-card)]/95 backdrop-blur-md border-t border-[var(--border-color)] shadow-2xl flex items-center justify-between gap-2">
          {/* Left: Summary Amount */}
          <div className="flex flex-col justify-center min-w-0 pr-1 shrink-0">
            <span className="text-[10px] uppercase font-normal text-[var(--text-secondary)] tracking-wider truncate">
              {paymentMode === 'all'
                ? 'Toàn bộ bàn'
                : paymentMode === 'mine'
                ? 'Phần của bạn'
                : `${selectedItems.reduce((s, i) => s + i.quantity, 0)} món chọn`}
            </span>
            <span className="text-sm xs:text-base font-extrabold font-mono text-[#0284c7] dark:text-[#38BDF8] leading-tight truncate">
              {formatPrice(paymentAmountToPay)}
            </span>
          </div>

          {/* Right: Payment Actions */}
          <div className="flex items-center gap-1.5 flex-1 justify-end min-w-0">
            {order.status === 'pending' ? (
              <div className="flex items-center gap-1.5 flex-1 justify-end">
                <div className="h-10 px-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-extrabold flex items-center justify-center text-center flex-1 max-w-[140px] truncate">
                  <span>Chờ duyệt...</span>
                </div>
                <button
                  id="btn-cancel-pending-order-mobile"
                  onClick={handleCancelOrder}
                  disabled={isCancellingOrder}
                  className="h-10 px-2.5 bg-rose-500/10 hover:bg-rose-500/20 active:bg-rose-500/30 text-rose-600 dark:text-rose-400 font-extrabold text-xs rounded-2xl border border-rose-500/20 active:scale-95 transition-all cursor-pointer flex items-center gap-1 shrink-0 disabled:opacity-50"
                >
                  <AppIcon name="close" className="text-base" />
                  <span>{isCancellingOrder ? 'Đang hủy...' : 'Hủy đơn'}</span>
                </button>
              </div>
            ) : (
              <>
                {/* Split Cash Button (Secondary Tinted) */}
                <button
                  onClick={handleSplitCashPayment}
                  disabled={callStaffCooldown > 0 || isCallingStaff || isPayingSplitCash || paymentAmountToPay <= 0}
                  className="h-10 px-2.5 bg-amber-500/10 hover:bg-amber-500/20 active:bg-amber-500/30 disabled:opacity-50 text-amber-700 dark:text-amber-300 border border-amber-500/30 font-extrabold text-xs uppercase tracking-wider rounded-2xl shadow-xs active:scale-95 transition-all cursor-pointer flex items-center gap-1 shrink-0 whitespace-nowrap"
                >
                  <AppIcon name="payments" className="text-base" />
                  <span>{isPayingSplitCash ? 'Đang gửi...' : 'Tiền mặt'}</span>
                </button>

                {/* Split VietQR Button (Primary Solid) */}
                <button
                  onClick={() => {
                    if (paymentAmountToPay <= 0) {
                      toast('Vui lòng chọn ít nhất một món để thanh toán.', { icon: null });
                      return;
                    }
                    setIsBankModalOpen(true);
                  }}
                  disabled={paymentAmountToPay <= 0}
                  className="h-10 px-3 bg-[#0284c7] hover:bg-[#0369a1] disabled:opacity-50 text-white font-extrabold text-xs uppercase tracking-wider rounded-2xl shadow-md shadow-sky-500/20 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-1 shrink-0 whitespace-nowrap"
                >
                  <AppIcon name="qr_code_2" className="text-base" />
                  <span>Chuyển khoản</span>
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
        tableName={formatTableName(order?.tableId?.tableName, lang)}
        lang={lang}
        isLeaving={isLeaving}
      />

      {/* Cancel Order Confirmation Modal */}
      <CancelOrderModal
        isOpen={isCancelConfirmOpen}
        onClose={() => setIsCancelConfirmOpen(false)}
        onConfirm={() => handleCancelOrder(true)}
        orderCode={order?._id ? `#${order._id.slice(-6).toUpperCase()}` : ''}
        orderTotal={order?.totalAmount}
        itemCount={order?.items?.length}
        tableName={formatTableName(order?.tableId?.tableName, lang)}
        isCancelling={isCancellingOrder}
        lang={lang}
      />
    </div>
  );
}
