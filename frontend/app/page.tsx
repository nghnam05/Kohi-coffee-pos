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
import { formatTableName, formatTableLocation } from '@/utils/format';
import { toast } from 'react-hot-toast';
import { useTranslation } from '@/context/LanguageContext';

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
    selectTableLabel: '1. Chọn bàn ăn phù hợp',
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
    selectedTableLabel: 'BÀN ĂN ĐƯỢC CHỌN',
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

  const isDark = resolvedTheme === 'dark';

  useEffect(() => {
    setMounted(true);
    fetchTables();

    // Default datetime input to 2 hours from now
    setPresetTime(2);
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
      } else {
        throw new Error('Không thể tra cứu đơn đặt bàn.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi khi tra cứu.');
    } finally {
      setIsSearchingLookup(false);
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
    <div className="min-h-screen bg-slate-50/80 dark:bg-[#070A10] text-slate-900 dark:text-slate-100 transition-colors duration-300 font-sans flex flex-col justify-between relative antialiased">
      {/* Top Header Bar */}
      <header className="bg-white/95 dark:bg-[#0F141F]/95 border-b border-slate-200 dark:border-slate-800 sticky top-0 left-0 w-full z-50 shadow-xs backdrop-blur-md">
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
              className="bg-[#0284c7] hover:bg-[#0369a1] dark:bg-[#38BDF8] dark:hover:bg-[#0284c7] text-white dark:text-slate-950 transition-colors duration-200 px-3 sm:px-4 h-[28px] sm:h-[34px] rounded-full text-[11px] sm:text-xs font-bold shadow-xs whitespace-nowrap cursor-pointer active:scale-95 flex items-center shrink-0"
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
          <div className="inline-flex items-center justify-center px-4 py-1.5 rounded-full bg-sky-500/10 dark:bg-sky-500/20 text-[#0284c7] dark:text-[#38BDF8] text-[11px] sm:text-xs font-bold uppercase tracking-wider mb-4 sm:mb-6 border border-sky-500/20">
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
        <nav className="flex justify-center border-b border-slate-200 dark:border-slate-800 mb-8 sm:mb-12">
          <button
            onClick={() => {
              setActiveTab('reserve');
              setError('');
            }}
            className={`px-6 sm:px-8 py-3.5 sm:py-4 text-xs sm:text-sm font-bold transition-all border-b-2 cursor-pointer ${
              activeTab === 'reserve'
                ? 'text-[#0284c7] dark:text-[#38BDF8] border-[#0284c7] dark:border-[#38BDF8] translate-y-[1px]'
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
                ? 'text-[#0284c7] dark:text-[#38BDF8] border-[#0284c7] dark:border-[#38BDF8] translate-y-[1px]'
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
            <div className="lg:col-span-7 bg-white dark:bg-[#0F141F] rounded-xl sm:rounded-2xl p-5 sm:p-6 lg:p-7 shadow-xs border border-slate-200/90 dark:border-slate-800/90">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6 pb-6 border-b border-slate-200 dark:border-slate-800">
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mb-1">
                    {t.selectTableLabel}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
                    {t.selectTableSub}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-[11px] font-bold">
                    <button
                      onClick={() => setTableFilter('all')}
                      className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                        tableFilter === 'all'
                          ? 'bg-white dark:bg-[#161D2C] text-[#0284c7] dark:text-[#38BDF8] shadow-xs'
                          : 'text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      {t.filterAll}
                    </button>
                    <button
                      onClick={() => setTableFilter('available')}
                      className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                        tableFilter === 'available'
                          ? 'bg-white dark:bg-[#161D2C] text-[#0284c7] dark:text-[#38BDF8] shadow-xs'
                          : 'text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      {t.filterAvailable}
                    </button>
                  </div>
                  <button
                    onClick={fetchTables}
                    className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer min-h-[36px]"
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
                    const formattedLocation = formatTableLocation(tbl.tableName, lang);

                    if (isSelected && isBookable) {
                      return (
                        <div
                          key={tbl._id}
                          onClick={() => {
                            setSelectedTable(tbl);
                            setError('');
                          }}
                          className="relative bg-white dark:bg-[#0F141F] border-2 border-[#0284c7] dark:border-[#38BDF8] rounded-xl sm:rounded-2xl p-4 sm:p-5 cursor-pointer shadow-md transition-all group overflow-hidden"
                        >
                          <div className="absolute inset-0 bg-[#0284c7]/5 dark:bg-[#38BDF8]/10 pointer-events-none" />
                          <div className="flex justify-between items-center mb-3 sm:mb-4 relative z-10">
                            <span className={`w-2 h-2 rounded-full ${statusDot}`} />
                            <span className="text-[11px] sm:text-xs font-bold text-emerald-600 dark:text-emerald-400">
                              {statusText}
                            </span>
                          </div>
                          <div className="text-center mb-1 relative z-10">
                            <span className="text-lg sm:text-xl font-extrabold text-[#0284c7] dark:text-[#38BDF8]">
                              {formattedName}
                            </span>
                          </div>
                          <div className="text-center text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium relative z-10 truncate">
                            {formattedLocation}
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
                        className={`relative rounded-xl sm:rounded-2xl p-4 sm:p-5 text-left transition-all group overflow-hidden border ${
                          isBookable
                            ? 'bg-slate-50/80 dark:bg-[#161D2C]/60 border-slate-200 dark:border-slate-800 cursor-pointer hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-sm'
                            : 'bg-slate-100/50 dark:bg-slate-900/30 border-slate-200/50 dark:border-slate-800/40 opacity-60 cursor-not-allowed'
                        }`}
                      >
                        <div className="flex justify-between items-center mb-3 sm:mb-4">
                          <span className={`w-2 h-2 rounded-full ${statusDot}`} />
                          <span className={`text-[11px] sm:text-xs font-medium ${isBookable ? 'text-slate-500 dark:text-slate-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors' : statusColorClass}`}>
                            {statusText}
                          </span>
                        </div>
                        <div className="text-center mb-1">
                          <span className={`text-lg sm:text-xl font-bold ${isBookable ? 'text-slate-800 dark:text-slate-200 group-hover:text-[#0284c7] dark:group-hover:text-[#38BDF8] transition-colors' : 'text-slate-400 dark:text-slate-500'}`}>
                            {formattedName}
                          </span>
                        </div>
                        <div className="text-center text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium truncate">
                          {formattedLocation}
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            {/* RIGHT COLUMN: Form Nhập Thông Tin Đặt Bàn (5 Cols) */}
            <div className="lg:col-span-5 bg-white dark:bg-[#0F141F] rounded-xl sm:rounded-2xl p-5 sm:p-6 lg:p-7 shadow-xs border border-slate-200/90 dark:border-slate-800/90 h-fit lg:sticky lg:top-24 space-y-5">
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mb-1">
                  {t.bookingFormTitle}
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
                  {t.bookingFormSub}
                </p>
              </div>

              {/* Selected Table Banner */}
              <div className="bg-[#0284c7]/5 dark:bg-[#38BDF8]/10 border border-[#0284c7]/20 dark:border-[#38BDF8]/20 rounded-xl p-4 flex justify-between items-center">
                <div>
                  <p className="text-[10.5px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-0.5">
                    {t.selectedTableLabel}
                  </p>
                  <p className="text-base sm:text-lg font-extrabold text-[#0284c7] dark:text-[#38BDF8] leading-none">
                    {selectedTable ? formatTableName(selectedTable.tableName, lang) : t.noTableSelected}
                  </p>
                </div>
                <span className="w-3 h-3 rounded-full bg-[#0284c7] dark:bg-[#38BDF8] shadow-xs shrink-0 animate-pulse" />
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
                    className="w-full bg-slate-50 dark:bg-[#161D2C] border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 sm:py-3 text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#0284c7] dark:focus:ring-[#38BDF8] focus:border-transparent transition-all"
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
                    className="w-full bg-slate-50 dark:bg-[#161D2C] border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 sm:py-3 text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#0284c7] dark:focus:ring-[#38BDF8] focus:border-transparent transition-all"
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
                      className="w-full bg-slate-50 dark:bg-[#161D2C] border border-slate-200 dark:border-slate-800 rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0284c7] dark:focus:ring-[#38BDF8] focus:border-transparent transition-all"
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
                      className="w-full bg-slate-50 dark:bg-[#161D2C] border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 sm:py-3 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0284c7] dark:focus:ring-[#38BDF8] focus:border-transparent transition-all"
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
                      className="px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-[11px] font-bold text-slate-700 dark:text-slate-300 hover:bg-[#0284c7] hover:text-white dark:hover:bg-[#38BDF8] dark:hover:text-slate-950 transition-all cursor-pointer"
                    >
                      {t.presetIn1h}
                    </button>
                    <button
                      type="button"
                      onClick={() => setPresetTime(2)}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-[11px] font-bold text-slate-700 dark:text-slate-300 hover:bg-[#0284c7] hover:text-white dark:hover:bg-[#38BDF8] dark:hover:text-slate-950 transition-all cursor-pointer"
                    >
                      {t.presetIn2h}
                    </button>
                    <button
                      type="button"
                      onClick={() => setSpecificTimePreset(19, false)}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-[11px] font-bold text-slate-700 dark:text-slate-300 hover:bg-[#0284c7] hover:text-white dark:hover:bg-[#38BDF8] dark:hover:text-slate-950 transition-all cursor-pointer"
                    >
                      {t.presetTonight}
                    </button>
                    <button
                      type="button"
                      onClick={() => setSpecificTimePreset(12, true)}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-[11px] font-bold text-slate-700 dark:text-slate-300 hover:bg-[#0284c7] hover:text-white dark:hover:bg-[#38BDF8] dark:hover:text-slate-950 transition-all cursor-pointer"
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
                    className="w-full bg-slate-50 dark:bg-[#161D2C] border border-slate-200 dark:border-slate-800 rounded-xl p-3 sm:p-4 text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#0284c7] dark:focus:ring-[#38BDF8] focus:border-transparent transition-all resize-none"
                  />
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting || !selectedTable}
                  className="w-full bg-[#0284c7] hover:bg-[#0369a1] dark:bg-[#38BDF8] dark:hover:bg-[#0284c7] text-white dark:text-slate-950 text-xs sm:text-sm font-extrabold py-3.5 sm:py-4 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 uppercase tracking-wider cursor-pointer active:scale-[0.98] disabled:opacity-50 mt-2 min-h-[44px]"
                >
                  <span>{isSubmitting ? t.btnSubmitting : t.btnSubmitBooking}</span>
                </button>
              </form>
            </div>
          </div>
        )}

        {/* TAB 2: LOOKUP & CUSTOMER CANCEL RESERVATIONS */}
        {activeTab === 'lookup' && (
          <div className="max-w-xl mx-auto bg-white dark:bg-[#0F141F] border border-slate-200/90 dark:border-slate-800/90 rounded-xl sm:rounded-2xl p-6 sm:p-8 space-y-6 shadow-xs transition-all font-sans">
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
                className="flex-1 bg-slate-50 dark:bg-[#161D2C] border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#0284c7] dark:focus:ring-[#38BDF8]"
              />
              <button
                type="submit"
                disabled={isSearchingLookup}
                className="h-11 px-6 bg-[#0284c7] hover:bg-[#0369a1] dark:bg-[#38BDF8] dark:hover:bg-[#0284c7] text-white dark:text-slate-950 font-bold rounded-xl text-xs sm:text-sm uppercase tracking-wider transition-all shadow-md active:scale-95 flex items-center justify-center shrink-0 cursor-pointer disabled:opacity-50 min-h-[44px]"
              >
                <span>{isSearchingLookup ? t.btnSearching : t.btnSearchNow}</span>
              </button>
            </form>

            {hasSearchedLookup && (
              <div className="space-y-4 pt-2">
                {lookupResults.length === 0 ? (
                  <div className="bg-slate-50 dark:bg-[#161D2C]/60 border border-slate-200/80 dark:border-slate-800 rounded-xl p-6 text-center text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
                    {lang === 'en' ? 'No reservation found matching phone number ' : 'Không tìm thấy đơn đặt bàn nào với số điện thoại '}
                    <span className="font-bold text-[#0284c7] dark:text-[#38BDF8]">{lookupPhone}</span>.
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-xs sm:text-sm font-bold text-slate-500 dark:text-slate-400">
                      {lang === 'en' ? `Found ${lookupResults.length} reservation(s):` : `Tìm thấy ${lookupResults.length} đơn đặt bàn:`}
                    </p>

                    {lookupResults.map((res) => {
                      let statusBadge = 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
                      let statusLabel = lang === 'en' ? 'Pending' : 'Chờ xác nhận';

                      if (res.status === 'confirmed') {
                        statusBadge = 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20';
                        statusLabel = lang === 'en' ? 'Confirmed' : 'Đã xác nhận';
                      } else if (res.status === 'arrived') {
                        statusBadge = 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
                        statusLabel = lang === 'en' ? 'Arrived' : 'Khách đã đến';
                      } else if (res.status === 'cancelled') {
                        statusBadge = 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20';
                        statusLabel = lang === 'en' ? 'Cancelled' : 'Đã hủy';
                      }

                      const canCancel = res.status === 'pending' || res.status === 'confirmed';
                      const isArrived = res.status === 'arrived';
                      const targetTableId = res.tableId?._id || res.tableId;
                      const tableNameStr = formatTableName(res.tableId?.tableName, lang);

                      return (
                        <div
                          key={res._id}
                          className="bg-slate-50/90 dark:bg-[#161D2C]/90 border border-slate-200 dark:border-slate-800 p-4 sm:p-5 rounded-xl space-y-3 shadow-xs"
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base">
                                {res.customerName}
                              </h4>
                              <p className="text-xs text-[#0284c7] dark:text-[#38BDF8] font-bold mt-0.5">
                                {res.customerPhone}
                              </p>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-[10.5px] font-bold border ${statusBadge}`}>
                              {statusLabel}
                            </span>
                          </div>

                          <div className="py-2.5 border-t border-b border-slate-200/80 dark:border-slate-800 space-y-1.5 text-xs sm:text-sm">
                            <div className="flex justify-between">
                              <span className="text-slate-500 dark:text-slate-400 font-medium">
                                {lang === 'en' ? 'Selected Table:' : lang === 'zh' ? '预订桌位：' : 'Bàn ăn chọn:'}
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
                              className="w-full h-11 bg-[#0284c7] hover:bg-[#0369a1] dark:bg-[#38BDF8] dark:hover:bg-[#0284c7] text-white dark:text-slate-950 font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md active:scale-95 cursor-pointer flex items-center justify-center min-h-[44px]"
                            >
                              {lang === 'en' ? `GO TO TABLE ORDER (${tableNameStr})` : lang === 'zh' ? `进入桌位点餐 (${tableNameStr})` : `VÀO BÀN GỌI MÓN (${tableNameStr})`}
                            </button>
                          )}

                          {canCancel && (
                            <button
                              type="button"
                              onClick={() => handleCustomerCancelReservation(res._id)}
                              className="w-full h-10 bg-rose-500/10 hover:bg-rose-500 hover:text-white text-rose-500 border border-rose-500/20 text-xs font-bold rounded-xl transition-all flex items-center justify-center cursor-pointer active:scale-95 min-h-[44px]"
                            >
                              {lang === 'en' ? 'CANCEL THIS RESERVATION' : lang === 'zh' ? '取消此预订' : 'HỦY ĐƠN ĐẶT BÀN NÀY'}
                            </button>
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
                className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs"
              />

              <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 15 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 15 }}
                transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                className="relative w-full max-w-md rounded-2xl bg-white dark:bg-[#0F141F] border border-slate-200 dark:border-slate-800 p-6 sm:p-8 text-center space-y-6 shadow-2xl z-10 font-sans"
              >
                <div className="space-y-2">
                  <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                    {t.bookingSuccessTitle}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                    {t.bookingSuccessSubtitle}
                  </p>
                </div>

                {/* Card Info Container */}
                <div className="space-y-2 text-xs sm:text-sm text-left p-3.5 rounded-xl bg-slate-50 dark:bg-[#161D2C] border border-slate-200/80 dark:border-slate-800">
                  <div className="flex justify-between items-center px-3.5 py-2.5 rounded-lg bg-white dark:bg-[#0F141F] border border-slate-200/60 dark:border-slate-800">
                    <span className="text-slate-500 dark:text-slate-400 font-bold">
                      {lang === 'en' ? 'Customer Name' : lang === 'zh' ? '顾客姓名' : 'Khách hàng'}
                    </span>
                    <span className="font-extrabold text-slate-900 dark:text-white">{bookingSuccess.customerName}</span>
                  </div>

                  <div className="flex justify-between items-center px-3.5 py-2.5 rounded-lg bg-white dark:bg-[#0F141F] border border-slate-200/60 dark:border-slate-800">
                    <span className="text-slate-500 dark:text-slate-400 font-bold">
                      {lang === 'en' ? 'Phone Number' : lang === 'zh' ? '联系电话' : 'Số điện thoại'}
                    </span>
                    <span className="font-extrabold text-[#0284c7] dark:text-[#38BDF8]">{bookingSuccess.customerPhone}</span>
                  </div>

                  <div className="flex justify-between items-center px-3.5 py-2.5 rounded-lg bg-sky-500/10 border border-sky-500/25">
                    <span className="text-[#0284c7] dark:text-[#38BDF8] font-bold">
                      {lang === 'en' ? 'Reserved Table' : lang === 'zh' ? '预订桌位' : 'Bàn ăn giữ chỗ'}
                    </span>
                    <span className="font-black text-[#0284c7] dark:text-[#38BDF8] tracking-wide">
                      {formatTableName(bookingSuccess.tableId?.tableName, lang)}
                    </span>
                  </div>

                  <div className="flex justify-between items-center px-3.5 py-2.5 rounded-lg bg-white dark:bg-[#0F141F] border border-slate-200/60 dark:border-slate-800">
                    <span className="text-slate-500 dark:text-slate-400 font-bold">
                      {lang === 'en' ? 'Reservation Time' : lang === 'zh' ? '入座时间' : 'Thời gian nhận bàn'}
                    </span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {new Date(bookingSuccess.reservationTime).toLocaleString(lang === 'en' ? 'en-US' : lang === 'zh' ? 'zh-CN' : 'vi-VN')}
                    </span>
                  </div>

                  <div className="flex justify-between items-center px-3.5 py-2.5 rounded-lg bg-white dark:bg-[#0F141F] border border-slate-200/60 dark:border-slate-800">
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
                  className="w-full h-11 rounded-xl bg-[#0284c7] hover:bg-[#0369a1] dark:bg-[#38BDF8] dark:hover:bg-[#0284c7] text-white dark:text-slate-950 font-extrabold text-xs uppercase tracking-wider transition-all shadow-md active:scale-95 cursor-pointer flex items-center justify-center min-h-[44px]"
                >
                  <span>{t.doneAndClose}</span>
                </button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-[#0F141F] border-t border-slate-200 dark:border-slate-800 mt-auto w-full">
        <div className="flex flex-col md:flex-row justify-between items-center w-full px-4 md:px-12 py-5 max-w-7xl mx-auto gap-4">
          <p className="text-xs text-slate-500 dark:text-slate-400 text-center md:text-left font-medium">
            © {new Date().getFullYear()} Kohi Coffee & Pastry. Smart Online Reservation & QR Solution.
          </p>
          <div className="flex gap-6">
            <Link href="/privacy" className="text-xs text-slate-500 dark:text-slate-400 hover:text-[#0284c7] dark:hover:text-[#38BDF8] underline transition-colors">
              {lang === 'en' ? 'Privacy Policy' : lang === 'zh' ? '隐私政策' : 'Chính sách bảo mật'}
            </Link>
            <Link href="/terms" className="text-xs text-slate-500 dark:text-slate-400 hover:text-[#0284c7] dark:hover:text-[#38BDF8] underline transition-colors">
              {lang === 'en' ? 'Terms of Service' : lang === 'zh' ? '服务条款' : 'Điều khoản dịch vụ'}
            </Link>
            <Link href="/contact" className="text-xs text-slate-500 dark:text-slate-400 hover:text-[#0284c7] dark:hover:text-[#38BDF8] underline transition-colors">
              {lang === 'en' ? 'Contact Us' : lang === 'zh' ? '联系我们' : 'Liên hệ chúng tôi'}
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
