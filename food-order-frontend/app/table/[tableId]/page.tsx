'use client';

import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { useTheme } from 'next-themes';
import { motion, AnimatePresence } from 'framer-motion';
import { io, Socket } from 'socket.io-client';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface Food {
  _id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  isAvailable: boolean;
}

interface Table {
  _id: string;
  tableName: string;
  status: string;
}

interface CartItem {
  food: Food;
  quantity: number;
  note: string;
  unitPrice?: number; // adjusted price (with size/addons)
}

// ─── Price modifiers ─────────────────────────────────────────────────────────
const SIZE_MULTIPLIERS: Record<'S' | 'M' | 'L', number> = {
  S: 0.85, // -15%
  M: 1.0,  // base
  L: 1.2,  // +20%
};

const ADDON_PRICES: Record<string, number> = {
  'Thêm trứng 🍳 (+5.000 đ)': 5000,
  'Thêm phô mai 🧀 (+10.005 đ)': 10005,
  'Không rau 🍃': 0,
};

type Lang = 'vi' | 'en' | 'zh';

// ─────────────────────────────────────────────────────────────────────────────
// Dictionary (i18n)
// ─────────────────────────────────────────────────────────────────────────────

const DICTIONARY = {
  vi: {
    welcome: 'Thực đơn',
    restaurant: 'Chika Restaurant Delivery',
    table: 'Bàn số',
    searchPlaceholder: 'Tìm kiếm món ngon...',
    addToCart: 'Thêm vào giỏ hàng',
    notePlaceholder: 'Ghi chú cho nhà bếp (ví dụ: không hành, ít cay...)',
    total: 'Tổng cộng',
    checkoutBtn: 'Xác nhận đặt món',
    emptyCart: 'Chưa có món nào được chọn.',
    submitSuccess: 'Đặt món thành công! Đang chuyển đến trang theo dõi...',
    submitError: 'Gửi đơn hàng thất bại.',
    fetchError: 'Không thể tải dữ liệu thực đơn.',
    submitting: 'Đang gửi yêu cầu...',
    retry: 'Thử lại',
    details: 'Chi tiết món ăn',
    close: 'Đóng',
    cartTitle: 'Giỏ hàng của bạn',
    noItems: 'Chưa chọn món nào.',
    addSuccess: 'Đã thêm vào giỏ hàng!',
    categories: {
      'Món nước': 'Món nước',
      'Món chính': 'Món chính',
      'Ăn nhẹ': 'Ăn nhẹ',
      'Đồ uống': 'Đồ uống',
    } as Record<string, string>,
  },
  en: {
    welcome: 'Menu',
    restaurant: 'Chika Restaurant Delivery',
    table: 'Table No.',
    searchPlaceholder: 'Search culinary delights...',
    addToCart: 'Add to Cart',
    notePlaceholder: 'Kitchen note (e.g., no onions, less spicy...)',
    total: 'Total',
    checkoutBtn: 'Confirm Order',
    emptyCart: 'Your cart is currently empty.',
    submitSuccess: 'Order placed successfully! Redirecting...',
    submitError: 'Failed to submit order.',
    fetchError: 'Failed to load menu data.',
    submitting: 'Submitting request...',
    retry: 'Retry',
    details: 'Food Details',
    close: 'Close',
    cartTitle: 'Your Cart',
    noItems: 'No items selected.',
    addSuccess: 'Added to cart!',
    categories: {
      'Món nước': 'Noodle Dishes',
      'Món chính': 'Main Dishes',
      'Ăn nhẹ': 'Snacks',
      'Đồ uống': 'Beverages',
    } as Record<string, string>,
  },
  zh: {
    welcome: '菜单',
    restaurant: 'Chika Restaurant Delivery',
    table: '桌号',
    searchPlaceholder: '搜索美食...',
    addToCart: '加入购物车',
    notePlaceholder: '备注 (如: 不要葱, 少辣...)',
    total: '总计',
    checkoutBtn: '确认下单',
    emptyCart: '您的购物车为空。',
    submitSuccess: '下单成功！正在跳转...',
    submitError: '提交订单失败。',
    fetchError: '无法加载菜单数据。',
    submitting: '正在提交...',
    retry: '重试',
    details: '菜品详情',
    close: '关闭',
    cartTitle: '您的购物车',
    noItems: '尚未选择任何菜品。',
    addSuccess: '已加入购物车！',
    categories: {
      'Món nước': '汤面类',
      'Món chính': '主菜类',
      'Ăn nhẹ': '小吃',
      'Đồ uống': '饮料',
    } as Record<string, string>,
  },
};

const SOCKET_BASE = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

const formatPrice = (amount: number, lang: Lang): string => {
  if (lang === 'en') {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount / 25000);
  }
  if (lang === 'zh') {
    return new Intl.NumberFormat('zh-CN', { style: 'currency', currency: 'CNY' }).format(amount / 3500);
  }
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
};

