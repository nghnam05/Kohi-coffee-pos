'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import Image from 'next/image';
import { io, Socket } from 'socket.io-client';
import { motion, AnimatePresence } from 'framer-motion';
import { playCashChime, playAlertPing, playMomoChime } from '@/app/utils/sound';
import { ThemeToggleSwitch } from '@/components/table/ThemeToggleSwitch';
import { LanguageToggleSwitch, Lang } from '@/components/table/LanguageToggleSwitch';
import { BrandLogo } from '@/components/table/BrandLogo';
import { MomoPayModal } from '@/components/table/MomoPayModal';
import { formatTableName } from '@/utils/format';
import { toast } from 'react-hot-toast';

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
    backToHome: 'Trang chủ (Đặt bàn)',
    loading: 'Đang tải thông tin đơn hàng...',
    error: 'Không tìm thấy đơn hàng hoặc đơn hàng đã hoàn tất.',
    orderTime: 'Thời gian đặt món',
    estCompletion: 'Thời gian hoàn thành dự kiến',
    mins: 'phút',
    served: 'Đã phục vụ xong',
    readyToEat: 'Thức uống & bánh đã sẵn sàng!',
    steps: {
      pending: 'Đã gửi đơn',
      confirmed: 'Phục vụ đã duyệt',
      cooking: 'Đang pha chế',
      ready: 'Xong pha chế',
      completed: 'Đã ra món tại bàn',
      paid: 'Hoàn tất thanh toán',
      cancelled: 'Đã hủy đơn',
    },
    stepDesc: {
      pending: 'Đơn hàng của bạn đã gửi lên hệ thống. Phục vụ đang xác nhận.',
      confirmed: 'Nhân viên phục vụ đã duyệt đơn và gửi xuống Quầy pha chế.',
      cooking: 'Barista đang chuẩn bị và pha chế thức uống tươi ngon cho bạn.',
      ready: 'Quầy pha chế đã làm xong đồ uống! Phục vụ đang mang ra bàn.',
      completed: 'Thức uống & bánh đã được phục vụ tại bàn của bạn. Chúc bạn ngon miệng!',
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
    backToHome: 'Home Page (Booking)',
    loading: 'Loading order details...',
    error: 'Order not found or already completed.',
    orderTime: 'Order time',
    estCompletion: 'Estimated completion time',
    mins: 'mins',
    served: 'Served successfully',
    readyToEat: 'Ready to enjoy!',
    steps: {
      pending: 'Order Received',
      confirmed: 'Confirmed by Waiter',
      cooking: 'Cooking / Brewing',
      ready: 'Drink Ready',
      completed: 'Served',
      paid: 'Payment Completed',
      cancelled: 'Cancelled',
    },
    stepDesc: {
      pending: 'Order submitted. Service staff is confirming your order.',
      confirmed: 'Service staff confirmed your order and sent to the Barista.',
      cooking: 'The Barista is preparing your drinks with fresh ingredients.',
      ready: 'Your drinks are ready! Service staff is bringing them to your table.',
      completed: 'Your order is served at your table. Enjoy your meal!',
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
    backToHome: '返回首页（预订桌位）',
    loading: '正在加载订单详情...',
    error: '未找到订单或订单已结账。',
    orderTime: '下单时间',
    estCompletion: '预计送达时间',
    mins: '分钟',
    served: '已全部送达',
    readyToEat: '美食已上桌！',
    steps: {
      pending: '已接单',
      confirmed: '服务员已确认',
      cooking: '正在烹饪',
      ready: '饮品制作完成',
      completed: '已上菜',
      paid: '交易完成',
      cancelled: '已取消',
    },
    stepDesc: {
      pending: '订单已提交，服务员正在确认中。',
      confirmed: '服务员已确认订单并转交吧台制作。',
      cooking: '调饮师正在为您制作新鲜饮品。',
      ready: '饮品已制作完成，服务员正送往您的餐桌。',
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
  status: 'pending' | 'confirmed' | 'cooking' | 'ready' | 'completed' | 'cancelled' | 'paid';
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
  const [order, setOrder] = useState<Order | null>(null);
  const [tableOrders, setTableOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPaying, setIsPaying] = useState(false);
  const [isMomoModalOpen, setIsMomoModalOpen] = useState(false);
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
      toast('Đã gửi yêu cầu gọi nhân viên thành công!', { icon: null });
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Lỗi khi gọi nhân viên.', { icon: null });
    } finally {
      setIsCallingStaff(false);
    }
  };

  // ── Review states ────────────────────────────────────────────────────────────
  const [hasReviewed, setHasReviewed] = useState(false);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [overallStar, setOverallStar] = useState(5);
  const [overallComment, setOverallComment] = useState('');
  const [foodStars, setFoodStars] = useState<Record<string, number>>({});

  const t = DICTIONARY[lang];

  useEffect(() => {
    setMounted(true);
  }, []);

  // Check if already reviewed
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
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Lỗi gửi đánh giá.', { icon: null });
    } finally {
      setIsSubmittingReview(false);
    }
  };

  // Fetch Order details
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
        if (status === 'paid') {
          playMomoChime();
        } else if (status === 'completed') {
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

  const stepsList: string[] = ['pending', 'confirmed', 'cooking', 'ready', 'completed', 'paid'];
  const currentStepIndex = order ? stepsList.indexOf(order.status) : -1;
  const isDark = resolvedTheme === 'dark';

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg-primary)] text-[var(--text-primary)] transition-colors duration-300 font-sans selection:bg-[#0284c7] selection:text-white">
      {/* ── Standardized Header Bar ───────────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-[var(--bg-card)]/90 backdrop-blur-md border-b border-[var(--border-color)] transition-colors shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between font-sans">
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => router.push(`/table/${tableId}`)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200/80 dark:border-slate-700/60 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 transition-all active:scale-95 cursor-pointer"
              title={t.backToMenu}
            >
              <span className="material-symbols-outlined text-sm">arrow_back</span>
              <span className="hidden xs:inline">{t.backToMenu}</span>
              <span className="xs:hidden">{lang === 'en' ? 'Menu' : lang === 'zh' ? '菜单' : 'Menu'}</span>
            </button>
            <BrandLogo onClick={() => router.push(`/table/${tableId}`)} />
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Standard Theme Toggle Switch */}
            <ThemeToggleSwitch isDark={isDark} setTheme={setTheme} />

            {/* Standard Compact Language Toggle Switch (VI / EN / ZH cycle button) */}
            <LanguageToggleSwitch lang={lang} setLang={setLang} />
          </div>
        </div>
      </header>

      {/* ── Main Content Area ───────────────────────────────────────────── */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 font-sans">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-32 gap-3">
            <div className="w-10 h-10 border-4 border-[#0284c7] dark:border-[#38BDF8] border-t-transparent rounded-full animate-spin" />
            <p className="text-xs font-bold text-[var(--text-secondary)]">{t.loading}</p>
          </div>
        ) : error ? (
          <div className="text-center py-16 bg-[var(--bg-card)] rounded-3xl p-6 shadow-xl border border-[var(--border-color)] transition-colors max-w-md mx-auto">
            <span className="material-symbols-outlined text-5xl text-amber-500 mb-2">info</span>
            <h2 className="text-base font-black text-[var(--text-primary)] mt-2 mb-4">{t.error}</h2>
            <button
              onClick={() => router.push(`/table/${tableId}`)}
              className="px-5 py-2.5 bg-[#0284c7] hover:bg-[#0369a1] text-white font-bold rounded-xl text-xs shadow-md transition-all active:scale-95 cursor-pointer"
            >
              {t.backToMenu}
            </button>
          </div>
        ) : order ? (
          <div>
            {order.status === 'paid' ? (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-6xl mx-auto font-sans">
                {/* Receipt Card */}
                <div className="lg:col-span-7 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden font-sans">
                  {/* Stamp "ĐÃ THANH TOÁN" */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.04] pointer-events-none rotate-12 select-none text-center">
                    <span className="text-5xl sm:text-6xl font-[900] border-8 border-emerald-500 text-emerald-500 rounded-3xl px-6 py-3 tracking-widest uppercase">
                      {lang === 'en' ? 'PAID' : lang === 'zh' ? '已结账' : 'ĐÃ THANH TOÁN'}
                    </span>
                  </div>

                  {/* Receipt Header */}
                  <div className="text-center pb-6 border-b border-dashed border-[var(--border-color)]">
                    <div className="w-12 h-12 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center text-2xl mx-auto mb-3 border border-emerald-500/30">
                      <span className="material-symbols-outlined text-2xl">check_circle</span>
                    </div>
                    <h2 className="text-xl font-bold text-[var(--text-primary)] mt-2 font-heading tracking-tight">
                      {lang === 'en' ? 'PAYMENT RECEIPT' : lang === 'zh' ? '结账收据' : 'HÓA ĐƠN THANH TOÁN'}
                    </h2>
                    <p className="text-[11px] font-semibold text-[var(--text-secondary)] mt-1 uppercase tracking-wider font-sans">
                      {lang === 'en' ? 'Thank you for visiting Kohi Coffee & Pastry' : lang === 'zh' ? '感谢您光临 Kohi Coffee & Pastry' : 'Cảm ơn quý khách đã tin dùng Kohi Coffee & Pastry'}
                    </p>

                    <div className="grid grid-cols-2 gap-3 mt-6 text-left text-xs text-[var(--text-primary)]">
                      <div>
                        <p className="text-[var(--text-secondary)] font-normal">{t.orderCode}:</p>
                        <p className="font-extrabold uppercase text-[#0284c7] dark:text-[#38BDF8]">#{order._id.slice(-8).toUpperCase()}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[var(--text-secondary)] font-normal">{lang === 'en' ? 'Table & Customer:' : lang === 'zh' ? '桌号与顾客:' : 'Số bàn & Người gọi:'}</p>
                        <p className="font-bold">
                          {formatTableName(order.tableId?.tableName, lang)}
                          {order.customerName && <span className="text-[#0284c7] dark:text-[#38BDF8] font-extrabold ml-1">({order.customerName})</span>}
                        </p>
                      </div>
                      <div className="mt-2">
                        <p className="text-[var(--text-secondary)] font-normal">{lang === 'en' ? 'Payment Method:' : lang === 'zh' ? '支付方式:' : 'Hình thức:'}</p>
                        <span className={`inline-block text-[10.5px] font-bold px-3 py-0.5 rounded-full mt-1 border ${
                          order.paymentMethod === 'momo'
                            ? 'bg-pink-500/10 text-pink-500 border-pink-500/30'
                            : 'bg-[#0284c7]/10 text-[#0284c7] dark:text-[#38BDF8] border-[#0284c7]/30'
                        }`}>
                          {order.paymentMethod === 'momo' ? 'Ví MoMo' : (lang === 'en' ? 'Cash' : lang === 'zh' ? '现金' : 'Tiền mặt')}
                        </span>
                      </div>
                      <div className="text-right mt-2">
                        <p className="text-[var(--text-secondary)] font-normal">{lang === 'en' ? 'Time:' : lang === 'zh' ? '时间:' : 'Thời gian:'}</p>
                        <p className="font-bold">{new Date(order.createdAt).toLocaleTimeString('vi-VN')} {new Date(order.createdAt).toLocaleDateString('vi-VN')}</p>
                      </div>
                    </div>
                  </div>

                  {/* Items list */}
                  <div className="py-5 border-b border-dashed border-[var(--border-color)] space-y-3">
                    <p className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-widest mb-1">
                      {lang === 'en' ? 'Item Details' : lang === 'zh' ? '商品明细' : 'Chi tiết thức uống & bánh'}
                    </p>
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-start text-xs text-left">
                        <div className="flex-1 pr-4">
                          <p className="font-semibold text-[var(--text-primary)] font-sans">
                            {item.foodId?.name || 'Thức uống / Bánh'}
                            <span className="text-[#0284c7] dark:text-[#38BDF8] font-bold ml-1.5">x{item.quantity}</span>
                          </p>
                          {item.note && (
                            <p className="text-[11px] text-[var(--text-secondary)] font-normal italic mt-0.5 pl-2 border-l border-[#0284c7]/40">
                              {lang === 'en' ? 'Note:' : lang === 'zh' ? '备注:' : 'Ghi chú:'} {item.note}
                            </p>
                          )}
                        </div>
                        <span className="font-bold text-[var(--text-primary)] shrink-0 font-sans">
                          {formatPrice((item.foodId?.price || 0) * item.quantity)}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Total section */}
                  <div className="pt-5 pb-2 space-y-2 font-sans">
                    <div className="flex justify-between text-xs text-[var(--text-secondary)] font-normal">
                      <span>{lang === 'en' ? 'Subtotal:' : lang === 'zh' ? '小计:' : 'Tổng tiền món:'}</span>
                      <span className="font-bold text-[var(--text-primary)]">{formatPrice(order.totalAmount)}</span>
                    </div>
                    <div className="flex justify-between text-xs text-[var(--text-secondary)] font-normal">
                      <span>{lang === 'en' ? 'Service Fee:' : lang === 'zh' ? '服务费:' : 'Phí dịch vụ:'}</span>
                      <span className="font-bold text-emerald-500">{lang === 'en' ? 'Free' : lang === 'zh' ? '免费' : 'Miễn phí'}</span>
                    </div>
                    <div className="flex justify-between items-center pt-3 border-t border-[var(--border-color)] mt-2">
                      <span className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider">{t.total.toUpperCase()}:</span>
                      <span className="text-xl font-extrabold text-[#0284c7] dark:text-[#38BDF8]">
                        {formatPrice(order.totalAmount)}
                      </span>
                    </div>
                  </div>

                  {/* Success Banner */}
                  <div className="mt-6 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center gap-3">
                    <span className="material-symbols-outlined text-emerald-500 text-2xl">verified</span>
                    <div className="text-left">
                      <h4 className="text-xs font-bold text-emerald-500">{lang === 'en' ? 'Payment Completed!' : lang === 'zh' ? '支付已完成！' : 'Thanh toán hoàn tất!'}</h4>
                      <p className="text-[11px] font-normal text-[var(--text-secondary)] mt-0.5">
                        {lang === 'en' ? 'Transaction recorded successfully.' : lang === 'zh' ? '交易已成功记录。' : 'Giao dịch đã được ghi nhận thành công trên hệ thống.'}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                    {/* Leave Table CTA (Navigates to Table Booking / Home) */}
                    <button
                      onClick={async () => {
                        if (confirm(lang === 'en' ? 'Are you sure you want to leave the table?' : lang === 'zh' ? '您确定要离开餐桌吗？' : 'Bạn có chắc chắn muốn rời bàn? Trạng thái bàn sẽ được lập tức dọn trống cho lượt khách tiếp theo.')) {
                          try {
                            let devId = localStorage.getItem('kohi_device_id');
                            if (!devId) {
                              devId = 'dev_' + Math.random().toString(36).substring(2, 9);
                              localStorage.setItem('kohi_device_id', devId);
                            }
                            await fetch(`${API_BASE}/tables/${tableId}/leave-session`, {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ deviceId: devId }),
                            }).catch(() => {});
                          } catch (e) {}
                          localStorage.removeItem(`chika_name_${tableId}`);
                          localStorage.removeItem(`chika_name_dismissed_${tableId}`);
                          router.push('/');
                        }
                      }}
                      className="w-full h-[48px] bg-rose-500 hover:bg-rose-600 text-white font-black rounded-2xl shadow-md transition-all text-xs uppercase tracking-wider flex items-center justify-center font-sans cursor-pointer active:scale-95"
                    >
                      <span>{lang === 'en' ? 'LEAVE TABLE' : lang === 'zh' ? '离开餐桌' : 'RỜI BÀN (ĐẶT BÀN)'}</span>
                    </button>

                    {/* Back to Table Menu CTA */}
                    <button
                      onClick={() => router.push(`/table/${tableId}`)}
                      className="w-full h-[48px] bg-[#0284c7] hover:bg-[#0369a1] dark:bg-[#38BDF8] dark:hover:bg-[#0284c7] text-white dark:text-slate-950 font-black rounded-2xl shadow-md hover:shadow-lg transition-all text-xs uppercase tracking-wider flex items-center justify-center font-sans cursor-pointer active:scale-95"
                    >
                      <span>{lang === 'en' ? 'MENU PAGE' : lang === 'zh' ? '菜单首页' : 'TRANG CHỦ MENU'}</span>
                    </button>
                  </div>
                </div>

                {/* Review Card */}
                <div className="lg:col-span-5 bg-[var(--bg-card)] rounded-3xl p-6 sm:p-8 shadow-2xl border border-[var(--border-color)] transition-all font-sans">
                  <div className="flex items-center gap-3 pb-4 border-b border-[var(--border-color)] mb-5">
                    <div className="w-10 h-10 rounded-2xl bg-[#0284c7]/10 dark:bg-[#38BDF8]/15 text-[#0284c7] dark:text-[#38BDF8] flex items-center justify-center border border-[#0284c7]/30">
                      <span className="material-symbols-outlined text-xl">rate_review</span>
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-[var(--text-primary)] font-heading">
                        {lang === 'vi' ? 'Đánh giá trải nghiệm' : lang === 'zh' ? '评价您的体验' : 'Rate your experience'}
                      </h3>
                      <p className="text-[11px] text-[var(--text-secondary)]">
                        {lang === 'vi' ? 'Ý kiến của bạn giúp Kohi nâng cao chất lượng phục vụ' : lang === 'zh' ? '您的反馈有助于我们提升服务质量' : 'Your feedback helps us improve our service'}
                      </p>
                    </div>
                  </div>

                  {hasReviewed ? (
                    <div className="text-center py-8 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-6">
                      <span className="material-symbols-outlined text-4xl text-emerald-500 mb-2">workspace_premium</span>
                      <h4 className="text-sm font-bold text-emerald-500">
                        {lang === 'vi' ? 'Cảm ơn bạn đã gửi đánh giá!' : lang === 'zh' ? '感谢您的评价！' : 'Thank you for your review!'}
                      </h4>
                      <p className="text-xs text-[var(--text-secondary)] mt-1">
                        {lang === 'vi' ? 'Đánh giá của bạn đã được hệ thống ghi nhận.' : lang === 'zh' ? '您的评价已成功记录。' : 'Your review has been successfully recorded.'}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-5">
                      <div className="space-y-3">
                        <p className="text-[11px] uppercase font-bold text-[var(--text-tertiary)] tracking-wider">
                          {lang === 'vi' ? 'Đánh giá từng món' : lang === 'zh' ? '商品评分' : 'Rate items'}
                        </p>
                        {order.items.map((item, i) => (
                          <div key={i} className="flex items-center justify-between gap-2 bg-[var(--bg-primary)] p-3 rounded-2xl border border-[var(--border-color)]">
                            <span className="text-xs font-bold text-[var(--text-primary)] truncate max-w-[140px] sm:max-w-none">{item.foodId?.name}</span>
                            <div className="flex gap-1 shrink-0">
                              {[1, 2, 3, 4, 5].map((s) => (
                                <button
                                  key={s}
                                  onClick={() => setFoodStars((prev) => ({ ...prev, [item.foodId?._id]: s }))}
                                  className={`text-lg transition-transform hover:scale-125 cursor-pointer ${
                                    s <= (foodStars[item.foodId?._id] ?? 5) ? 'text-amber-400' : 'text-slate-300 dark:text-slate-700'
                                  }`}
                                >★</button>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="border-t border-[var(--border-color)] pt-4 space-y-3">
                        <p className="text-[11px] uppercase font-bold text-[var(--text-tertiary)] tracking-wider">
                          {lang === 'vi' ? 'Đánh giá tổng thể' : lang === 'zh' ? '总体评分' : 'Overall Rating'}
                        </p>
                        <div className="flex gap-2 justify-center py-1">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <button
                              key={s}
                              onClick={() => setOverallStar(s)}
                              className={`text-3xl transition-transform hover:scale-125 cursor-pointer ${
                                s <= overallStar ? 'text-amber-400' : 'text-slate-300 dark:text-slate-700'
                              }`}
                            >★</button>
                          ))}
                        </div>
                        <textarea
                          value={overallComment}
                          onChange={(e) => setOverallComment(e.target.value)}
                          placeholder={lang === 'vi' ? 'Nhận xét thêm về thức uống, không gian, thái độ phục vụ (tuỳ chọn)...' : lang === 'zh' ? '对饮品、环境或服务的意见（可选）...' : 'Additional comments on drinks, space, or service (optional)...'}
                          rows={4}
                          maxLength={300}
                          className="w-full text-xs bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-2xl px-3.5 py-3 outline-none focus:border-[#0284c7] dark:focus:border-[#38BDF8] resize-none text-[var(--text-primary)] font-normal placeholder-[var(--text-tertiary)] transition-colors"
                        />
                      </div>

                      <button
                        onClick={handleSubmitReview}
                        disabled={isSubmittingReview}
                        className="w-full h-[48px] bg-[#0284c7] hover:bg-[#0369a1] dark:bg-[#38BDF8] dark:hover:bg-[#0284c7] text-white dark:text-slate-950 font-black rounded-2xl shadow-md transition-all text-xs uppercase tracking-wider disabled:opacity-50 font-sans cursor-pointer active:scale-95"
                      >
                        {isSubmittingReview
                          ? (lang === 'vi' ? 'Đang gửi...' : lang === 'zh' ? '提交中...' : 'Submitting...')
                          : (lang === 'vi' ? 'Gửi đánh giá ngay' : lang === 'zh' ? '立即提交评价' : 'Submit Review Now')}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-12 lg:grid-cols-12 gap-6 items-stretch pb-20 lg:pb-0 font-sans">
                {/* ── LEFT COLUMN (ORDER HISTORY & SESSION) ────────────────── */}
                <div className="order-3 md:order-3 lg:order-1 md:col-span-12 lg:col-span-3 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl p-5 sm:p-6 flex flex-col justify-between shadow-xl text-left transition-colors">
                  <div>
                    {/* Card Header */}
                    <div className="mb-4 border-b border-[var(--border-color)] pb-3">
                      <h2 className="text-lg font-black text-[var(--text-primary)] tracking-tight uppercase font-heading">
                        {lang === 'en' ? 'ORDER HISTORY' : lang === 'zh' ? '点餐历史' : 'LỊCH SỬ GỌI MÓN'}
                      </h2>
                      <p className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider mt-0.5">
                        {lang === 'en' ? 'TABLE SESSION' : lang === 'zh' ? '本桌记录' : 'GỌI MÓN TẠI BÀN'}
                      </p>
                    </div>

                    {/* Subheader Badge Row */}
                    <div className="flex items-center justify-between py-2 border-b border-[var(--border-color)] mb-4 text-xs">
                      <span className="font-normal text-[var(--text-secondary)]">
                        {lang === 'en' ? 'Total Rounds' : lang === 'zh' ? '总次数' : 'Tổng cộng'}
                      </span>
                      <span className="font-bold text-[#0284c7] dark:text-[#38BDF8] bg-[#0284c7]/10 border border-[#0284c7]/30 px-2.5 py-0.5 rounded-full text-[11px]">
                        {tableOrders.length} {lang === 'en' ? 'rounds' : lang === 'zh' ? '次' : 'lượt gọi'}
                      </span>
                    </div>

                    {/* Round List */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2.5 max-h-72 md:max-h-80 lg:max-h-[calc(100vh-360px)] overflow-y-auto pr-1 scrollbar-thin">
                      {tableOrders.map((tOrder, idx) => (
                        <div
                          key={tOrder._id}
                          onClick={() => {
                            if (tOrder._id !== orderId) {
                              router.push(`/table/${tableId}/order-status/${tOrder._id}`);
                            }
                          }}
                          className={`p-3 rounded-2xl border transition-all cursor-pointer text-left ${
                            tOrder._id === orderId
                              ? 'border-[#0284c7] dark:border-[#38BDF8] bg-[#0284c7]/10 dark:bg-sky-500/10 ring-2 ring-[#0284c7]/20 shadow-xs'
                              : 'border-[var(--border-color)] bg-[var(--bg-primary)] hover:border-[#0284c7]/40'
                          }`}
                        >
                          <div className="flex justify-between items-center mb-1">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-black text-[var(--text-primary)]">
                                {lang === 'en' ? `Round #${tableOrders.length - idx}` : lang === 'zh' ? `第 ${tableOrders.length - idx} 次` : `Lượt #${tableOrders.length - idx}`}
                              </span>
                              {tOrder.customerName && (
                                <span className="text-[10px] font-bold px-1.5 py-0.5 bg-[#0284c7]/10 text-[#0284c7] dark:text-[#38BDF8] rounded-md border border-[#0284c7]/20 truncate max-w-[90px] inline-flex items-center gap-0.5">
                                  <span className="material-symbols-outlined text-[10px]">person</span>
                                  <span>{tOrder.customerName}</span>
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] font-medium text-[var(--text-tertiary)]">
                              {new Date(tOrder.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>

                          <p className="text-[11px] font-normal text-[var(--text-secondary)] truncate">
                            {tOrder.items.map((i) => `${i.quantity}x ${i.foodId?.name || 'Món'}`).join(', ')}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Bottom Table Info */}
                  <div className="pt-4 mt-4 border-t border-[var(--border-color)] flex flex-col gap-3 text-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 font-bold text-[var(--text-primary)]">
                        <span className="material-symbols-outlined text-base text-[#0284c7] dark:text-[#38BDF8]">table_restaurant</span>
                        <span>{formatTableName(order.tableId?.tableName, lang)}</span>
                      </div>
                      {order.customerName && (
                        <span className="text-[11px] font-bold text-[#0284c7] dark:text-[#38BDF8] bg-[#0284c7]/10 px-2 py-0.5 rounded-full border border-[#0284c7]/30 flex items-center gap-1">
                          <span className="material-symbols-outlined text-xs">person</span>
                          <span>{order.customerName}</span>
                        </span>
                      )}
                    </div>

                    <button
                      onClick={async () => {
                        if (confirm(lang === 'en' ? 'Are you sure you want to leave the table?' : lang === 'zh' ? '您确定要离开餐桌吗？' : 'Bạn có chắc chắn muốn rời bàn? Trạng thái bàn sẽ được lập tức dọn trống cho lượt khách tiếp theo.')) {
                          try {
                            let devId = localStorage.getItem('kohi_device_id');
                            if (!devId) {
                              devId = 'dev_' + Math.random().toString(36).substring(2, 9);
                              localStorage.setItem('kohi_device_id', devId);
                            }
                            await fetch(`${API_BASE}/tables/${tableId}/leave-session`, {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ deviceId: devId }),
                            }).catch(() => {});
                          } catch (e) {}
                          localStorage.removeItem(`chika_name_${tableId}`);
                          localStorage.removeItem(`chika_name_dismissed_${tableId}`);
                          router.push('/');
                        }
                      }}
                      className="w-full py-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border border-rose-500/20 rounded-2xl text-[11px] font-bold transition-all flex items-center justify-center cursor-pointer active:scale-95"
                    >
                      <span>{lang === 'en' ? 'LEAVE TABLE' : lang === 'zh' ? '离开餐桌' : 'RỜI BÀN (TRANG ĐẶT BÀN)'}</span>
                    </button>
                  </div>
                </div>

                {/* ── MIDDLE COLUMN (LIVE TRACKING TIMELINE) ──────────────── */}
                <div className="order-1 md:order-1 lg:order-2 md:col-span-7 lg:col-span-5 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl p-5 sm:p-6 shadow-xl flex flex-col justify-between text-left transition-colors">
                  <div>
                    {/* Top Header Badge */}
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black text-[#0284c7] dark:text-[#38BDF8] bg-[#0284c7]/10 dark:bg-[#38BDF8]/15 px-3 py-1 rounded-full border border-[#0284c7]/25 dark:border-[#38BDF8]/30 uppercase tracking-widest flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#0284c7] dark:bg-[#38BDF8] animate-ping" />
                        LIVE TRACKING
                      </span>
                    </div>

                    {/* Order Code */}
                    <h1 className="text-2xl sm:text-3xl font-black text-[var(--text-primary)] tracking-tight mt-3 font-heading">
                      #{order._id.slice(-6).toUpperCase()}
                    </h1>

                    {/* Est Completion Time Pill */}
                    {order.status !== 'cancelled' && (
                      <div className="mt-3 inline-flex items-center gap-2 bg-[#0284c7]/10 dark:bg-[#38BDF8]/15 border border-[#0284c7]/25 dark:border-[#38BDF8]/30 px-3.5 py-1.5 rounded-full text-xs font-bold text-[#0284c7] dark:text-[#38BDF8]">
                        <span className="material-symbols-outlined text-sm animate-pulse">schedule</span>
                        <span>{t.estCompletion}: ~{new Date(new Date(order.createdAt).getTime() + 20 * 60 * 1000).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    )}

                    {/* Vertical Timeline */}
                    <div className="mt-6 relative pl-7 sm:pl-8 before:absolute before:left-3.5 before:top-4 before:bottom-4 before:w-[2px] before:bg-slate-200 dark:before:bg-slate-800">
                      {stepsList.map((stepKey, idx) => {
                        const isCompleted = idx < currentStepIndex;
                        const isCurrent = idx === currentStepIndex;

                        return (
                          <div key={stepKey} className="relative mb-5 last:mb-0">
                            {/* Timeline Node Circle */}
                            <div className={`absolute -left-7 sm:-left-8 top-3.5 w-7 h-7 rounded-full flex items-center justify-center text-xs font-black transition-all ${
                              isCompleted
                                ? 'bg-emerald-500 text-white shadow-md'
                                : isCurrent
                                ? 'bg-[#0284c7] dark:bg-[#38BDF8] text-white dark:text-slate-950 ring-4 ring-[#0284c7]/30 dark:ring-[#38BDF8]/30 shadow-lg animate-pulse'
                                : 'bg-slate-200 dark:bg-slate-800 text-slate-400'
                            }`}>
                              {isCompleted ? (
                                <span className="material-symbols-outlined text-xs">check</span>
                              ) : isCurrent ? (
                                <span className="material-symbols-outlined text-xs">radio_button_checked</span>
                              ) : (
                                <span className="w-1.5 h-1.5 rounded-full bg-current inline-block" />
                              )}
                            </div>

                            {/* Step Card Box with Fixed Line Heights & Padding */}
                            <div className={`p-4 rounded-2xl border text-left transition-all ${
                              isCurrent
                                ? 'bg-[#0284c7]/10 dark:bg-sky-500/10 border-[#0284c7] dark:border-[#38BDF8] ring-2 ring-[#0284c7]/20 shadow-md'
                                : 'bg-[var(--bg-primary)] border-[var(--border-color)] opacity-75'
                            }`}>
                              <div className="flex items-center justify-between gap-2 mb-1">
                                <h4 className={`text-xs sm:text-sm font-black uppercase tracking-wider ${
                                  isCurrent ? 'text-[#0284c7] dark:text-[#38BDF8]' : isCompleted ? 'text-[var(--text-primary)]' : 'text-[var(--text-tertiary)]'
                                }`}>
                                  { (t.steps as any)[stepKey] }
                                </h4>
                                {isCurrent && (
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#0284c7] text-white shrink-0">
                                    {lang === 'en' ? 'CURRENT' : lang === 'zh' ? '进行中' : 'ĐANG XỬ LÝ'}
                                  </span>
                                )}
                              </div>
                              <p className={`text-xs font-normal leading-relaxed ${
                                isCurrent ? 'text-[var(--text-primary)] font-medium' : 'text-[var(--text-secondary)]'
                              }`}>
                                { (t.stepDesc as any)[stepKey] }
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Payment CTA */}
                  {order.status !== 'cancelled' && (
                    <div className="mt-6 pt-4 border-t border-[var(--border-color)]">
                      {order.paymentMethod === 'momo' ? (
                        <button
                          onClick={() => setIsMomoModalOpen(true)}
                          className="w-full py-3.5 bg-[#D82D8B] hover:bg-[#c2247b] text-white font-black rounded-2xl shadow-lg shadow-pink-500/20 transition-all active:scale-95 text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-lg">bolt</span>
                          <span>{lang === 'en' ? 'Pay via MoMo (Simulation)' : lang === 'zh' ? 'MoMo 支付（模拟）' : 'Thanh toán MoMo ngay (Giả lập)'}</span>
                        </button>
                      ) : (
                        <p className="text-xs font-normal text-[var(--text-secondary)] text-center">
                          {lang === 'en' ? 'Please pay with cash at counter or wait for staff at your table.' : lang === 'zh' ? '请在柜台现金支付或在桌前等待服务员。' : 'Vui lòng thanh toán tiền mặt tại quầy hoặc chờ nhân viên tại bàn.'}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* ── RIGHT COLUMN (ORDER DETAILS & CALL STAFF) ───────────── */}
                <div className="order-2 md:order-2 lg:order-3 md:col-span-5 lg:col-span-4 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl p-5 sm:p-6 shadow-xl flex flex-col justify-between text-left transition-colors">
                  <div>
                    {/* Card Header */}
                    <h3 className="text-base sm:text-lg font-black text-[var(--text-primary)] uppercase tracking-wider mb-4 sm:mb-5 text-left border-b border-[var(--border-color)] pb-3 font-heading">
                      ORDER DETAILS
                    </h3>

                    {/* Food Items List */}
                    <div className="space-y-3 max-h-72 md:max-h-80 lg:max-h-[calc(100vh-360px)] overflow-y-auto pr-1 scrollbar-thin">
                      {order.items.map((item, idx) => {
                        const foodImg = item.foodId?.image || 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=500&q=80';
                        return (
                          <div key={idx} className="bg-[var(--bg-primary)] border border-[var(--border-color)] p-3 rounded-2xl flex items-start gap-3 text-left relative group">
                            {/* Image thumbnail with Quantity Badge overlay */}
                            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden relative bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 shrink-0">
                              <Image
                                src={foodImg}
                                alt={item.foodId?.name || 'Food image'}
                                fill
                                className="object-cover"
                              />
                              <span className="absolute top-1 left-1 bg-[#0284c7] text-white text-[10px] font-black px-1.5 py-0.5 rounded-md shadow-xs z-10">
                                x{item.quantity}
                              </span>
                            </div>

                            {/* Food Info */}
                            <div className="flex-1 min-w-0 pr-1">
                              <p className="font-bold text-xs sm:text-sm text-[var(--text-primary)] truncate">
                                {item.foodId?.name || 'Thức uống / Bánh'}
                              </p>
                              {item.note ? (
                                <p className="text-[11px] font-normal text-[var(--text-secondary)] italic mt-0.5 truncate">
                                  {item.note}
                                </p>
                              ) : (
                                <p className="text-[10px] font-normal text-[var(--text-tertiary)] italic mt-0.5">
                                  Kohi Original
                                </p>
                              )}
                              <p className="font-black text-xs sm:text-sm text-[#0284c7] dark:text-[#38BDF8] mt-1">
                                {formatPrice((item.foodId?.price || 0) * item.quantity)}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Total Amount & Call Staff Action */}
                  <div className="pt-4 border-t border-[var(--border-color)] mt-4 space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-normal text-[var(--text-secondary)]">{t.total}</span>
                      <span className="text-xl sm:text-2xl font-black text-[var(--text-primary)]">
                        {formatPrice(order.totalAmount)}
                      </span>
                    </div>

                    <button
                      onClick={handleCallStaff}
                      disabled={callStaffCooldown > 0 || isCallingStaff}
                      className="hidden sm:flex w-full group py-3.5 bg-amber-500/5 hover:bg-gradient-to-r hover:from-amber-500 hover:to-orange-500 dark:bg-amber-500/10 border-2 border-amber-500/30 dark:border-amber-400/30 hover:border-transparent text-amber-600 dark:text-amber-400 hover:text-white font-black rounded-2xl hover:shadow-lg hover:shadow-orange-500/30 transition-all duration-300 active:scale-95 text-xs uppercase tracking-wider items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      <span className="material-symbols-outlined text-base animate-bounce text-amber-500 group-hover:text-white transition-colors">notifications_active</span>
                      <span>
                        {callStaffCooldown > 0
                          ? `${lang === 'en' ? 'Call Staff' : lang === 'zh' ? '呼叫服务员' : 'Gọi nhân viên'} (${callStaffCooldown}s)`
                          : isCallingStaff
                            ? (lang === 'en' ? 'Sending...' : lang === 'zh' ? '正在发送...' : 'Đang gửi yêu cầu...')
                            : (lang === 'en' ? 'CALL STAFF' : lang === 'zh' ? '呼叫服务员' : 'GỌI NHÂN VIÊN')}
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Sticky Mobile Floating Call Staff Action Bar */}
            {order && order.status !== 'paid' && (
              <div className="sm:hidden fixed bottom-0 left-0 right-0 p-3 bg-[var(--bg-card)]/95 backdrop-blur-md border-t border-[var(--border-color)] z-30 shadow-2xl">
                <button
                  onClick={handleCallStaff}
                  disabled={callStaffCooldown > 0 || isCallingStaff}
                  className="w-full group py-3.5 bg-amber-500/5 hover:bg-gradient-to-r hover:from-amber-500 hover:to-orange-500 dark:bg-amber-500/10 border-2 border-amber-500/30 dark:border-amber-400/30 hover:border-transparent text-amber-600 dark:text-amber-400 hover:text-white font-black rounded-2xl hover:shadow-lg hover:shadow-orange-500/30 transition-all duration-300 active:scale-95 text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-base text-amber-500 group-hover:text-white transition-colors animate-bounce">notifications_active</span>
                  <span>
                    {callStaffCooldown > 0
                      ? `${lang === 'en' ? 'CALL STAFF' : lang === 'zh' ? '呼叫服务员' : 'GỌI NHÂN VIÊN'} (${callStaffCooldown}s)`
                      : isCallingStaff
                        ? (lang === 'en' ? 'SENDING REQUEST...' : lang === 'zh' ? '正在发送...' : 'ĐANG GỬI YÊU CẦU...')
                        : (lang === 'en' ? 'CALL STAFF' : lang === 'zh' ? '呼叫服务员' : 'GỌI NHÂN VIÊN')}
                  </span>
                </button>
              </div>
            )}

            {/* MoMo Simulation Payment Modal */}
            {order && (
              <MomoPayModal
                isOpen={isMomoModalOpen}
                onClose={() => setIsMomoModalOpen(false)}
                orderId={order._id}
                tableName={order.tableId?.tableName || 'Bàn'}
                totalAmount={order.totalAmount}
                customerName={order.customerName}
                onSuccess={() => {
                  setOrder((prev) => (prev ? { ...prev, status: 'paid' } : null));
                }}
              />
            )}
          </div>
        ) : null}
      </main>
    </div>
  );
}
