'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { io, Socket } from 'socket.io-client';
import { motion, AnimatePresence } from 'framer-motion';
import { playCashChime, playAlertPing, playMomoChime } from '../../../../utils/sound';

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
    readyToEat: 'Món ăn đã lên bàn!',
    steps: {
      pending: 'Đã nhận đơn',
      cooking: 'Đang chế biến',
      completed: 'Đã lên món',
      paid: 'Hoàn tất thanh toán',
      cancelled: 'Đã hủy đơn',
    },
    stepDesc: {
      pending: 'Nhà bếp đã nhận thông tin món ăn của bạn.',
      cooking: 'Đầu bếp đang chuẩn bị món ăn với nguyên liệu tươi ngon.',
      completed: 'Món ăn đã sẵn sàng phục vụ tại bàn của bạn. Chúc bạn ngon miệng!',
      paid: 'Cảm ơn quý khách đã dùng bữa tại nhà hàng!',
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
      cooking: '主厨正在使用新鲜食材为您烹制美食。',
      completed: '您的美食已送达桌前，请慢用！',
      paid: '感谢您光临本店用餐！',
      cancelled: '抱歉，您的订单已被取消。请联系服务员。',
    },
  },
};

interface FoodItem {
  foodId: {
    name: string;
    price: number;
  };
  quantity: number;
  note?: string;
}

interface Order {
  _id: string;
  tableId: {
    tableName: string;
  };
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
  const socketRef = useRef<Socket | null>(null);

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
      
