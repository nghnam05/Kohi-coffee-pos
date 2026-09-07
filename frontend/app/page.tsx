'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { motion, AnimatePresence } from 'framer-motion';
import { Html5Qrcode } from 'html5-qrcode';
import { playScanBeep, playWelcomeChime } from './utils/sound';
import { ThemeToggleSwitch } from '@/components/table/ThemeToggleSwitch';
import { LanguageToggleSwitch, Lang } from '@/components/table/LanguageToggleSwitch';
import { BrandLogo } from '@/components/table/BrandLogo';
import { formatTableName, formatTableLocation, formatTableFloor } from '@/utils/format';
import { toast } from 'react-hot-toast';
import { useTranslation } from '@/context/LanguageContext';
import { io } from 'socket.io-client';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

const translations = {
  vi: {
    welcome: 'Kohi Coffee & Pastry',
    heroBadge: 'Smart Online Reservation & QR Order',
    heroTitle: 'Đặt Bàn & Giữ Chỗ Trực Tuyến',
    heroSubtitle: 'Thưởng thức cà phê rang xay thủ công & bánh ngọt tươi mới. Giữ chỗ trước để chọn vị trí đẹp nhất!',
    btnBookTab: 'Đặt Bàn Trực Tuyến',
    btnLookupTab: 'Tra Cứu Đặt Bàn',
    btnLogin: 'Đăng nhập Nhân viên',
    selectTableLabel: '1. Chọn bàn phù hợp',
    selectTableSub: 'Bấm vào bàn bạn muốn đặt để giữ chỗ',
    refreshMap: 'Cập nhật sơ đồ',
    filterAll: 'Tất cả bàn',
    filterAvailable: 'Chỉ bàn trống',
    tableStatusEmpty: 'Bàn trống',
    tableStatusServing: 'Đang có khách',
    tableStatusReserved: 'Đã giữ chỗ',
    bookingFormTitle: '2. Nhập thông tin đặt bàn',
    bookingFormSub: 'Vui lòng điền đầy đủ thông tin để cửa hàng nhận đơn',
    customerNameLabel: 'HỌ VÀ TÊN KHÁCH HÀNG',
    customerNamePlaceholder: 'Ví dụ: Nguyễn Văn An',
    customerPhoneLabel: 'SỐ ĐIỆN THOẠI LIÊN HỆ',
    customerPhonePlaceholder: 'Ví dụ: 0901234567',
    reservationTimeLabel: 'THỜI GIAN NHẬN BÀN',
    quickTimePresets: 'Chọn nhanh thời gian:',
    presetIn1h: '+1 Giờ nữa',
    presetIn2h: '+2 Giờ nữa',
    presetTonight: 'Tối nay 19:00',
    presetTomorrowNoon: 'Trưa mai 12:00',
    guestCountLabel: 'SỐ LƯỢNG KHÁCH HÀNG',
    selectedTableLabel: 'BÀN ĐƯỢC CHỌN',
    noTableSelected: 'Vui lòng chọn 1 bàn ở sơ đồ bên trái',
    noteLabel: 'GHI CHÚ THÊM (TÙY CHỌN)',
    notePlaceholder: 'Ví dụ: Cần bàn gần cửa sổ, ghế trẻ em, không gian yên tĩnh...',
    btnSubmitBooking: 'XÁC NHẬN ĐẶT BÀN NGAY',
    btnSubmitting: 'Đang gửi thông tin...',
    bookingSuccessTitle: 'Đặt Bàn Thành Công!',
    bookingSuccessSubtitle: 'Đơn giữ chỗ của bạn đã được chuyển trực tiếp đến hệ thống Kohi Coffee.',
    lookupTitle: 'Tra Cứu & Quản Lý Đơn Đặt Bàn',
    lookupSubtitle: 'Nhập số điện thoại của bạn để kiểm tra chi tiết đơn giữ chỗ và hủy nếu cần',
    lookupPhonePlaceholder: 'Nhập số điện thoại (Ví dụ: 0987654321)...',
    btnSearchNow: 'Tra cứu ngay',
    btnSearching: 'Đang tìm...',
    doneAndClose: 'HOÀN TẤT & ĐÓNG',
    errEmptyPhone: 'Vui lòng nhập số điện thoại để tra cứu!',
    errInvalidPhone: 'Số điện thoại không hợp lệ (Phải đúng 10 chữ số).',
  },
  en: {
    welcome: 'Kohi Coffee & Pastry',
    heroBadge: 'Smart Online Reservation & QR Order',
    heroTitle: 'Online Table Reservation',
    heroSubtitle: 'Enjoy handcrafted specialty coffee & fresh pastries. Book in advance to secure your favorite table!',
    btnBookTab: 'Reserve a Table',
    btnLookupTab: 'Lookup Reservation',
    btnLogin: 'Staff Login',
    selectTableLabel: '1. Select Your Table',
    selectTableSub: 'Click on an available table below to select it',
    refreshMap: 'Refresh Map',
    filterAll: 'All Tables',
    filterAvailable: 'Available Only',
    tableStatusEmpty: 'Available',
    tableStatusServing: 'Occupied',
    tableStatusReserved: 'Reserved',
    bookingFormTitle: '2. Reservation Details',
    bookingFormSub: 'Please fill in your contact information to complete booking',
    customerNameLabel: 'FULL NAME',
    customerNamePlaceholder: 'E.g. John Smith',
    customerPhoneLabel: 'PHONE NUMBER',
    customerPhonePlaceholder: 'E.g. 0901234567',
    reservationTimeLabel: 'RESERVATION DATE & TIME',
    quickTimePresets: 'Quick Time Options:',
    presetIn1h: 'In 1 Hour',
    presetIn2h: 'In 2 Hours',
    presetTonight: 'Tonight 19:00',
    presetTomorrowNoon: 'Tomorrow 12:00',
    guestCountLabel: 'NUMBER OF GUESTS',
    selectedTableLabel: 'SELECTED TABLE',
    noTableSelected: 'Please select a table from the left floor map',
    noteLabel: 'SPECIAL REQUESTS / NOTES',
    notePlaceholder: 'E.g. Window seat, baby high chair, quiet area...',
    btnSubmitBooking: 'CONFIRM RESERVATION NOW',
    btnSubmitting: 'Submitting booking...',
    bookingSuccessTitle: 'Booking Successful!',
    bookingSuccessSubtitle: 'Your reservation has been recorded and submitted to Kohi Coffee.',
    lookupTitle: 'Lookup & Manage Reservations',
    lookupSubtitle: 'Enter your registered phone number to view or manage your reservation',
    lookupPhonePlaceholder: 'Enter phone number (e.g. 0987654321)...',
    btnSearchNow: 'Search Now',
    btnSearching: 'Searching...',
    doneAndClose: 'DONE & CLOSE',
    errEmptyPhone: 'Please enter your phone number to lookup!',
    errInvalidPhone: 'Invalid phone number format.',
  },
  zh: {
    welcome: 'Kohi Coffee & Pastry',
    heroBadge: 'Smart Online Reservation & QR Order',
    heroTitle: '在线预订桌位与留座',
    heroSubtitle: '享用手工精制咖啡与新鲜糕点。提前预订以获得最佳座位！',
    btnBookTab: '在线预订桌位',
    btnLookupTab: '查询预订',
    btnLogin: '员工登录',
    selectTableLabel: '1. 选择合适桌位',
    selectTableSub: '点击下方空桌进行留座预订',
    refreshMap: '刷新桌位图',
    filterAll: '全部桌位',
    filterAvailable: '仅看空桌',
    tableStatusEmpty: '空桌',
    tableStatusServing: '使用中',
    tableStatusReserved: '已预订',
    bookingFormTitle: '2. 填写预订信息',
    bookingFormSub: '请填写您的联系信息以便门店确认预订',
    customerNameLabel: '顾客姓名',
    customerNamePlaceholder: '例如：张三',
    customerPhoneLabel: '联系电话',
    customerPhonePlaceholder: '例如：0901234567',
    reservationTimeLabel: '入座时间',
    quickTimePresets: '快速选择时间：',
    presetIn1h: '1小时后',
    presetIn2h: '2小时后',
    presetTonight: '今晚 19:00',
    presetTomorrowNoon: '明天中午 12:00',
    guestCountLabel: '顾客人数',
    selectedTableLabel: '已选桌位',
    noTableSelected: '请在左侧地图中点击选择桌位',
    noteLabel: '特殊要求 / 备注',
    notePlaceholder: '例如：靠窗座位、婴儿椅、安静区域...',
    btnSubmitBooking: '立即确认预订',
    btnSubmitting: '正在提交预订...',
    bookingSuccessTitle: '预订成功！',
    bookingSuccessSubtitle: '您的预订信息已成功提交至 Kohi Coffee。',
    lookupTitle: '查询与管理预订',
    lookupSubtitle: '输入您的电话号码以查看预订详情或进行取消',
    lookupPhonePlaceholder: '输入电话号码（例如：0987654321）...',
    btnSearchNow: '立即查询',
    btnSearching: '正在查询...',
    doneAndClose: '完成并关闭',
    errEmptyPhone: '请输入手机号以进行查询！',
    errInvalidPhone: '手机号码格式不正确。',
  }
};

