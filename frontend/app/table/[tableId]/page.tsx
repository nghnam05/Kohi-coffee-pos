'use client';

import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { AnimatePresence, motion } from 'framer-motion';
import { io, Socket } from 'socket.io-client';
import { playAlertPing } from '../../utils/sound';
import { toast } from 'react-hot-toast';

import { LeftSidebar } from '@/components/table/LeftSidebar';
import { Header } from '@/components/table/Header';
import { CatalogHeader } from '@/components/table/CatalogHeader';
import { FoodCard } from '@/components/table/FoodCard';
import { CartSidebar } from '@/components/table/CartSidebar';
import { FoodDetailModal } from '@/components/table/FoodDetailModal';
import { OrderHistoryModal } from '@/components/table/OrderHistoryModal';
import { TransferTableModal } from '@/components/table/TransferTableModal';
import { OrderSuccessModal } from '@/components/table/OrderSuccessModal';
import { NamePromptModal } from '@/components/table/NamePromptModal';
import { AiChatWidget } from '@/components/table/AiChatWidget';
import { TableQRModal } from '@/components/table/TableQRModal';

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
  addedBy?: string;
  addedByDeviceId?: string;
}

// ─── Price modifiers ─────────────────────────────────────────────────────────
const SIZE_MULTIPLIERS: Record<'S' | 'M' | 'L', number> = {
  S: 0.85, // -15%
  M: 1.0,  // base
  L: 1.2,  // +20%
};

const ADDON_PRICES: Record<string, number> = {
  'Thêm Trân Châu Trắng (+5.000 đ)': 5000,
  'Thêm Phô Mai Machiato (+10.000 đ)': 10000,
  'Thêm Sữa Đặc (+5.000 đ)': 5000,
  'Ít Đường / Ít Đá': 0,
};

const ADDON_ICONS: Record<string, string> = {
  'Thêm Trân Châu Trắng (+5.000 đ)': 'grain',
  'Thêm Phô Mai Machiato (+10.000 đ)': 'local_cafe',
  'Thêm Sữa Đặc (+5.000 đ)': 'water_drop',
  'Ít Đường / Ít Đá': 'ac_unit',
};

type Lang = 'vi' | 'en' | 'zh';

const ITEMS_PER_PAGE = 12;

// ─────────────────────────────────────────────────────────────────────────────
// Dictionary (i18n)
// ─────────────────────────────────────────────────────────────────────────────

