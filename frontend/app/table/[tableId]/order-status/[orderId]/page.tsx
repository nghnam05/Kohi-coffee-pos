'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import Image from 'next/image';
import { io, Socket } from 'socket.io-client';
import { motion, AnimatePresence } from 'framer-motion';
import { playCashChime, playAlertPing, playMomoChime } from '../../../../utils/sound';
import { ThemeToggleSwitch } from '@/components/table/ThemeToggleSwitch';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
const SOCKET_BASE = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';

type Lang = 'vi' | 'en' | 'zh';

const DICTIONARY = {
  vi: {
    title: 'Theo Dõi Đơn Hàng',
    table: 'Bàn số',
    orderCode: 'Mã đơn hàng',
    status: 'Trạng thái',
    total: 'Tổng thanh toán',
    backToMenu: 'Quay lại thực đơn',
    loading: 'Đang tải thông tin đơn hàng...',
    error: 'Không tìm thấy đơn hàng hoặc đơn hàng đã hoàn tất.',
    orderTime: 'Thời gian đặt món',
    estCompletion: 'Thời gian hoàn thành dự kiến',
    mins: 'phút',
    served: 'Đã phục vụ xong',
    readyToEat: 'Thức uống & bánh đã sẵn sàng!',
    steps: {
      pending: 'Đã nhận đơn',
      cooking: 'Đang pha chế',
      completed: 'Đã ra món',
      paid: 'Hoàn tất thanh toán',
      cancelled: 'Đã hủy đơn',
    },
    stepDesc: {
      pending: 'Quầy pha chế đã nhận thông tin thức uống của bạn.',
      cooking: 'Barista đang chuẩn bị và pha chế thức uống tươi ngon.',
      completed: 'Thức uống & bánh đã sẵn sàng phục vụ tại bàn của bạn. Chúc bạn thưởng thức vui vẻ!',
      paid: 'Cảm ơn quý khách đã thưởng thức tại Kohi Coffee!',
      cancelled: 'Rất tiếc, đơn hàng đã bị hủy. Vui lòng liên hệ nhân viên.',
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
    orderTime: 'Order time',
    estCompletion: 'Estimated completion time',
    mins: 'mins',
    served: 'Served successfully',
    readyToEat: 'Ready to enjoy!',
    steps: {
      pending: 'Order Received',
      cooking: 'Cooking',
      completed: 'Served',
      paid: 'Payment Completed',
      cancelled: 'Cancelled',
    },
    stepDesc: {
      pending: 'Kitchen has received your ordering list.',
      cooking: 'The chef is preparing your dishes with fresh ingredients.',
      completed: 'Your food is served at your table. Enjoy your meal!',
      paid: 'Thank you for dining with us!',
      cancelled: 'Unfortunately, your order has been cancelled. Please contact staff.',
    },
  },
  zh: {
    title: '订单状态追踪',
    table: '桌号',
    orderCode: '订单编号',
    status: '状态',
    total: '总计金额',
    backToMenu: '返回菜单',
    loading: '正在加载订单详情...',
    error: '未找到订单或订单已结账。',
    orderTime: '下单时间',
    estCompletion: '预计送达时间',
    mins: '分钟',
    served: '已全部送达',
    readyToEat: '美食已上桌！',
    steps: {
      pending: '已接单',
      cooking: '正在烹饪',
      completed: '已上菜',
      paid: '交易完成',
      cancelled: '已取消',
    },
    stepDesc: {
      pending: '后厨已收到您的点单信息。',
      cooking: '主厨 đang sử dụng nguyên liệu tươi ngon để chế biến món ăn.',
      completed: '您的美食已送达桌前，请慢用！',
      paid: '感谢您光临本店用餐！',
      cancelled: '抱歉，您的订单已被取消。请联系服务员。',
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
}

interface Order {
  _id: string;
  tableId: {
    tableName: string;
  };
  customerName?: string;
  items: FoodItem[];
  totalAmount: number;
  status: 'pending' | 'cooking' | 'completed' | 'cancelled' | 'paid';
  paymentMethod: 'cash' | 'momo';
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
  const [isLangOpen, setIsLangOpen] = useState(false);
  const [order, setOrder] = useState<Order | null>(null);
  const [tableOrders, setTableOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPaying, setIsPaying] = useState(false);
  const [isCallingStaff, setIsCallingStaff] = useState(false);
  const [callStaffCooldown, setCallStaffCooldown] = useState(0);
  const socketRef = useRef<Socket | null>(null);

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
      alert('Đã gửi yêu cầu gọi nhân viên thành công! ');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Lỗi khi gọi nhân viên.');
    } finally {
      setIsCallingStaff(false);
    }
  };

  // ── Review states ────────────────────────────────────────────────────────────
  const [hasReviewed, setHasReviewed] = useState(false);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [overallStar, setOverallStar] = useState(5);
  const [overallComment, setOverallComment] = useState('');
  const [foodStars, setFoodStars] = useState<Record<string, number>>({});

  const handleSimulateMoMoPayment = async () => {
    if (!orderId) return;
    setIsPaying(true);
    try {
      const res = await fetch(`${API_BASE}/orders/${orderId}/pay`, {
        method: 'PATCH',
      });
      if (!res.ok) throw new Error('Thanh toán thất bại.');

      const updatedOrder = await res.json();
      setOrder(updatedOrder);

      try {
        playMomoChime();
      } catch (e) { }
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Lỗi thanh toán.');
    } finally {
      setIsPaying(false);
    }
  };

  const t = DICTIONARY[lang];

  // ── Check if already reviewed ────────────────────────────────────────────────
  useEffect(() => {
    if (!orderId || !order || order.status !== 'paid') return;
    fetch(`${API_BASE}/reviews/order/${orderId}`)
      .then((r) => r.json())
      .then((data) => { if (data?._id) setHasReviewed(true); })
      .catch(() => { });
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
      setIsReviewOpen(false);
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Lỗi gửi đánh giá.');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch Order details publicly through table orders endpoint
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

    // Socket.io for live updates
    socketRef.current = io(SOCKET_BASE);

    socketRef.current.on('statusUpdated', ({ orderId: updatedId, status }: { orderId: string; status: Order['status'] }) => {
      if (updatedId === orderId) {
        setOrder((prev) => (prev ? { ...prev, status } : null));
        if (status === 'completed') {
          playCashChime();
        } else {
          playAlertPing();
        }
      }
      setTableOrders((prev) =>
        prev.map((o) => (o._id === updatedId ? { ...o, status } : o))
      );
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

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [orderId, tableId, router, t.error]);

  if (!mounted) return null;

  const stepsList: Order['status'][] = ['pending', 'cooking', 'completed', 'paid'];
  const currentStepIndex = order ? stepsList.indexOf(order.status) : -1;

  const isDark = resolvedTheme === 'dark';

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] dark:bg-[#090D16] text-[#000000] dark:text-[#FFFFFF] transition-colors duration-300 font-sans selection:bg-[#3AA6FF] selection:text-white">
      {/* Header Top Bar */}
      <header className="sticky top-0 z-40 bg-[var(--bg-primary)]/95 backdrop-blur-md border-b border-[var(--border-color)] transition-colors shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between font-sans">
          <button
            onClick={() => router.push(`/table/${tableId}`)}
            className="px-3.5 py-2 bg-[var(--bg-card)] border border-[var(--border-color)] hover:border-[#3AA6FF] rounded-xl text-xs font-[700] text-[var(--text-primary)] hover:text-[#3AA6FF] transition-all shadow-xs active:scale-95 cursor-pointer flex items-center gap-1.5"
          >
            <span>Quay lại thực đơn</span>
          </button>

          <div className="flex items-center gap-3">
            {/* UIverse Theme Switch */}
            <ThemeToggleSwitch isDark={isDark} setTheme={setTheme} />

            {/* Language Selector Pills */}
            <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-1 flex items-center gap-1 shadow-xs">
              <button
                onClick={() => setLang('vi')}
                className={`text-[10.5px] font-[700] px-2.5 py-1 rounded-lg transition-all ${
                  lang === 'vi'
                    ? 'bg-[#3AA6FF] text-white shadow-xs'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                VI
              </button>
              <button
                onClick={() => setLang('en')}
                className={`text-[10.5px] font-[700] px-2.5 py-1 rounded-lg transition-all ${
                  lang === 'en'
                    ? 'bg-[#3AA6FF] text-white shadow-xs'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                EN
              </button>
              <button
                onClick={() => setLang('zh')}
                className={`text-[10.5px] font-[700] px-2.5 py-1 rounded-lg transition-all ${
                  lang === 'zh'
                    ? 'bg-[#3AA6FF] text-white shadow-xs'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                ZH
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 font-sans">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-32 gap-3">
            <div className="w-10 h-10 border-4 border-[#3AA6FF] border-t-transparent rounded-full animate-spin"></div>
            <p className="text-xs font-black text-[#64748B] dark:text-[#94A3B8]">{t.loading}</p>
          </div>
        ) : error ? (
          <div className="text-center py-16 bg-[#FFFFFF] dark:bg-[#181B21] rounded-2xl p-6 shadow-md border border-[#E2E8F0] dark:border-[#222222] transition-colors">
            <span className="material-symbols-outlined text-5xl text-amber-500 mb-2">info</span>
            <h2 className="text-base font-black text-[#000000] dark:text-[#FFFFFF] mt-2">{t.error}</h2>
            <button
              onClick={() => router.push(`/table/${tableId}`)}
              className="mt-6 w-full bg-[#3AA6FF] hover:bg-[#3AA6FF]/90 text-white font-black py-3 rounded-xl transition-all active:scale-95 text-xs uppercase tracking-wider shadow-md"
            >
              {t.backToMenu}
            </button>
          </div>
        ) : order && (
          <div className="space-y-6">
            {order.status === 'paid' ? (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-6xl mx-auto items-start font-sans">
                {/* 1️⃣ LEFT COLUMN: BEAUTIFUL INVOICE / RECEIPT COMPONENT FOR CUSTOMER (lg:col-span-7) */}
                <div className="lg:col-span-7 bg-[var(--bg-card)] rounded-2xl p-6 sm:p-8 shadow-2xl border border-[var(--border-color)] transition-all relative overflow-hidden font-sans">
                  {/* Dotted Accent Header Top Bar */}
                  <div className="absolute top-0 left-0 right-0 h-1.5 bg-[#3AA6FF]" />

                  {/* Stamp "ĐÃ THANH TOÁN" */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.05] pointer-events-none rotate-12 select-none text-center">
                    <span className="text-5xl sm:text-6xl font-[900] border-8 border-emerald-500 text-emerald-500 rounded-2xl px-6 py-3 tracking-widest uppercase">
                      ĐÃ THANH TOÁN
                    </span>
                  </div>

                  {/* Receipt Header */}
                  <div className="text-center pb-6 border-b border-dashed border-[var(--border-color)]">
                    <div className="w-12 h-12 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center text-2xl mx-auto mb-3 border border-emerald-500/30">
                      <span className="material-symbols-outlined text-2xl">check_circle</span>
                    </div>
                    <h2 className="text-xl font-[700] text-[var(--text-primary)] mt-2 font-heading tracking-tight">
                      HÓA ĐƠN THANH TOÁN
                    </h2>
                    <p className="text-[11px] font-[500] text-[var(--text-secondary)] mt-1 uppercase tracking-wider font-sans">
                      Cảm ơn quý khách đã tin dùng Kohi Coffee & Pastry
                    </p>

                    <div className="grid grid-cols-2 gap-3 mt-6 text-left text-xs text-[var(--text-primary)]">
                      <div>
                        <p className="text-[var(--text-secondary)] font-normal">Mã hóa đơn:</p>
                        <p className="font-bold uppercase text-[#3AA6FF]">#{order._id.slice(-8).toUpperCase()}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[var(--text-secondary)] font-normal">Số bàn:</p>
                        <p className="font-bold">{order.tableId?.tableName || '—'}</p>
                      </div>
                      <div className="mt-2">
                        <p className="text-[var(--text-secondary)] font-normal">Hình thức:</p>
                        <span className={`inline-block text-[10.5px] font-bold px-3 py-1 rounded-full mt-1 border ${
                          order.paymentMethod === 'momo'
                            ? 'bg-pink-500/10 text-pink-500 border-pink-500/30'
                            : 'bg-[#3AA6FF]/10 text-[#3AA6FF] border-[#3AA6FF]/30'
                        }`}>
                          {order.paymentMethod === 'momo' ? 'Ví MoMo' : 'Tiền mặt'}
                        </span>
                      </div>
                      <div className="text-right mt-2">
                        <p className="text-[var(--text-secondary)] font-normal">Thời gian:</p>
                        <p className="font-bold">{new Date(order.createdAt).toLocaleTimeString('vi-VN')} {new Date(order.createdAt).toLocaleDateString('vi-VN')}</p>
                      </div>
                    </div>
                  </div>

                  {/* Items list */}
                  <div className="py-5 border-b border-dashed border-[var(--border-color)] space-y-3">
                    <p className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-widest mb-1">
                      Chi tiết thức uống & bánh
                    </p>
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-start text-xs text-left">
                        <div className="flex-1 pr-4">
                          <p className="font-semibold text-[var(--text-primary)] font-sans">
                            {item.foodId?.name || 'Thức uống / Bánh'}
                            <span className="text-[#3AA6FF] font-bold ml-1.5">x{item.quantity}</span>
                          </p>
                          {item.note && (
                            <p className="text-[11px] text-[var(--text-secondary)] font-normal italic mt-0.5 pl-2 border-l border-[#3AA6FF]/40">
                              Ghi chú: {item.note}
                            </p>
                          )}
                        </div>
                        <span className="font-bold text-[var(--text-primary)] shrink-0 font-sans">
                          {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format((item.foodId?.price || 0) * item.quantity)}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Total section */}
                  <div className="pt-5 pb-2 space-y-2 font-sans">
                    <div className="flex justify-between text-xs text-[var(--text-secondary)] font-normal">
                      <span>Tổng tiền món:</span>
                      <span className="font-bold text-[var(--text-primary)]">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(order.totalAmount)}</span>
                    </div>
                    <div className="flex justify-between text-xs text-[var(--text-secondary)] font-normal">
                      <span>Phí dịch vụ:</span>
                      <span className="font-bold text-emerald-500">Miễn phí</span>
                    </div>
                    <div className="flex justify-between items-center pt-3 border-t border-[var(--border-color)] mt-2">
                      <span className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider">TỔNG CỘNG:</span>
                      <span className="text-xl font-extrabold text-[#3AA6FF]">
                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(order.totalAmount)}
                      </span>
                    </div>
                  </div>

                  {/* Success Banner */}
                  <div className="mt-6 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center gap-3">
                    <span className="material-symbols-outlined text-emerald-500 text-2xl">verified</span>
                    <div className="text-left">
                      <h4 className="text-xs font-bold text-emerald-500">Thanh toán hoàn tất!</h4>
                      <p className="text-[11px] font-normal text-[var(--text-secondary)] mt-0.5">
                        Giao dịch đã được ghi nhận thành công trên hệ thống.
                      </p>
                    </div>
                  </div>

                  {/* Back to Menu CTA */}
                  <button
                    onClick={() => router.push(`/table/${tableId}`)}
                    className="mt-6 w-full h-[52px] uiverse-btn text-[#FFFFFF] font-bold rounded-xl shadow-md hover:shadow-lg transition-all text-xs uppercase tracking-wider flex items-center justify-center font-sans cursor-pointer"
                  >
                    <span>Quay lại Thực đơn</span>
                  </button>
                </div>

                {/* 2️⃣ RIGHT COLUMN: REVIEW & RATING CARD (lg:col-span-5) */}
                <div className="lg:col-span-5 bg-[var(--bg-card)] rounded-2xl p-6 sm:p-8 shadow-2xl border border-[var(--border-color)] transition-all font-sans">
                  <div className="flex items-center gap-3 pb-4 border-b border-[var(--border-color)] mb-5">
                    <div className="w-10 h-10 rounded-xl bg-[#3AA6FF]/10 text-[#3AA6FF] flex items-center justify-center border border-[#3AA6FF]/30">
                      <span className="material-symbols-outlined text-xl">rate_review</span>
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-[var(--text-primary)] font-heading">
                        {lang === 'vi' ? 'Đánh giá trải nghiệm' : 'Rate your experience'}
                      </h3>
                      <p className="text-[11px] text-[var(--text-secondary)]">
                        {lang === 'vi' ? 'Ý kiến của bạn giúp Kohi nâng cao chất lượng phục vụ' : 'Your feedback helps us improve our service'}
                      </p>
                    </div>
                  </div>

                  {hasReviewed ? (
                    <div className="text-center py-8 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-6">
                      <span className="material-symbols-outlined text-4xl text-emerald-500 mb-2">workspace_premium</span>
                      <h4 className="text-sm font-bold text-emerald-500">
                        {lang === 'vi' ? 'Cảm ơn bạn đã gửi đánh giá!' : 'Thank you for your review!'}
                      </h4>
                      <p className="text-xs text-[var(--text-secondary)] mt-1">
                        {lang === 'vi' ? 'Đánh giá của bạn đã được hệ thống ghi nhận.' : 'Your review has been successfully recorded.'}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-5">
                      {/* Per-food rating */}
                      <div className="space-y-3">
                        <p className="text-[11px] uppercase font-bold text-[var(--text-tertiary)] tracking-wider">
                          {lang === 'vi' ? 'Đánh giá từng món' : 'Rate items'}
                        </p>
                        {order.items.map((item, i) => (
                          <div key={i} className="flex items-center justify-between gap-2 bg-[var(--bg-primary)] p-3 rounded-xl border border-[var(--border-color)]">
                            <span className="text-xs font-bold text-[var(--text-primary)] truncate max-w-[140px] sm:max-w-none">{item.foodId?.name}</span>
                            <div className="flex gap-1 shrink-0">
                              {[1, 2, 3, 4, 5].map((s) => (
                                <button
                                  key={s}
                                  onClick={() => setFoodStars((prev) => ({ ...prev, [item.foodId?._id]: s }))}
                                  className={`text-lg transition-transform hover:scale-125 cursor-pointer ${
                                    s <= (foodStars[item.foodId?._id] ?? 5) ? 'text-amber-400' : 'text-gray-300 dark:text-gray-700'
                                  }`}
                                >★</button>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Overall rating & comment */}
                      <div className="border-t border-[var(--border-color)] pt-4 space-y-3">
                        <p className="text-[11px] uppercase font-bold text-[var(--text-tertiary)] tracking-wider">
                          {lang === 'vi' ? 'Đánh giá tổng thể' : 'Overall Rating'}
                        </p>
                        <div className="flex gap-2 justify-center py-1">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <button
                              key={s}
                              onClick={() => setOverallStar(s)}
                              className={`text-3xl transition-transform hover:scale-125 cursor-pointer ${
                                s <= overallStar ? 'text-amber-400' : 'text-gray-300 dark:text-gray-700'
                              }`}
                            >★</button>
                          ))}
                        </div>
                        <textarea
                          value={overallComment}
                          onChange={(e) => setOverallComment(e.target.value)}
                          placeholder={lang === 'vi' ? 'Nhận xét thêm về thức uống, không gian, thái độ phục vụ (tuỳ chọn)...' : 'Additional comments on drinks, space, or service (optional)...'}
                          rows={4}
                          maxLength={300}
                          className="w-full text-xs bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl px-3.5 py-3 outline-none focus:border-[#3AA6FF] resize-none text-[var(--text-primary)] font-normal placeholder-[var(--text-tertiary)] transition-colors"
                        />
                      </div>

                      <button
                        onClick={handleSubmitReview}
                        disabled={isSubmittingReview}
                        className="w-full h-[48px] uiverse-btn text-[#FFFFFF] font-bold rounded-xl shadow-md transition-all text-xs uppercase tracking-wider disabled:opacity-50 font-sans cursor-pointer"
                      >
                        {isSubmittingReview
                          ? (lang === 'vi' ? 'Đang gửi...' : 'Submitting...')
                          : (lang === 'vi' ? 'Gửi đánh giá ngay' : 'Submit Review Now')}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-12 lg:grid-cols-12 gap-6 items-stretch pb-16 lg:pb-0">

                {/* 1️⃣ LEFT COLUMN (LỊCH SỬ GỌI MÓN TẠI BÀN) */}
                <div className="order-3 md:order-3 lg:order-1 md:col-span-12 lg:col-span-3 bg-[#FFFFFF] dark:bg-[#11141A] border border-[#E2E8F0] dark:border-[#222732] rounded-2xl p-5 flex flex-col justify-between shadow-xl text-left transition-colors">
                  <div>
                    {/* Header */}
                    <div className="mb-4 border-b border-[#E2E8F0] dark:border-[#222732] pb-3">
                      <h2 className="text-xl font-black text-[#000000] dark:text-[#FFFFFF] tracking-tight uppercase">LỊCH SỬ</h2>
                      <p className="text-[11px] font-black text-[#64748B] dark:text-[#94A3B8] uppercase tracking-wider mt-0.5">GỌI MÓN TẠI BÀN</p>
                    </div>

                    {/* Subheader Badge Row */}
                    <div className="flex items-center justify-between py-2 border-b border-[#E2E8F0] dark:border-[#222732] mb-4 text-xs">
                      <span className="font-normal text-[#64748B] dark:text-[#94A3B8]">Tổng cộng</span>
                      <span className="font-black text-[#3AA6FF] bg-[#3AA6FF]/10 border border-[#3AA6FF]/30 px-2.5 py-0.5 rounded-full">
                        {tableOrders.length} lượt gọi
                      </span>
                    </div>

                    {/* Round List */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3 max-h-72 md:max-h-80 lg:max-h-[calc(100vh-340px)] overflow-y-auto pr-1 scrollbar-thin">
                      {tableOrders.map((tOrder, idx) => (
                        <div
                          key={tOrder._id}
                          onClick={() => {
                            if (tOrder._id !== orderId) {
                              router.push(`/table/${tableId}/order-status/${tOrder._id}`);
                            }
                          }}
                          className={`p-3.5 rounded-xl border transition-all cursor-pointer text-left ${tOrder._id === orderId
                            ? 'border-[#3AA6FF] bg-[#3AA6FF]/10 dark:bg-[#181B21] ring-2 ring-[#3AA6FF]/30 shadow-md'
                            : 'border-[#E2E8F0] dark:border-[#222732] bg-[#F8FAFC] dark:bg-[#181B21]/50 hover:border-[#3AA6FF]/50'
                            }`}
                        >
                          <div className="flex justify-between items-center mb-1.5">
                            <span className="text-xs font-black text-[#000000] dark:text-[#FFFFFF]">
                              Lượt #{tableOrders.length - idx}
                            </span>
                            <span className="text-[11px] font-normal text-[#64748B] dark:text-[#94A3B8]">
                              {new Date(tOrder.createdAt).toLocaleTimeString('vi-VN')}
                            </span>
                          </div>

                          <p className="text-xs font-normal text-[#475569] dark:text-[#94A3B8] truncate">
                            {tOrder.items.map(i => `${i.quantity}x ${i.foodId?.name || 'Món'}`).join(', ')}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Bottom Table Info */}
                  <div className="pt-4 mt-4 border-t border-[#E2E8F0] dark:border-[#222732] flex items-center justify-between text-xs text-[#000000] dark:text-white/90">
                    <div className="flex items-center gap-2 font-black">
                      <span className="material-symbols-outlined text-base text-[#3AA6FF]">table_restaurant</span>
                      <span>{order.tableId?.tableName ? (
                        order.tableId.tableName.toLowerCase().startsWith('bàn') || order.tableId.tableName.toLowerCase().startsWith('table')
                          ? order.tableId.tableName
                          : `${t.table} ${order.tableId.tableName}`
                      ) : '—'}</span>
                    </div>
                    {order.customerName && (
                      <span className="text-[11px] font-black text-[#3AA6FF] bg-[#3AA6FF]/10 px-2 py-0.5 rounded-full border border-[#3AA6FF]/30">
                        👤 {order.customerName}
                      </span>
                    )}
                  </div>
                </div>


                {/* 2️⃣ MIDDLE COLUMN (LIVE TRACKING & TIMELINE) */}
                <div className="order-1 md:order-1 lg:order-2 md:col-span-7 lg:col-span-5 bg-[#FFFFFF] dark:bg-[#11141A] border border-[#E2E8F0] dark:border-[#222732] rounded-2xl p-5 sm:p-6 shadow-xl flex flex-col justify-between text-left transition-colors">
                  <div>
                    {/* Top Header Badge */}
                    <div className="flex justify-start">
                      <span className="text-[10px] font-black text-[#3AA6FF] bg-[#3AA6FF]/15 px-3 py-1 rounded-full border border-[#3AA6FF]/30 uppercase tracking-widest">
                        LIVE TRACKING
                      </span>
                    </div>

                    {/* Order Code */}
                    <h1 className="text-2xl sm:text-4xl font-black text-[#000000] dark:text-[#FFFFFF] tracking-tight mt-3">
                      #{order._id.slice(-6).toUpperCase()}
                    </h1>

                    {/* Est Completion Time Pill */}
                    {order.status !== 'cancelled' && (
                      <div className="mt-3 inline-flex items-center gap-2 bg-[#3AA6FF]/10 border border-[#3AA6FF]/25 px-3.5 py-1.5 rounded-full text-xs font-black text-[#3AA6FF]">
                        <span className="material-symbols-outlined text-sm animate-pulse">schedule</span>
                        <span>Dự kiến hoàn thành: ~{new Date(new Date(order.createdAt).getTime() + 20 * 60 * 1000).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    )}

                    {/* Vertical Timeline */}
                    <div className="mt-6 sm:mt-8 relative pl-7 sm:pl-8 before:absolute before:left-3.5 before:top-3 before:bottom-3 before:w-[2px] before:bg-[#CBD5E1] dark:before:bg-[#222732]">
                      {stepsList.map((stepKey, idx) => {
                        const isCompleted = idx < currentStepIndex;
                        const isCurrent = idx === currentStepIndex;

                        return (
                          <div key={stepKey} className="relative mb-5 sm:mb-6 last:mb-0">
                            {/* Timeline Node Circle */}
                            <div className={`absolute -left-7 sm:-left-8 top-3.5 w-7 h-7 rounded-full flex items-center justify-center text-xs font-black transition-all ${isCompleted ? 'bg-[#3AA6FF] text-white shadow-md' :
                              isCurrent ? 'bg-[#3AA6FF] text-white ring-4 ring-[#3AA6FF]/30 shadow-lg animate-pulse' :
                                'bg-[#CBD5E1] dark:bg-[#222732] text-[#64748B]'
                              }`}>
                              {isCompleted ? '✓' : isCurrent ? '⊙' : '•'}
                            </div>

                            {/* Step Card Box */}
                            <div className={`p-3.5 sm:p-4 rounded-xl border text-left transition-all ${isCurrent
                              ? 'bg-[#3AA6FF]/10 dark:bg-[#181B21] border-[#3AA6FF] ring-2 ring-[#3AA6FF]/20 shadow-lg'
                              : 'bg-[#F8FAFC] dark:bg-[#181B21]/40 border-[#E2E8F0] dark:border-[#222732] opacity-80'
                              }`}>
                              <h4 className={`text-xs sm:text-sm font-black uppercase tracking-wider ${isCurrent ? 'text-[#3AA6FF]' : isCompleted ? 'text-[#000000] dark:text-white' : 'text-[#64748B] dark:text-[#64748B]'
                                }`}>
                                {t.steps[stepKey]}
                              </h4>
                              <p className={`text-xs font-normal mt-1 leading-relaxed ${isCurrent ? 'text-[#000000] dark:text-white/90' : 'text-[#64748B] dark:text-[#94A3B8]'
                                }`}>
                                {t.stepDesc[stepKey]}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Integrated Payment Actions (MoMo/Cash) */}
                  {order.status !== 'cancelled' && (
                    <div className="mt-6 pt-4 border-t border-[#E2E8F0] dark:border-[#222732]">
                      {order.paymentMethod === 'momo' ? (
                        <button
                          onClick={handleSimulateMoMoPayment}
                          disabled={isPaying}
                          className="w-full py-3.5 bg-pink-500 hover:bg-pink-600 text-white font-black rounded-xl shadow-md transition-all active:scale-95 text-xs uppercase tracking-wider cursor-pointer"
                        >
                          {isPaying ? 'Đang xử lý...' : 'Thanh toán MoMo ngay '}
                        </button>
                      ) : (
                        <p className="text-xs font-normal text-[#64748B] dark:text-[#94A3B8] text-center">
                          Vui lòng thanh toán tiền mặt tại quầy hoặc chờ nhân viên tại bàn.
                        </p>
                      )}
                    </div>
                  )}
                </div>


                {/* 3️⃣ RIGHT COLUMN (ORDER DETAILS & CALL STAFF) */}
                <div className="order-2 md:order-2 lg:order-3 md:col-span-5 lg:col-span-4 bg-[#FFFFFF] dark:bg-[#11141A] border border-[#E2E8F0] dark:border-[#222732] rounded-2xl p-5 sm:p-6 shadow-xl flex flex-col justify-between text-left transition-colors">
                  <div>
                    {/* Header */}
                    <h3 className="text-base sm:text-lg font-black text-[#000000] dark:text-[#FFFFFF] uppercase tracking-wider mb-4 sm:mb-5 text-left border-b border-[#E2E8F0] dark:border-[#222732] pb-3">
                      ORDER DETAILS
                    </h3>

                    {/* Food Items List */}
                    <div className="space-y-3.5 max-h-72 md:max-h-80 lg:max-h-[calc(100vh-340px)] overflow-y-auto pr-1 scrollbar-thin">
                      {order.items.map((item, idx) => {
                        const foodImg = item.foodId?.image || 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=500&q=80';
                        return (
                          <div key={idx} className="bg-[#F8FAFC] dark:bg-[#181B21] border border-[#E2E8F0] dark:border-[#222732] p-3 sm:p-3.5 rounded-xl flex items-start gap-3 text-left relative group">
                            {/* Image thumbnail with Quantity Badge overlay */}
                            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden relative bg-[#E2E8F0] dark:bg-[#090D16] border border-[#CBD5E1] dark:border-[#222732] flex-shrink-0">
                              <Image
                                src={foodImg}
                                alt={item.foodId?.name || 'Food image'}
                                fill
                                className="object-cover"
                              />
                              <span className="absolute top-1 left-1 bg-[#3AA6FF] text-white text-[10px] font-black px-1.5 py-0.5 rounded-md shadow-sm z-10">
                                x{item.quantity}
                              </span>
                            </div>

                            {/* Food Info */}
                            <div className="flex-1 min-w-0 pr-1 sm:pr-2">
                              <p className="font-black text-xs sm:text-sm text-[#000000] dark:text-[#FFFFFF] truncate">
                                {item.foodId?.name || 'Thức uống / Bánh'}
                              </p>
                              {item.note ? (
                                <p className="text-[11px] sm:text-xs font-normal text-[#64748B] dark:text-[#94A3B8] italic mt-0.5 truncate">
                                  {item.note}
                                </p>
                              ) : (
                                <p className="text-[10px] sm:text-[11px] font-normal text-[#64748B] dark:text-[#94A3B8] italic mt-0.5">
                                  Chuẩn vị Kohi
                                </p>
                              )}
                              <p className="font-black text-xs sm:text-sm text-[#3AA6FF] mt-1">
                                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format((item.foodId?.price || 0) * item.quantity)}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Bottom Total Amount & Call Staff CTA */}
                  <div className="pt-4 border-t border-[#E2E8F0] dark:border-[#222732] mt-4 space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-normal text-[#64748B] dark:text-[#94A3B8]">Total Amount</span>
                      <span className="text-xl sm:text-2xl font-black text-[#000000] dark:text-[#FFFFFF]">
                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(order.totalAmount)}
                      </span>
                    </div>

                    <button
                      onClick={handleCallStaff}
                      disabled={callStaffCooldown > 0 || isCallingStaff}
                      className="hidden sm:flex w-full py-4 bg-[#F1F5F9] dark:bg-[#181B21] hover:bg-[#E2E8F0] dark:hover:bg-[#22252C] border border-[#CBD5E1] dark:border-[#333333] hover:border-[#3AA6FF] text-[#000000] dark:text-[#FFFFFF] font-black rounded-xl shadow-md transition-all active:scale-95 text-xs uppercase tracking-wider items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      <span>
                        {callStaffCooldown > 0
                          ? `Gọi nhân viên (${callStaffCooldown}s)`
                          : isCallingStaff
                            ? 'Đang gửi yêu cầu...'
                            : 'GỌI NHÂN VIÊN'}
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Sticky Mobile Floating Action Bar for Gọi Nhân Viên */}
            {order && order.status !== 'paid' && (
              <div className="sm:hidden fixed bottom-0 left-0 right-0 p-3 bg-[#FFFFFF]/95 dark:bg-[#11141A]/95 backdrop-blur-md border-t border-[#E2E8F0] dark:border-[#222732] z-30 shadow-2xl">
                <button
                  onClick={handleCallStaff}
                  disabled={callStaffCooldown > 0 || isCallingStaff}
                  className="w-full py-3.5 bg-[#F1F5F9] dark:bg-[#181B21] hover:bg-[#E2E8F0] dark:hover:bg-[#22252C] border border-[#3AA6FF] text-[#000000] dark:text-[#FFFFFF] font-black rounded-xl shadow-lg active:scale-95 text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-base text-[#3AA6FF] animate-pulse">notifications</span>
                  <span>
                    {callStaffCooldown > 0
                      ? `GỌI NHÂN VIÊN (${callStaffCooldown}s)`
                      : isCallingStaff
                        ? 'ĐANG GỬI YÊU CẦU...'
                        : 'GỌI NHÂN VIÊN'}
                  </span>
                </button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