export default function Home() {
  const router = useRouter();
  const { setTheme, resolvedTheme } = useTheme();
  const { lang, setLang } = useTranslation();
  const t = translations[(lang as Lang) || 'vi'] || translations.vi;
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<'reserve' | 'lookup'>('reserve');
  const [tableFilter, setTableFilter] = useState<'all' | 'available'>('all');

  // Tables list state
  const [tables, setTables] = useState<any[]>([]);
  const [selectedTable, setSelectedTable] = useState<any | null>(null);

  // Reservation form state
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [guestCount, setGuestCount] = useState(2);
  const [reservationTime, setReservationTime] = useState('');
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState<any | null>(null);

  // Lookup / Cancel states
  const [lookupPhone, setLookupPhone] = useState('');
  const [lookupResults, setLookupResults] = useState<any[]>([]);
  const [isSearchingLookup, setIsSearchingLookup] = useState(false);
  const [hasSearchedLookup, setHasSearchedLookup] = useState(false);
  const [error, setError] = useState('');

  // Check-in PIN Modal states
  const [pinModalRes, setPinModalRes] = useState<any | null>(null);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const [isVerifyingPin, setIsVerifyingPin] = useState(false);

  // Table Occupied / Suggestion Modal states
  const [occupiedData, setOccupiedData] = useState<{
    resId: string;
    currentTable: any;
    suggestedTables: any[];
    checkInCode: string;
  } | null>(null);
  const [isSwitchingTable, setIsSwitchingTable] = useState(false);

  // One-time code popup state (Chỉ hiển thị 1 lần duy nhất khi phục vụ duyệt!)
  const [oneTimeCodeData, setOneTimeCodeData] = useState<{
    id: string;
    tableName: string;
    code: string;
  } | null>(null);

  const handleAcknowledgeOneTimeCode = async () => {
    if (!oneTimeCodeData) return;
    const targetId = oneTimeCodeData.id;
    try {
      await fetch(`${API_BASE}/reservations/${targetId}/mark-code-viewed`, {
        method: 'PATCH',
      });
    } catch (e) {}
    setLookupResults((prev) =>
      prev.map((r) => (r._id === targetId ? { ...r, checkInCode: null, isCodeViewed: true } : r)),
    );
    setBookingSuccess((prev: any) => {
      if (prev && prev._id === targetId) {
        return { ...prev, checkInCode: null, isCodeViewed: true };
      }
      return prev;
    });
    setOneTimeCodeData(null);
  };

  const isDark = resolvedTheme === 'dark';

  useEffect(() => {
    setMounted(true);
    fetchTables();

    // Default datetime input to 2 hours from now
    setPresetTime(2);

    const socketBase = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';
    const socket = io(socketBase);

    socket.on('reservationStatusUpdated', ({ id, status, checkInCode }: any) => {
      if (status === 'confirmed' && checkInCode) {
        try { playWelcomeChime(); } catch (e) {}
        setOneTimeCodeData({
          id,
          tableName: '',
          code: checkInCode,
        });
      }

      setBookingSuccess((prev: any) => {
        if (prev && prev._id === id) {
          return { ...prev, status, ...(checkInCode ? { checkInCode } : {}) };
        }
        return prev;
      });

      setLookupResults((prev) =>
        prev.map((r) => (r._id === id ? { ...r, status, ...(checkInCode ? { checkInCode } : {}) } : r)),
      );

      fetchTables();
    });

    socket.on('tableUpdated', () => {
      fetchTables();
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const setPresetTime = (hoursFromNow: number) => {
    const now = new Date();
    now.setHours(now.getHours() + hoursFromNow);
    const pad = (n: number) => (n < 10 ? '0' + n : n);
    setReservationTime(`${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`);
  };

  const setSpecificTimePreset = (targetHour: number, isTomorrow: boolean = false) => {
    const d = new Date();
    if (isTomorrow) d.setDate(d.getDate() + 1);
    d.setHours(targetHour, 0, 0, 0);
    const pad = (n: number) => (n < 10 ? '0' + n : n);
    setReservationTime(`${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:00`);
  };

  const fetchTables = async () => {
    try {
      const res = await fetch(`${API_BASE}/tables`);
      if (res.ok) {
        const data = await res.json();
        setTables(data);
        if (data.length > 0) {
          const firstEmpty = data.find((tbl: any) => tbl.status === 'empty') || null;
          if (!selectedTable) setSelectedTable(firstEmpty);
        }
      }
    } catch (err) {
      console.error('Lỗi tải danh sách bàn:', err);
    }
  };

  // Lookup reservations by phone number
  const handleLookupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const phone = lookupPhone.trim();
    const phoneRegex = /^(0|\+84)?[35789][0-9]{8}$/;
    if (!phone) {
      setError(t.errEmptyPhone);
      return;
    }
    if (!phoneRegex.test(phone)) {
      setError(t.errInvalidPhone);
      return;
    }
    setIsSearchingLookup(true);
    setError('');

    try {
      const res = await fetch(`${API_BASE}/reservations/lookup?phone=${encodeURIComponent(phone)}`);
      if (res.ok) {
        const data = await res.json();
        setLookupResults(data);
        setHasSearchedLookup(true);

        // Nếu có đơn đã duyệt có mã PIN chưa xem -> hiển thị modal 1 lần duy nhất
        const unviewed = (data || []).find(
          (r: any) => r.status === 'confirmed' && r.checkInCode && !r.isCodeViewed,
        );
        if (unviewed) {
          try { playWelcomeChime(); } catch (e) {}
          setOneTimeCodeData({
            id: unviewed._id,
            tableName: unviewed.tableId?.tableName || '',
            code: unviewed.checkInCode,
          });
        }
      } else {
        throw new Error('Không thể tra cứu đơn đặt bàn.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi khi tra cứu.');
    } finally {
      setIsSearchingLookup(false);
    }
  };

  // Customer arrive & go to menu (with 4-digit PIN verification & early table occupied check)
  const handleCustomerArrive = async (
    resId: string,
    targetTableId: string,
    checkInCode?: string,
    preferredNewTableId?: string,
  ) => {
    try {
      setIsVerifyingPin(true);
      setPinError('');
      const res = await fetch(`${API_BASE}/reservations/${resId}/customer-arrive`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          checkInCode: (checkInCode || '').trim(),
          newTableId: preferredNewTableId || '',
        }),
      });

      const resData = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(resData.message || 'Không thể cập nhật trạng thái đã đến.');
      }

      // Nếu bàn đang có khách ngồi trước giờ hẹn -> hiển thị modal gợi ý bàn trống
      if (resData.statusCode === 'TABLE_OCCUPIED') {
        setPinModalRes(null);
        setOccupiedData({
          resId,
          currentTable: resData.currentTable,
          suggestedTables: resData.suggestedTables || [],
          checkInCode: (checkInCode || '').trim(),
        });
        return;
      }

      setPinModalRes(null);
      setOccupiedData(null);
      try { playWelcomeChime(); } catch (e) {}
      toast.success(
        lang === 'en'
          ? 'Welcome! Redirecting to menu...'
          : 'Chào mừng quý khách! Đang chuyển tới Menu gọi món...',
      );
      setTimeout(() => {
        router.push(`/table/${resData.tableId || targetTableId}`);
      }, 1000);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Có lỗi xảy ra.';
      setPinError(msg);
      toast.error(msg);
    } finally {
      setIsVerifyingPin(false);
    }
  };

  // Customer cancel reservation
  const handleCustomerCancelReservation = async (id: string) => {
    if (!confirm(lang === 'en' ? 'Are you sure you want to cancel this reservation?' : lang === 'zh' ? '您确定要取消此预订吗？' : 'Bạn có chắc chắn muốn hủy đơn đặt bàn này không?')) return;
    try {
      const res = await fetch(`${API_BASE}/reservations/${id}/customer-cancel`, {
        method: 'PATCH',
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || 'Không thể hủy đơn đặt bàn.');
      }
      playWelcomeChime();
      toast(lang === 'en' ? 'Reservation cancelled successfully!' : 'Đã hủy đơn đặt bàn thành công!', { icon: null });
      handleLookupSubmit({ preventDefault: () => {} } as any);
      fetchTables();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Lỗi khi hủy đơn đặt bàn.', { icon: null });
    }
  };

  // Submit Table Reservation
  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!selectedTable) {
      setError(t.noTableSelected);
      return;
    }
    if (selectedTable.status === 'reserved' || selectedTable.status === 'serving') {
      setError(
        lang === 'en'
          ? `Table ${selectedTable.tableName} is currently occupied or reserved. Please choose another table.`
          : `Bàn ${selectedTable.tableName} đã có khách hoặc được giữ chỗ trước. Vui lòng chọn bàn khác.`
      );
      return;
    }

    const cleanName = customerName.trim();
    const cleanPhone = customerPhone.trim();
    const phoneRegex = /^(0|\+84)?[35789][0-9]{8}$/;

    if (!cleanName || cleanName.length < 2) {
      setError(lang === 'en' ? 'Please enter full name (at least 2 characters).' : 'Vui lòng nhập họ và tên khách hàng (tối thiểu 2 ký tự).');
      return;
    }

    if (!cleanPhone || !phoneRegex.test(cleanPhone)) {
      setError(lang === 'en' ? 'Invalid phone number format (10 digits required).' : 'Số điện thoại không hợp lệ. Vui lòng nhập SĐT Việt Nam 10 chữ số (Ví dụ: 0987654321).');
      return;
    }

    const numGuests = Number(guestCount);
    if (isNaN(numGuests) || numGuests < 1 || numGuests > 50) {
      setError(lang === 'en' ? 'Guest count must be between 1 and 50.' : 'Số lượng khách phải là số hợp lệ từ 1 đến 50 người.');
      return;
    }

    if (!reservationTime) {
      setError(lang === 'en' ? 'Please select reservation date and time.' : 'Vui lòng chọn thời gian đặt bàn.');
      return;
    }

    const selectedDate = new Date(reservationTime);
    if (isNaN(selectedDate.getTime()) || selectedDate.getTime() < Date.now() - 5 * 60 * 1000) {
      setError(lang === 'en' ? 'Reservation time cannot be in the past.' : 'Thời gian đặt bàn không hợp lệ hoặc đã trôi qua trong quá khứ.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const payload = {
        tableId: selectedTable._id,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        guestCount: Number(guestCount),
        reservationTime: new Date(reservationTime).toISOString(),
        note: note.trim(),
      };

      const res = await fetch(`${API_BASE}/reservations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        const msg = Array.isArray(errData.message) ? errData.message.join(', ') : errData.message;
        throw new Error(msg || 'Không thể gửi đơn đặt bàn.');
      }

      const result = await res.json();
      playWelcomeChime();
      setBookingSuccess(result);

      // Reset form
      setCustomerName('');
      setCustomerPhone('');
      setGuestCount(2);
      setNote('');
      setSelectedTable(null);
      setPresetTime(2);

      fetchTables();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Có lỗi xảy ra khi đặt bàn.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!mounted) return null;

  const filteredTables = tables.filter((tbl) => {
    if (tableFilter === 'available') {
      return tbl.status === 'empty';
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0B0F17] text-slate-900 dark:text-slate-100 transition-colors duration-300 font-sans flex flex-col justify-between relative antialiased">
      {/* Top Header Bar */}
      <header className="bg-white/90 dark:bg-[#0B0F17]/80 border-b border-slate-200 dark:border-white/10 sticky top-0 left-0 w-full z-50 shadow-xs backdrop-blur-xl">
        <div className="flex justify-between items-center w-full px-3 sm:px-6 md:px-12 py-2.5 sm:py-3.5 max-w-7xl mx-auto gap-2">
          <BrandLogo onClick={() => router.push('/')} />

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <LanguageToggleSwitch
              lang={lang as Lang}
              setLang={(l) => {
                setLang(l as any);
                localStorage.setItem('pho-beyond-lang', l);
              }}
            />
            <ThemeToggleSwitch isDark={isDark} setTheme={setTheme} />
            <button
              onClick={() => router.push('/login')}
              className="bg-[#3B82F6] hover:bg-blue-600 text-white transition-colors duration-200 px-3 sm:px-4 h-[30px] sm:h-[36px] rounded-xl text-[11px] sm:text-xs font-bold shadow-xs whitespace-nowrap cursor-pointer active:scale-95 flex items-center shrink-0"
            >
              <span className="sm:hidden">Đăng nhập</span>
              <span className="hidden sm:inline">{t.btnLogin}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-grow pt-8 sm:pt-12 pb-16 px-4 md:px-12 w-full max-w-7xl mx-auto">
        {/* Hero Section */}
        <section className="text-center mb-8 sm:mb-12">
          <div className="inline-flex items-center justify-center px-4 py-1.5 rounded-full bg-blue-500/10 text-[#3B82F6] dark:text-[#38BDF8] text-[11px] sm:text-xs font-bold uppercase tracking-wider mb-4 sm:mb-6 border border-blue-500/20">
            {t.heroBadge}
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 dark:text-white mb-3 sm:mb-4 tracking-tight">
            {t.heroTitle}
          </h2>
          <p className="text-xs sm:text-sm lg:text-base text-slate-500 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
            {t.heroSubtitle}
          </p>
        </section>

        {/* Tab Navigation: Đặt Bàn vs Tra Cứu */}
        <nav className="flex justify-center border-b border-slate-200 dark:border-white/10 mb-8 sm:mb-12">
          <button
            onClick={() => {
              setActiveTab('reserve');
              setError('');
            }}
            className={`px-6 sm:px-8 py-3.5 sm:py-4 text-xs sm:text-sm font-bold transition-all border-b-2 cursor-pointer ${
              activeTab === 'reserve'
                ? 'text-[#3B82F6] dark:text-[#38BDF8] border-[#3B82F6] dark:border-[#38BDF8] translate-y-[1px]'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 border-transparent'
            }`}
          >
            <span>{t.btnBookTab}</span>
          </button>
          <button
            onClick={() => {
              setActiveTab('lookup');
              setError('');
            }}
            className={`px-6 sm:px-8 py-3.5 sm:py-4 text-xs sm:text-sm font-bold transition-all border-b-2 cursor-pointer ${
              activeTab === 'lookup'
                ? 'text-[#3B82F6] dark:text-[#38BDF8] border-[#3B82F6] dark:border-[#38BDF8] translate-y-[1px]'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 border-transparent'
            }`}
          >
            <span>{t.btnLookupTab}</span>
          </button>
        </nav>

        {/* TAB 1: TABLE RESERVATION MAIN GRID */}
        {activeTab === 'reserve' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
            {/* LEFT COLUMN: Sơ Đồ Chọn Bàn (7 Cols) */}
            <div className="lg:col-span-7 bg-white dark:bg-[#0F172A]/70 rounded-2xl p-5 sm:p-6 lg:p-7 shadow-xs border border-slate-200/90 dark:border-white/10 backdrop-blur-xl">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6 pb-6 border-b border-slate-200 dark:border-white/10">
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mb-1">
                    {t.selectTableLabel}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
                    {t.selectTableSub}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-900 border border-transparent dark:border-white/10 rounded-xl text-[11px] font-bold">
                    <button
                      onClick={() => setTableFilter('all')}
                      className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                        tableFilter === 'all'
                          ? 'bg-white dark:bg-[#1E293B] text-[#3B82F6] dark:text-[#38BDF8] shadow-xs'
                          : 'text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      {t.filterAll}
                    </button>
                    <button
                      onClick={() => setTableFilter('available')}
                      className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                        tableFilter === 'available'
                          ? 'bg-white dark:bg-[#1E293B] text-[#3B82F6] dark:text-[#38BDF8] shadow-xs'
                          : 'text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      {t.filterAvailable}
                    </button>
                  </div>
                  <button
                    onClick={fetchTables}
                    className="px-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer min-h-[36px]"
                  >
                    {t.refreshMap}
                  </button>
                </div>
              </div>

              {/* Status Legend Row */}
              <div className="flex flex-wrap items-center gap-4 sm:gap-6 mb-6 sm:mb-8 text-xs font-semibold text-slate-600 dark:text-slate-400">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span>{t.tableStatusEmpty}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  <span>{t.tableStatusReserved}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
                  <span>{t.tableStatusServing}</span>
                </div>
              </div>

              {/* Table Map Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5 sm:gap-4">
                {filteredTables.length === 0 ? (
                  <div className="col-span-full text-center py-12 text-xs text-slate-400 dark:text-slate-500 font-medium">
                    {tables.length === 0
                      ? (lang === 'en' ? 'Loading table map...' : 'Đang tải danh sách bàn...')
                      : (lang === 'en' ? 'No available tables found.' : 'Không có bàn trống nào.')}
                  </div>
                ) : (
                  filteredTables.map((tbl) => {
                    const isSelected = selectedTable?._id === tbl._id;
                    const isBookable = tbl.status !== 'reserved' && tbl.status !== 'serving';
                    let statusDot = 'bg-emerald-500';
                    let statusText = t.tableStatusEmpty;
                    let statusColorClass = 'text-emerald-600 dark:text-emerald-400';

                    if (tbl.status === 'serving') {
                      statusDot = 'bg-slate-400';
                      statusText = t.tableStatusServing;
                      statusColorClass = 'text-slate-400';
                    } else if (tbl.status === 'reserved') {
                      statusDot = 'bg-amber-500';
                      statusText = t.tableStatusReserved;
                      statusColorClass = 'text-amber-600 dark:text-amber-400';
                    }

                    const formattedName = formatTableName(tbl.tableName, lang);
                    const formattedFloor = formatTableFloor(lang);

                    if (isSelected && isBookable) {
                      return (
                        <div
                          key={tbl._id}
                          onClick={() => {
                            setSelectedTable(tbl);
                            setError('');
                          }}
                          className="relative bg-white dark:bg-slate-900 border-2 border-[#3B82F6] dark:border-[#38BDF8] rounded-2xl p-4 sm:p-5 cursor-pointer shadow-md shadow-blue-500/10 transition-all group overflow-hidden"
                        >
                          <div className="absolute inset-0 bg-[#3B82F6]/10 pointer-events-none" />
                          <div className="flex justify-between items-center mb-3 sm:mb-4 relative z-10">
                            <span className={`w-2 h-2 rounded-full ${statusDot}`} />
                            <span className="text-[11px] sm:text-xs font-bold text-emerald-600 dark:text-emerald-400">
                              {statusText}
                            </span>
                          </div>
                          <div className="text-center mb-1 relative z-10">
                            <span className="text-lg sm:text-xl font-extrabold text-[#3B82F6] dark:text-[#38BDF8]">
                              {formattedName}
                            </span>
                          </div>
                          <div className="text-center text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium relative z-10 truncate">
                            {formattedFloor}
                          </div>
                        </div>
                      );
                    }

                    return (
                      <button
                        key={tbl._id}
                        type="button"
                        disabled={!isBookable}
                        onClick={() => {
                          if (isBookable) {
                            setSelectedTable(tbl);
                            setError('');
                          }
                        }}
                        className={`relative rounded-2xl p-4 sm:p-5 text-left transition-all group overflow-hidden border ${
                          isBookable
                            ? 'bg-slate-50/80 dark:bg-slate-900/60 border-slate-200 dark:border-white/10 cursor-pointer hover:border-slate-300 dark:hover:border-white/20 hover:shadow-sm'
                            : 'bg-slate-100/50 dark:bg-slate-900/30 border-slate-200/50 dark:border-white/5 opacity-60 cursor-not-allowed'
                        }`}
                      >
                        <div className="flex justify-between items-center mb-3 sm:mb-4">
                          <span className={`w-2 h-2 rounded-full ${statusDot}`} />
                          <span className={`text-[11px] sm:text-xs font-medium ${isBookable ? 'text-slate-500 dark:text-slate-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors' : statusColorClass}`}>
                            {statusText}
                          </span>
                        </div>
                        <div className="text-center mb-1">
                          <span className={`text-lg sm:text-xl font-bold ${isBookable ? 'text-slate-800 dark:text-slate-200 group-hover:text-[#3B82F6] dark:group-hover:text-[#38BDF8] transition-colors' : 'text-slate-400 dark:text-slate-500'}`}>
                            {formattedName}
                          </span>
                        </div>
                        <div className="text-center text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium truncate">
                          {formattedFloor}
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            {/* RIGHT COLUMN: Form Nhập Thông Tin Đặt Bàn (5 Cols) */}
            <div className="lg:col-span-5 bg-white dark:bg-[#0F172A]/70 rounded-2xl p-5 sm:p-6 lg:p-7 shadow-xs border border-slate-200/90 dark:border-white/10 backdrop-blur-xl h-fit lg:sticky lg:top-24 space-y-5">
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mb-1">
                  {t.bookingFormTitle}
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
                  {t.bookingFormSub}
                </p>
              </div>

              {/* Selected Table Banner */}
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 flex justify-between items-center">
                <div>
                  <p className="text-[10.5px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-0.5">
                    {t.selectedTableLabel}
                  </p>
                  <p className="text-base sm:text-lg font-extrabold text-[#3B82F6] dark:text-[#38BDF8] leading-none">
                    {selectedTable ? formatTableName(selectedTable.tableName, lang) : t.noTableSelected}
                  </p>
                </div>
                <span className="w-3 h-3 rounded-full bg-[#3B82F6] dark:bg-[#38BDF8] shadow-xs shrink-0 animate-pulse" />
              </div>

              {error && (
                <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs font-bold text-center">
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleBookingSubmit} className="space-y-4">
                {/* Full Name */}
                <div>
                  <label htmlFor="customer-name-input" className="block text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    {t.customerNameLabel}
                  </label>
                  <input
                    id="customer-name-input"
                    type="text"
                    required
                    placeholder={t.customerNamePlaceholder}
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 sm:py-3 text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#3B82F6] dark:focus:ring-[#38BDF8] focus:border-transparent transition-all"
                  />
                </div>

                {/* Phone Number */}
                <div>
                  <label htmlFor="customer-phone-input" className="block text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    {t.customerPhoneLabel}
                  </label>
                  <input
                    id="customer-phone-input"
                    type="tel"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    required
                    placeholder={t.customerPhonePlaceholder}
                    value={customerPhone}
                    onChange={(e) => {
                      const onlyDigits = e.target.value.replace(/\D/g, '');
                      if (onlyDigits.length <= 11) {
                        setCustomerPhone(onlyDigits);
                        if (error) setError('');
                      }
                    }}
                    className="w-full bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 sm:py-3 text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#3B82F6] dark:focus:ring-[#38BDF8] focus:border-transparent transition-all"
                  />
                </div>

                {/* Reservation Time & Guest Count Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="reservation-time-input" className="block text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      {t.reservationTimeLabel}
                    </label>
                    <input
                      id="reservation-time-input"
                      type="datetime-local"
                      required
                      value={reservationTime}
                      onChange={(e) => setReservationTime(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-white/10 rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#3B82F6] dark:focus:ring-[#38BDF8] focus:border-transparent transition-all"
                    />
                  </div>

                  <div>
                    <label htmlFor="guest-count-input" className="block text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      {t.guestCountLabel}
                    </label>
                    <input
                      id="guest-count-input"
                      type="number"
                      min={1}
                      max={50}
                      required
                      value={guestCount}
                      onChange={(e) => setGuestCount(Number(e.target.value))}
                      className="w-full bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 sm:py-3 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#3B82F6] dark:focus:ring-[#38BDF8] focus:border-transparent transition-all"
                    />
                  </div>
                </div>

                {/* Quick Time Options */}
                <div className="space-y-1.5 pt-1">
                  <span className="text-[11px] text-slate-400 dark:text-slate-500 font-bold block">
                    {t.quickTimePresets}
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => setPresetTime(1)}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-[11px] font-bold text-slate-700 dark:text-slate-300 hover:bg-[#3B82F6] hover:text-white dark:hover:bg-[#3B82F6] dark:hover:text-white transition-all cursor-pointer"
                    >
                      {t.presetIn1h}
                    </button>
                    <button
                      type="button"
                      onClick={() => setPresetTime(2)}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-[11px] font-bold text-slate-700 dark:text-slate-300 hover:bg-[#3B82F6] hover:text-white dark:hover:bg-[#3B82F6] dark:hover:text-white transition-all cursor-pointer"
                    >
                      {t.presetIn2h}
                    </button>
                    <button
                      type="button"
                      onClick={() => setSpecificTimePreset(19, false)}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-[11px] font-bold text-slate-700 dark:text-slate-300 hover:bg-[#3B82F6] hover:text-white dark:hover:bg-[#3B82F6] dark:hover:text-white transition-all cursor-pointer"
                    >
                      {t.presetTonight}
                    </button>
                    <button
                      type="button"
                      onClick={() => setSpecificTimePreset(12, true)}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-[11px] font-bold text-slate-700 dark:text-slate-300 hover:bg-[#3B82F6] hover:text-white dark:hover:bg-[#3B82F6] dark:hover:text-white transition-all cursor-pointer"
                    >
                      {t.presetTomorrowNoon}
                    </button>
                  </div>
                </div>

                {/* Special Requests / Notes */}
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    {t.noteLabel}
                  </label>
                  <textarea
                    rows={3}
                    placeholder={t.notePlaceholder}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-white/10 rounded-xl p-3 sm:p-4 text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#3B82F6] dark:focus:ring-[#38BDF8] focus:border-transparent transition-all resize-none"
                  />
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting || !selectedTable}
                  className="w-full bg-[#3B82F6] hover:bg-blue-600 text-white text-xs sm:text-sm font-extrabold py-3.5 sm:py-4 rounded-xl shadow-md hover:shadow-lg hover:shadow-blue-500/25 transition-all duration-200 uppercase tracking-wider cursor-pointer active:scale-[0.98] disabled:opacity-50 mt-2 min-h-[44px]"
                >
                  <span>{isSubmitting ? t.btnSubmitting : t.btnSubmitBooking}</span>
                </button>
              </form>
            </div>
          </div>
        )}

        {/* TAB 2: LOOKUP & CUSTOMER CANCEL RESERVATIONS */}
        {activeTab === 'lookup' && (
          <div className="max-w-xl mx-auto bg-white dark:bg-[#0F172A]/70 border border-slate-200/90 dark:border-white/10 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xs backdrop-blur-xl transition-all font-sans">
            <div className="text-center space-y-1.5">
              <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                {t.lookupTitle}
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
                {t.lookupSubtitle}
              </p>
            </div>

            {error && (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs font-bold text-center">
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleLookupSubmit} className="flex flex-col sm:flex-row gap-3">
              <input
                id="lookup-phone-input"
                aria-label={t.lookupPhonePlaceholder}
                type="tel"
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder={t.lookupPhonePlaceholder}
                value={lookupPhone}
                onChange={(e) => {
                  const onlyDigits = e.target.value.replace(/\D/g, '');
                  if (onlyDigits.length <= 11) {
                    setLookupPhone(onlyDigits);
                    if (error) setError('');
                  }
                }}
                className="flex-1 bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#3B82F6] dark:focus:ring-[#38BDF8]"
              />
              <button
                type="submit"
                disabled={isSearchingLookup}
                className="h-11 px-6 bg-[#3B82F6] hover:bg-blue-600 text-white font-bold rounded-xl text-xs sm:text-sm uppercase tracking-wider transition-all shadow-md active:scale-95 flex items-center justify-center shrink-0 cursor-pointer disabled:opacity-50 min-h-[44px]"
              >
                <span>{isSearchingLookup ? t.btnSearching : t.btnSearchNow}</span>
              </button>
            </form>

            {hasSearchedLookup && (
              <div className="space-y-4 pt-2">
                {lookupResults.length === 0 ? (
                  <div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/10 rounded-xl p-6 text-center text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
                    {lang === 'en' ? 'No reservation found matching phone number ' : 'Không tìm thấy đơn đặt bàn nào với số điện thoại '}
                    <span className="font-bold text-[#3B82F6] dark:text-[#38BDF8]">{lookupPhone}</span>.
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-xs sm:text-sm font-bold text-slate-500 dark:text-slate-400">
                      {lang === 'en' ? `Found ${lookupResults.length} reservation(s):` : `Tìm thấy ${lookupResults.length} đơn đặt bàn:`}
                    </p>

                    {lookupResults.map((res) => {
                      let statusBadge = 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
                      let statusLabel = lang === 'en' ? 'Pending Staff Approval' : 'Chờ phục vụ duyệt';

                      if (res.status === 'confirmed') {
                        statusBadge = 'bg-sky-500/10 text-[#0284c7] dark:text-[#38BDF8] border-sky-500/30';
                        statusLabel = lang === 'en' ? 'Confirmed' : 'Đã duyệt thành công';
                      } else if (res.status === 'arrived') {
                        statusBadge = 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
                        statusLabel = lang === 'en' ? 'Arrived' : 'Khách đã đến';
                      } else if (res.status === 'cancelled') {
                        statusBadge = 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20';
                        statusLabel = lang === 'en' ? 'Cancelled' : 'Đã hủy';
                      }

                      const isPending = res.status === 'pending';
                      const isConfirmed = res.status === 'confirmed';
                      const isArrived = res.status === 'arrived';
                      const targetTableId = res.tableId?._id || res.tableId;
                      const tableNameStr = formatTableName(res.tableId?.tableName, lang);

                      return (
                        <div
                          key={res._id}
                          className="bg-slate-50/90 dark:bg-slate-900/80 border border-slate-200 dark:border-white/10 p-4 sm:p-5 rounded-xl space-y-3 shadow-xs"
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base">
                                {res.customerName}
                              </h4>
                              <p className="text-xs text-[#3B82F6] dark:text-[#38BDF8] font-bold mt-0.5">
                                {res.customerPhone}
                              </p>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-[10.5px] font-bold border ${statusBadge}`}>
                              {statusLabel}
                            </span>
                          </div>

                          <div className="py-2.5 border-t border-b border-slate-200/80 dark:border-white/10 space-y-1.5 text-xs sm:text-sm">
                            <div className="flex justify-between">
                              <span className="text-slate-500 dark:text-slate-400 font-medium">
                                {lang === 'en' ? 'Selected Table:' : lang === 'zh' ? '预订桌位：' : 'Bàn chọn:'}
                              </span>
                              <span className="font-bold text-slate-900 dark:text-white">{tableNameStr}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-500 dark:text-slate-400 font-medium">
                                {lang === 'en' ? 'Reservation Time:' : lang === 'zh' ? '入座时间：' : 'Thời gian nhận bàn:'}
                              </span>
                              <span className="font-bold text-slate-900 dark:text-white">
                                {new Date(res.reservationTime).toLocaleString(lang === 'en' ? 'en-US' : lang === 'zh' ? 'zh-CN' : 'vi-VN')}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-500 dark:text-slate-400 font-medium">
                                {lang === 'en' ? 'Guest Count:' : lang === 'zh' ? '顾客人数：' : 'Số lượng khách:'}
                              </span>
                              <span className="font-bold text-slate-900 dark:text-white">
                                {res.guestCount} {lang === 'en' ? 'guests' : lang === 'zh' ? '人' : 'người'}
                              </span>
                            </div>

                            {isConfirmed && (
                              <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-white/10 text-xs flex justify-between items-center">
                                <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                                  <span className="material-symbols-outlined text-sm text-[#0284c7] dark:text-[#38BDF8]">verified_user</span>
                                  <span>Mã nhận bàn:</span>
                                </span>
                                <span className="font-mono font-extrabold tracking-widest text-xs text-slate-500 dark:text-slate-400 bg-white dark:bg-[#090D16] px-2.5 py-1 rounded-md border border-slate-300 dark:border-slate-700">
                                  •••• (Bảo mật - chỉ cấp 1 lần)
                                </span>
                              </div>
                            )}

                            {res.note && (
                              <div className="pt-1 text-xs text-amber-600 dark:text-amber-400 italic">
                                {lang === 'en' ? 'Note: ' : lang === 'zh' ? '备注：' : 'Ghi chú: '}{res.note}
                              </div>
                            )}
                          </div>

                          {isArrived && targetTableId && (
                            <button
                              type="button"
                              onClick={() => router.push(`/table/${targetTableId}`)}
                              className="w-full h-11 bg-[#38BDF8] hover:bg-[#0284c7] text-[#090D16] hover:text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-md active:scale-95 cursor-pointer flex items-center justify-center min-h-[44px]"
                            >
                              {lang === 'en' ? `GO TO TABLE ORDER (${tableNameStr})` : lang === 'zh' ? `进入桌位点餐 (${tableNameStr})` : `VÀO BÀN GỌI MÓN (${tableNameStr})`}
                            </button>
                          )}

                          {isPending && (
                            <div className="space-y-2">
                              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-700 dark:text-amber-400 flex items-start gap-2">
                                <span className="material-symbols-outlined text-base shrink-0 mt-0.5 animate-pulse">hourglass_empty</span>
                                <span>Đơn đặt bàn đang chờ nhân viên phục vụ duyệt. Quý khách vui lòng chờ trong giây lát.</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleCustomerCancelReservation(res._id)}
                                className="w-full h-10 bg-rose-500/10 hover:bg-rose-500 hover:text-white text-rose-500 border border-rose-500/20 text-xs font-bold rounded-xl transition-all flex items-center justify-center cursor-pointer active:scale-95 min-h-[44px]"
                              >
                                {lang === 'en' ? 'CANCEL THIS RESERVATION' : lang === 'zh' ? '取消此预订' : 'HỦY ĐƠN ĐẶT BÀN NÀY'}
                              </button>
                            </div>
                          )}

                          {isConfirmed && targetTableId && (
                            <div className="space-y-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setPinModalRes(res);
                                  setPinInput('');
                                  setPinError('');
                                }}
                                className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md active:scale-95 cursor-pointer flex items-center justify-center gap-1.5 min-h-[44px]"
                              >
                                <span className="material-symbols-outlined text-base">key</span>
                                <span>{lang === 'en' ? `I HAVE ARRIVED - ENTER PIN (${tableNameStr})` : `TÔI ĐÃ ĐẾN - NHẬP MÃ VÀO BÀN (${tableNameStr})`}</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleCustomerCancelReservation(res._id)}
                                className="w-full h-10 bg-rose-500/10 hover:bg-rose-500 hover:text-white text-rose-500 border border-rose-500/20 text-xs font-bold rounded-xl transition-all flex items-center justify-center cursor-pointer active:scale-95 min-h-[44px]"
                              >
                                {lang === 'en' ? 'CANCEL THIS RESERVATION' : lang === 'zh' ? '取消此预订' : 'HỦY ĐƠN ĐẶT BÀN NÀY'}
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* BOOKING SUCCESS MODAL POPUP */}
        <AnimatePresence>
          {bookingSuccess && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 select-none">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setBookingSuccess(null)}
                className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm"
              />

              <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 15 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 15 }}
                transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                className="relative w-full max-w-md rounded-2xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-white/10 p-6 sm:p-8 text-center space-y-5 shadow-2xl z-10 font-sans"
              >
                <div className="space-y-1.5">
                  <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                    {bookingSuccess.status === 'confirmed' ? 'Đặt Bàn Đã Được Duyệt!' : 'Đã Gửi Yêu Cầu Giữ Chỗ!'}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                    {bookingSuccess.status === 'confirmed'
                      ? 'Nhân viên phục vụ đã duyệt đơn đặt bàn của quý khách.'
                      : 'Đơn đặt bàn của bạn đã gửi đến quán và đang chờ nhân viên phục vụ duyệt.'}
                  </p>
                </div>

                {bookingSuccess.checkInCode ? (
                  <div className="p-4 rounded-2xl bg-sky-500/10 border border-[#38BDF8]/40 flex flex-col items-center justify-center gap-1.5 text-center shadow-xs">
                    <span className="text-xs font-black text-[#0284c7] dark:text-[#38BDF8] flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">pin</span>
                      MÃ NHẬN BÀN CỦA BẠN
                    </span>
                    <span className="font-black text-3xl tracking-[0.3em] text-[#090D16] dark:text-white bg-white dark:bg-[#090D16] px-5 py-1.5 rounded-xl border border-[#38BDF8]/40 shadow-xs">
                      {bookingSuccess.checkInCode}
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Vui lòng nhập mã này khi tra cứu SĐT tại quán để vào bàn gọi món
                    </span>
                  </div>
                ) : (
                  <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-2.5 text-left">
                    <span className="material-symbols-outlined text-amber-500 text-xl shrink-0 mt-0.5 animate-pulse">hourglass_top</span>
                    <div>
                      <div className="text-xs font-extrabold text-amber-700 dark:text-amber-400">
                        Đang chờ nhân viên phục vụ phê duyệt
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                        Hệ thống sẽ tự động cấp mã nhận bàn 4 chữ số ngay khi nhân viên duyệt đơn của quý khách.
                      </div>
                    </div>
                  </div>
                )}

                {/* Card Info Container */}
                <div className="space-y-2 text-xs sm:text-sm text-left p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/10">
                  <div className="flex justify-between items-center px-3.5 py-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-white/10">
                    <span className="text-slate-500 dark:text-slate-400 font-bold">
                      {lang === 'en' ? 'Customer Name' : lang === 'zh' ? '顾客姓名' : 'Khách hàng'}
                    </span>
                    <span className="font-extrabold text-slate-900 dark:text-white">{bookingSuccess.customerName}</span>
                  </div>

                  <div className="flex justify-between items-center px-3.5 py-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-white/10">
                    <span className="text-slate-500 dark:text-slate-400 font-bold">
                      {lang === 'en' ? 'Phone Number' : lang === 'zh' ? '联系电话' : 'Số điện thoại'}
                    </span>
                    <span className="font-extrabold text-[#3B82F6] dark:text-[#38BDF8]">{bookingSuccess.customerPhone}</span>
                  </div>

                  <div className="flex justify-between items-center px-3.5 py-2.5 rounded-lg bg-blue-500/10 border border-blue-500/25">
                    <span className="text-[#3B82F6] dark:text-[#38BDF8] font-bold">
                      {lang === 'en' ? 'Reserved Table' : lang === 'zh' ? '预订桌位' : 'Bàn giữ chỗ'}
                    </span>
                    <span className="font-black text-[#3B82F6] dark:text-[#38BDF8] tracking-wide">
                      {formatTableName(bookingSuccess.tableId?.tableName, lang)}
                    </span>
                  </div>

                  <div className="flex justify-between items-center px-3.5 py-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-white/10">
                    <span className="text-slate-500 dark:text-slate-400 font-bold">
                      {lang === 'en' ? 'Reservation Time' : lang === 'zh' ? '入座时间' : 'Thời gian nhận bàn'}
                    </span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {new Date(bookingSuccess.reservationTime).toLocaleString(lang === 'en' ? 'en-US' : lang === 'zh' ? 'zh-CN' : 'vi-VN')}
                    </span>
                  </div>

                  <div className="flex justify-between items-center px-3.5 py-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-white/10">
                    <span className="text-slate-500 dark:text-slate-400 font-bold">
                      {lang === 'en' ? 'Guest Count' : lang === 'zh' ? '顾客人数' : 'Số lượng khách'}
                    </span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {bookingSuccess.guestCount} {lang === 'en' ? 'guests' : lang === 'zh' ? '人' : 'người'}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setBookingSuccess(null)}
                  className="w-full h-11 rounded-xl bg-[#38BDF8] hover:bg-[#0284c7] text-[#090D16] hover:text-white font-black text-xs uppercase tracking-wider transition-all shadow-md active:scale-95 cursor-pointer flex items-center justify-center min-h-[44px]"
                >
                  <span>{t.doneAndClose}</span>
                </button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* 4-DIGIT PIN ENTRY MODAL */}
        <AnimatePresence>
          {pinModalRes && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 select-none">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setPinModalRes(null)}
                className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm"
              />
              <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 15 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 15 }}
                transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                className="relative w-full max-w-sm rounded-2xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-white/10 p-6 text-center space-y-5 shadow-2xl z-10 font-sans"
              >
                <div className="space-y-1">
                  <h3 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight font-heading">
                    Nhập Mã Nhận Bàn
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    Vui lòng nhập mã PIN 4 chữ số được cấp khi nhân viên phục vụ duyệt đơn để nhận{' '}
                    <strong className="text-slate-800 dark:text-slate-200">
                      {formatTableName(pinModalRes.tableId?.tableName, lang)}
                    </strong>.
                  </p>
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleCustomerArrive(
                      pinModalRes._id,
                      pinModalRes.tableId?._id || pinModalRes.tableId,
                      pinInput,
                    );
                  }}
                  className="space-y-4"
                >
                  <div className="space-y-1.5">
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={4}
                      autoFocus
                      value={pinInput}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '').slice(0, 4);
                        setPinInput(val);
                        setPinError('');
                      }}
                      placeholder="••••"
                      className="w-full text-center text-3xl font-black tracking-[0.4em] py-3 px-4 rounded-xl border-2 border-slate-300 dark:border-slate-700 focus:border-[#38BDF8] focus:ring-4 focus:ring-[#38BDF8]/20 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white outline-none transition-all placeholder:text-slate-300 dark:placeholder:text-slate-700"
                    />
                    {pinError && (
                      <p className="text-xs text-rose-500 font-bold">{pinError}</p>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setPinModalRes(null)}
                      className="flex-1 h-11 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
                    >
                      Đóng
                    </button>
                    <button
                      type="submit"
                      disabled={pinInput.length !== 4 || isVerifyingPin}
                      className="flex-1 h-11 bg-[#38BDF8] hover:bg-[#0284c7] text-[#090D16] hover:text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-md active:scale-95 disabled:opacity-40 disabled:pointer-events-none cursor-pointer flex items-center justify-center gap-1"
                    >
                      {isVerifyingPin ? 'Đang kiểm tra...' : 'Vào bàn'}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* TABLE OCCUPIED SUGGESTION MODAL */}
        <AnimatePresence>
          {occupiedData && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 select-none">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setOccupiedData(null)}
                className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm"
              />
              <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 15 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 15 }}
                transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                className="relative w-full max-w-md rounded-2xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-white/10 p-6 space-y-5 shadow-2xl z-10 font-sans"
              >
                <div className="space-y-1 text-left">
                  <div className="w-11 h-11 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mb-2">
                    <span className="material-symbols-outlined text-2xl">event_busy</span>
                  </div>
                  <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white tracking-tight font-heading">
                    Bàn Hiện Đang Có Khách Ngồi
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    Bàn <strong>{formatTableName(occupiedData.currentTable?.tableName, lang)}</strong> hiện đang phục vụ khách trước giờ hẹn của bạn.
                  </p>
                </div>

                <div className="space-y-2 text-left">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Gợi ý bàn trống sẵn sàng đón bạn ngay:
                  </span>
                  {occupiedData.suggestedTables.length === 0 ? (
                    <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-900 text-xs text-center text-slate-500">
                      Hiện các bàn khác đều đang bận. Bạn vui lòng chờ đến giờ hẹn để nhận bàn cũ nhé!
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                      {occupiedData.suggestedTables.map((tbl: any) => (
                        <button
                          key={tbl._id}
                          type="button"
                          onClick={() =>
                            handleCustomerArrive(
                              occupiedData.resId,
                              occupiedData.currentTable?._id,
                              occupiedData.checkInCode,
                              tbl._id,
                            )
                          }
                          className="w-full p-3 rounded-xl border border-[#38BDF8]/40 hover:border-[#38BDF8] bg-sky-500/5 hover:bg-sky-500/15 text-left transition-all flex justify-between items-center group cursor-pointer"
                        >
                          <div>
                            <div className="font-extrabold text-slate-900 dark:text-white text-xs group-hover:text-[#0284c7] dark:group-hover:text-[#38BDF8]">
                              {formatTableName(tbl.tableName, lang)}
                            </div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400">
                              Sức chứa: {tbl.capacity || 2} khách
                            </div>
                          </div>
                          <span className="px-2.5 py-1 bg-[#38BDF8] text-[#090D16] text-[11px] font-extrabold rounded-lg flex items-center gap-1 shadow-xs group-hover:bg-[#0284c7] group-hover:text-white transition-colors">
                            <span>Đổi sang bàn này</span>
                            <span className="material-symbols-outlined text-xs">arrow_forward</span>
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setOccupiedData(null)}
                    className="w-full h-11 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 font-bold text-xs rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
                  >
                    Tôi sẽ chờ đến giờ hẹn tại bàn cũ
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* ONE-TIME CHECK-IN CODE MODAL (HIỂN THỊ 1 LẦN DUY NHẤT KHI PHỤC VỤ XÁC NHẬN) */}
        <AnimatePresence>
          {oneTimeCodeData && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 select-none">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-slate-950/75 backdrop-blur-md"
              />
              <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 15 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 15 }}
                transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                className="relative w-full max-w-sm rounded-3xl bg-white dark:bg-[#0F172A] border border-slate-200/80 dark:border-white/10 p-6 sm:p-7 text-center space-y-6 shadow-2xl z-10 font-sans"
              >
                {/* Header */}
                <div className="space-y-1">
                  <h3 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight font-heading">
                    Mã Nhận Bàn
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Đơn đặt bàn của bạn đã được nhân viên duyệt thành công.
                  </p>
                </div>

                {/* 4-digit Passcode Display (Minimalist Fintech / Apple OTP Style) */}
                <div className="py-1">
                  <div className="flex justify-center items-center gap-2.5">
                    {oneTimeCodeData.code.split('').map((digit: string, idx: number) => (
                      <div
                        key={idx}
                        className="w-14 h-16 rounded-2xl bg-slate-50 dark:bg-slate-900/90 border-2 border-slate-200 dark:border-slate-800 flex items-center justify-center font-mono text-3xl font-black text-slate-900 dark:text-white shadow-xs"
                      >
                        {digit}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Discreet Alert Notice */}
                <div className="text-[11px] text-amber-700 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 py-2.5 px-3.5 rounded-xl text-center leading-relaxed font-medium">
                  Mã chỉ hiển thị <strong>1 lần duy nhất</strong>. Khi đến quán, bạn hãy bấm <strong>&ldquo;Tôi đã đến&rdquo;</strong> và nhập 4 số này để vào bàn.
                </div>

                {/* Action Button */}
                <button
                  type="button"
                  onClick={handleAcknowledgeOneTimeCode}
                  className="w-full h-11 bg-[#38BDF8] hover:bg-[#0284c7] text-[#090D16] hover:text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-md active:scale-95 cursor-pointer flex items-center justify-center min-h-[44px]"
                >
                  Tôi đã lưu mã & Đóng
                </button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-[#0B0F17] border-t border-slate-200 dark:border-white/10 mt-auto w-full">
        <div className="flex flex-col md:flex-row justify-between items-center w-full px-4 md:px-12 py-5 max-w-7xl mx-auto gap-4">
          <p className="text-xs text-slate-500 dark:text-slate-400 text-center md:text-left font-medium">
            © {new Date().getFullYear()} Kohi Coffee & Pastry. Smart Online Reservation & QR Solution.
          </p>
          <div className="flex gap-6">
            <Link href="/privacy" className="text-xs text-slate-500 dark:text-slate-400 hover:text-[#3B82F6] dark:hover:text-[#38BDF8] underline transition-colors">
              {lang === 'en' ? 'Privacy Policy' : lang === 'zh' ? '隐私政策' : 'Chính sách bảo mật'}
            </Link>
            <Link href="/terms" className="text-xs text-slate-500 dark:text-slate-400 hover:text-[#3B82F6] dark:hover:text-[#38BDF8] underline transition-colors">
              {lang === 'en' ? 'Terms of Service' : lang === 'zh' ? '服务条款' : 'Điều khoản dịch vụ'}
            </Link>
            <Link href="/contact" className="text-xs text-slate-500 dark:text-slate-400 hover:text-[#3B82F6] dark:hover:text-[#38BDF8] underline transition-colors">
              {lang === 'en' ? 'Contact Us' : lang === 'zh' ? '联系我们' : 'Liên hệ chúng tôi'}
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