const DICTIONARY = {
  vi: {
    welcome: 'Hôm nay chúng ta uống gì?',
    restaurant: 'Kohi Coffee & Pastry',
    table: 'Bàn số',
    searchPlaceholder: 'Tìm kiếm cà phê, trà, bánh ngọt...',
    addToCart: 'Thêm vào giỏ hàng',
    notePlaceholder: 'Ghi chú cho Barista (ví dụ: ít đường, 70% đá, không sữa...)',
    total: 'Tổng cộng',
    checkoutBtn: 'Xác nhận gọi món',
    emptyCart: 'Chưa có món nào được chọn.',
    submitSuccess: 'Đặt món thành công! Đang chuyển đến trang theo dõi...',
    submitError: 'Gửi đơn hàng thất bại.',
    fetchError: 'Không thể tải dữ liệu thực đơn.',
    submitting: 'Đang gửi yêu cầu...',
    retry: 'Thử lại',
    details: 'Chi tiết thức uống & bánh',
    close: 'Đóng',
    cartTitle: 'Giỏ hàng của bạn',
    noItems: 'Chưa chọn món nào.',
    addSuccess: 'Đã thêm vào giỏ hàng!',
    callStaff: 'Gọi nhân viên',
    changeTable: 'Đổi bàn',
    orderHistory: 'Lịch sử gọi món',
    darkMode: 'Giao diện Tối',
    lightMode: 'Giao diện Sáng',
    promoCode: 'Mã giảm giá',
    apply: 'Áp dụng',
    subtotal: 'Tạm tính',
    paymentMethod: 'Phương thức thanh toán',
    cash: 'Tiền mặt',
    momoQr: 'MoMo QR',
    gridView: 'Dạng lưới',
    listView: 'Dạng danh sách',
    viewMode: 'Chế độ xem',
    askAi: 'Hỏi AI về món này',
    size: 'Kích cỡ / Size',
    topping: 'Topping / Addon',
    suggestedForYou: 'Có thể bạn sẽ thích',
    addItem: 'Thêm',
    categories: {} as Record<string, string>,
  },
  en: {
    welcome: 'What are we having today?',
    restaurant: 'Kohi Coffee & Pastry',
    table: 'Table No.',
    searchPlaceholder: 'Search coffee, tea, pastry...',
    addToCart: 'Add to Cart',
    notePlaceholder: 'Barista note (e.g., less sugar, 70% ice, oat milk...)',
    total: 'Total',
    checkoutBtn: 'Confirm Order',
    emptyCart: 'Your cart is currently empty.',
    submitSuccess: 'Order placed successfully! Redirecting...',
    submitError: 'Failed to submit order.',
    fetchError: 'Failed to load menu data.',
    submitting: 'Submitting request...',
    retry: 'Retry',
    details: 'Coffee & Pastry Details',
    close: 'Close',
    cartTitle: 'Your Cart',
    noItems: 'No items selected.',
    addSuccess: 'Added to cart!',
    callStaff: 'Call Staff',
    changeTable: 'Change Table',
    orderHistory: 'Order History',
    darkMode: 'Dark Mode',
    lightMode: 'Light Mode',
    promoCode: 'Promo Code',
    apply: 'Apply',
    subtotal: 'Subtotal',
    paymentMethod: 'Payment Method',
    cash: 'Cash',
    momoQr: 'MoMo QR',
    gridView: 'Grid View',
    listView: 'List View',
    viewMode: 'View Mode',
    askAi: 'Ask AI about this item',
    size: 'Size',
    topping: 'Topping / Add-on',
    suggestedForYou: 'You Might Also Like',
    addItem: 'Add',
    categories: {
      'Cà phê': 'Coffee',
      'Cà phê Specialty': 'Specialty Coffee',
      'Trà & Trái cây': 'Fruit Tea & Fresh Tea',
      'Trà trái cây': 'Fruit Tea',
      'Bánh ngọt & Pastry': 'Bakery & Pastry',
      'Bánh ngọt thủ công': 'Handcrafted Pastry',
      'Đá xay & Ăn vặt': 'Ice Blended & Snacks',
      'Đá xay': 'Ice Blended',
    } as Record<string, string>,
  },
  zh: {
    welcome: '今天想喝点什么？',
    restaurant: 'Kohi Coffee & Pastry',
    table: '桌号',
    searchPlaceholder: '搜索咖啡、水果茶、手工烘焙糕点...',
    addToCart: '加入购物车',
    notePlaceholder: '咖啡师备注 (如: 少糖, 70%冰, 燕麦奶...)',
    total: '总计',
    checkoutBtn: '确认提交订单',
    emptyCart: '您的购物车为空。',
    submitSuccess: '下单成功！正在跳转到追踪页面...',
    submitError: '提交订单失败。',
    fetchError: '无法加载菜单数据。',
    submitting: '正在提交请求...',
    retry: '重试',
    details: '饮品与糕点详情',
    close: '关闭',
    cartTitle: '您的购物车',
    noItems: '尚未选择任何菜品。',
    addSuccess: '已加入购物车！',
    callStaff: '呼叫服务员',
    changeTable: '更换桌号',
    orderHistory: '点单记录',
    darkMode: '深色模式',
    lightMode: '浅色模式',
    promoCode: '优惠码',
    apply: '应用',
    subtotal: '小计',
    paymentMethod: '支付方式',
    cash: '现金',
    momoQr: 'MoMo 扫码',
    gridView: '网格视图',
    listView: '列表视图',
    viewMode: '查看方式',
    askAi: '向AI咨询此商品',
    size: '尺寸',
    topping: '加料 / Topping',
    suggestedForYou: '猜你喜欢',
    addItem: '添加',
    categories: {
      'Cà phê': '特调咖啡',
      'Cà phê Specialty': '精品咖啡 Specialty',
      'Trà & Trái cây': '水果茶 & 鲜茶',
      'Trà trái cây': '鲜果茶类',
      'Bánh ngọt & Pastry': '手工烘焙糕点',
      'Bánh ngọt thủ công': '精致手工甜点',
      'Đá xay & Ăn vặt': '冰沙 & 休闲小食',
      'Đá xay': '特调冰沙',
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [foods, setFoods] = useState<Food[]>([]);
  const [table, setTable] = useState<Table | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('');

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);

  // Active Modals & Drawer States
  const [selectedFood, setSelectedFood] = useState<Food | null>(null);
  const [modalQuantity, setModalQuantity] = useState(1);
  const [modalNote, setModalNote] = useState('');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'momo'>('cash');

  // Custom Detail Options
  const [selectedSize, setSelectedSize] = useState<'S' | 'M' | 'L'>('M');
  const [selectedAddons, setSelectedAddons] = useState<string[]>([]);

  // Multi-round & Table transfer states
  const [activeOrders, setActiveOrders] = useState<any[]>([]);
  const [latestCreatedOrder, setLatestCreatedOrder] = useState<any | null>(null);
  const [isOrderSuccessModalOpen, setIsOrderSuccessModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [isNoHistoryModalOpen, setIsNoHistoryModalOpen] = useState(false);
  const [isOrderHistoryModalOpen, setIsOrderHistoryModalOpen] = useState(false);
  const [tablesList, setTablesList] = useState<any[]>([]);
  const [selectedTransferTableId, setSelectedTransferTableId] = useState<string>('');
  const [isTransferring, setIsTransferring] = useState(false);
  const [callStaffCooldown, setCallStaffCooldown] = useState(0);
  const [isCallingStaff, setIsCallingStaff] = useState(false);
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);

  // Coupon
  const [couponInput, setCouponInput] = useState('');
  const [couponResult, setCouponResult] = useState<{ valid: boolean; discountAmount: number; message?: string } | null>(null);
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);

  // Food Reviews
  const [foodReviews, setFoodReviews] = useState<any[]>([]);
  const [isLoadingReviews, setIsLoadingReviews] = useState(false);

  // AI Chat
  const [isAiChatOpen, setIsAiChatOpen] = useState(false);
  const [aiMessages, setAiMessages] = useState<{ role: 'user' | 'ai'; text: string }[]>([]);
  const [aiInput, setAiInput] = useState('');
  const [isAiThinking, setIsAiThinking] = useState(false);

  // Modal Specific AI Chat & Lightbox
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [isModalAiOpen, setIsModalAiOpen] = useState(false);
  const [modalAiMessages, setModalAiMessages] = useState<{ role: 'user' | 'ai'; text: string }[]>([]);
  const [modalAiInput, setModalAiInput] = useState('');
  const [isModalAiThinking, setIsModalAiThinking] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Customer Name
  const [customerName, setCustomerName] = useState<string>('');
  const [nameInput, setNameInput] = useState<string>('');
  const [isNamePromptOpen, setIsNamePromptOpen] = useState<boolean>(false);
  const nameInputRef = useRef<HTMLInputElement>(null);

  // Kitchen preparation notification state
  const [kitchenNotification, setKitchenNotification] = useState<{
    show: boolean;
    title: string;
    message: string;
    orderId?: string;
  } | null>(null);

  const socketRef = useRef<Socket | null>(null);

  const t = DICTIONARY[lang];
  const isDark = resolvedTheme === 'dark';

  const translateCategory = useCallback((cat: string) => {
    const categoryMap = (t as any).categories;
    if (!categoryMap) return cat;
    return categoryMap[cat] || cat;
  }, [t]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!tableId || !mounted) return;
    const savedName = localStorage.getItem(`chika_name_${tableId}`);
    const isDismissed = localStorage.getItem(`chika_name_dismissed_${tableId}`) === 'true';
    if (savedName && savedName.trim()) {
      setCustomerName(savedName.trim());
      setIsNamePromptOpen(false);
    } else if (isDismissed) {
      setIsNamePromptOpen(false);
    } else {
      setIsNamePromptOpen(true);
    }
  }, [tableId, mounted]);

  useEffect(() => {
    if (isNamePromptOpen && nameInputRef.current) {
      setTimeout(() => nameInputRef.current?.focus(), 100);
    }
  }, [isNamePromptOpen]);

  useEffect(() => {
    if (!tableId) return;
    socketRef.current = io(SOCKET_BASE);

    socketRef.current.emit('joinTableRoom', { tableId });

    socketRef.current.on('groupCartState', ({ items }: { items: any[] }) => {
      if (Array.isArray(items) && items.length > 0) {
        setCart(items);
      }
    });

    socketRef.current.on('groupCartUpdated', ({ items }: { items: any[] }) => {
      if (Array.isArray(items)) {
        setCart(items);
      }
    });

    socketRef.current.on('groupCartCleared', () => {
      setCart([]);
    });

    socketRef.current.on('tableTransferred', ({ fromTableId, toTableId }: { fromTableId: string; toTableId: string }) => {
      if (fromTableId === tableId) {
        const savedName = localStorage.getItem(`chika_name_${tableId}`);
        if (savedName) {
          localStorage.setItem(`chika_name_${toTableId}`, savedName);
        }
        router.push(`/table/${toTableId}`);
      }
    });

    socketRef.current.on('newOrder', (newOrder: any) => {
      const orderTableId = newOrder.tableId?._id || newOrder.tableId;
      if (orderTableId === tableId) {
        setActiveOrders((prev) => {
          if (prev.some((o) => o._id === newOrder._id)) return prev;
          return [newOrder, ...prev];
        });
        setTable((prev) => (prev ? { ...prev, status: 'serving' } : null));
      }
    });

    socketRef.current.on('orderDeleted', ({ orderId: deletedId }: { orderId: string }) => {
      setActiveOrders((prev) => prev.filter((o) => o._id !== deletedId));
    });

    socketRef.current.on('ordersMerged', ({ tableId: evtTableId }: { tableId: string }) => {
      if (evtTableId === tableId) {
        const fetchActiveOrders = async () => {
          try {
            const res = await fetch(`${API_BASE}/orders/table/${tableId}`);
            if (res.ok) {
              const data = await res.json();
              const validOrders = data.filter((o: any) => o.status !== 'cancelled');
              setActiveOrders(validOrders);
            }
          } catch (err) {
            console.error('Error fetching active orders:', err);
          }
        };
        fetchActiveOrders();
      }
    });

    socketRef.current.on('statusUpdated', ({ orderId: updatedId, status }: { orderId: string; status: any }) => {
      setActiveOrders((prev) =>
        prev
          .map((o) => (o._id === updatedId ? { ...o, status } : o))
          .filter((o) => o.status !== 'cancelled')
      );

      if (status === 'preparing' || status === 'processing' || status === 'in_progress') {
        try { playAlertPing(); } catch {}
        setKitchenNotification({
          show: true,
          title: 'Bếp / Barista đang pha chế đơn!',
          message: `Đơn hàng #${updatedId ? updatedId.slice(-6).toUpperCase() : ''} đã bắt đầu được làm.`,
          orderId: updatedId,
        });
      } else if (status === 'ready' || status === 'served' || status === 'completed') {
        try { playAlertPing(); } catch {}
        setKitchenNotification({
          show: true,
          title: 'Thức uống đã sẵn sàng!',
          message: `Đơn hàng #${updatedId ? updatedId.slice(-6).toUpperCase() : ''} đã chuẩn bị xong.`,
          orderId: updatedId,
        });
      } else if (status === 'paid') {
        try { playAlertPing(); } catch {}
        setKitchenNotification({
          show: true,
          title: 'Thanh toán thành công!',
          message: `Nhân viên đã xác nhận thanh toán hoàn tất cho bàn. Bạn có thể xem lại hóa đơn hoặc chọn rời bàn.`,
          orderId: updatedId,
        });
      }
    });

    socketRef.current.on('tableUpdated', ({ tableId: evtTableId, status }: { tableId: string; status: string }) => {
      const currentTableId = typeof tableId === 'string' ? tableId : (tableId as any)?._id;
      if (evtTableId === currentTableId) {
        setTable((prev) => (prev ? { ...prev, status } : null));
        if (status === 'empty') {
          try { playAlertPing(); } catch {}
          setKitchenNotification({
            show: true,
            title: 'Thanh toán hoàn tất!',
            message: 'Bàn đã được giải phóng sang trạng thái trống. Cảm ơn quý khách!',
          });
        }
      }
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [tableId, router]);

  useEffect(() => {
    if (kitchenNotification?.show) {
      const timer = setTimeout(() => {
        setKitchenNotification(null);
      }, 7000);
      return () => clearTimeout(timer);
    }
  }, [kitchenNotification]);

  useEffect(() => {
    if (tableId) {
      let devId = localStorage.getItem('kohi_device_id');
      if (!devId) {
        devId = 'dev_' + Math.random().toString(36).substring(2, 9);
        localStorage.setItem('kohi_device_id', devId);
      }
      fetch(`${API_BASE}/tables/${tableId}/join-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceId: devId }),
      }).catch(() => {});
    }
  }, [tableId]);

  const handleLeaveTable = async () => {
    if (!confirm('Bạn có chắc chắn muốn rời bàn?')) return;
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
      if (res.ok) {
        const data = await res.json();
        if (data.isTableCleared) {
          toast('Bạn là người cuối cùng rời bàn. Bàn đã được đưa về trạng thái bàn trống.', { icon: null });
        } else {
          toast(`Bạn đã rời bàn thành công. Nhóm của bạn vẫn còn ${data.remainingCount} người đang ở tại bàn.`, { icon: null });
        }
      }
    } catch (err) {
      console.error('Error leaving session:', err);
    }
    localStorage.removeItem(`chika_name_${tableId}`);
    localStorage.removeItem(`chika_name_dismissed_${tableId}`);
    router.push('/');
  };

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

  useEffect(() => {
    if (!tableId) return;
    const fetchActiveOrders = async () => {
      try {
        const res = await fetch(`${API_BASE}/orders/table/${tableId}`);
        if (res.ok) {
          const data = await res.json();
          const validOrders = data.filter((o: any) => o.status !== 'cancelled');
          setActiveOrders(validOrders);
        }
      } catch (err) {
        console.error('Error fetching active orders:', err);
      }
    };
    fetchActiveOrders();
    const interval = setInterval(fetchActiveOrders, 20000);
    return () => clearInterval(interval);
  }, [tableId]);

  useEffect(() => {
    if (!isTransferModalOpen) return;
    const fetchTables = async () => {
      try {
        const res = await fetch(`${API_BASE}/tables`);
        if (res.ok) {
          const data = await res.json();
          setTablesList(data);
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

  useEffect(() => {
    setCurrentPage(1);
  }, [activeCategory, searchQuery]);

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
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Lỗi gửi yêu cầu.', { icon: null });
    } finally {
      setIsCallingStaff(false);
    }
  };

  const handleTransferTable = async () => {
    if (!selectedTransferTableId || isTransferring) return;
    setIsTransferring(true);
    try {
      // 1. Chuyển tên khách hàng lưu trong localStorage từ bàn cũ sang bàn mới
      const savedName = localStorage.getItem(`chika_name_${tableId}`);
      if (savedName) {
        localStorage.setItem(`chika_name_${selectedTransferTableId}`, savedName);
      }

      // 2. Gọi API backend chuyển đơn hàng & giỏ hàng từ bàn cũ sang bàn mới
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

      // 3. Giữ nguyên giỏ hàng đang chọn và đồng bộ qua socket sang bàn mới
      if (socketRef.current && cart.length > 0) {
        const cName = savedName || customerName || 'Khách';
        socketRef.current.emit('updateGroupCart', {
          tableId: selectedTransferTableId,
          items: cart,
          senderName: cName,
        });
      }

      setIsTransferModalOpen(false);
      router.push(`/table/${selectedTransferTableId}`);
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Lỗi khi chuyển bàn.', { icon: null });
    } finally {
      setIsTransferring(false);
    }
  };

  const handleOpenOrderHistory = () => {
    setIsOrderHistoryModalOpen(true);
  };

  const getOrderStatusInfo = (status: string) => {
    switch (status) {
      case 'pending':
        return {
          label: lang === 'en' ? 'Pending Kitchen' : lang === 'zh' ? '等待厨房接单' : 'Đang chờ bếp nhận',
          color: 'bg-amber-500/10 text-amber-500 border-amber-500/30',
          step: 1,
        };
      case 'preparing':
      case 'processing':
      case 'in_progress':
        return {
          label: lang === 'en' ? 'Preparing / Brewing' : lang === 'zh' ? '正在制作 / 烹饪' : 'Đang pha chế / Làm món',
          color: 'bg-[var(--brand-primary)]/15 text-[var(--brand-primary)] border-[var(--brand-primary)]/40',
          step: 2,
        };
      case 'ready':
      case 'served':
      case 'completed':
        return {
          label: lang === 'en' ? 'Completed / Served' : lang === 'zh' ? '已完成 / 已上菜' : 'Đã hoàn thành / Đã phục vụ',
          color: 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30',
          step: 3,
        };
      case 'paid':
        return {
          label: lang === 'en' ? 'Paid' : lang === 'zh' ? '已结账' : 'Đã thanh toán',
          color: 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30',
          step: 4,
        };
      case 'cancelled':
        return {
          label: lang === 'en' ? 'Cancelled' : lang === 'zh' ? '已取消' : 'Đã hủy',
          color: 'bg-red-500/15 text-red-500 border-red-500/30',
          step: 0,
        };
      default:
        return {
          label: lang === 'en' ? 'Processing' : lang === 'zh' ? '处理中' : 'Đang xử lý',
          color: 'bg-[var(--brand-primary)]/15 text-[var(--brand-primary)] border-[var(--brand-primary)]/40',
          step: 1,
        };
    }
  };

  const handleIncrease = useCallback((food: Food) => {
    setCart((prev) => {
      const devId = typeof window !== 'undefined' ? localStorage.getItem('kohi_device_id') || 'dev_guest' : 'dev_guest';
      const cName = typeof window !== 'undefined' ? (localStorage.getItem(`chika_name_${tableId}`) || customerName || 'Bạn').trim() : 'Bạn';
      const existing = prev.find((item) => item.food._id === food._id && item.addedByDeviceId === devId);
      let updated: CartItem[];
      if (existing) {
        updated = prev.map((item) =>
          item.food._id === food._id && item.addedByDeviceId === devId ? { ...item, quantity: item.quantity + 1 } : item,
        );
      } else {
        updated = [...prev, { food, quantity: 1, note: '', addedBy: cName, addedByDeviceId: devId }];
      }
      if (socketRef.current && tableId) {
        socketRef.current.emit('updateGroupCart', {
          tableId,
          items: updated,
          senderName: cName,
        });
      }
      return updated;
    });
  }, [tableId, customerName]);

  const handleDecrease = useCallback((foodId: string) => {
    setCart((prev) => {
      const devId = typeof window !== 'undefined' ? localStorage.getItem('kohi_device_id') || 'dev_guest' : 'dev_guest';
      const cName = typeof window !== 'undefined' ? (localStorage.getItem(`chika_name_${tableId}`) || customerName || 'Bạn').trim() : 'Bạn';
      const existing = prev.find((item) => item.food._id === foodId);
      if (!existing) return prev;
      let updated: CartItem[];
      if (existing.quantity === 1) {
        updated = prev.filter((item) => !(item.food._id === foodId && (item.addedByDeviceId ? item.addedByDeviceId === devId : true)));
      } else {
        updated = prev.map((item) =>
          item.food._id === foodId ? { ...item, quantity: item.quantity - 1 } : item,
        );
      }
      if (socketRef.current && tableId) {
        socketRef.current.emit('updateGroupCart', {
          tableId,
          items: updated,
          senderName: cName,
        });
      }
      return updated;
    });
  }, [tableId, customerName]);

  const handleRemove = useCallback((foodId: string) => {
    setCart((prev) => {
      const cName = typeof window !== 'undefined' ? (localStorage.getItem(`chika_name_${tableId}`) || customerName || 'Bạn').trim() : 'Bạn';
      const updated = prev.filter((item) => item.food._id !== foodId);
      if (socketRef.current && tableId) {
        socketRef.current.emit('updateGroupCart', {
          tableId,
          items: updated,
          senderName: cName,
        });
      }
      return updated;
    });
  }, [tableId, customerName]);

  const handleAddFromModal = () => {
    if (!selectedFood) return;
    const devId = typeof window !== 'undefined' ? localStorage.getItem('kohi_device_id') || 'dev_guest' : 'dev_guest';
    const cName = typeof window !== 'undefined' ? (localStorage.getItem(`chika_name_${tableId}`) || customerName || 'Bạn').trim() : 'Bạn';
    const addonTotal = selectedAddons.reduce((sum, a) => sum + (ADDON_PRICES[a] ?? 0), 0);
    const adjusted = Math.round(selectedFood.price * SIZE_MULTIPLIERS[selectedSize] + addonTotal);
    setCart((prev) => {
      const existing = prev.find((item) => item.food._id === selectedFood._id && item.addedByDeviceId === devId);
      let updated: CartItem[];
      if (existing) {
        updated = prev.map((item) =>
          item.food._id === selectedFood._id && item.addedByDeviceId === devId
            ? { ...item, quantity: item.quantity + modalQuantity, note: modalNote || item.note, unitPrice: adjusted }
            : item
        );
      } else {
        updated = [...prev, { food: selectedFood, quantity: modalQuantity, note: modalNote, unitPrice: adjusted, addedBy: cName, addedByDeviceId: devId }];
      }
      if (socketRef.current && tableId) {
        socketRef.current.emit('updateGroupCart', {
          tableId,
          items: updated,
          senderName: cName,
        });
      }
      return updated;
    });
    setSelectedFood(null);
    setSelectedSize('M');
    setSelectedAddons([]);
    setModalNote('');
  };

  const handleConfirmName = () => {
    const trimmed = nameInput.trim();
    const finalName = trimmed || '';
    setCustomerName(finalName);
    if (finalName) {
      localStorage.setItem(`chika_name_${tableId}`, finalName);
      localStorage.removeItem(`chika_name_dismissed_${tableId}`);
    } else {
      localStorage.setItem(`chika_name_dismissed_${tableId}`, 'true');
    }
    setIsNamePromptOpen(false);
  };

  const handleSubmitOrder = async () => {
    if (cart.length === 0 || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);
    setIsCartOpen(false);

    try {
      const resolvedNames = cart.map((i) => (i.addedBy === 'Bạn' ? (customerName || 'Khách') : (i.addedBy || 'Khách')));
      const uniqueNames = Array.from(new Set(resolvedNames.filter(Boolean)));
      const groupCustomerName = uniqueNames.length > 0 ? uniqueNames.join(', ') : (customerName || 'Nhóm khách');

      const payload = {
        tableId,
        items: cart.map((item) => {
          const itemCaller = item.addedBy === 'Bạn' ? (customerName || '') : (item.addedBy || '');
          return {
            foodId: item.food._id,
            quantity: item.quantity,
            note: itemCaller ? `[${itemCaller}] ${item.note || ''}`.trim() : item.note || undefined,
          };
        }),
        paymentMethod,
        ...(couponResult?.valid && couponInput ? { couponCode: couponInput.toUpperCase() } : {}),
        customerName: groupCustomerName,
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

      setActiveOrders((prev) => {
        if (prev.some((o) => o._id === createdOrder._id)) return prev;
        return [createdOrder, ...prev];
      });
      setTable((prev) => (prev ? { ...prev, status: 'serving' } : null));

      setCart([]);
      setCouponInput('');
      setCouponResult(null);
      setLatestCreatedOrder(createdOrder);
      setIsOrderSuccessModalOpen(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : t.submitError);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleValidateCoupon = async () => {
    const code = couponInput.toUpperCase().trim();
    if (!code || isValidatingCoupon) return;

    if (code.length < 3) {
      setCouponResult({ valid: false, discountAmount: 0, message: 'Mã giảm giá phải có ít nhất 3 ký tự.' });
      return;
    }

    setIsValidatingCoupon(true);
    try {
      const res = await fetch(
        `${API_BASE}/coupons/validate/${encodeURIComponent(code)}?amount=${totalAmount}`,
      );
      const data = await res.json();
      setCouponResult(data);
    } catch {
      setCouponResult({ valid: false, discountAmount: 0, message: 'Lỗi kết nối kiểm tra mã.' });
    } finally {
      setIsValidatingCoupon(false);
    }
  };

  const fetchFoodReviews = async (foodId: string) => {
    setIsLoadingReviews(true);
    try {
      const res = await fetch(`${API_BASE}/reviews/food/${foodId}`);
      if (res.ok) {
        const data = await res.json();
        setFoodReviews(data);
      }
    } catch { }
    finally { setIsLoadingReviews(false); }
  };

  const handleSendAiMessage = async () => {
    const q = aiInput.trim();
    if (!q || isAiThinking) return;
    setAiMessages((prev) => [...prev, { role: 'user', text: q }]);
    setAiInput('');
    setIsAiThinking(true);
    try {
      const res = await fetch(`${API_BASE}/ai-chat/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: q }),
      });
      const data = await res.json();
      setAiMessages((prev) => [...prev, { role: 'ai', text: data.answer || 'Dạ, Kohi AI đã nhận thông tin. Bạn có thể chọn món hoặc nhờ nhân viên hỗ trợ nhé! ☕' }]);
    } catch {
      let fallbackText = 'Dạ, Kohi xin chào! ';
      const lowerQ = q.toLowerCase();
      if (lowerQ.includes('ngon') || lowerQ.includes('best seller') || lowerQ.includes('bán chạy')) {
        fallbackText += 'Các món Signature bán chạy nhất tại Kohi bao gồm: Cà phê Muối Huế đặc sản, Matcha Espresso Nhật Bản và Bánh Croissant bơ Pháp giòn rụm ạ! ☕🥐';
      } else if (lowerQ.includes('giờ') || lowerQ.includes('mở cửa') || lowerQ.includes('hours')) {
        fallbackText += 'Kohi Coffee mở cửa đón khách từ 07:00 - 22:00 tất cả các ngày trong tuần ạ! ✨';
      } else if (lowerQ.includes('wifi') || lowerQ.includes('mật khẩu') || lowerQ.includes('pass')) {
        fallbackText += 'Quán có Wifi tốc độ cao hoàn toàn miễn phí. Bạn có thể nhờ nhân viên phục vụ hỗ trợ nhập mật khẩu tại bàn nhé! 📶';
      } else {
        fallbackText += 'Cảm ơn bạn đã hỏi! Bạn có thể xem thực đơn và thêm món vào giỏ hàng, hoặc nhấn "Gọi nhân viên" ở thanh bên trái để được phục vụ trực tiếp ạ! 😊';
      }
      setAiMessages((prev) => [...prev, { role: 'ai', text: fallbackText }]);
    } finally {
      setIsAiThinking(false);
    }
  };

  const handleSendModalAiMessage = async (customPrompt?: string) => {
    const q = (customPrompt || modalAiInput).trim();
    if (!q || isModalAiThinking || !selectedFood) return;

    setModalAiMessages((prev) => [...prev, { role: 'user', text: q }]);
    if (!customPrompt) setModalAiInput('');
    setIsModalAiThinking(true);

    try {
      const addonNames = selectedAddons.map((a) => a.split(' (')[0]).join(', ');
      const contextPrompt = `[Món đang xem: ${selectedFood.name}, Mô tả: ${selectedFood.description}, Giá: ${selectedFood.price}đ, Size đang chọn: ${selectedSize}, Topping: ${addonNames || 'Không chọn'}] - Câu hỏi: ${q}`;

      const res = await fetch(`${API_BASE}/ai-chat/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: contextPrompt }),
      });
      const data = await res.json();
      setModalAiMessages((prev) => [
        ...prev,
        { role: 'ai', text: data.answer || `Về món ${selectedFood.name}: ${selectedFood.description || 'Hương vị thơm ngon đặc trưng Kohi Coffee.'}` },
      ]);
    } catch {
      let answer = `Về món ${selectedFood.name}: `;
      if (q.includes('cay')) answer += 'Món này hoàn toàn không cay, mang hương vị ngọt thanh nhẹ nhàng đặc trưng.';
      else if (q.includes('đường')) answer += 'Bạn có thể chọn ít đường hoặc ghi chú "ít đường, ít đá" cho Barista ở mục ghi chú bên dưới nhé!';
      else if (q.includes('Hợp với ai')) answer += 'Món uống tuyệt vời phù hợp cho mọi lứa tuổi, đặc biệt là tín đồ yêu thích cà phê & thức uống chuẩn Kohi.';
      else answer += 'Món uống đặc sản được rất nhiều khách hàng yêu thích và lựa chọn tại Kohi Coffee & Pastry!';

      setModalAiMessages((prev) => [...prev, { role: 'ai', text: answer }]);
    } finally {
      setIsModalAiThinking(false);
    }
  };

  const categories = useMemo(() => Array.from(new Set(foods.map((f) => f.category))), [foods]);

  const filteredFoods = useMemo(() => {
    return foods.filter(
      (f) =>
        (!activeCategory || f.category === activeCategory) &&
        f.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [foods, activeCategory, searchQuery]);

  const totalQuantity = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalAmount = cart.reduce((sum, item) => sum + (item.unitPrice ?? item.food.price) * item.quantity, 0);
  const cartMap = new Map(cart.map((item) => [item.food._id, item]));

  if (!mounted) return null;

  if (error && !isLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-[#FFFFFF] dark:bg-[#090D16] p-8 text-center font-sans text-[#1C1008] dark:text-[#F5EFE6]">
        <div className="w-20 h-20 bg-[#3AA6FF]/10 dark:bg-[#5B9EFF]/15 text-[#3AA6FF] dark:text-[#5B9EFF] border border-[#3AA6FF]/40 rounded-full flex items-center justify-center text-4xl shadow-[0_0_20px_rgba(58,166,255,0.2)] animate-bounce">
          <span className="material-symbols-outlined text-4xl">warning</span>
        </div>
        <div>
          <h2 className="text-xl font-extrabold">{lang === 'vi' ? 'Có lỗi xảy ra' : 'An error occurred'}</h2>
          <p className="text-sm text-slate-500 dark:text-[#94A3B8] mt-2 max-w-sm mx-auto">{error}</p>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="rounded-xl bg-[#3AA6FF] text-white font-extrabold py-3.5 px-8 shadow-lg hover:bg-[#2B96EF] active:scale-95 transition-all text-sm uppercase tracking-wide"
        >
          {t.retry}
        </button>
      </div>
    );
  }

  return (
    <>
      {/* Realtime Kitchen Preparation Notification Toast */}
      <AnimatePresence>
        {kitchenNotification?.show && (
          <motion.div
            initial={{ y: -60, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: -60, opacity: 0, scale: 0.95 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            className="fixed top-4 left-4 right-4 sm:left-auto sm:right-6 sm:w-96 z-50 bg-[#090D16]/95 dark:bg-[#181B21]/95 text-white border border-[#3AA6FF]/50 rounded-2xl p-4 shadow-2xl backdrop-blur-md font-sans"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#3AA6FF]/20 text-[#3AA6FF] flex items-center justify-center flex-shrink-0 border border-[#3AA6FF]/40 shadow-inner">
                <span className="material-symbols-outlined text-xl animate-bounce">
                  notifications_active
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-bold text-white leading-snug">
                  {kitchenNotification.title}
                </h4>
                <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
                  {kitchenNotification.message}
                </p>
                <div className="flex items-center gap-2 mt-2.5">
                  <button
                    onClick={() => {
                      setKitchenNotification(null);
                      setIsOrderHistoryModalOpen(true);
                    }}
                    className="px-3 py-1.5 bg-[#3AA6FF] hover:bg-[#2B96EF] text-white text-[11px] font-bold rounded-lg transition-all active:scale-95 shadow-sm"
                  >
                    Xem tiến độ chi tiết
                  </button>
                </div>
              </div>
              <button
                onClick={() => setKitchenNotification(null)}
                className="text-slate-400 hover:text-white transition-colors p-1"
              >
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Top App Bar & Menu Dropdown Overlay */}
      <Header
        table={table}
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
        handleCallStaff={handleCallStaff}
        callStaffCooldown={callStaffCooldown}
        isCallingStaff={isCallingStaff}
        setIsTransferModalOpen={setIsTransferModalOpen}
        isDark={isDark}
        setTheme={setTheme}
        lang={lang}
        setLang={setLang}
        handleOpenOrderHistory={handleOpenOrderHistory}
        activeOrders={activeOrders}
        onOpenQRModal={() => setIsQRModalOpen(true)}
      />

      <div className="min-h-[100dvh] md:h-screen w-full md:w-screen overflow-y-auto md:overflow-hidden flex flex-col md:flex-row bg-[#FFFFFF] dark:bg-[#090D16] text-[var(--text-primary)] font-sans antialiased selection:bg-[#3AA6FF] selection:text-white">
        {/* Left Sidebar (Desktop/Tablet Column 1) */}
        <LeftSidebar
          isLoading={isLoading}
          table={table}
          handleCallStaff={handleCallStaff}
          callStaffCooldown={callStaffCooldown}
          isCallingStaff={isCallingStaff}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          activeCategory={activeCategory}
          setActiveCategory={setActiveCategory}
          categories={categories}
          translateCategory={translateCategory}
          isDark={isDark}
          setTheme={setTheme}
          lang={lang}
          setLang={setLang}
          setIsTransferModalOpen={setIsTransferModalOpen}
          isAiChatOpen={isAiChatOpen}
          setIsAiChatOpen={setIsAiChatOpen}
          setAiInput={setAiInput}
          handleLeaveTable={handleLeaveTable}
          onOpenQRModal={() => setIsQRModalOpen(true)}
        />

        {/* Main Catalog View (Desktop/Tablet Column 2) */}
        <main
          data-lenis-prevent
          className="flex-1 h-full overflow-y-auto scrollbar-none bg-[#FFFFFF] dark:bg-[#090D16] text-[var(--text-primary)] relative min-w-0 pt-16 sm:pt-18 md:pt-0 pb-28 md:pb-12 transition-colors"
        >
          <div
            className="absolute inset-0 pointer-events-none opacity-[0.03]"
            style={{
              backgroundImage: 'radial-gradient(var(--brand-primary) 1px, transparent 1px)',
              backgroundSize: '24px 24px',
            }}
          />

          {/* Desktop Sticky Catalog Header */}
          <CatalogHeader
            t={t}
            customerName={customerName}
            handleOpenOrderHistory={handleOpenOrderHistory}
            activeOrders={activeOrders}
            viewMode={viewMode}
            setViewMode={setViewMode}
            lang={lang}
          />

          <div className="px-4 md:px-6">
            {/* Mobile Category Horizontal Scroll Bar */}
            <div className="-mx-4 px-4 flex md:hidden gap-2 overflow-x-auto pb-3 mb-3.5 scrollbar-none border-b border-[var(--border-color)] flex-shrink-0">
              <button
                onClick={() => setActiveCategory('')}
                className={`px-4 py-2 rounded-xl text-[12px] font-bold tracking-[0.02em] whitespace-nowrap transition-all font-sans cursor-pointer ${
                  activeCategory === ''
                    ? 'bg-[var(--brand-primary)] text-[var(--brand-primary-fg)] shadow-[0_4px_12px_rgba(0,132,255,0.3)]'
                    : 'bg-[var(--bg-card)] text-[var(--text-secondary)] border border-[var(--border-color)] hover:text-[var(--text-primary)]'
                }`}
              >
                {lang === 'en' ? 'All' : lang === 'zh' ? '全部' : 'Tất cả'}
              </button>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-4 py-2 rounded-xl text-[12px] font-bold tracking-[0.02em] whitespace-nowrap transition-all font-sans cursor-pointer ${
                    activeCategory === cat
                      ? 'bg-[var(--brand-primary)] text-[var(--brand-primary-fg)] shadow-[0_4px_12px_rgba(0,132,255,0.3)]'
                      : 'bg-[var(--bg-card)] text-[var(--text-secondary)] border border-[var(--border-color)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  {translateCategory(cat)}
                </button>
              ))}
            </div>

            {/* Mobile Search Bar & View Mode Toggle Row */}
            <div className="flex items-center gap-2 mb-4 md:hidden flex-shrink-0">
              <div className="relative flex-1">
                <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] text-lg pointer-events-none">
                  search
                </span>
                <input
                  type="text"
                  placeholder={t.searchPlaceholder}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl py-2.5 pl-10 pr-3.5 text-[13.5px] font-normal text-[var(--text-primary)] focus:outline-none focus:border-[var(--brand-primary)] shadow-2xs font-sans placeholder-[var(--text-tertiary)] transition-colors"
                />
              </div>

              {/* Mobile View Mode Toggle (Grid/List) */}
              <div className="bg-[var(--bg-card)] text-[var(--text-primary)] rounded-xl p-1 border border-[var(--border-color)] shadow-2xs flex items-center shrink-0">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded-lg transition-colors flex items-center justify-center cursor-pointer ${
                    viewMode === 'grid'
                      ? 'bg-[var(--brand-primary)] text-[var(--brand-primary-fg)] shadow-2xs font-bold'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                  title="Dạng lưới"
                >
                  <span className="material-symbols-outlined text-lg">grid_view</span>
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-1.5 rounded-lg transition-colors flex items-center justify-center cursor-pointer ${
                    viewMode === 'list'
                      ? 'bg-[var(--brand-primary)] text-[var(--brand-primary-fg)] shadow-2xs font-bold'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                  title="Dạng danh sách"
                >
                  <span className="material-symbols-outlined text-lg">view_list</span>
                </button>
              </div>
            </div>

            {/* Food Grid / List */}
            {isLoading ? (
              <div
                className={
                  viewMode === 'grid'
                    ? 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4 xl:gap-5 items-stretch'
                    : 'flex flex-col gap-3'
                }
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((i) => (
                  <div
                    key={i}
                    className="bg-[var(--bg-card)] rounded-[var(--radius-lg)] h-64 animate-pulse border border-[var(--border-color)]"
                  />
                ))}
              </div>
            ) : filteredFoods.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 py-16 text-center flex-1">
                <span className="material-symbols-outlined text-5xl text-[var(--text-secondary)]">
                  local_cafe
                </span>
                <p className="text-sm font-semibold text-[var(--text-secondary)]">
                  {t.emptyCart}
                </p>
              </div>
            ) : (
              <div
                className={
                  viewMode === 'grid'
                    ? 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4 xl:gap-5 items-stretch pb-12'
                    : 'flex flex-col gap-3 pb-12'
                }
              >
                {filteredFoods.map((food) => {
                  const cartItem = cartMap.get(food._id);
                  const quantity = cartItem?.quantity ?? 0;

                  return (
                    <FoodCard
                      key={food._id}
                      food={food}
                      viewMode={viewMode}
                      quantity={quantity}
                      cartItemNote={cartItem?.note}
                      formatPrice={formatPrice}
                      translateCategory={translateCategory}
                      lang={lang}
                      onSelectFood={(f, q, note) => {
                        setSelectedFood(f);
                        setModalQuantity(q);
                        setModalNote(note);
                      }}
                    />
                  );
                })}
              </div>
            )}
          </div>
        </main>

        {/* Right Cart Sidebar (Desktop) & Mobile Cart Bottom Sheet */}
        <CartSidebar
          table={table}
          totalQuantity={totalQuantity}
          totalAmount={totalAmount}
          cart={cart}
          foods={foods}
          cartMap={cartMap}
          lang={lang}
          formatPrice={formatPrice}
          handleIncrease={handleIncrease}
          handleDecrease={handleDecrease}
          handleRemove={handleRemove}
          couponInput={couponInput}
          setCouponInput={setCouponInput}
          couponResult={couponResult}
          setCouponResult={setCouponResult}
          handleValidateCoupon={handleValidateCoupon}
          isValidatingCoupon={isValidatingCoupon}
          paymentMethod={paymentMethod}
          setPaymentMethod={setPaymentMethod}
          handleSubmitOrder={handleSubmitOrder}
          isSubmitting={isSubmitting}
          t={t}
          isCartOpen={isCartOpen}
          setIsCartOpen={setIsCartOpen}
          currentDeviceId={typeof window !== 'undefined' ? localStorage.getItem('kohi_device_id') || 'dev_guest' : 'dev_guest'}
          customerName={customerName}
        />

        {/* Sticky Mobile/Tablet Cart Bar */}
        <AnimatePresence>
          {totalQuantity > 0 && (
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              className="fixed bottom-4 left-4 right-4 z-40 lg:hidden max-w-md mx-auto"
            >
              <button
                onClick={() => setIsCartOpen(true)}
                className="w-full bg-[var(--brand-primary)] text-[var(--brand-primary-fg)] p-3.5 rounded-2xl font-bold flex items-center justify-between shadow-2xl shadow-[var(--brand-primary)]/30 active:scale-95 transition-all font-sans cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <span className="bg-white text-[var(--brand-primary)] w-6 h-6 rounded-full text-xs font-black flex items-center justify-center shadow-xs">
                    {totalQuantity}
                  </span>
                  <span className="text-xs uppercase tracking-wide font-extrabold font-sans">
                    {lang === 'en' ? 'View Cart' : lang === 'zh' ? '查看购物车' : 'Xem Giỏ Hàng'}
                  </span>
                </div>
                <span className="text-sm font-black font-sans">{formatPrice(totalAmount, lang)}</span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Modals */}
        <FoodDetailModal
          selectedFood={selectedFood}
          setSelectedFood={setSelectedFood}
          isLightboxOpen={isLightboxOpen}
          setIsLightboxOpen={setIsLightboxOpen}
          selectedSize={selectedSize}
          setSelectedSize={setSelectedSize}
          selectedAddons={selectedAddons}
          setSelectedAddons={setSelectedAddons}
          modalQuantity={modalQuantity}
          setModalQuantity={setModalQuantity}
          modalNote={modalNote}
          setModalNote={setModalNote}
          handleAddFromModal={handleAddFromModal}
          foodReviews={foodReviews}
          isLoadingReviews={isLoadingReviews}
          fetchFoodReviews={fetchFoodReviews}
          isModalAiOpen={isModalAiOpen}
          setIsModalAiOpen={setIsModalAiOpen}
          modalAiMessages={modalAiMessages}
          modalAiInput={modalAiInput}
          setModalAiInput={setModalAiInput}
          isModalAiThinking={isModalAiThinking}
          handleSendModalAiMessage={handleSendModalAiMessage}
          SIZE_MULTIPLIERS={SIZE_MULTIPLIERS}
          ADDON_PRICES={ADDON_PRICES}
          ADDON_ICONS={ADDON_ICONS}
          formatPrice={formatPrice}
          lang={lang}
        />

        <OrderHistoryModal
          isOrderHistoryModalOpen={isOrderHistoryModalOpen}
          setIsOrderHistoryModalOpen={setIsOrderHistoryModalOpen}
          table={table}
          activeOrders={activeOrders}
          getOrderStatusInfo={getOrderStatusInfo}
          formatPrice={formatPrice}
          lang={lang}
          tableId={tableId}
          router={router}
        />

        <TransferTableModal
          isTransferModalOpen={isTransferModalOpen}
          setIsTransferModalOpen={setIsTransferModalOpen}
          tablesList={tablesList}
          tableId={tableId}
          selectedTransferTableId={selectedTransferTableId}
          setSelectedTransferTableId={setSelectedTransferTableId}
          handleTransferTable={handleTransferTable}
          isTransferring={isTransferring}
          lang={lang}
        />

        <OrderSuccessModal
          isOrderSuccessModalOpen={isOrderSuccessModalOpen}
          setIsOrderSuccessModalOpen={setIsOrderSuccessModalOpen}
          latestCreatedOrder={latestCreatedOrder}
          tableId={tableId}
          router={router}
          lang={lang}
        />

        <AiChatWidget
          totalQuantity={totalQuantity}
          isAiChatOpen={isAiChatOpen}
          setIsAiChatOpen={setIsAiChatOpen}
          aiMessages={aiMessages}
          isAiThinking={isAiThinking}
          aiInput={aiInput}
          setAiInput={setAiInput}
          handleSendAiMessage={handleSendAiMessage}
          lang={lang}
        />
      </div>

      <NamePromptModal
        mounted={mounted}
        isNamePromptOpen={isNamePromptOpen}
        nameInputRef={nameInputRef}
        nameInput={nameInput}
        setNameInput={setNameInput}
        handleConfirmName={handleConfirmName}
        table={table}
        lang={lang}
      />

      <TableQRModal
        isOpen={isQRModalOpen}
        onClose={() => setIsQRModalOpen(false)}
        table={table}
        lang={lang}
      />
    </>
  );
}