      // Play alert sound for payment success
      try {
        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2019/2019-84.wav');
        audio.play();
      } catch (e) {}
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Lỗi thanh toán.');
    } finally {
      setIsPaying(false);
    }
  };

  const t = DICTIONARY[lang];

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch Order details publicly through table orders endpoint
  useEffect(() => {
    if (!orderId || !tableId) return;

    const fetchOrderDetails = async () => {
      try {
        setIsLoading(true);
        // Find specific order inside public active orders of this table
        const res = await fetch(`${API_BASE}/orders/table/${tableId}`);
        if (!res.ok) throw new Error(t.error);
        const data: Order[] = await res.json();
        setTableOrders(data);
        
        const currentOrder = data.find((o) => o._id === orderId);
        if (currentOrder) {
          setOrder(currentOrder);
        } else {
          // If not found in active list, try getting historic if they exist, but fallback
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
        // Play appropriate notification sound on transition
        if (status === 'completed') {
          playCashChime();
        } else {
          playAlertPing();
        }
      }
      // Cập nhật trạng thái trong danh sách lịch sử gọi món
      setTableOrders((prev) =>
        prev.map((o) => (o._id === updatedId ? { ...o, status } : o))
      );
    });

    socketRef.current.on('tableTransferred', ({ fromTableId, toTableId }: { fromTableId: string; toTableId: string }) => {
      if (fromTableId === tableId) {
        router.push(`/table/${toTableId}/order-status/${orderId}`);
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

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-zinc-950 transition-colors duration-300 font-sans selection:bg-orange-500 selection:text-white">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border-b border-slate-100 dark:border-zinc-800/60 shadow-[0_1px_10px_rgba(0,0,0,0.02)] transition-colors duration-300">
        <div className="max-w-md w-full mx-auto flex items-center justify-between px-4 py-3.5">
          <button
            onClick={() => router.push(`/table/${tableId}`)}
            className="flex items-center gap-2 text-xs font-black text-orange-500 dark:text-orange-400 hover:scale-105 active:scale-95 transition-all"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" /></svg>
            {t.backToMenu}
          </button>

          <div className="flex items-center gap-2">
            {/* Theme Toggle */}
            <button
              onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
              className="p-2.5 rounded-xl bg-slate-100 dark:bg-zinc-800 text-slate-655 dark:text-zinc-350 hover:bg-slate-200 dark:hover:bg-zinc-700 hover:scale-105 active:scale-95 transition-all border border-transparent dark:border-zinc-755"
            >
              {resolvedTheme === 'dark' ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
              )}
            </button>

            {/* Language Selector */}
            <div className="relative">
              <button
                onClick={() => setIsLangOpen(!isLangOpen)}
                className="flex items-center gap-1.5 bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-200 text-xs font-bold py-2 px-3 rounded-xl hover:bg-slate-200 dark:hover:bg-zinc-700 hover:scale-105 active:scale-95 transition-all border border-transparent dark:border-zinc-750 shadow-sm"
              >
                <span>{lang === 'vi' ? '🇻🇳 VI' : lang === 'en' ? '🇺🇸 EN' : '🇨🇳 ZH'}</span>
                <svg className={`w-3 h-3 text-slate-450 dark:text-zinc-400 transition-transform duration-200 ${isLangOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" /></svg>
              </button>

              <AnimatePresence>
                {isLangOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsLangOpen(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.15, ease: 'easeOut' }}
                      className="absolute right-0 mt-2 z-50 min-w-[120px] rounded-2xl bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border border-slate-100 dark:border-zinc-800 p-1.5 shadow-xl"
                    >
                      <button
                        onClick={() => {
                          setLang('vi');
                          setIsLangOpen(false);
                        }}
                        className={`w-full flex items-center gap-2 px-3 py-2 text-xs font-bold rounded-xl transition-all ${
                          lang === 'vi'
                            ? 'bg-orange-500/10 text-orange-500'
                            : 'text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800/80'
                        }`}
                      >
                        <span className="text-base">🇻🇳</span> Vietnamese
                      </button>
                      <button
                        onClick={() => {
                          setLang('en');
                          setIsLangOpen(false);
                        }}
                        className={`w-full flex items-center gap-2 px-3 py-2 text-xs font-bold rounded-xl transition-all ${
                          lang === 'en'
                            ? 'bg-orange-500/10 text-orange-500'
                            : 'text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800/80'
                        }`}
                      >
                        <span className="text-base">🇺🇸</span> English
                      </button>
                      <button
                        onClick={() => {
                          setLang('zh');
                          setIsLangOpen(false);
                        }}
                        className={`w-full flex items-center gap-2 px-3 py-2 text-xs font-bold rounded-xl transition-all ${
                          lang === 'zh'
                            ? 'bg-orange-500/10 text-orange-500'
                            : 'text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800/80'
                        }`}
                      >
                        <span className="text-base">🇨🇳</span> Chinese
                      </button>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </header>

      {/* Main Body */}
      <main className="flex-1 max-w-md w-full mx-auto px-4 py-6">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-32 gap-3">
            <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-xs font-bold text-slate-400 dark:text-zinc-500">{t.loading}</p>
          </div>
        ) : error ? (
          <div className="text-center py-16 bg-white dark:bg-zinc-900 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-zinc-800 transition-colors">
            <span className="text-5xl">ℹ️</span>
            <h2 className="text-base font-black text-slate-800 dark:text-zinc-200 mt-4">{t.error}</h2>
            <button
              onClick={() => router.push(`/table/${tableId}`)}
              className="mt-6 w-full bg-orange-500 hover:bg-orange-600 text-white font-extrabold py-3.5 rounded-2xl transition-all active:scale-[0.98]"
            >
              {t.backToMenu}
            </button>
          </div>
        ) : order && (
          <div className="space-y-5">
            {order.status === 'paid' ? (
              /* 🧾 BEAUTIFUL INVOICE / RECEIPT COMPONENT FOR CUSTOMER */
              <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 shadow-xl border border-slate-100 dark:border-zinc-800 transition-all relative overflow-hidden max-w-sm mx-auto">
                {/* Dotted border styling top */}
                <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-orange-500 via-emerald-500 to-orange-500" />
                
                {/* Stamp "ĐÃ THANH TOÁN" */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.05] pointer-events-none rotate-12 select-none text-center">
                  <span className="text-6xl font-black border-8 border-green-500 text-green-500 rounded-2xl px-6 py-3 tracking-widest uppercase">
                    ĐÃ THANH TOÁN
                  </span>
                </div>

                {/* Receipt Header */}
                <div className="text-center pb-6 border-b border-dashed border-slate-200 dark:border-zinc-800">
                  <span className="text-4xl">🧾</span>
                  <h2 className="text-base font-black text-slate-900 dark:text-white mt-3">HÓA ĐƠN THANH TOÁN</h2>
                  <p className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 mt-1 uppercase tracking-wider">Cảm ơn quý khách đã tin dùng Chika Restaurant Delivery</p>
                  
                  <div className="grid grid-cols-2 gap-2 mt-5 text-left text-xs font-semibold text-slate-500 dark:text-zinc-400">
                    <div>
                      <p>Mã hóa đơn:</p>
                      <p className="font-extrabold text-slate-800 dark:text-zinc-200 uppercase">#{order._id.slice(-8).toUpperCase()}</p>
                    </div>
                    <div className="text-right">
                      <p>Số bàn:</p>
                      <p className="font-extrabold text-slate-800 dark:text-zinc-200">{order.tableId?.tableName || '—'}</p>
                    </div>
                    <div className="mt-2">
                      <p>Hình thức:</p>
                      <span className={`inline-block text-[10px] font-extrabold px-2.5 py-1 rounded-full mt-0.5 ${
                        order.paymentMethod === 'momo'
                          ? 'bg-pink-50 dark:bg-pink-950/20 text-pink-650 dark:text-pink-400 border border-pink-100 dark:border-pink-900/30'
                          : 'bg-orange-50 dark:bg-orange-950/20 text-orange-655 dark:text-orange-400 border border-orange-100 dark:border-orange-900/30'
                      }`}>
                        {order.paymentMethod === 'momo' ? '🌸 Ví MoMo' : '💵 Tiền mặt'}
                      </span>
                    </div>
                    <div className="text-right mt-2">
                      <p>Thời gian:</p>
                      <p className="font-extrabold text-slate-800 dark:text-zinc-200">{new Date(order.createdAt).toLocaleTimeString('vi-VN')} {new Date(order.createdAt).toLocaleDateString('vi-VN')}</p>
                    </div>
                  </div>
                </div>

                {/* Items list */}
                <div className="py-5 border-b border-dashed border-slate-200 dark:border-zinc-800 space-y-3">
                  <p className="text-[10px] font-black text-slate-400 dark:text-zinc-550 uppercase tracking-widest mb-1">Chi tiết món ăn</p>
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-start text-xs text-left">
                      <div className="flex-1 pr-4">
                        <p className="font-bold text-slate-800 dark:text-zinc-250">
                          {item.foodId?.name || 'Món ăn'}
                          <span className="text-orange-500 font-bold ml-1.5">x{item.quantity}</span>
                        </p>
                        {item.note && (
                          <p className="text-[10px] text-slate-400 dark:text-zinc-500 italic mt-0.5 pl-2 border-l border-orange-200 dark:border-zinc-800">
                            {item.note}
                          </p>
                        )}
                      </div>
                      <span className="font-bold text-slate-600 dark:text-zinc-400 shrink-0">
                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format((item.foodId?.price || 0) * item.quantity)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Total section */}
                <div className="pt-5 pb-2 space-y-2">
                  <div className="flex justify-between text-xs text-slate-500 font-medium">
                    <span>Tổng tiền món:</span>
                    <span>{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(order.totalAmount)}</span>
                  </div>
                  <div className="flex justify-between text-xs text-slate-500 font-medium">
                    <span>Phí dịch vụ:</span>
                    <span>Miễn phí</span>
                  </div>
                  <div className="flex justify-between items-center pt-3 border-t border-slate-100 dark:border-zinc-800 mt-2">
                    <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">TỔNG CỘNG:</span>
                    <span className="text-lg font-black text-green-500">
                      {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(order.totalAmount)}
                    </span>
                  </div>
                </div>

                {/* Success Banner */}
                <div className="mt-6 p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900/30 rounded-2xl flex items-center gap-3">
                  <span className="text-2xl">🎉</span>
                  <div className="text-left">
                    <h4 className="text-xs font-black text-green-600 dark:text-green-450">Thanh toán hoàn tất!</h4>
                    <p className="text-[10px] text-green-500 dark:text-green-500 mt-0.5">Giao dịch đã được ghi nhận trên hệ thống.</p>
                  </div>
                </div>

                {/* Back to Menu */}
                <button
                  onClick={() => router.push(`/table/${tableId}`)}
                  className="mt-6 w-full py-4 bg-gradient-to-r from-orange-500 to-emerald-600 hover:from-orange-600 hover:to-emerald-700 text-white font-black rounded-2xl shadow-lg hover:shadow-xl active:scale-95 transition-all text-xs uppercase tracking-wider"
                >
                  Quay lại Thực đơn 🚀
                </button>
              </div>
            ) : (
              <>
                {/* Card Information */}
                <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-zinc-800 transition-colors">
                  <div className="flex items-center justify-between mb-4 border-b dark:border-zinc-800 pb-4">
                    <div>
                      <h2 className="text-base font-black text-slate-900 dark:text-white">
                        {t.table} {order.tableId?.tableName || '—'}
                      </h2>
                      <p className="text-[10px] font-bold text-slate-400 dark:text-zinc-550 uppercase tracking-wider mt-0.5">
                        {t.orderCode}: #{order._id.slice(-6).toUpperCase()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-bold text-slate-400 dark:text-zinc-550 uppercase tracking-wider">{t.total}</p>
                      <p className="text-base font-black text-orange-500 dark:text-orange-400 mt-0.5">
                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(order.totalAmount)}
                      </p>
                    </div>
                  </div>

                  {/* 🕒 Est Preparation Card */}
                  {order.status !== 'cancelled' && (
                    <div className="mt-4 p-4 bg-gradient-to-br from-orange-50/60 to-emerald-50/40 dark:from-zinc-850/40 dark:to-zinc-900/30 border border-orange-100/50 dark:border-zinc-800/80 rounded-2xl flex flex-col gap-3 transition-all">
                      <div className="flex items-center gap-3">
                        <span className="text-xl animate-pulse">⏱️</span>
                        <div className="text-left">
                          <h4 className="text-[9px] font-black text-slate-400 dark:text-zinc-550 uppercase tracking-wider">{t.estCompletion}</h4>
                          <p className="text-sm font-extrabold text-orange-655 dark:text-orange-400 mt-0.5">
                            {order.status === 'completed' ? (
                              <span>🎉 {t.readyToEat}</span>
                            ) : (
                              <span>
                                ~{new Date(new Date(order.createdAt).getTime() + 20 * 60 * 1000).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} ({t.steps[order.status]})
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                      
                      <div className="border-t border-dashed border-orange-100/80 dark:border-zinc-850 pt-3 flex justify-between items-center text-xs text-slate-500 dark:text-zinc-400">
                        <span className="font-semibold">{t.orderTime}:</span>
                        <span className="font-bold text-slate-700 dark:text-zinc-300">
                          {new Date(order.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} - {new Date(order.createdAt).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Steps Progress Timeline */}
                  <div className="mt-8 relative">
                    {order.status === 'cancelled' ? (
                      <div className="flex gap-4 items-start p-4 bg-red-50 dark:bg-red-955/20 border border-red-200 dark:border-red-900/30 rounded-2xl">
                        <span className="text-2xl">❌</span>
                        <div>
                          <h3 className="font-extrabold text-red-650 dark:text-red-400">{t.steps.cancelled}</h3>
                          <p className="text-xs text-red-500 dark:text-red-300 mt-1">{t.stepDesc.cancelled}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-8 relative before:absolute before:left-4 before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-100 dark:before:bg-zinc-800">
                        {stepsList.map((stepKey, idx) => {
                          const isCompleted = idx < currentStepIndex;
                          const isCurrent = idx === currentStepIndex;
                          
                          return (
                            <div key={stepKey} className="flex gap-4 items-start relative z-10">
                              {/* Dot Circle */}
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                                isCompleted ? 'bg-green-500 text-white shadow-md' :
                                isCurrent ? 'bg-orange-500 text-white ring-4 ring-orange-500/20 shadow-md animate-pulse' :
                                'bg-slate-200 dark:bg-zinc-800 text-slate-450'
                              }`}>
                                {isCompleted ? '✓' : idx + 1}
                              </div>

                              {/* Step Content */}
                              <div className="flex-1">
                                <h4 className={`text-xs font-black uppercase tracking-wider transition-colors ${
                                  isCurrent ? 'text-orange-500 dark:text-orange-400' :
                                  isCompleted ? 'text-slate-700 dark:text-zinc-300' :
                                  'text-slate-400'
                                }`}>
                                  {t.steps[stepKey]}
                                </h4>
                                {isCurrent && (
                                  <motion.p
                                    initial={{ opacity: 0, y: 5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="text-xs text-slate-400 dark:text-zinc-500 mt-1 leading-relaxed"
                                  >
                                    {t.stepDesc[stepKey]}
                                  </motion.p>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* Payment status instruction block */}
                {order?.status !== 'cancelled' && (
                  <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-zinc-800 transition-colors">
                    {order.status === 'pending' || order.status === 'cooking' ? (
                      <div className="text-center py-4 space-y-3">
                        <div className="w-12 h-12 bg-amber-500/10 text-amber-500 rounded-full flex items-center justify-center text-xl mx-auto animate-pulse">
                          🍳
                        </div>
                        <h4 className="text-xs font-black text-slate-800 dark:text-zinc-200">
                          {lang === 'vi' ? 'Món ăn đang được chuẩn bị' : lang === 'en' ? 'Dishes are being prepared' : '餐品制作中'}
                        </h4>
                        <p className="text-xs text-slate-400 dark:text-zinc-550 leading-relaxed max-w-[280px] mx-auto">
                          {lang === 'vi'
                            ? 'Vui lòng đợi nhà bếp chế biến xong tất cả các món trước khi thanh toán.'
                            : lang === 'en'
                            ? 'Please wait for the kitchen to complete all dishes before paying.'
                            : '请等待后厨完成所有餐品后再进行结账。'}
                        </p>
                        
                        {/* Disabled/greyed-out simulated state preview */}
                        <div className="opacity-40 select-none pointer-events-none mt-2">
                          <button disabled className="w-full py-3 bg-slate-100 dark:bg-zinc-800 text-slate-400 text-xs font-black rounded-2xl uppercase tracking-wider">
                            {order.paymentMethod === 'momo' ? 'Thanh toán MoMo' : 'Thanh toán tiền mặt'}
                          </button>
                        </div>
                      </div>
                    ) : (
                      order.paymentMethod === 'momo' ? (
                        <div className="text-center space-y-4">
                          <span className="inline-block text-pink-500 font-black text-[9px] uppercase tracking-wider bg-pink-50 dark:bg-pink-950/20 px-3 py-1.5 rounded-full border border-pink-100 dark:border-pink-900/30">
                            🌸 {lang === 'vi' ? 'Thanh toán qua Ví MoMo' : lang === 'en' ? 'Pay via MoMo Wallet' : '墨墨钱包支付'}
                          </span>
                          <h3 className="text-sm font-black text-slate-800 dark:text-white">
                            {lang === 'vi' ? 'Quét mã MoMo để thanh toán' : lang === 'en' ? 'Scan MoMo QR to Pay' : '扫描墨墨二维码支付'}
                          </h3>
                          
                          {/* Simulated scanning vietqr for momo */}
                          <div className="flex justify-center py-2">
                            <div className="relative w-48 h-48 border-4 border-pink-200 dark:border-pink-900/40 rounded-2xl overflow-hidden p-2 bg-white">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={`https://api.vietqr.io/image/970403-113366668888-ThGRLJd.jpg?amount=${order.totalAmount}&addInfo=TABLE%20${order.tableId?.tableName || ''}%20ORDER%20${order._id.slice(-6).toUpperCase()}`}
                                alt="VietQR simulated MoMo code"
                                className="w-full h-full object-contain"
                              />
                            </div>
                          </div>

                          <p className="text-xs text-slate-400 dark:text-zinc-500 max-w-xs mx-auto leading-relaxed">
                            {lang === 'vi' 
                              ? 'Bạn có thể scan QR trên bằng ứng dụng Ngân hàng/Ví điện tử, hoặc bấm nút dưới đây để giả lập thanh toán ngay.' 
                              : 'Scan the QR with any bank/e-wallet app, or click the button below to simulate checkout.'}
                          </p>

                          <button
                            onClick={handleSimulateMoMoPayment}
                            disabled={isPaying}
                            className="w-full py-3.5 bg-pink-500 hover:bg-pink-600 text-white font-extrabold rounded-2xl shadow-md transition-all active:scale-95 text-xs uppercase tracking-wider disabled:opacity-50"
                          >
                            {isPaying 
                              ? (lang === 'vi' ? 'Đang thực hiện thanh toán...' : 'Processing...') 
                              : (lang === 'vi' ? 'Thanh toán ngay bằng Ví MoMo 🚀' : 'Pay Instantly with MoMo')}
                          </button>
                        </div>
                      ) : (
                        <div className="flex gap-4 items-start p-4 bg-orange-50/50 dark:bg-zinc-800/40 rounded-2xl border border-orange-100/50 dark:border-zinc-850">
                          <span className="text-2xl shrink-0">💵</span>
                          <div className="text-left">
                            <h4 className="font-extrabold text-slate-800 dark:text-zinc-200 text-xs">
                              {lang === 'vi' ? 'Phương thức Tiền mặt' : lang === 'en' ? 'Cash Payment Mode' : '现金支付方式'}
                            </h4>
                            <p className="text-xs text-slate-400 dark:text-zinc-500 mt-1 leading-relaxed">
                              {lang === 'vi'
                                ? 'Vui lòng thanh toán trực tiếp bằng tiền mặt tại quầy lễ tân hoặc chờ nhân viên phục vụ xác nhận thu tiền tại bàn.'
                                : 'Please pay directly in cash at the counter or wait for server staff to confirm cash collection at your table.'}
                            </p>
                          </div>
                        </div>
                      )
                    )}
                  </div>
                )}

                {/* Menu List of items */}
                <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-zinc-800 transition-colors">
                  <h3 className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-wider mb-4 border-b dark:border-zinc-800 pb-2 text-left">
                    {lang === 'vi' ? 'Món đã chọn của đợt này' : lang === 'en' ? 'Ordered Items of this Round' : '本轮已点餐品'}
                  </h3>
                  <div className="divide-y divide-slate-100 dark:divide-zinc-800/60">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="py-3 flex justify-between text-xs text-left">
                        <div>
                          <p className="font-extrabold text-slate-800 dark:text-zinc-200">
                            {item.foodId?.name || '—'} <span className="text-orange-500 font-bold ml-1">x{item.quantity}</span>
                          </p>
                          {item.note && (
                            <p className="text-[10.5px] text-slate-400 dark:text-zinc-550 mt-1 pl-2 border-l border-orange-200 dark:border-zinc-700">
                              {item.note}
                            </p>
                          )}
                        </div>
                        <span className="font-bold text-slate-650 dark:text-zinc-400 shrink-0">
                          {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format((item.foodId?.price || 0) * item.quantity)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 📋 LỊCH SỬ GỌI MÓN CỦA BÀN (TẤT CẢ CÁC ĐỢT GỌI MÓN TRONG PHIÊN) */}
                {tableOrders.length > 1 && (
                  <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-zinc-800 transition-colors">
                    <h3 className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-wider mb-4 border-b dark:border-zinc-800 pb-2 text-left flex items-center justify-between">
                      <span>🧾 {lang === 'vi' ? 'Lịch sử gọi món tại bàn' : 'Table Ordering History'}</span>
                      <span className="text-[10px] font-extrabold text-orange-500 bg-orange-500/10 px-2 py-0.5 rounded-full">
                        {tableOrders.length} {lang === 'vi' ? 'lượt gọi' : 'rounds'}
                      </span>
                    </h3>
                    <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                      {tableOrders.map((tOrder, idx) => (
                        <div
                          key={tOrder._id}
                          onClick={() => {
                            if (tOrder._id !== orderId) {
                              router.push(`/table/${tableId}/order-status/${tOrder._id}`);
                            }
                          }}
                          className={`p-4 rounded-2xl border transition-all cursor-pointer text-left ${
                            tOrder._id === orderId
                              ? 'border-orange-500 bg-orange-500/5 ring-2 ring-orange-500/10 dark:bg-orange-950/10'
                              : 'border-slate-100 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900 hover:bg-slate-100/50 dark:hover:bg-zinc-800/30'
                          }`}
                        >
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-xs font-bold text-slate-700 dark:text-zinc-300">
                              {lang === 'vi' ? 'Lượt' : 'Round'} #{tableOrders.length - idx} • <span className="text-[10px] text-slate-400">{new Date(tOrder.createdAt).toLocaleTimeString('vi-VN')}</span>
                            </span>
                            <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                              tOrder.status === 'pending' ? 'bg-yellow-100 text-yellow-600 dark:bg-yellow-950/20 dark:text-yellow-450' :
                              tOrder.status === 'cooking' ? 'bg-orange-100 text-orange-600 dark:bg-orange-950/20 dark:text-orange-450' :
                              tOrder.status === 'completed' ? 'bg-green-100 text-green-600 dark:bg-green-950/20 dark:text-green-450' :
                              tOrder.status === 'paid' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-450' :
                              'bg-red-100 text-red-650 dark:bg-red-950/20 dark:text-red-450'
                            }`}>
                              {t.steps[tOrder.status]}
                            </span>
                          </div>
                          
                          <div className="space-y-1 pl-2 border-l border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-zinc-400 text-xs">
                            {tOrder.items.map((item, i) => (
                              <p key={i}>
                                {item.foodId?.name || '—'} <span className="text-orange-500 font-semibold">x{item.quantity}</span>
                              </p>
                            ))}
                          </div>
                          <div className="flex justify-between items-center mt-3 pt-2 border-t border-slate-100 dark:border-zinc-800 text-xs">
                            <span className="text-slate-400 font-semibold">{lang === 'vi' ? 'Tổng:' : 'Total:'}</span>
                            <span className="font-extrabold text-slate-800 dark:text-zinc-200">
                              {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(tOrder.totalAmount)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
