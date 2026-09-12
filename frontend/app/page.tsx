'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { motion, AnimatePresence } from 'framer-motion';
import { playScanBeep, playWelcomeChime } from './utils/sound';
import { BrandLogo } from '@/components/table/BrandLogo';
import { formatTableName, formatTableLocation, formatTableFloor } from '@/utils/format';
import { toast } from 'react-hot-toast';
import { useTranslation, Lang } from '@/context/LanguageContext';
import { io } from 'socket.io-client';
import { BookingClosingAlertModal } from '@/components/booking/BookingClosingAlertModal';
import { checkReservationClosingWarning, ReservationClosingCheck } from '@/utils/storeHours';

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
  const [tablePage, setTablePage] = useState(1);
  const [isMobile, setIsMobile] = useState(false);
  const [isTableFilterOpen, setIsTableFilterOpen] = useState(false);
  const tableFilterRef = useRef<HTMLDivElement>(null);

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

  // Closing Alert Warning Modal (< 30 minutes before closing)
  const [closingAlertData, setClosingAlertData] = useState<ReservationClosingCheck | null>(null);
  const [isClosingModalOpen, setIsClosingModalOpen] = useState(false);

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

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 640);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (tableFilterRef.current && !tableFilterRef.current.contains(event.target as Node)) {
        setIsTableFilterOpen(false);
      }
    };
    if (isTableFilterOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isTableFilterOpen]);

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
  const handleBookingSubmit = async (e?: React.FormEvent, skipClosingWarning = false) => {
    if (e) e.preventDefault();
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

    // ⚡ Kiểm tra khung giờ đóng cửa của quán (07:00 - 22:00)
    const closingCheck = checkReservationClosingWarning(reservationTime);
    if (closingCheck.isBeforeOpen) {
      setError(
        lang === 'en'
          ? `Kohi Coffee opens at ${closingCheck.openingTimeStr}. Please choose a time after opening.`
          : lang === 'zh'
          ? `本店将于 ${closingCheck.openingTimeStr} 营业。请选择营业时间内的入座时间。`
          : `Quán chỉ mở cửa từ ${closingCheck.openingTimeStr}. Vui lòng chọn thời gian nhận bàn sau giờ mở cửa.`
      );
      return;
    }

    if (closingCheck.isAfterClosing) {
      setError(
        lang === 'en'
          ? `Kohi Coffee closes at ${closingCheck.closingTimeStr}. Please choose a time before closing.`
          : lang === 'zh'
          ? `本店将于 ${closingCheck.closingTimeStr} 打烊。请选择打烊前的入座时间。`
          : `Quán đóng cửa vào lúc ${closingCheck.closingTimeStr}. Vui lòng chọn thời gian nhận bàn trước giờ đóng cửa.`
      );
      return;
    }

    // ⚡ Nếu đặt cách giờ đóng cửa < 30 phút mà khách chưa xác nhận -> Mở Pop-up cảnh báo
    if (closingCheck.isNearClosing && !skipClosingWarning) {
      setClosingAlertData(closingCheck);
      setIsClosingModalOpen(true);
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
      setTablePage(1);
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
  }).sort((a, b) => {
    const numA = parseInt(a.tableName?.replace(/\D/g, '') || '0', 10);
    const numB = parseInt(b.tableName?.replace(/\D/g, '') || '0', 10);
    if (!isNaN(numA) && !isNaN(numB) && numA !== numB) {
      return numA - numB;
    }
    return (a.tableName || '').localeCompare(b.tableName || '', undefined, { numeric: true, sensitivity: 'base' });
  });

  // Trên màn hình mobile (2 cột) chỉ hiển thị 4 hàng (8 bàn / trang)
  const TABLES_PER_PAGE = isMobile ? 8 : 12;
  const totalTablePages = Math.ceil(filteredTables.length / TABLES_PER_PAGE) || 1;
  const currentPage = Math.min(Math.max(1, tablePage), totalTablePages);
  const paginatedTables = filteredTables.slice(
    (currentPage - 1) * TABLES_PER_PAGE,
    currentPage * TABLES_PER_PAGE
  );

  return (
    <div className="fixed inset-0 w-full h-full flex flex-col overflow-hidden bg-slate-50 dark:bg-[#0B0F17] text-slate-900 dark:text-slate-100 transition-colors duration-300 font-sans antialiased">
      {/* Top Header Bar (Fixed / Stationary: Không bao giờ cuộn) */}
      <header className="shrink-0 z-40 bg-white/95 dark:bg-[#0B0F17]/95 border-b border-slate-200 dark:border-white/10 w-full shadow-xs backdrop-blur-xl">
        <div className="flex justify-between items-center w-full px-3 sm:px-6 md:px-12 py-2 sm:py-3 max-w-7xl mx-auto gap-2">
          <BrandLogo onClick={() => router.push('/')} />

          <div className="flex items-center gap-2 sm:gap-3.5 shrink-0">
            {/* Language Selector Pill */}
            <div className="inline-flex items-center px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full border border-slate-200 dark:border-slate-700/80 text-[11px] sm:text-xs font-semibold bg-white dark:bg-slate-800/90 shadow-2xs">
              <button
                type="button"
                onClick={() => setLang('vi')}
                className={`transition-colors cursor-pointer ${
                  lang === 'vi'
                    ? 'text-blue-600 dark:text-blue-400 font-bold'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                VI
              </button>
              <span className="mx-1 sm:mx-1.5 text-slate-300 dark:text-slate-600 font-normal">|</span>
              <button
                type="button"
                onClick={() => setLang('en')}
                className={`transition-colors cursor-pointer ${
                  lang === 'en'
                    ? 'text-blue-600 dark:text-blue-400 font-bold'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                EN
              </button>
              <span className="mx-1 sm:mx-1.5 text-slate-300 dark:text-slate-600 font-normal">|</span>
              <button
                type="button"
                onClick={() => setLang('zh')}
                className={`transition-colors cursor-pointer ${
                  lang === 'zh'
                    ? 'text-blue-600 dark:text-blue-400 font-bold'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                ZH
              </button>
            </div>

            {/* Light / Dark Mode Toggle Capsule */}
            <button
              type="button"
              aria-label="Toggle Theme"
              onClick={() => setTheme(isDark ? 'light' : 'dark')}
              className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 border border-slate-200 dark:border-slate-700/80 rounded-full bg-white dark:bg-slate-800/90 hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-colors shadow-2xs cursor-pointer"
            >
              <svg
                className={`w-3.5 h-3.5 sm:w-4 sm:h-4 transition-colors ${
                  !isDark ? 'text-amber-500' : 'text-slate-400 dark:text-slate-500'
                }`}
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  clipRule="evenodd"
                  d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"
                  fillRule="evenodd"
                />
              </svg>
              <span className="text-slate-300 dark:text-slate-600 font-normal">|</span>
              <svg
                className={`w-3.5 h-3.5 sm:w-4 sm:h-4 transition-colors ${
                  isDark ? 'text-amber-400 dark:text-amber-300' : 'text-slate-400'
                }`}
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
              </svg>
            </button>

            {/* Staff Login Button */}
            <button
              type="button"
              onClick={() => router.push('/login')}
              className="inline-flex items-center justify-center px-3.5 sm:px-5 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-sm transition-all duration-150 cursor-pointer active:scale-95 whitespace-nowrap shrink-0"
            >
              <span className="sm:hidden">Đăng nhập</span>
              <span className="hidden sm:inline">{t.btnLogin || 'Đăng nhập Nhân viên'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Scrollable Body: Pure Content Scroll */}
      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain w-full flex flex-col justify-between scrollbar-thin" style={{ WebkitOverflowScrolling: 'touch' }}>
        {/* Main Container */}
        <main className="flex-grow pt-4 sm:pt-8 pb-12 px-3.5 sm:px-6 md:px-12 w-full max-w-7xl mx-auto">
          {/* Hero Section */}
          <section className="text-center max-w-2xl mx-auto mb-8 sm:mb-10">
            <div className="inline-flex items-center gap-1.5 px-4 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 text-xs font-bold uppercase tracking-wider mb-3 sm:mb-4 border border-blue-100 dark:border-blue-800/50 shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 dark:bg-blue-400 animate-pulse" />
              <span>{t.heroBadge}</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-2 sm:mb-3">
              {t.heroTitle}
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm sm:text-base leading-relaxed">
              {t.heroSubtitle}
            </p>
          </section>

          {/* Tab Navigation: Đặt Bàn vs Tra Cứu */}
          <div className="flex justify-center border-b border-slate-200 dark:border-slate-800 mb-8">
            <nav aria-label="Tabs" className="flex space-x-8 sm:space-x-12 -mb-px">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('reserve');
                  setError('');
                }}
                className={`py-3 px-2 text-sm font-bold inline-flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
                  activeTab === 'reserve'
                    ? 'border-blue-600 dark:border-blue-500 text-blue-600 dark:text-blue-400 translate-y-[1px]'
                    : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <span className="material-symbols-outlined text-base">calendar_month</span>
                <span>{t.btnBookTab}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('lookup');
                  setError('');
                }}
                className={`py-3 px-2 text-sm font-semibold inline-flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
                  activeTab === 'lookup'
                    ? 'border-blue-600 dark:border-blue-500 text-blue-600 dark:text-blue-400 translate-y-[1px]'
                    : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <span className="material-symbols-outlined text-base">search</span>
                <span>{t.btnLookupTab}</span>
              </button>
            </nav>
          </div>

          {/* TAB 1: TABLE RESERVATION MAIN GRID */}
          {activeTab === 'reserve' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* LEFT COLUMN: Sơ Đồ Chọn Bàn (7 Cols) */}
              <section className="lg:col-span-7 bg-white dark:bg-[#141D2E]/90 rounded-2xl p-6 sm:p-7 border border-slate-200/80 dark:border-slate-800 shadow-sm dark:shadow-xl backdrop-blur-sm" data-purpose="table-selection">
                {/* Header & Filter Toolbar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100 dark:border-slate-800">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                      {t.selectTableLabel}
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {t.selectTableSub}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    {/* Filter Segmented Control */}
                    <div className="inline-flex rounded-lg p-1 bg-slate-100/90 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 text-xs font-semibold">
                      <button
                        type="button"
                        onClick={() => {
                          setTableFilter('all');
                          setTablePage(1);
                        }}
                        className={`px-3 py-1.5 rounded-md transition-all cursor-pointer font-bold ${
                          tableFilter === 'all'
                            ? 'bg-white dark:bg-blue-600 text-blue-600 dark:text-white shadow-xs'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        {t.filterAll}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setTableFilter('available');
                          setTablePage(1);
                        }}
                        className={`px-3 py-1.5 rounded-md transition-all cursor-pointer font-bold ${
                          tableFilter === 'available'
                            ? 'bg-white dark:bg-blue-600 text-blue-600 dark:text-white shadow-xs'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        {t.filterAvailable}
                      </button>
                    </div>

                    {/* Refresh Button */}
                    <button
                      type="button"
                      onClick={fetchTables}
                      className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-xs">sync</span>
                      <span>{t.refreshMap}</span>
                    </button>
                  </div>
                </div>

                {/* Status Badges Legend */}
                <div className="flex flex-wrap items-center gap-5 sm:gap-6 py-4 text-xs font-semibold text-slate-600 dark:text-slate-300 border-b border-slate-100 dark:border-slate-800/80 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-4 ring-emerald-500/20" />
                    <span>{t.tableStatusEmpty}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500 ring-4 ring-amber-500/20" />
                    <span>{t.tableStatusReserved}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-400 dark:bg-slate-500 ring-4 ring-slate-500/20" />
                    <span>{t.tableStatusServing}</span>
                  </div>
                </div>

                {/* Table Grid (4 columns x 3 rows = 12 items) */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 my-2">
                  {paginatedTables.length === 0 ? (
                    <div className="col-span-full text-center py-10 text-xs text-slate-400 dark:text-slate-500 font-medium">
                      {tables.length === 0
                        ? (lang === 'en' ? 'Loading table map...' : 'Đang tải danh sách bàn...')
                        : (lang === 'en' ? 'No available tables found.' : 'Không có bàn trống nào.')}
                    </div>
                  ) : (
                    paginatedTables.map((tbl) => {
                      const isSelected = selectedTable?._id === tbl._id;
                      const isBookable = tbl.status !== 'reserved' && tbl.status !== 'serving';
                      let statusDot = 'bg-emerald-500';
                      let statusText = t.tableStatusEmpty;
                      let statusColorClass = 'text-emerald-600 dark:text-emerald-400';

                      if (tbl.status === 'serving') {
                        statusDot = 'bg-slate-400 dark:bg-slate-500';
                        statusText = t.tableStatusServing;
                        statusColorClass = 'text-slate-400 dark:text-slate-500';
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
                            className="relative bg-blue-50/70 dark:bg-blue-950/40 border-2 border-blue-500 dark:border-blue-500 rounded-xl p-3.5 flex flex-col justify-between min-h-[92px] cursor-pointer shadow-xs ring-2 ring-blue-500/20 transition-all"
                          >
                            <div className="flex items-center justify-between">
                              <span className="w-2 h-2 rounded-full bg-blue-600 dark:bg-blue-400" />
                              <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400">
                                {statusText}
                              </span>
                            </div>
                            <div className="text-center my-1">
                              <div className="font-extrabold text-sm text-blue-600 dark:text-blue-400">
                                {formattedName}
                              </div>
                              <div className="text-[11px] font-medium text-blue-500 dark:text-blue-400/80">
                                {formattedFloor}
                              </div>
                            </div>
                          </div>
                        );
                      }

                      if (!isBookable) {
                        return (
                          <div
                            key={tbl._id}
                            className="relative bg-slate-50/70 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/60 rounded-xl p-3.5 flex flex-col justify-between min-h-[92px] cursor-not-allowed opacity-75 select-none text-left"
                          >
                            <div className="flex items-center justify-between">
                              <span className={`w-2 h-2 rounded-full ${statusDot}`} />
                              <span className={`text-[10px] font-medium ${statusColorClass}`}>
                                {statusText}
                              </span>
                            </div>
                            <div className="text-center my-1">
                              <div className="font-bold text-sm text-slate-600 dark:text-slate-400">
                                {formattedName}
                              </div>
                              <div className="text-[11px] text-slate-400 dark:text-slate-500">
                                {formattedFloor}
                              </div>
                            </div>
                          </div>
                        );
                      }

                      return (
                        <button
                          key={tbl._id}
                          type="button"
                          onClick={() => {
                            setSelectedTable(tbl);
                            setError('');
                          }}
                          className="relative bg-white dark:bg-[#141D2E] border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 rounded-xl p-3.5 flex flex-col justify-between min-h-[92px] cursor-pointer transition-colors shadow-2xs text-left group"
                        >
                          <div className="flex items-center justify-between">
                            <span className="w-2 h-2 rounded-full bg-emerald-500" />
                            <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
                              {statusText}
                            </span>
                          </div>
                          <div className="text-center my-1">
                            <div className="font-bold text-sm text-slate-800 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                              {formattedName}
                            </div>
                            <div className="text-[11px] text-slate-400 dark:text-slate-500">
                              {formattedFloor}
                            </div>
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>

                {/* Table Pagination Controls */}
                {totalTablePages > 1 && (
                  <div className="flex flex-col sm:flex-row items-center justify-center sm:justify-between gap-3 sm:gap-4 pt-5 mt-4 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 select-none text-center sm:text-left">
                    <div className="text-center sm:text-left">
                      {lang === 'en' ? (
                        <>Showing <strong className="text-slate-800 dark:text-slate-200">{(currentPage - 1) * TABLES_PER_PAGE + 1} - {Math.min(currentPage * TABLES_PER_PAGE, filteredTables.length)}</strong> of <strong className="text-slate-800 dark:text-slate-200">{filteredTables.length}</strong> tables</>
                      ) : lang === 'zh' ? (
                        <>显示 <strong className="text-slate-800 dark:text-slate-200">{(currentPage - 1) * TABLES_PER_PAGE + 1} - {Math.min(currentPage * TABLES_PER_PAGE, filteredTables.length)}</strong> / <strong className="text-slate-800 dark:text-slate-200">{filteredTables.length}</strong> 桌</>
                      ) : (
                        <>Hiển thị <strong className="text-slate-800 dark:text-slate-200">{(currentPage - 1) * TABLES_PER_PAGE + 1} - {Math.min(currentPage * TABLES_PER_PAGE, filteredTables.length)}</strong> trong <strong className="text-slate-800 dark:text-slate-200">{filteredTables.length}</strong> bàn</>
                      )}
                    </div>

                    <div className="inline-flex items-center justify-center gap-1.5">
                      <button
                        type="button"
                        disabled={currentPage === 1}
                        onClick={() => setTablePage(p => Math.max(1, p - 1))}
                        className={`px-3 py-1.5 rounded-lg border transition-all text-xs font-semibold ${
                          currentPage === 1
                            ? 'border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-600 bg-slate-50 dark:bg-slate-900/50 cursor-not-allowed'
                            : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer'
                        }`}
                      >
                        &lt; {lang === 'en' ? 'Prev' : lang === 'zh' ? '上页' : 'Trước'}
                      </button>

                      {Array.from({ length: totalTablePages }, (_, i) => i + 1).map((pageNum) => (
                        <button
                          key={pageNum}
                          type="button"
                          onClick={() => setTablePage(pageNum)}
                          className={`w-8 h-8 rounded-lg text-xs font-bold transition-all flex items-center justify-center cursor-pointer ${
                            pageNum === currentPage
                              ? 'bg-blue-600 text-white shadow-xs'
                              : 'border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                          }`}
                        >
                          {pageNum}
                        </button>
                      ))}

                      <button
                        type="button"
                        disabled={currentPage === totalTablePages}
                        onClick={() => setTablePage(p => Math.min(totalTablePages, p + 1))}
                        className={`px-3 py-1.5 rounded-lg border transition-all text-xs font-semibold ${
                          currentPage === totalTablePages
                            ? 'border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-600 bg-slate-50 dark:bg-slate-900/50 cursor-not-allowed'
                            : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer'
                        }`}
                      >
                        {lang === 'en' ? 'Next' : lang === 'zh' ? '下页' : 'Sau'} &gt;
                      </button>
                    </div>
                  </div>
                )}
              </section>

              {/* RIGHT COLUMN: Form Nhập Thông Tin Đặt Bàn (5 Cols) */}
              <section className="lg:col-span-5 bg-white dark:bg-[#141D2E]/90 rounded-2xl p-6 sm:p-7 border border-slate-200/80 dark:border-slate-800 shadow-sm dark:shadow-xl backdrop-blur-sm h-fit lg:sticky lg:top-24 space-y-5" data-purpose="reservation-form">
                <div className="pb-5 border-b border-slate-100 dark:border-slate-800">
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                    {t.bookingFormTitle}
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {t.bookingFormSub}
                  </p>
                </div>

                {/* Selected Table Banner */}
                <div className="bg-blue-50/70 dark:bg-blue-950/50 border border-blue-100 dark:border-blue-800/60 rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <span className="block text-[11px] font-bold text-blue-600 dark:text-blue-400 tracking-wider uppercase">
                      {t.selectedTableLabel}
                    </span>
                    <span className="text-xl font-extrabold text-blue-700 dark:text-blue-300 mt-0.5 block">
                      {selectedTable ? formatTableName(selectedTable.tableName, lang) : t.noTableSelected}
                    </span>
                  </div>
                  <div className="w-3.5 h-3.5 rounded-full bg-blue-600 dark:bg-blue-400 ring-4 ring-blue-100 dark:ring-blue-900/50" />
                </div>

                {error && (
                  <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs font-bold text-center">
                    <span>{error}</span>
                  </div>
                )}

                <form onSubmit={handleBookingSubmit} className="space-y-4">
                  {/* Full Name */}
                  <div>
                    <label htmlFor="customer-name" className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                      {t.customerNameLabel}
                    </label>
                    <input
                      id="customer-name"
                      name="customerName"
                      type="text"
                      required
                      placeholder={t.customerNamePlaceholder}
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/60 text-sm focus:bg-white dark:focus:bg-[#0F172A] focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-colors py-2.5 px-3.5 placeholder:text-slate-400 dark:placeholder:text-slate-500 text-slate-800 dark:text-slate-100 font-medium outline-none"
                    />
                  </div>

                  {/* Phone Number */}
                  <div>
                    <label htmlFor="customer-phone" className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                      {t.customerPhoneLabel}
                    </label>
                    <input
                      id="customer-phone"
                      name="customerPhone"
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
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/60 text-sm focus:bg-white dark:focus:bg-[#0F172A] focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-colors py-2.5 px-3.5 placeholder:text-slate-400 dark:placeholder:text-slate-500 text-slate-800 dark:text-slate-100 font-medium outline-none"
                    />
                  </div>

                  {/* Reservation Time & Guest Count Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5">
                    <div className="sm:col-span-7">
                      <label htmlFor="reservation-time" className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                        {t.reservationTimeLabel}
                      </label>
                      <div className="relative">
                        <input
                          id="reservation-time"
                          name="reservationTime"
                          type="datetime-local"
                          required
                          value={reservationTime}
                          onChange={(e) => setReservationTime(e.target.value)}
                          className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/60 text-sm focus:bg-white dark:focus:bg-[#0F172A] focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-colors py-2.5 pl-3.5 pr-10 text-slate-800 dark:text-slate-100 font-medium outline-none"
                        />
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-400">
                          <span className="material-symbols-outlined text-base">calendar_today</span>
                        </div>
                      </div>
                    </div>

                    <div className="sm:col-span-5">
                      <label htmlFor="guest-count" className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                        {t.guestCountLabel}
                      </label>
                      <input
                        id="guest-count"
                        name="guestCount"
                        type="number"
                        min={1}
                        max={50}
                        required
                        value={guestCount}
                        onChange={(e) => setGuestCount(Number(e.target.value))}
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/60 text-sm focus:bg-white dark:focus:bg-[#0F172A] focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-colors py-2.5 px-3.5 text-slate-800 dark:text-slate-100 font-medium text-center sm:text-left outline-none"
                      />
                    </div>
                  </div>

                  {/* Quick Time Selection Pills */}
                  <div>
                    <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-2">
                      {t.quickTimePresets}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => setPresetTime(1)}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
                      >
                        {t.presetIn1h}
                      </button>
                      <button
                        type="button"
                        onClick={() => setPresetTime(2)}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
                      >
                        {t.presetIn2h}
                      </button>
                      <button
                        type="button"
                        onClick={() => setSpecificTimePreset(19, false)}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
                      >
                        {t.presetTonight}
                      </button>
                      <button
                        type="button"
                        onClick={() => setSpecificTimePreset(12, true)}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
                      >
                        {t.presetTomorrowNoon}
                      </button>
                    </div>
                  </div>

                  {/* Special Requests / Notes */}
                  <div>
                    <label htmlFor="special-notes" className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                      {t.noteLabel}
                    </label>
                    <textarea
                      id="special-notes"
                      name="specialNotes"
                      rows={3}
                      placeholder={t.notePlaceholder}
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/60 text-sm focus:bg-white dark:focus:bg-[#0F172A] focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-colors p-3 placeholder:text-slate-400 dark:placeholder:text-slate-500 text-slate-800 dark:text-slate-100 resize-none outline-none"
                    />
                  </div>

                  {/* Submit CTA Button */}
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isSubmitting || !selectedTable}
                      className="w-full py-3.5 px-6 rounded-xl text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 font-bold text-sm tracking-wide shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 min-h-[44px]"
                    >
                      <span>{isSubmitting ? t.btnSubmitting : t.btnSubmitBooking}</span>
                      <span className="material-symbols-outlined text-base">arrow_forward</span>
                    </button>
                  </div>
                </form>
              </section>
            </div>
          )}

          {/* TAB 2: LOOKUP & CUSTOMER CANCEL RESERVATIONS */}
          {activeTab === 'lookup' && (
            <div className="max-w-xl mx-auto bg-white dark:bg-[#141D2E]/90 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-sm dark:shadow-xl backdrop-blur-sm transition-all font-sans">
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
                  className="flex-1 bg-slate-50/50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl px-4 py-3 text-xs sm:text-sm placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-colors"
                />
                <button
                  type="submit"
                  disabled={isSearchingLookup}
                  className="h-11 px-6 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs sm:text-sm uppercase tracking-wider transition-all shadow-md active:scale-95 flex items-center justify-center shrink-0 cursor-pointer disabled:opacity-50 min-h-[44px]"
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
                        // Nếu bàn đang phục vụ -> Đang trong phiên; nếu bàn đã trống -> Đã kết thúc phiên
                        if (res.tableId?.status === 'serving' || !res.tableId?.status) {
                          statusBadge = 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
                          statusLabel = lang === 'en' ? 'Arrived / In Service' : 'Khách đã đến';
                        } else {
                          statusBadge = 'bg-slate-500/10 text-slate-500 dark:text-slate-400 border-slate-500/20';
                          statusLabel = lang === 'en' ? 'Completed Session' : 'Đã hoàn tất phiên';
                        }
                      } else if (res.status === 'completed') {
                        statusBadge = 'bg-slate-500/10 text-slate-500 dark:text-slate-400 border-slate-500/20';
                        statusLabel = lang === 'en' ? 'Completed Session' : 'Đã hoàn tất phiên';
                      } else if (res.status === 'cancelled') {
                        statusBadge = 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20';
                        statusLabel = lang === 'en' ? 'Cancelled' : 'Đã hủy';
                      }

                      const isPending = res.status === 'pending';
                      const isConfirmed = res.status === 'confirmed';
                      const isCompleted = res.status === 'completed' || (res.status === 'arrived' && res.tableId?.status === 'empty');
                      // Chỉ cho phép vào bàn khi đơn đang phục vụ thực tế và bàn chưa bị dọn sạch
                      const canEnterTable = res.status === 'arrived' && res.tableId?.status === 'serving';
                      const targetTableId = res.tableId?._id || res.tableId;
                      const tableNameStr = formatTableName(res.tableId?.tableName, lang);

                      return (
                        <div
                          key={res._id}
                          className="bg-slate-50/90 dark:bg-slate-900/80 border border-slate-200 dark:border-white/10 p-4 sm:p-5 rounded-2xl space-y-3 shadow-xs hover:border-[#38BDF8]/30 transition-all"
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-extrabold text-slate-900 dark:text-white text-sm sm:text-base">
                                {res.customerName}
                              </h4>
                              <p className="text-xs text-[#0284c7] dark:text-[#38BDF8] font-extrabold mt-0.5">
                                {res.customerPhone}
                              </p>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-[11px] font-extrabold border ${statusBadge}`}>
                              {statusLabel}
                            </span>
                          </div>

                          <div className="py-2.5 border-t border-b border-slate-200/80 dark:border-white/10 space-y-1.5 text-xs sm:text-sm">
                            <div className="flex justify-between">
                              <span className="text-slate-500 dark:text-slate-400 font-normal">
                                {lang === 'en' ? 'Selected Table:' : lang === 'zh' ? '预订桌位：' : 'Bàn chọn:'}
                              </span>
                              <span className="font-extrabold text-slate-900 dark:text-white">{tableNameStr}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-500 dark:text-slate-400 font-normal">
                                {lang === 'en' ? 'Reservation Time:' : lang === 'zh' ? '入座时间：' : 'Thời gian nhận bàn:'}
                              </span>
                              <span className="font-extrabold text-slate-900 dark:text-white">
                                {new Date(res.reservationTime).toLocaleString(lang === 'en' ? 'en-US' : lang === 'zh' ? 'zh-CN' : 'vi-VN')}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-500 dark:text-slate-400 font-normal">
                                {lang === 'en' ? 'Guest Count:' : lang === 'zh' ? '顾客人数：' : 'Số lượng khách:'}
                              </span>
                              <span className="font-extrabold text-slate-900 dark:text-white">
                                {res.guestCount} {lang === 'en' ? 'guests' : lang === 'zh' ? '人' : 'người'}
                              </span>
                            </div>

                            {isConfirmed && (
                              <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-white/10 text-xs flex justify-between items-center">
                                <span className="font-extrabold text-slate-700 dark:text-slate-300">
                                  Mã nhận bàn:
                                </span>
                                <span className="font-mono font-extrabold tracking-widest text-xs text-slate-500 dark:text-slate-400 bg-white dark:bg-[#090D16] px-2.5 py-1 rounded-md border border-slate-300 dark:border-slate-700">
                                  •••• (Bảo mật - chỉ cấp 1 lần)
                                </span>
                              </div>
                            )}

                            {res.note && (
                              <div className="pt-1 text-xs text-amber-600 dark:text-amber-400 italic font-normal">
                                {lang === 'en' ? 'Note: ' : lang === 'zh' ? '备注：' : 'Ghi chú: '}{res.note}
                              </div>
                            )}
                          </div>

                          {canEnterTable && targetTableId && (
                            <button
                              type="button"
                              onClick={() => router.push(`/table/${targetTableId}`)}
                              className="w-full h-11 bg-[#38BDF8] hover:bg-[#0284c7] focus-visible:ring-2 focus-visible:ring-[#38BDF8] focus-visible:outline-none focus-visible:ring-offset-2 text-[#090D16] hover:text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-md active:scale-[0.98] cursor-pointer flex items-center justify-center min-h-[44px]"
                            >
                              {lang === 'en' ? `GO TO TABLE ORDER (${tableNameStr})` : lang === 'zh' ? `进入桌位点餐 (${tableNameStr})` : `VÀO BÀN GỌI MÓN (${tableNameStr})`}
                            </button>
                          )}

                          {isCompleted && (
                            <div className="p-3 rounded-xl bg-slate-100/90 dark:bg-slate-800/50 border border-slate-200/60 dark:border-white/5 text-xs text-slate-500 dark:text-slate-400 text-center font-normal leading-relaxed">
                              {lang === 'en' ? 'This reservation session has ended. Thank you for visiting KOHI Coffee!' : 'Phiên đặt bàn này đã kết thúc. Cảm ơn quý khách đã ghé thăm KOHI Coffee!'}
                            </div>
                          )}

                          {isPending && (
                            <div className="space-y-2">
                              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-700 dark:text-amber-400 font-normal leading-relaxed">
                                Đơn đặt bàn đang chờ nhân viên phục vụ duyệt. Quý khách vui lòng chờ trong giây lát.
                              </div>
                              <button
                                type="button"
                                onClick={() => handleCustomerCancelReservation(res._id)}
                                className="w-full h-10 bg-rose-500/10 hover:bg-rose-500 hover:text-white focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:outline-none text-rose-500 border border-rose-500/20 text-xs font-extrabold rounded-xl transition-all flex items-center justify-center cursor-pointer active:scale-[0.98] min-h-[44px]"
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
                                className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md active:scale-[0.98] cursor-pointer flex items-center justify-center min-h-[44px]"
                              >
                                <span>{lang === 'en' ? `I HAVE ARRIVED - ENTER PIN (${tableNameStr})` : `TÔI ĐÃ ĐẾN - NHẬP MÃ VÀO BÀN (${tableNameStr})`}</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleCustomerCancelReservation(res._id)}
                                className="w-full h-10 bg-rose-500/10 hover:bg-rose-500 hover:text-white focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:outline-none text-rose-500 border border-rose-500/20 text-xs font-extrabold rounded-xl transition-all flex items-center justify-center cursor-pointer active:scale-[0.98] min-h-[44px]"
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
                    <span className="text-xs font-extrabold text-[#0284c7] dark:text-[#38BDF8] tracking-wider uppercase">
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
                  <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-left">
                    <div>
                      <div className="text-xs font-extrabold text-amber-700 dark:text-amber-400">
                        Đang chờ nhân viên phục vụ phê duyệt
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed font-normal">
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
                  <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white tracking-tight font-heading">
                    Bàn Hiện Đang Có Khách Ngồi
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-normal">
                    Bàn <strong>{formatTableName(occupiedData.currentTable?.tableName, lang)}</strong> hiện đang phục vụ khách trước giờ hẹn của bạn.
                  </p>
                </div>

                <div className="space-y-2 text-left">
                  <span className="text-xs font-extrabold text-slate-700 dark:text-slate-300">
                    Gợi ý bàn trống sẵn sàng đón bạn ngay:
                  </span>
                  {occupiedData.suggestedTables.length === 0 ? (
                    <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-900 text-xs text-center text-slate-500 font-normal">
                      Hiện các bàn khác đều đang bận. Bạn vui lòng chờ đến giờ hẹn để nhận bàn cũ nhé!
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-56 overflow-y-auto pr-1.5 table-scroll-container scroll-smooth">
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
                          className="w-full p-3 rounded-xl border border-[#38BDF8]/40 hover:border-[#38BDF8] bg-sky-500/5 hover:bg-sky-500/15 text-left transition-all flex justify-between items-center group cursor-pointer focus-visible:ring-2 focus-visible:ring-[#38BDF8] focus-visible:outline-none"
                        >
                          <div>
                            <div className="font-extrabold text-slate-900 dark:text-white text-xs group-hover:text-[#0284c7] dark:group-hover:text-[#38BDF8]">
                              {formatTableName(tbl.tableName, lang)}
                            </div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 font-normal">
                              Sức chứa: {tbl.capacity || 2} khách
                            </div>
                          </div>
                          <span className="px-2.5 py-1 bg-[#38BDF8] text-[#090D16] text-[11px] font-extrabold rounded-lg shadow-xs group-hover:bg-[#0284c7] group-hover:text-white transition-colors">
                            Đổi sang bàn này
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

        {/* BOOKING CLOSING ALERT MODAL (< 30 PHÚT TRƯỚC GIỜ ĐÓNG CỬA) */}
        {closingAlertData && (
          <BookingClosingAlertModal
            isOpen={isClosingModalOpen}
            onClose={() => setIsClosingModalOpen(false)}
            onConfirm={() => {
              setIsClosingModalOpen(false);
              handleBookingSubmit(undefined, true);
            }}
            reservationTimeStr={closingAlertData.reservationTimeStr}
            closingTimeStr={closingAlertData.closingTimeStr}
            minutesUntilClosing={closingAlertData.minutesUntilClosing}
            isSubmitting={isSubmitting}
            lang={lang}
          />
        )}
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
    </div>
  );
}