export default function TableMenuPage() {
  const params = useParams();
  const router = useRouter();
  const tableId = params.tableId as string;
  const { setTheme, resolvedTheme } = useTheme();

  // Hydration state
  const [mounted, setMounted] = useState(false);

  const [lang, setLang] = useState<Lang>('vi');
  const [isLangOpen, setIsLangOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [foods, setFoods] = useState<Food[]>([]);
  const [table, setTable] = useState<Table | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('');
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Active Modals & Drawer States
  const [selectedFood, setSelectedFood] = useState<Food | null>(null);
  const [modalQuantity, setModalQuantity] = useState(1);
  const [modalNote, setModalNote] = useState('');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'momo'>('cash');

  // Custom Detail Options Mockup States (UI Refinements)
  const [selectedSize, setSelectedSize] = useState<'S' | 'M' | 'L'>('M');
  const [selectedAddons, setSelectedAddons] = useState<string[]>([]);

  // Multi-round & Table transfer states
  const [activeOrders, setActiveOrders] = useState<any[]>([]);
  const [latestCreatedOrder, setLatestCreatedOrder] = useState<any | null>(null);
  const [isOrderSuccessModalOpen, setIsOrderSuccessModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [isNoHistoryModalOpen, setIsNoHistoryModalOpen] = useState(false);
  const [tablesList, setTablesList] = useState<any[]>([]);
  const [selectedTransferTableId, setSelectedTransferTableId] = useState<string>('');
  const [isTransferring, setIsTransferring] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  const t = DICTIONARY[lang];

  // Helper to translate category names
  const translateCategory = useCallback((cat: string) => {
    const categoryMap = (t as any).categories;
    if (!categoryMap) return cat;
    return categoryMap[cat] || cat;
  }, [t]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!tableId) return;
    socketRef.current = io(SOCKET_BASE);

    socketRef.current.on('tableTransferred', ({ fromTableId, toTableId }: { fromTableId: string; toTableId: string }) => {
      if (fromTableId === tableId) {
        setCart([]);
        router.push(`/table/${toTableId}`);
      }
    });

    socketRef.current.on('statusUpdated', ({ orderId: updatedId, status }: { orderId: string; status: any }) => {
      setActiveOrders((prev) =>
        prev
          .map((o) => (o._id === updatedId ? { ...o, status } : o))
          .filter((o) => o.status !== 'cancelled' && o.status !== 'paid')
      );
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [tableId, router]);

  // ── Fetch Data ──────────────────────────────────────────────────────────────

  useEffect(() => {
    async function fetchData() {
      try {
        setIsLoading(true);
        const [foodsRes, tableRes] = await Promise.all([
          fetch(`${API_BASE}/foods`),
          fetch(`${API_BASE}/tables/${tableId}`),
        ]);

        if (!foodsRes.ok || !tableRes.ok) throw new Error(t.fetchError);

        const foodsData: Food[] = await foodsRes.json();
        const tableData: Table = await tableRes.json();

        const availableFoods = foodsData.filter((f) => f.isAvailable);
        setFoods(availableFoods);
        setTable(tableData);

        const categories = Array.from(new Set(availableFoods.map((f) => f.category)));
        if (categories.length > 0) setActiveCategory(categories[0]);
      } catch (err) {
        setError(err instanceof Error ? err.message : t.fetchError);
      } finally {
        setIsLoading(false);
      }
    }

    if (tableId) fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tableId]);

  // Fetch active orders of this table
  useEffect(() => {
    if (!tableId) return;
    const fetchActiveOrders = async () => {
      try {
        const res = await fetch(`${API_BASE}/orders/table/${tableId}`);
        if (res.ok) {
          const data = await res.json();
          // Filter out completed and paid orders if we only want active ones,
          // but we can keep everything not cancelled.
          const activeOnly = data.filter((o: any) => o.status !== 'cancelled' && o.status !== 'paid');
          setActiveOrders(activeOnly);
        }
      } catch (err) {
        console.error('Error fetching active orders:', err);
      }
    };
    fetchActiveOrders();
    const interval = setInterval(fetchActiveOrders, 20000);
    return () => clearInterval(interval);
  }, [tableId]);

  // Fetch tables list for table transfer
  useEffect(() => {
    if (!isTransferModalOpen) return;
    const fetchTables = async () => {
      try {
        const res = await fetch(`${API_BASE}/tables`);
        if (res.ok) {
          const data = await res.json();
          setTablesList(data);
          // Select the first empty table by default (excluding current table)
          const firstEmpty = data.find((t: any) => t._id !== tableId && t.status === 'empty');
          if (firstEmpty) {
            setSelectedTransferTableId(firstEmpty._id);
          }
        }
      } catch (err) {
        console.error('Error fetching tables:', err);
      }
    };
    fetchTables();
  }, [isTransferModalOpen, tableId]);

  const handleTransferTable = async () => {
    if (!selectedTransferTableId || isTransferring) return;
    setIsTransferring(true);
    try {
      // Nếu có đơn hàng hoạt động, gọi API chuyển đơn hàng sang bàn mới
      if (activeOrders.length > 0) {
        const res = await fetch(`${API_BASE}/orders/transfer-table`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fromTableId: tableId,
            toTableId: selectedTransferTableId,
          }),
        });
        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.message || 'Không thể chuyển bàn ăn.');
        }
      } else {
        // Nếu không có đơn hàng hoạt động, chỉ đổi trạng thái bàn cũ sang trống và bàn mới sang serving trực tiếp
        await fetch(`${API_BASE}/tables/${tableId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'empty' }),
        });
        await fetch(`${API_BASE}/tables/${selectedTransferTableId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'serving' }),
        });
      }
      
      setIsTransferModalOpen(false);
      // Chuyển hướng người dùng sang URL của bàn mới
      router.push(`/table/${selectedTransferTableId}`);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Lỗi khi chuyển bàn.');
    } finally {
      setIsTransferring(false);
    }
  };

  // ── Cart Handlers ────────────────────────────────────────────────────────────

  const handleIncrease = useCallback((food: Food) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.food._id === food._id);
      if (existing) {
        return prev.map((item) =>
          item.food._id === food._id ? { ...item, quantity: item.quantity + 1 } : item,
        );
      }
      return [...prev, { food, quantity: 1, note: '' }];
    });
  }, []);

  const handleDecrease = useCallback((foodId: string) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.food._id === foodId);
      if (!existing) return prev;
      if (existing.quantity === 1) return prev.filter((item) => item.food._id !== foodId);
      return prev.map((item) =>
        item.food._id === foodId ? { ...item, quantity: item.quantity - 1 } : item,
      );
    });
  }, []);

  const handleRemove = useCallback((foodId: string) => {
    setCart((prev) => prev.filter((item) => item.food._id !== foodId));
  }, []);

  const handleNoteChange = useCallback((foodId: string, note: string) => {
    setCart((prev) =>
      prev.map((item) => (item.food._id === foodId ? { ...item, note } : item)),
    );
  }, []);

  // Modal specific cart addition
  const handleAddFromModal = () => {
    if (!selectedFood) return;
    const addonTotal = selectedAddons.reduce((sum, a) => sum + (ADDON_PRICES[a] ?? 0), 0);
    const adjusted = Math.round(selectedFood.price * SIZE_MULTIPLIERS[selectedSize] + addonTotal);
    setCart((prev) => {
      const existing = prev.find((item) => item.food._id === selectedFood._id);
      if (existing) {
        return prev.map((item) =>
          item.food._id === selectedFood._id
            ? { ...item, quantity: item.quantity + modalQuantity, note: modalNote || item.note, unitPrice: adjusted }
            : item
        );
      }
      return [...prev, { food: selectedFood, quantity: modalQuantity, note: modalNote, unitPrice: adjusted }];
    });
    setSelectedFood(null);
    setSelectedSize('M');
    setSelectedAddons([]);
    setModalNote('');
  };

  // ── Submit Order ─────────────────────────────────────────────────────────────

  const handleSubmitOrder = async () => {
    if (cart.length === 0 || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);
    setIsCartOpen(false);

    try {
      const payload = {
        tableId,
        items: cart.map((item) => ({
          foodId: item.food._id,
          quantity: item.quantity,
          note: item.note || undefined,
        })),
        paymentMethod,
      };

      const res = await fetch(`${API_BASE}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || t.submitError);
      }

      const createdOrder = await res.json();

      setCart([]);
      setLatestCreatedOrder(createdOrder);
      setIsOrderSuccessModalOpen(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : t.submitError);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Derived Values ───────────────────────────────────────────────────────────

  const categories = useMemo(() => Array.from(new Set(foods.map((f) => f.category))), [foods]);
  
  const filteredFoods = useMemo(() => {
    return foods.filter(
      (f) =>
        f.category === activeCategory &&
        f.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [foods, activeCategory, searchQuery]);

  const totalQuantity = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalAmount = cart.reduce((sum, item) => sum + (item.unitPrice ?? item.food.price) * item.quantity, 0);
  const cartMap = new Map(cart.map((item) => [item.food._id, item]));

  // ── Render ───────────────────────────────────────────────────────────────────

  if (!mounted) return null;

  if (error && !isLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-slate-50 dark:bg-zinc-950 p-8 text-center transition-colors duration-300 font-sans">
        <div className="w-20 h-20 bg-red-50 dark:bg-red-955/20 text-red-550 rounded-full flex items-center justify-center text-4xl shadow-sm animate-bounce">
          ⚠️
        </div>
        <div>
          <h2 className="text-xl font-extrabold text-slate-800 dark:text-zinc-200">{lang === 'vi' ? 'Có lỗi xảy ra' : 'An error occurred'}</h2>
          <p className="text-sm text-slate-500 dark:text-zinc-400 mt-2 max-w-sm mx-auto">{error}</p>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="rounded-2xl bg-orange-500 text-white font-bold py-3.5 px-8 shadow-lg hover:bg-orange-600 active:scale-95 transition-all text-sm"
        >
          {t.retry}
        </button>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 dark:bg-zinc-950 transition-colors duration-300 font-sans antialiased text-slate-900 dark:text-zinc-100 selection:bg-orange-500 selection:text-white">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border-b border-slate-100 dark:border-zinc-800/60 transition-colors duration-300 shadow-[0_1px_10px_rgba(0,0,0,0.02)]">
        <div className="max-w-7xl mx-auto px-4 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center text-white shadow-md shadow-orange-500/20 font-logo text-2xl hover:scale-105 active:scale-95 transition-all cursor-pointer select-none">
              C
            </div>
            <div>
              <h1 className="font-logo text-xl sm:text-2xl text-orange-500 dark:text-orange-400 font-normal leading-none select-none">
                Chika Restaurant
              </h1>
              <p className="text-[9px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest mt-1">
                ★ {t.welcome} • Delivery ★
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Desktop / Tablet Utility Controls (Shown on sm and above) */}
            <div className="hidden sm:flex items-center gap-1.5 sm:gap-2">
              {/* Dark Mode Toggle */}
              <button
                onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
                className="p-2 sm:p-2.5 rounded-xl bg-slate-100 dark:bg-zinc-800 text-slate-655 dark:text-zinc-350 hover:bg-slate-200 dark:hover:bg-zinc-700 hover:scale-105 active:scale-95 transition-all border border-transparent dark:border-zinc-750"
                aria-label="Toggle Dark Mode"
              >
                {resolvedTheme === 'dark' ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
                )}
              </button>

              {/* Language Selector */}
              <div className="relative">
                <button
                  onClick={() => setIsLangOpen(!isLangOpen)}
                  className="flex items-center gap-1 bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-200 text-xs font-bold py-2 px-2.5 sm:py-2.5 sm:px-3 rounded-xl hover:bg-slate-200 dark:hover:bg-zinc-700 hover:scale-105 active:scale-95 transition-all border border-transparent dark:border-zinc-750 shadow-sm"
                >
                  <span>{lang === 'vi' ? '🇻🇳' : lang === 'en' ? '🇺🇸' : '🇨🇳'}</span>
                  <span className="hidden sm:inline">
                    {lang === 'vi' ? ' VI' : lang === 'en' ? ' EN' : ' ZH'}
                  </span>
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

              {/* Lịch sử gọi món */}
              <button
                onClick={() => {
                  if (activeOrders.length > 0) {
                    router.push(`/table/${tableId}/order-status/${activeOrders[0]._id}`);
                  } else {
                    setIsNoHistoryModalOpen(true);
                  }
                }}
                className={`flex items-center gap-1 py-2 px-2.5 sm:py-2.5 sm:px-3 rounded-xl hover:scale-105 active:scale-95 transition-all text-xs font-bold border shadow-sm shrink-0 ${
                  activeOrders.length > 0
                    ? 'bg-green-500/15 text-green-600 dark:text-green-400 border-green-500/20 hover:bg-green-500/20'
                    : 'bg-slate-100 dark:bg-zinc-800 text-slate-400 dark:text-zinc-555 border-transparent'
                }`}
                title="Lịch sử gọi món"
              >
                <span>🧾</span>
                <span className="hidden sm:inline">
                  {lang === 'vi' ? 'Lịch sử' : 'History'}
                </span>
              </button>

              {/* Đổi bàn */}
              <button
                onClick={() => setIsTransferModalOpen(true)}
                className="flex items-center gap-1 bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-200 text-xs font-bold py-2 px-2.5 sm:py-2.5 sm:px-3 rounded-xl hover:bg-slate-200 dark:hover:bg-zinc-700 hover:scale-105 active:scale-95 transition-all border border-transparent dark:border-zinc-750 shadow-sm shrink-0"
                title="Yêu cầu đổi bàn"
              >
                <span>🪑</span>
                <span className="hidden sm:inline">
                  {lang === 'vi' ? 'Đổi bàn' : 'Move'}
                </span>
              </button>
            </div>

            {/* Mobile Dropdown Menu (Shown on mobile only) */}
            <div className="relative sm:hidden">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2.5 rounded-xl bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-200 hover:bg-slate-200 dark:hover:bg-zinc-700 active:scale-95 hover:scale-105 transition-all border border-transparent dark:border-zinc-750 flex items-center justify-center shadow-sm"
                title="Tiện ích"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 12h16m-7 6h7" />
                </svg>
              </button>

              <AnimatePresence>
                {isMobileMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsMobileMenuOpen(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.15, ease: 'easeOut' }}
                      className="absolute right-0 mt-2 z-50 min-w-[190px] rounded-2xl bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border border-slate-150 dark:border-zinc-800 p-1.5 shadow-xl space-y-1"
                    >
                      {/* Lịch sử gọi món */}
                      <button
                        onClick={() => {
                          setIsMobileMenuOpen(false);
                          if (activeOrders.length > 0) {
                            router.push(`/table/${tableId}/order-status/${activeOrders[0]._id}`);
                          } else {
                            setIsNoHistoryModalOpen(true);
                          }
                        }}
                        className={`w-full flex items-center gap-2.5 px-3 py-2 text-left text-xs font-bold rounded-xl transition-all ${
                          activeOrders.length > 0
                            ? 'bg-green-500/10 text-green-600 dark:text-green-400 hover:bg-green-500/15'
                            : 'text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800/80'
                        }`}
                      >
                        <span className="text-sm shrink-0">🧾</span>
                        <span>{lang === 'vi' ? 'Lịch sử gọi món' : 'Order History'}</span>
                      </button>

                      {/* Đổi bàn */}
                      <button
                        onClick={() => {
                          setIsMobileMenuOpen(false);
                          setIsTransferModalOpen(true);
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-left text-xs font-bold rounded-xl text-slate-655 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800/80 transition-all"
                      >
                        <span className="text-sm shrink-0">🪑</span>
                        <span>{lang === 'vi' ? 'Đổi bàn' : 'Move Table'}</span>
                      </button>

                      <div className="border-t border-slate-100 dark:border-zinc-800/60 my-1" />

                      {/* Dark Mode Toggle */}
                      <button
                        onClick={() => {
                          setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-left text-xs font-bold rounded-xl text-slate-655 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800/80 transition-all"
                      >
                        <span className="text-sm shrink-0">
                          {resolvedTheme === 'dark' ? '☀️' : '🌙'}
                        </span>
                        <span>
                          {resolvedTheme === 'dark'
                            ? (lang === 'vi' ? 'Giao diện sáng' : 'Light Mode')
                            : (lang === 'vi' ? 'Giao diện tối' : 'Dark Mode')
                          }
                        </span>
                      </button>

                      <div className="border-t border-slate-150 dark:border-zinc-800/60 my-1" />

                      {/* Language Selection Grid */}
                      <div className="px-3 py-1.5">
                        <p className="text-[9px] font-extrabold text-slate-400 dark:text-zinc-500 uppercase tracking-wider mb-1.5">
                          {lang === 'vi' ? 'Ngôn ngữ' : 'Language'}
                        </p>
                        <div className="grid grid-cols-3 gap-1">
                          <button
                            onClick={() => {
                              setLang('vi');
                              setIsMobileMenuOpen(false);
                            }}
                            className={`py-1 rounded-lg text-[10px] font-black transition-all ${
                              lang === 'vi'
                                ? 'bg-orange-500/10 text-orange-500 border border-orange-500/20'
                                : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-350 hover:bg-slate-200 dark:hover:bg-zinc-700'
                            }`}
                          >
                            🇻🇳 VI
                          </button>
                          <button
                            onClick={() => {
                              setLang('en');
                              setIsMobileMenuOpen(false);
                            }}
                            className={`py-1 rounded-lg text-[10px] font-black transition-all ${
                              lang === 'en'
                                ? 'bg-orange-500/10 text-orange-500 border border-orange-500/20'
                                : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-350 hover:bg-slate-200 dark:hover:bg-zinc-700'
                            }`}
                          >
                            🇺🇸 EN
                          </button>
                          <button
                            onClick={() => {
                              setLang('zh');
                              setIsMobileMenuOpen(false);
                            }}
                            className={`py-1 rounded-lg text-[10px] font-black transition-all ${
                              lang === 'zh'
                                ? 'bg-orange-500/10 text-orange-500 border border-orange-500/20'
                                : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-350 hover:bg-slate-200 dark:hover:bg-zinc-700'
                            }`}
                          >
                            🇨🇳 ZH
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            {/* Table Number Badge */}
            <div className="rounded-xl bg-orange-500/10 text-orange-655 dark:text-orange-400 border border-orange-500/20 px-2 py-1.5 sm:px-3 sm:py-1.5 flex flex-col items-center justify-center shrink-0">
              <span className="text-[9px] font-extrabold uppercase tracking-wide leading-none">{t.table}</span>
              <span className="text-xs font-black leading-none mt-1">
                {isLoading ? '...' : (table?.tableName.replace(/\D/g, '') ?? '—')}
              </span>
            </div>
          </div>
        </div>

        {/* ── Search Input ──────────────────────────────────────────────────── */}
        <div className="max-w-7xl mx-auto px-4 pb-3 pt-1">
          <div className="relative">
            <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <input
              type="text"
              placeholder={t.searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 rounded-2xl py-3 pl-11 pr-4 text-xs font-medium outline-none border border-slate-200 dark:border-transparent focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all placeholder-slate-400 dark:placeholder-zinc-500 shadow-sm"
            />
          </div>
        </div>

        {/* ── Category Slider ───────────────────────────────────────────────── */}
        {!isLoading && categories.length > 0 && (
          <div className="max-w-7xl mx-auto px-4 pb-3 flex gap-2 overflow-x-auto scrollbar-none relative">
            <AnimatePresence>
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setActiveCategory(category)}
                  className={`relative flex-shrink-0 px-4 py-2.5 rounded-2xl text-xs font-extrabold transition-colors duration-300 ${
                    activeCategory === category
                      ? 'text-white'
                      : 'bg-white dark:bg-zinc-800/60 text-slate-600 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200 border border-slate-200 dark:border-zinc-800'
                  }`}
                >
                  {activeCategory === category && (
                    <motion.div
                      layoutId="activeCategoryBg"
                      className="absolute inset-0 bg-orange-500 rounded-2xl z-0 shadow-md shadow-orange-500/10"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10">{translateCategory(category)}</span>
                </button>
              ))}
            </AnimatePresence>
          </div>
        )}
      </header>

      {/* ── Main Content Grid ──────────────────────────────────────────────── */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6 pb-32">
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="flex flex-row sm:flex-col gap-4 rounded-3xl bg-white dark:bg-zinc-900 p-4 border border-slate-100 dark:border-zinc-800 shadow-sm animate-pulse">
                <div className="h-24 w-24 sm:h-44 sm:w-full rounded-2xl bg-slate-100 dark:bg-zinc-850" />
                <div className="flex-1 space-y-3 py-1">
                  <div className="h-4 w-1/2 rounded bg-slate-100 dark:bg-zinc-800" />
                  <div className="h-3 w-5/6 rounded bg-slate-50 dark:bg-zinc-800/50" />
                  <div className="h-5 w-1/4 rounded bg-slate-100 dark:bg-zinc-800 mt-4" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredFoods.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
            <span className="text-5xl opacity-45">🍲</span>
            <p className="text-sm font-bold text-slate-500 dark:text-zinc-400">{t.emptyCart}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredFoods.map((food) => {
              const cartItem = cartMap.get(food._id);
              const quantity = cartItem?.quantity ?? 0;

              return (
                <div
                  key={food._id}
                  className={`reveal-on-scroll group relative overflow-hidden rounded-3xl p-4 transition-all duration-300 border flex flex-col justify-between ${
                    quantity > 0 
                      ? 'bg-gradient-to-br from-orange-50/60 to-white dark:from-zinc-900/60 dark:to-zinc-900 border-orange-500 dark:border-orange-500 shadow-md shadow-orange-500/10 dark:shadow-orange-500/5 scale-[1.01]' 
                      : 'bg-gradient-to-br from-white to-slate-50/50 dark:from-zinc-900 dark:to-zinc-950/40 border-slate-200/60 dark:border-zinc-800/80 shadow-sm hover:shadow-md hover:border-slate-350/80 dark:hover:border-zinc-700 hover:scale-[1.005]'
                  }`}
                >
                  <div className="flex flex-row sm:flex-col gap-4">
                    {/* Cover image with click details */}
                    <div
                      onClick={() => {
                        setSelectedFood(food);
                        setModalQuantity(quantity > 0 ? quantity : 1);
                        setModalNote(cartItem?.note ?? '');
                      }}
                      className="relative h-24 w-24 sm:w-full sm:h-44 flex-shrink-0 overflow-hidden rounded-2xl bg-slate-100 dark:bg-zinc-800 cursor-pointer shadow-inner group-hover:scale-[1.01] active:scale-[0.99] transition-all"
                    >
                      <Image
                        src={food.image}
                        alt={food.name}
                        fill
                        className="object-cover"
                        sizes="(max-width: 640px) 96px, 260px"
                      />
                    </div>

                    {/* Card Body */}
                    <div className="flex min-w-0 flex-1 flex-col justify-between py-0.5">
                      <div
                        onClick={() => {
                          setSelectedFood(food);
                          setModalQuantity(quantity > 0 ? quantity : 1);
                          setModalNote(cartItem?.note ?? '');
                        }}
                        className="cursor-pointer group-hover:text-orange-500 transition-colors"
                      >
                        <h3 className="line-clamp-2 text-sm font-black text-slate-850 dark:text-zinc-100 transition-colors group-hover:text-orange-500 leading-snug">
                          {food.name}
                        </h3>
                        {food.description && (
                          <p className="mt-1.5 line-clamp-2 text-xs font-medium text-slate-500/90 dark:text-zinc-500 leading-relaxed">
                            {food.description}
                          </p>
                        )}
                      </div>

                      <div className="mt-4 flex items-center justify-between gap-2">
                        <span className="text-sm font-black text-orange-500 dark:text-orange-400 shrink-0">
                          {formatPrice(food.price, lang)}
                        </span>

                        {quantity === 0 ? (
                          <button
                            onClick={() => handleIncrease(food)}
                            className="flex h-9 w-9 items-center justify-center rounded-2xl bg-orange-500 text-white font-extrabold shadow-md hover:bg-orange-600 hover:scale-105 active:scale-95 transition-all text-lg shrink-0"
                            aria-label={t.addToCart}
                          >
                            +
                          </button>
                        ) : (
                          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-zinc-800 rounded-2xl p-0.5 border dark:border-zinc-700/60 shadow-inner shrink-0">
                            <button
                              onClick={() => handleDecrease(food._id)}
                              className="flex h-7 w-7 items-center justify-center rounded-xl bg-white dark:bg-zinc-700 text-orange-500 dark:text-orange-450 font-black shadow-sm active:scale-90 transition-all text-sm"
                            >
                              −
                            </button>
                            <span className="min-w-[1rem] text-center text-xs font-black text-slate-800 dark:text-zinc-200">
                              {quantity}
                            </span>
                            <button
                              onClick={() => handleIncrease(food)}
                              className="flex h-7 w-7 items-center justify-center rounded-xl bg-orange-500 text-white font-black shadow-sm active:scale-90 transition-all text-sm"
                            >
                              +
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {quantity > 0 && (
                    <div className="mt-3.5 border-t border-dashed border-slate-200/60 dark:border-zinc-850 pt-3">
                      <input
                        type="text"
                        placeholder={t.notePlaceholder}
                        value={cartItem?.note ?? ''}
                        onChange={(e) => handleNoteChange(food._id, e.target.value)}
                        className="w-full rounded-2xl border border-slate-200/60 dark:border-zinc-750 bg-slate-100/40 dark:bg-zinc-800/55 px-3 py-2 text-[10.5px] text-slate-700 dark:text-zinc-350 placeholder-slate-450 dark:placeholder-zinc-500 outline-none focus:border-orange-400 focus:bg-white dark:focus:bg-zinc-800 transition-all"
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* ── Toasts ─────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {submitSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -20, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: -20, x: '-50%' }}
            className="fixed top-6 left-1/2 z-50 w-11/12 max-w-sm"
          >
            <div className="flex items-center gap-3.5 rounded-3xl bg-emerald-500 dark:bg-emerald-600 px-5 py-4 text-xs font-black text-white shadow-xl">
              <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
              <span>{t.submitSuccess}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Sticky Bottom Cart Bar ─────────────────────────────────────────── */}
      <AnimatePresence>
        {totalQuantity > 0 && (
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            className="fixed bottom-6 left-0 right-0 z-40 px-4 max-w-md mx-auto"
          >
            <div className="bg-white/80 dark:bg-zinc-950/80 p-3 rounded-[2rem] backdrop-blur-xl border border-white/20 dark:border-zinc-800/60 shadow-[0_10px_30px_rgba(0,0,0,0.08)] dark:shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
              <button
                onClick={() => setIsCartOpen(true)}
                className="relative flex w-full items-center justify-between rounded-[1.75rem] px-5 py-4 text-white shadow-md bg-gradient-to-r from-orange-500 to-emerald-600 hover:from-orange-600 hover:to-emerald-700 hover:scale-[1.01] active:scale-[0.99] transition-all duration-200"
              >
                <span className="flex h-7 min-w-[1.75rem] items-center justify-center rounded-full bg-white/20 px-2 text-xs font-black backdrop-blur-sm shadow-sm">
                  {totalQuantity}
                </span>

                <span className="absolute left-1/2 -translate-x-1/2 text-xs font-extrabold tracking-wider uppercase flex items-center gap-1.5">
                  {lang === 'vi' ? 'Xem giỏ hàng' : lang === 'en' ? 'View Cart' : '查看购物车'} 🛍️
                </span>

                <span className="text-sm font-black">{formatPrice(totalAmount, lang)}</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── 1. Food Detail Modal/Drawer ────────────────────────────────────── */}
      <AnimatePresence>
        {selectedFood && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
            {/* Backdrop Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedFood(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
            />
            {/* Sheet Content */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 26, stiffness: 220 }}
              className="relative w-full sm:max-w-md bg-white dark:bg-zinc-900 rounded-t-[2.5rem] sm:rounded-[2.5rem] overflow-hidden shadow-2xl z-10 border-t sm:border dark:border-zinc-800 flex flex-col max-h-[90vh]"
            >
              {/* Cover Banner */}
              <div className="relative h-64 w-full bg-slate-100 dark:bg-zinc-800">
                <Image
                  src={selectedFood.image}
                  alt={selectedFood.name}
                  fill
                  className="object-cover"
                />
                <button
                  onClick={() => setSelectedFood(null)}
                  className="absolute top-4 right-4 w-9 h-9 flex items-center justify-center rounded-full bg-black/40 hover:bg-black/65 text-white font-extrabold transition-all hover:scale-105 active:scale-95 text-sm"
                >
                  ✕
                </button>
              </div>

              {/* Body */}
              <div className="p-6 overflow-y-auto space-y-5">
                <div>
                  <span className="text-[10px] font-black uppercase text-orange-500 tracking-wider">
                    {translateCategory(selectedFood.category)}
                  </span>
                  <h2 className="text-lg font-black text-slate-850 dark:text-white mt-1">
                    {selectedFood.name}
                  </h2>
                  {selectedFood.description && (
                    <p className="text-xs text-slate-400 dark:text-zinc-500 mt-1 leading-relaxed">
                      {selectedFood.description}
                    </p>
                  )}
                </div>

                {/* Customizable Sizes */}
                <div className="space-y-2 border-t dark:border-zinc-800 pt-4">
                  <h4 className="text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-widest">Kích cỡ / Size</h4>
                  <div className="grid grid-cols-3 gap-2">
                    {(['S', 'M', 'L'] as const).map((sz) => {
                      const mult = SIZE_MULTIPLIERS[sz];
                      const diff = mult === 1 ? null : mult > 1 ? `+${Math.round((mult - 1) * 100)}%` : `${Math.round((mult - 1) * 100)}%`;
                      return (
                        <button
                          key={sz}
                          type="button"
                          onClick={() => setSelectedSize(sz)}
                          className={`py-2.5 px-1 rounded-2xl text-xs font-bold border-2 transition-all flex flex-col items-center gap-0.5 ${
                            selectedSize === sz
                              ? 'border-orange-500 bg-orange-500/10 text-orange-600 dark:text-orange-400'
                              : 'border-slate-100 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-800/40 text-slate-500 dark:text-zinc-400'
                          }`}
                        >
                          <span>{sz === 'S' ? 'Nhỏ (S)' : sz === 'M' ? 'Vừa (M)' : 'Lớn (L)'}</span>
                          {diff && <span className={`text-[9px] font-black ${selectedSize === sz ? 'text-orange-500' : 'text-slate-400 dark:text-zinc-500'}`}>{diff}</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Customizable Addons */}
                <div className="space-y-2 border-t dark:border-zinc-800 pt-4">
                  <h4 className="text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-widest">Tùy chọn thêm / Add-ons</h4>
                  <div className="space-y-2">
                    {(Object.keys(ADDON_PRICES) as string[]).map((addon) => {
                      const hasAddon = selectedAddons.includes(addon);
                      const price = ADDON_PRICES[addon];
                      return (
                        <button
                          key={addon}
                          type="button"
                          onClick={() => {
                            setSelectedAddons(prev =>
                              hasAddon ? prev.filter(a => a !== addon) : [...prev, addon]
                            );
                          }}
                          className={`w-full flex items-center justify-between py-3 px-4 rounded-2xl text-xs font-bold border-2 transition-all ${
                            hasAddon
                              ? 'border-orange-500 bg-orange-500/5 text-orange-600 dark:text-orange-400'
                              : 'border-slate-100 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-800/40 text-slate-600 dark:text-zinc-400'
                          }`}
                        >
                          <span>{addon}</span>
                          <div className="flex items-center gap-2">
                            {price > 0 && (
                              <span className={`text-[10px] font-black ${hasAddon ? 'text-orange-500' : 'text-slate-400 dark:text-zinc-500'}`}>
                                +{new Intl.NumberFormat('vi-VN').format(price)}đ
                              </span>
                            )}
                            <span className={`w-5 h-5 rounded-full flex items-center justify-center border text-[10px] transition-all ${
                              hasAddon ? 'bg-orange-500 border-orange-500 text-white' : 'border-slate-300 dark:border-zinc-650 text-transparent'
                            }`}>
                              ✓
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Live price display */}
                {(() => {
                  const addonTotal = selectedAddons.reduce((sum, a) => sum + (ADDON_PRICES[a] ?? 0), 0);
                  const adjustedPrice = Math.round(selectedFood.price * SIZE_MULTIPLIERS[selectedSize] + addonTotal);
                  const hasChange = adjustedPrice !== selectedFood.price;
                  return (
                    <div className="flex items-center justify-between border-t dark:border-zinc-800 pt-4 pb-1">
                      <div>
                        <span className="text-xs font-bold text-slate-500 dark:text-zinc-400">
                          {lang === 'vi' ? 'Đơn giá' : lang === 'en' ? 'Unit Price' : '单价'}
                        </span>
                        {hasChange && (
                          <p className="text-[10px] text-slate-400 dark:text-zinc-600 line-through mt-0.5">
                            {formatPrice(selectedFood.price, lang)}
                          </p>
                        )}
                      </div>
                      <span className={`text-base font-black transition-all ${hasChange ? 'text-orange-500' : 'text-orange-500'}`}>
                        {formatPrice(adjustedPrice, lang)}
                      </span>
                    </div>
                  );
                })()}

                {/* Quantity Control inside Modal */}
                <div className="flex items-center justify-between bg-slate-50 dark:bg-zinc-800/50 p-3.5 rounded-2xl border dark:border-zinc-800">
                  <span className="text-xs font-black text-slate-655 dark:text-zinc-350">
                    {lang === 'vi' ? 'Số lượng đặt' : lang === 'en' ? 'Order Quantity' : '订购数量'}
                  </span>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setModalQuantity(q => Math.max(1, q - 1))}
                      className="w-9 h-9 rounded-xl border-2 border-orange-500/20 text-orange-500 dark:text-orange-450 flex items-center justify-center font-black text-lg bg-white dark:bg-zinc-700 active:scale-95 transition-all shadow-sm"
                    >
                      −
                    </button>
                    <span className="text-sm font-black w-6 text-center text-slate-800 dark:text-zinc-200">
                      {modalQuantity}
                    </span>
                    <button
                      onClick={() => setModalQuantity(q => q + 1)}
                      className="w-9 h-9 rounded-xl bg-orange-500 text-white flex items-center justify-center font-black text-lg active:scale-95 transition-all shadow-md"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Note Field in Modal */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 dark:text-zinc-550 uppercase tracking-widest">
                    {t.notePlaceholder}
                  </label>
                  <input
                    type="text"
                    placeholder="Ví dụ: không cay, không hành..."
                    value={modalNote}
                    onChange={(e) => setModalNote(e.target.value)}
                    className="w-full rounded-2xl border border-slate-150 dark:border-zinc-750 bg-slate-50 dark:bg-zinc-800 text-xs px-4 py-3.5 text-slate-900 dark:text-zinc-100 outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition-all placeholder-slate-400"
                  />
                </div>

                {/* Confirm Add CTA */}
                {(() => {
                  const addonTotal = selectedAddons.reduce((sum, a) => sum + (ADDON_PRICES[a] ?? 0), 0);
                  const adjustedPrice = Math.round(selectedFood.price * SIZE_MULTIPLIERS[selectedSize] + addonTotal);
                  return (
                    <button
                      onClick={handleAddFromModal}
                      className="w-full bg-gradient-to-r from-orange-500 to-emerald-600 hover:from-orange-600 hover:to-emerald-700 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-wider shadow-lg hover:shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2"
                    >
                      {t.addToCart} • {formatPrice(adjustedPrice * modalQuantity, lang)}
                    </button>
                  );
                })()}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── 2. Cart Drawer ─────────────────────────────────────────────────── */}
      <AnimatePresence>
        {isCartOpen && (
          <div className="fixed inset-0 z-50 flex items-end justify-center">
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCartOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
            />
            {/* Drawer Body */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="relative w-full max-w-md bg-white dark:bg-zinc-900 rounded-t-[2.5rem] shadow-2xl z-10 flex flex-col max-h-[85vh] transition-colors border-t dark:border-zinc-800"
            >
              {/* Header drag-indicator bar */}
              <div className="flex justify-center py-4 cursor-pointer" onClick={() => setIsCartOpen(false)}>
                <div className="w-12 h-1.5 rounded-full bg-slate-200 dark:bg-zinc-850" />
              </div>

              {/* Title & Close */}
              <div className="px-6 pb-4 flex items-center justify-between border-b border-slate-100 dark:border-zinc-800">
                <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <span>🛒</span> {t.cartTitle}
                </h3>
                <span className="text-xs font-black text-slate-400 dark:text-zinc-550">
                  {totalQuantity} {lang === 'vi' ? 'món' : lang === 'en' ? 'items' : '份'}
                </span>
              </div>

              {/* Cart Items List */}
              <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3.5">
                {cart.length === 0 ? (
                  <div className="text-center py-16 text-slate-400 dark:text-zinc-500">
                    <span className="text-5xl block mb-3">🛍️</span>
                    {t.noItems}
                  </div>
                ) : (
                  cart.map((item) => (
                    <div key={item.food._id} className="flex items-start justify-between gap-3 bg-slate-50/50 dark:bg-zinc-800/30 p-4 rounded-3xl border border-slate-100 dark:border-zinc-800/60 shadow-sm">
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-black text-slate-900 dark:text-zinc-150 truncate">
                          {item.food.name}
                        </h4>
                        <p className="text-xs font-extrabold text-orange-500 mt-1">
                          {formatPrice(item.food.price, lang)}
                        </p>
                        {item.note && (
                          <p className="text-[10.5px] text-slate-400 mt-1.5 italic pl-2 border-l border-orange-300">
                            💬 {item.note}
                          </p>
                        )}
                      </div>

                      {/* Controls inside Drawer */}
                      <div className="flex flex-col items-end justify-between self-stretch shrink-0">
                        <button
                          onClick={() => handleRemove(item.food._id)}
                          className="text-slate-400 hover:text-red-500 text-[10px] font-extrabold uppercase tracking-wider transition-colors"
                        >
                          ✕ Xóa
                        </button>
                        
                        <div className="flex items-center gap-2 mt-3 bg-white dark:bg-zinc-800 rounded-xl p-0.5 border dark:border-zinc-700 shadow-sm">
                          <button
                            onClick={() => handleDecrease(item.food._id)}
                            className="w-7 h-7 rounded-lg bg-slate-50 dark:bg-zinc-700 text-orange-500 font-black flex items-center justify-center text-xs active:scale-90 transition-all shadow-sm"
                          >
                            −
                          </button>
                          <span className="text-xs font-black w-4 text-center text-slate-800 dark:text-zinc-200">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => handleIncrease(item.food)}
                            className="w-7 h-7 rounded-lg bg-orange-500 text-white font-black flex items-center justify-center text-xs active:scale-90 transition-all shadow-md"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Checkout Block */}
              <div className="px-6 py-6 pb-8 border-t border-slate-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 transition-colors">
                {/* Payment Method Selector */}
                <div className="mb-5 space-y-2">
                  <label className="text-[10px] font-black text-slate-400 dark:text-zinc-550 uppercase tracking-widest">
                    {lang === 'vi' ? 'Phương thức thanh toán' : lang === 'en' ? 'Payment Method' : '支付方式'}
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setPaymentMethod('cash')}
                      className={`flex items-center justify-center gap-2 py-3.5 rounded-2xl text-xs font-bold border-2 transition-all ${
                        paymentMethod === 'cash'
                          ? 'border-orange-500 bg-orange-500/5 text-orange-655 dark:text-orange-455 font-black'
                          : 'border-slate-100 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-800/40 text-slate-550 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800'
                      }`}
                    >
                      💵 {lang === 'vi' ? 'Tiền mặt' : lang === 'en' ? 'Cash' : '现金'}
                    </button>
                    <button
                      onClick={() => setPaymentMethod('momo')}
                      className={`flex items-center justify-center gap-2 py-3.5 rounded-2xl text-xs font-bold border-2 transition-all ${
                        paymentMethod === 'momo'
                          ? 'border-pink-500 bg-pink-500/5 text-pink-650 dark:text-pink-400 font-black'
                          : 'border-slate-100 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-800/40 text-slate-500 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800'
                      }`}
                    >
                      🌸 {lang === 'vi' ? 'Ví MoMo' : lang === 'en' ? 'MoMo Wallet' : '墨墨钱包'}
                    </button>
                  </div>
                </div>

                <div className="flex justify-between items-center mb-5">
                  <span className="text-xs font-bold text-slate-500 dark:text-zinc-400">{t.total}:</span>
                  <span className="text-lg font-black text-orange-500">
                    {formatPrice(totalAmount, lang)}
                  </span>
                </div>

                <button
                  onClick={handleSubmitOrder}
                  disabled={cart.length === 0 || isSubmitting}
                  className="w-full bg-gradient-to-r from-orange-500 to-emerald-600 hover:from-orange-600 hover:to-emerald-700 text-white py-4 rounded-2.5xl font-black text-xs uppercase tracking-wider shadow-lg active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? t.submitting : t.checkoutBtn} 🚀
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── 3. Table Transfer Modal ─────────────────────────────────────────── */}
      <AnimatePresence>
        {isTransferModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsTransferModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
            />
            {/* Modal Body */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-sm bg-white dark:bg-zinc-900 rounded-3xl p-6 shadow-2xl z-10 transition-colors border dark:border-zinc-800 text-left"
            >
              <h3 className="text-base font-black text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                🔄 {lang === 'vi' ? 'Yêu cầu chuyển bàn' : 'Request Table Transfer'}
              </h3>
              <p className="text-xs text-slate-400 dark:text-zinc-500 mb-6 leading-relaxed">
                {lang === 'vi'
                  ? 'Vui lòng chọn bàn trống bạn muốn chuyển đến. Tất cả các món ăn đã gọi và giỏ hàng của bạn sẽ được chuyển theo sang bàn mới.'
                  : 'Please choose an empty table to move to. All ordered items and your current session will be transferred.'}
              </p>

              <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-400 dark:text-zinc-550 uppercase tracking-widest block">
                  {lang === 'vi' ? 'Chọn bàn trống mới' : 'Select New Empty Table'}
                </label>

                {/* Gorgeous, tactile Bento-style Table Selection Grid */}
                <div className="grid grid-cols-3 gap-2.5 max-h-[220px] overflow-y-auto scrollbar-none pr-1">
                  {tablesList.filter(t => t._id !== tableId && t.status === 'empty').length === 0 ? (
                    <div className="col-span-3 text-center py-8 bg-slate-50 dark:bg-zinc-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-zinc-800">
                      <span className="text-xl opacity-60">🪑</span>
                      <p className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 mt-2">
                        {lang === 'vi' ? 'Không có bàn trống khả dụng' : 'No empty tables available'}
                      </p>
                    </div>
                  ) : (
                    tablesList
                      .filter(t => t._id !== tableId && t.status === 'empty')
                      .map((tItem) => {
                        const isSelected = selectedTransferTableId === tItem._id;
                        return (
                          <button
                            key={tItem._id}
                            type="button"
                            onClick={() => setSelectedTransferTableId(tItem._id)}
                            className={`flex flex-col items-center justify-center p-3.5 rounded-2xl border transition-all duration-200 text-center relative hover:scale-102 active:scale-98 ${
                              isSelected
                                ? 'bg-orange-500 border-orange-500 text-white shadow-md shadow-orange-500/20'
                                : 'bg-slate-50 dark:bg-zinc-800/60 border-slate-100 dark:border-zinc-800/85 text-slate-700 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 hover:border-slate-200/80'
                            }`}
                          >
                            <span className="text-base mb-1">🪑</span>
                            <span className="text-[10px] font-black tracking-tight line-clamp-1">
                              {tItem.tableName}
                            </span>
                            {isSelected && (
                              <span className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-500 text-white rounded-full flex items-center justify-center text-[9px] font-black border-2 border-white dark:border-zinc-900 shadow">
                                ✓
                              </span>
                            )}
                          </button>
                        );
                      })
                  )}
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => {
                      setIsTransferModalOpen(false);
                      setSelectedTransferTableId('');
                    }}
                    className="flex-1 py-3 bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-350 hover:bg-slate-200 dark:hover:bg-zinc-750 text-xs font-black rounded-2xl transition-colors uppercase tracking-wider"
                  >
                    {lang === 'vi' ? 'Hủy bỏ' : 'Cancel'}
                  </button>
                  <button
                    onClick={handleTransferTable}
                    disabled={!selectedTransferTableId || isTransferring}
                    className="flex-1 py-3 bg-gradient-to-r from-orange-500 to-emerald-600 hover:from-orange-600 hover:to-emerald-700 text-white text-xs font-black rounded-2xl transition-all shadow-md hover:shadow-lg disabled:opacity-50 uppercase tracking-wider active:scale-95"
                  >
                    {isTransferring ? (lang === 'vi' ? 'Đang chuyển...' : 'Moving...') : (lang === 'vi' ? 'Đồng ý chuyển' : 'Confirm Move')}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── 4. Order Success Modal ──────────────────────────────────────────── */}
      <AnimatePresence>
        {isOrderSuccessModalOpen && latestCreatedOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOrderSuccessModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
            />
            {/* Modal Body */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-sm bg-white dark:bg-zinc-900 rounded-3xl p-6 shadow-2xl z-10 transition-colors border dark:border-zinc-800 text-center"
            >
              <div className="w-16 h-16 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center text-3xl mx-auto mb-4 animate-bounce">
                🎉
              </div>
              <h3 className="text-base font-black text-slate-900 dark:text-white mb-2">
                {lang === 'vi' ? 'Đặt món thành công!' : 'Order Placed Successfully!'}
              </h3>
              <p className="text-xs text-slate-400 dark:text-zinc-500 mb-6 leading-relaxed max-w-[280px] mx-auto">
                {lang === 'vi'
                  ? 'Đơn hàng của bạn đã được gửi xuống nhà bếp. Bạn muốn tiếp tục chọn thêm món hay theo dõi tiến độ chuẩn bị món ăn?'
                  : 'Your order has been sent to the kitchen. Would you like to order more items or track preparation progress?'}
              </p>

              <div className="flex flex-col gap-3">
                <button
                  onClick={() => {
                    setIsOrderSuccessModalOpen(false);
                    // Refresh active orders list
                    fetch(`${API_BASE}/orders/table/${tableId}`)
                      .then(res => res.json())
                      .then(data => {
                        const activeOnly = data.filter((o: any) => o.status !== 'cancelled' && o.status !== 'paid');
                        setActiveOrders(activeOnly);
                      });
                  }}
                  className="w-full py-3.5 bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-200 hover:bg-slate-200 dark:hover:bg-zinc-750 text-xs font-black rounded-2xl transition-colors uppercase tracking-wider"
                >
                  ➕ {lang === 'vi' ? 'Quay lại chọn thêm món' : 'Add More Items'}
                </button>
                <button
                  onClick={() => {
                    setIsOrderSuccessModalOpen(false);
                    router.push(`/table/${tableId}/order-status/${latestCreatedOrder._id}`);
                  }}
                  className="w-full py-3.5 bg-gradient-to-r from-orange-500 to-emerald-600 hover:from-orange-600 hover:to-emerald-700 text-white text-xs font-black rounded-2xl transition-all shadow-md hover:shadow-lg uppercase tracking-wider"
                >
                  📋 {lang === 'vi' ? 'Xem trạng thái chế biến' : 'View Order Status'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── 5. No History Warning Modal ──────────────────────────────────────── */}
      <AnimatePresence>
        {isNoHistoryModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsNoHistoryModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
            />
            {/* Modal Body */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-sm bg-white dark:bg-zinc-900 rounded-3xl p-6 shadow-2xl z-10 transition-colors border dark:border-zinc-800 text-center animate-pulse-once"
            >
              <div className="w-16 h-16 bg-amber-500/10 text-amber-500 rounded-full flex items-center justify-center text-3xl mx-auto mb-4">
                🧾
              </div>
              <h3 className="text-base font-black text-slate-900 dark:text-white mb-2">
                {lang === 'vi' ? 'Chưa có lịch sử gọi món!' : 'No Order History Yet!'}
              </h3>
              <p className="text-xs text-slate-400 dark:text-zinc-500 mb-6 leading-relaxed max-w-[280px] mx-auto">
                {lang === 'vi'
                  ? 'Quý khách hiện chưa thực hiện đặt món ăn nào tại bàn này. Vui lòng chọn các món ăn ngon từ thực đơn và gửi yêu cầu.'
                  : 'You have not placed any orders at this table yet. Please choose delicious dishes from our menu to begin.'}
              </p>

              <button
                onClick={() => setIsNoHistoryModalOpen(false)}
                className="w-full py-3.5 bg-orange-500 hover:bg-orange-600 text-white text-xs font-black rounded-2xl transition-all shadow-md hover:shadow-lg uppercase tracking-wider active:scale-95"
              >
                {lang === 'vi' ? 'Xem thực đơn ngay' : 'Browse Menu Now'}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
