'use client';
import { AppIcon } from '@/components/common/DashboardIcon';

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
import { LanguageToggleSwitch } from '@/components/table/LanguageToggleSwitch';
import { SegmentedControl, ChoiceChips, PinInputBoxes, StatusDot, FormField, InlineAlert } from '@/components/ui';

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1')
  .trim()
  .replace(/[\r\n\t]+/g, '')
  .replace(/\/+$/, '');

const translations = {
  vi: {
    welcome: 'Kohi Coffee & Pastry',
    heroBadge: 'Cà phê đặc sản & Bánh tươi mỗi ngày',
    heroTitle: 'Đặt Bàn & Trải Nghiệm Không Gian',
    heroSubtitle: 'Thưởng thức từng tách cà phê rang xay thủ công cùng bánh ngọt tươi mới mỗi ngày. Giữ chỗ trước để chọn vị trí ưng ý nhất!',
    btnBookTab: 'Đặt Bàn Trực Tuyến',
    btnLookupTab: 'Tra Cứu Đặt Bàn',
    btnLogin: 'Nhân viên',
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
    guestCountLabel: 'SỐ LƯỢNG KHÁCH',
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
    heroBadge: 'Specialty Coffee & Fresh Pastries Daily',
    heroTitle: 'Reserve a Table & Enjoy Kohi',
    heroSubtitle: 'Savor handcrafted specialty coffee and fresh artisanal pastries. Reserve in advance to pick your ideal spot!',
    btnBookTab: 'Reserve a Table',
    btnLookupTab: 'Lookup Reservation',
    btnLogin: 'Staff',
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
    heroBadge: '精品特调咖啡与每日新鲜烘焙',
    heroTitle: '在线订座与惬意体验',
    heroSubtitle: '品味手工现磨咖啡与每日新鲜出炉糕点。提前留座，挑选心仪的舒适角落！',
    btnBookTab: '在线预订桌位',
    btnLookupTab: '查询预订',
    btnLogin: '员工',
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

    const socketBase = (process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001')
      .trim()
      .replace(/[\r\n\t]+/g, '')
      .replace(/\/+$/, '');
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
    <div className="fixed inset-0 w-full h-full flex flex-col overflow-hidden bg-[#F9FAFB] dark:bg-[#0E121B] text-slate-900 dark:text-slate-100 transition-colors duration-300 font-sans antialiased">
      {/* Top Header Bar (Fixed / Stationary: Không bao giờ cuộn) */}
      <header className="shrink-0 z-40 bg-white/95 dark:bg-[#0E121B]/95 border-b border-slate-200/80 dark:border-white/10 w-full shadow-xs backdrop-blur-xl">
        <div className="flex justify-between items-center w-full px-3.5 sm:px-6 md:px-12 py-4 sm:py-4.5 md:py-5 min-h-[72px] sm:min-h-[76px] md:min-h-[80px] max-w-7xl mx-auto gap-2">
          <BrandLogo onClick={() => router.push('/')} />

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Language Selector Dropdown (Component có sẵn: LanguageToggleSwitch) */}
            <LanguageToggleSwitch lang={lang} setLang={setLang} />

            {/* Light / Dark Mode Toggle Capsule */}
            <button
              type="button"
              aria-label={isDark ? 'Chuyển sang giao diện sáng' : 'Chuyển sang giao diện tối'}
              onClick={() => setTheme(isDark ? 'light' : 'dark')}
              className="flex items-center justify-center min-w-[40px] min-h-[40px] sm:min-w-[42px] sm:min-h-[42px] px-2.5 sm:px-3 sm:py-2 sm:gap-1.5 border border-slate-200 dark:border-slate-700/80 rounded-full bg-white dark:bg-slate-800/90 hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-colors shadow-2xs cursor-pointer shrink-0 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38BDF8]"
            >
              <svg
                className={`w-4 h-4 transition-colors ${
                  !isDark ? 'text-amber-500' : 'text-slate-400 dark:text-slate-500'
                } ${isDark ? 'hidden sm:block' : 'block'}`}
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  clipRule="evenodd"
                  d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"
                  fillRule="evenodd"
                />
              </svg>
              <span className="hidden sm:inline text-slate-300 dark:text-slate-600 font-normal">|</span>
              <svg
                className={`w-4 h-4 transition-colors ${
                  isDark ? 'text-amber-400 dark:text-amber-300' : 'text-slate-400'
                } ${!isDark ? 'hidden sm:block' : 'block'}`}
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
              </svg>
            </button>

            {/* Staff / Team Login Button */}
            <button
              type="button"
              onClick={() => router.push('/login')}
              aria-label={t.btnLogin || 'Đăng nhập nhân viên'}
              title={t.btnLogin || 'Đăng nhập nhân viên'}
              className="flex items-center justify-center min-w-[40px] min-h-[40px] sm:min-w-[42px] sm:min-h-[42px] rounded-full bg-slate-900 hover:bg-slate-800 dark:bg-sky-400 dark:hover:bg-sky-300 text-white dark:text-slate-950 shadow-2xs transition-all duration-150 cursor-pointer active:scale-95 shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38BDF8]"
            >
              <AppIcon name="users" className="text-lg sm:text-xl text-white dark:text-slate-950" />
            </button>
          </div>
        </div>
      </header>

      {/* Scrollable Container */}
      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain w-full scrollbar-thin" style={{ WebkitOverflowScrolling: 'touch' }}>
        <div className="min-h-full flex flex-col justify-between">
          {/* Main Container */}
          <main className="flex-1 pt-4 sm:pt-8 pb-12 px-3 sm:px-6 md:px-12 w-full max-w-7xl mx-auto overflow-x-hidden">
          {/* Hero Section */}
          <section className="text-center max-w-2xl mx-auto mb-8 sm:mb-10">
            <div className="mb-2.5 sm:mb-3">
              <span className="text-[11px] sm:text-xs font-bold uppercase tracking-[0.24em] text-[#0284c7] dark:text-[#38BDF8]">
                {t.heroBadge}
              </span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-2 sm:mb-3 text-balance">
              {t.heroTitle}
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-base leading-relaxed max-w-xl mx-auto">
              {t.heroSubtitle}
            </p>
          </section>

          {/* Tab Navigation: Đặt Bàn vs Tra Cứu (Name That UI Segmented Control) */}
          <div className="flex justify-center mb-8">
            <SegmentedControl<'reserve' | 'lookup'>
              value={activeTab}
              onChange={(tab) => {
                setActiveTab(tab);
                setError('');
              }}
              size="lg"
              fullWidth
              className="max-w-md w-full shadow-xs"
              options={[
                {
                  value: 'reserve',
                  label: t.btnBookTab,
                  icon: <AppIcon name="calendar_month" className="text-lg shrink-0" />,
                },
                {
                  value: 'lookup',
                  label: t.btnLookupTab,
                  icon: <AppIcon name="search" className="text-lg shrink-0" />,
                },
              ]}
            />
          </div>

          {/* TAB 1: TABLE RESERVATION MAIN GRID */}
          {activeTab === 'reserve' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start w-full min-w-0">
              {/* LEFT COLUMN: Sơ Đồ Chọn Bàn (7 Cols) */}
              <section className="lg:col-span-7 bg-white dark:bg-[#0d1322] rounded-3xl p-4 sm:p-7 border border-slate-200/80 dark:border-white/5 shadow-xs backdrop-blur-sm w-full min-w-0 max-w-full box-border" data-purpose="table-selection">
                {/* Header & Filter Toolbar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100 dark:border-white/5">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                      {t.selectTableLabel}
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {t.selectTableSub}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
                    {/* Filter Segmented Control (Name That UI) */}
                    <SegmentedControl<'all' | 'available'>
                      size="sm"
                      value={tableFilter}
                      onChange={(val) => {
                        setTableFilter(val);
                        setTablePage(1);
                      }}
                      options={[
                        { value: 'all', label: t.filterAll },
                        { value: 'available', label: t.filterAvailable },
                      ]}
                    />

                    {/* Refresh Button */}
                    <button
                      type="button"
                      onClick={fetchTables}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 bg-white dark:bg-white/5 border border-slate-200/80 dark:border-white/10 rounded-2xl hover:bg-slate-50 dark:hover:bg-white/10 transition-colors cursor-pointer shadow-2xs active:scale-95"
                    >
                      <AppIcon name="sync" className="text-sm" />
                      <span>{t.refreshMap}</span>
                    </button>
                  </div>
                </div>

                {/* Status Badges Legend (Name That UI StatusDot) */}
                <div className="flex flex-wrap items-center gap-5 sm:gap-6 py-3.5 text-xs font-bold text-slate-600 dark:text-slate-300 border-b border-slate-100 dark:border-white/5 mb-3">
                  <div className="flex items-center gap-2">
                    <StatusDot status="available" size="md" ping />
                    <span>{t.tableStatusEmpty}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusDot status="reserved" size="md" />
                    <span>{t.tableStatusReserved}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusDot status="serving" size="md" />
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
                          <button
                            key={tbl._id}
                            type="button"
                            aria-pressed="true"
                            aria-label={`${formattedName}, ${formattedFloor}, ${statusText}, Bàn đã chọn`}
                            onClick={() => {
                              setSelectedTable(tbl);
                              setError('');
                            }}
                            className="relative bg-sky-500/10 border-2 border-[#38BDF8] rounded-2xl p-3 sm:p-3.5 flex flex-col justify-between min-h-[100px] sm:min-h-[108px] w-full cursor-pointer shadow-[0_0_18px_rgba(56,189,248,0.22)] ring-2 ring-sky-500/20 transition-all select-none active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38BDF8] focus-visible:ring-offset-2"
                          >
                            <div className="flex items-center justify-between w-full">
                              <StatusDot status="available" size="sm" ping />
                              <span className="text-[10px] font-black text-[#0284c7] dark:text-[#38BDF8] uppercase tracking-wider">
                                {statusText}
                              </span>
                            </div>
                            <div className="text-center my-1 w-full">
                              <div className="font-black text-sm sm:text-base text-[#0284c7] dark:text-[#38BDF8]">
                                {formattedName}
                              </div>
                              <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                                {formattedFloor}
                              </div>
                            </div>
                          </button>
                        );
                      }

                      if (!isBookable) {
                        return (
                          <button
                            key={tbl._id}
                            type="button"
                            disabled
                            aria-disabled="true"
                            aria-label={`${formattedName}, ${formattedFloor}, ${statusText}, Bàn không khả dụng`}
                            className="relative bg-slate-50/60 dark:bg-white/[0.01] border border-slate-200/50 dark:border-white/5 rounded-2xl p-3 sm:p-3.5 flex flex-col justify-between min-h-[100px] sm:min-h-[108px] w-full cursor-not-allowed opacity-55 select-none text-left"
                          >
                            <div className="flex items-center justify-between w-full">
                              <StatusDot status={tbl.status === 'serving' ? 'serving' : 'reserved'} size="sm" />
                              <span className={`text-[10px] font-bold ${statusColorClass}`}>
                                {statusText}
                              </span>
                            </div>
                            <div className="text-center my-1 w-full">
                              <div className="font-extrabold text-sm sm:text-base text-slate-600 dark:text-slate-400">
                                {formattedName}
                              </div>
                              <div className="text-[11px] text-slate-400 dark:text-slate-500">
                                {formattedFloor}
                              </div>
                            </div>
                          </button>
                        );
                      }

                      return (
                        <button
                          key={tbl._id}
                          type="button"
                          aria-pressed="false"
                          aria-label={`${formattedName}, ${formattedFloor}, ${statusText}, Bấm để chọn bàn này`}
                          onClick={() => {
                            setSelectedTable(tbl);
                            setError('');
                          }}
                          className="relative bg-white dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/5 hover:border-[#38BDF8]/60 dark:hover:border-[#38BDF8]/50 hover:shadow-md rounded-2xl p-3 sm:p-3.5 flex flex-col justify-between min-h-[100px] sm:min-h-[108px] w-full cursor-pointer transition-all shadow-2xs text-left group select-none active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38BDF8] focus-visible:ring-offset-2"
                        >
                          <div className="flex items-center justify-between w-full">
                            <StatusDot status="available" size="sm" />
                            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                              {statusText}
                            </span>
                          </div>
                          <div className="text-center my-1 w-full">
                            <div className="font-extrabold text-sm sm:text-base text-slate-800 dark:text-slate-200 group-hover:text-[#0284c7] dark:group-hover:text-[#38BDF8] transition-colors">
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
                  <div className="flex flex-col sm:flex-row items-center justify-center sm:justify-between gap-3 sm:gap-4 pt-5 mt-4 border-t border-slate-100 dark:border-white/5 text-xs text-slate-500 dark:text-slate-400 select-none text-center sm:text-left">
                    <div className="text-center sm:text-left">
                      {lang === 'en' ? (
                        <>Showing <strong className="text-slate-800 dark:text-slate-200">{(currentPage - 1) * TABLES_PER_PAGE + 1} - {Math.min(currentPage * TABLES_PER_PAGE, filteredTables.length)}</strong> of <strong className="text-slate-800 dark:text-slate-200">{filteredTables.length}</strong> tables</>
                      ) : lang === 'zh' ? (
                        <>显示 <strong className="text-slate-800 dark:text-slate-200">{(currentPage - 1) * TABLES_PER_PAGE + 1} - {Math.min(currentPage * TABLES_PER_PAGE, filteredTables.length)}</strong> / <strong className="text-slate-800 dark:text-slate-200">{filteredTables.length}</strong> 桌</>
                      ) : (
                        <>Hiển thị <strong className="text-slate-800 dark:text-slate-200">{(currentPage - 1) * TABLES_PER_PAGE + 1} - {Math.min(currentPage * TABLES_PER_PAGE, filteredTables.length)}</strong> trong <strong className="text-slate-800 dark:text-slate-200">{filteredTables.length}</strong> bàn</>
                      )}
                    </div>

                    <div className="inline-flex items-center justify-center gap-1.5 sm:gap-2">
                      <button
                        type="button"
                        aria-label="Trang trước"
                        disabled={currentPage === 1}
                        onClick={() => setTablePage(p => Math.max(1, p - 1))}
                        className={`min-h-[44px] px-3.5 sm:px-4 py-2 rounded-2xl border transition-all text-xs font-bold active:scale-95 flex items-center justify-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38BDF8] ${
                          currentPage === 1
                            ? 'border-slate-200/60 dark:border-white/5 text-slate-300 dark:text-slate-700 bg-slate-50/50 dark:bg-white/[0.01] cursor-not-allowed'
                            : 'border-slate-200/80 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 cursor-pointer shadow-2xs'
                        }`}
                      >
                        <AppIcon name="chevron_left" className="text-sm" />
                        <span>{lang === 'en' ? 'Prev' : lang === 'zh' ? '上页' : 'Trước'}</span>
                      </button>

                      {Array.from({ length: totalTablePages }, (_, i) => i + 1).map((pageNum) => (
                        <button
                          key={pageNum}
                          type="button"
                          aria-label={`Trang ${pageNum}`}
                          aria-current={pageNum === currentPage ? 'page' : undefined}
                          onClick={() => setTablePage(pageNum)}
                          className={`min-w-[44px] min-h-[44px] rounded-2xl text-xs font-extrabold transition-all flex items-center justify-center cursor-pointer active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38BDF8] ${
                            pageNum === currentPage
                              ? 'bg-slate-900 text-white dark:bg-sky-400 dark:text-slate-950 shadow-xs'
                              : 'border border-slate-200/80 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5'
                          }`}
                        >
                          {pageNum}
                        </button>
                      ))}

                      <button
                        type="button"
                        aria-label="Trang sau"
                        disabled={currentPage === totalTablePages}
                        onClick={() => setTablePage(p => Math.min(totalTablePages, p + 1))}
                        className={`min-h-[44px] px-3.5 sm:px-4 py-2 rounded-2xl border transition-all text-xs font-bold active:scale-95 flex items-center justify-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38BDF8] ${
                          currentPage === totalTablePages
                            ? 'border-slate-200/60 dark:border-white/5 text-slate-300 dark:text-slate-700 bg-slate-50/50 dark:bg-white/[0.01] cursor-not-allowed'
                            : 'border-slate-200/80 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 cursor-pointer shadow-2xs'
                        }`}
                      >
                        <span>{lang === 'en' ? 'Next' : lang === 'zh' ? '下页' : 'Sau'}</span>
                        <AppIcon name="chevron_right" className="text-sm" />
                      </button>
                    </div>
                  </div>
                )}
              </section>

              {/* RIGHT COLUMN: Form Nhập Thông Tin Đặt Bàn (5 Cols) */}
              <section className="lg:col-span-5 bg-white dark:bg-[#0d1322] rounded-3xl p-4 sm:p-7 border border-slate-200/80 dark:border-white/5 shadow-xs backdrop-blur-sm h-fit lg:sticky lg:top-24 space-y-5 w-full min-w-0 max-w-full box-border" data-purpose="reservation-form">
                <div className="pb-5 border-b border-slate-100 dark:border-white/5">
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                    {t.bookingFormTitle}
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {t.bookingFormSub}
                  </p>
                </div>

                {/* Selected Table Callout Banner (Name That UI) */}
                <div className="bg-sky-50/80 dark:bg-sky-500/10 border border-[#38BDF8]/30 rounded-2xl p-4 flex items-center justify-between w-full min-w-0 shadow-xs">
                  <div>
                    <span className="block text-[11px] font-black text-[#0284c7] dark:text-[#38BDF8] tracking-widest uppercase">
                      {t.selectedTableLabel}
                    </span>
                    <span className="text-xl font-black text-slate-900 dark:text-white mt-0.5 block font-heading">
                      {selectedTable ? formatTableName(selectedTable.tableName, lang) : t.noTableSelected}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3.5 h-3.5 rounded-full bg-[#0284c7] dark:bg-[#38BDF8] ring-4 ring-sky-500/20 animate-pulse" />
                  </div>
                </div>

                {error && (
                  <InlineAlert severity="error">
                    {error}
                  </InlineAlert>
                )}

                <form onSubmit={handleBookingSubmit} className="space-y-4">
                  {/* Full Name */}
                  <FormField label={t.customerNameLabel} htmlFor="customer-name" required>
                    <input
                      id="customer-name"
                      name="customerName"
                      type="text"
                      required
                      placeholder={t.customerNamePlaceholder}
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full h-12 sm:h-11 rounded-2xl border border-slate-200/80 dark:border-white/10 bg-slate-50/80 dark:bg-white/[0.03] text-base sm:text-sm focus:bg-white dark:focus:bg-[#0d1322] focus:border-[#0284c7] dark:focus:border-[#38BDF8] focus:ring-2 focus:ring-[#38BDF8]/20 transition-all px-4 placeholder:text-slate-400 dark:placeholder:text-slate-500 text-slate-900 dark:text-slate-100 font-medium outline-none flex items-center"
                    />
                  </FormField>

                  {/* Phone Number */}
                  <FormField label={t.customerPhoneLabel} htmlFor="customer-phone" required>
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
                      className="w-full h-12 sm:h-11 rounded-2xl border border-slate-200/80 dark:border-white/10 bg-slate-50/80 dark:bg-white/[0.03] text-base sm:text-sm focus:bg-white dark:focus:bg-[#0d1322] focus:border-[#0284c7] dark:focus:border-[#38BDF8] focus:ring-2 focus:ring-[#38BDF8]/20 transition-all px-4 placeholder:text-slate-400 dark:placeholder:text-slate-500 text-slate-900 dark:text-slate-100 font-medium outline-none flex items-center"
                    />
                  </FormField>

                  {/* Reservation Time & Guest Count Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5 w-full min-w-0 items-end">
                    <div className="sm:col-span-7 w-full min-w-0">
                      <FormField label={t.reservationTimeLabel} htmlFor="reservation-time" required>
                        <div className="relative w-full min-w-0">
                          <input
                            id="reservation-time"
                            name="reservationTime"
                            type="datetime-local"
                            required
                            value={reservationTime}
                            onChange={(e) => setReservationTime(e.target.value)}
                            className="w-full h-12 sm:h-11 min-w-0 max-w-full rounded-2xl border border-slate-200/80 dark:border-white/10 bg-slate-50/80 dark:bg-white/[0.03] text-base sm:text-sm focus:bg-white dark:focus:bg-[#0d1322] focus:border-[#0284c7] dark:focus:border-[#38BDF8] focus:ring-2 focus:ring-[#38BDF8]/20 transition-all pl-4 pr-10 text-slate-900 dark:text-slate-100 font-medium outline-none flex items-center [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full"
                          />
                          <div className="absolute inset-y-0 right-0 flex items-center pr-3.5 pointer-events-none text-slate-400">
                            <AppIcon name="calendar_today" className="text-base" />
                          </div>
                        </div>
                      </FormField>
                    </div>

                    <div className="sm:col-span-5 w-full min-w-0">
                      <FormField label={t.guestCountLabel} htmlFor="guest-count" required>
                        <input
                          id="guest-count"
                          name="guestCount"
                          type="number"
                          min={1}
                          max={50}
                          required
                          value={guestCount}
                          onChange={(e) => setGuestCount(Number(e.target.value))}
                          className="w-full h-12 sm:h-11 rounded-2xl border border-slate-200/80 dark:border-white/10 bg-slate-50/80 dark:bg-white/[0.03] text-base sm:text-sm focus:bg-white dark:focus:bg-[#0d1322] focus:border-[#0284c7] dark:focus:border-[#38BDF8] focus:ring-2 focus:ring-[#38BDF8]/20 transition-all px-4 text-slate-900 dark:text-slate-100 font-medium text-center sm:text-left outline-none flex items-center"
                        />
                      </FormField>
                    </div>
                  </div>

                  {/* Quick Time Selection Pills (Name That UI ChoiceChips) */}
                  <div>
                    <div className="text-[11px] font-extrabold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">
                      {t.quickTimePresets}
                    </div>
                    <ChoiceChips
                      items={[
                        { value: '1h', label: t.presetIn1h },
                        { value: '2h', label: t.presetIn2h },
                        { value: 'tonight', label: t.presetTonight },
                        { value: 'tomorrow', label: t.presetTomorrowNoon },
                      ]}
                      onSelect={(val) => {
                        if (val === '1h') setPresetTime(1);
                        else if (val === '2h') setPresetTime(2);
                        else if (val === 'tonight') setSpecificTimePreset(19, false);
                        else if (val === 'tomorrow') setSpecificTimePreset(12, true);
                      }}
                    />
                  </div>

                  {/* Special Requests / Notes */}
                  <FormField label={t.noteLabel} htmlFor="special-notes">
                    <textarea
                      id="special-notes"
                      name="specialNotes"
                      rows={3}
                      placeholder={t.notePlaceholder}
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      className="w-full rounded-2xl border border-slate-200/80 dark:border-white/10 bg-slate-50/80 dark:bg-white/[0.03] text-base sm:text-sm focus:bg-white dark:focus:bg-[#0d1322] focus:border-[#0284c7] dark:focus:border-[#38BDF8] focus:ring-2 focus:ring-[#38BDF8]/20 transition-all p-4 placeholder:text-slate-400 dark:placeholder:text-slate-500 text-slate-900 dark:text-slate-100 resize-none outline-none font-medium min-h-[96px]"
                    />
                  </FormField>

                  {/* Submit CTA Button */}
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isSubmitting || !selectedTable}
                      className="w-full py-4 px-6 rounded-2xl text-white dark:text-slate-950 bg-slate-900 hover:bg-slate-800 dark:bg-sky-400 dark:hover:bg-sky-300 active:scale-[0.98] font-black text-sm sm:text-base tracking-wide shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 min-h-[52px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38BDF8] focus-visible:ring-offset-2"
                    >
                      <span>{isSubmitting ? t.btnSubmitting : t.btnSubmitBooking}</span>
                      <AppIcon name="arrow_forward" className="text-lg" />
                    </button>
                  </div>
                </form>
              </section>
            </div>
          )}

          {/* TAB 2: LOOKUP & CUSTOMER CANCEL RESERVATIONS */}
          {activeTab === 'lookup' && (
            <div className="max-w-xl mx-auto bg-white dark:bg-[#0d1322] border border-slate-200/80 dark:border-white/10 rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm backdrop-blur-sm transition-all font-sans">
              <div className="text-center space-y-1.5">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-sky-500/10 text-[#0284c7] dark:text-[#38BDF8] mb-1">
                  <AppIcon name="search" className="text-2xl" />
                </div>
                <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                  {t.lookupTitle}
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
                  {t.lookupSubtitle}
                </p>
              </div>

              {error && (
                <InlineAlert
                  severity="error"
                  dismissible
                  onDismiss={() => setError('')}
                >
                  {error}
                </InlineAlert>
              )}

              {/* Modern Search Input Bar (Name That UI Style) */}
              <form onSubmit={handleLookupSubmit} className="flex flex-col sm:flex-row gap-2.5">
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                    <AppIcon name="phone" className="text-lg" />
                  </div>
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
                    className="w-full h-12 rounded-2xl pl-11 pr-4 bg-slate-50/80 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/10 text-slate-900 dark:text-white text-base sm:text-sm placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:bg-white dark:focus:bg-[#090D16] focus:border-[#0284c7] dark:focus:border-[#38BDF8] focus:ring-2 focus:ring-[#38BDF8]/20 transition-all flex items-center"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSearchingLookup}
                  className="h-12 min-h-[48px] px-6 bg-slate-900 hover:bg-slate-800 dark:bg-sky-400 dark:hover:bg-sky-300 text-white dark:text-slate-950 font-black rounded-2xl text-xs sm:text-sm uppercase tracking-wider transition-all shadow-md active:scale-[0.98] flex items-center justify-center gap-2 shrink-0 cursor-pointer disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38BDF8]"
                >
                  <AppIcon name="search" className="text-base" />
                  <span>{isSearchingLookup ? t.btnSearching : t.btnSearchNow}</span>
                </button>
              </form>

              {hasSearchedLookup && (
                <div className="space-y-4 pt-2">
                  {lookupResults.length === 0 ? (
                    <div className="bg-slate-50/80 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/5 rounded-2xl p-6 text-center space-y-2">
                      <div className="w-10 h-10 mx-auto rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-400">
                        <AppIcon name="search_off" className="text-xl" />
                      </div>
                      <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
                        {lang === 'en' ? 'No reservation found matching phone number ' : 'Không tìm thấy đơn đặt bàn nào với số điện thoại '}
                        <span className="font-extrabold text-[#0284c7] dark:text-[#38BDF8]">{lookupPhone}</span>.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3.5">
                      <div className="flex items-center justify-between text-xs sm:text-sm font-extrabold text-slate-600 dark:text-slate-300 px-1">
                        <span>
                          {lang === 'en' ? `Found ${lookupResults.length} reservation(s):` : `Tìm thấy ${lookupResults.length} đơn đặt bàn:`}
                        </span>
                        <span className="text-[11px] font-bold text-slate-400">
                          {lookupPhone}
                        </span>
                      </div>

                      {lookupResults.map((res) => {
                        let statusColor = 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
                        let statusDotType: 'available' | 'serving' | 'reserved' | 'cancelled' | 'offline' = 'reserved';
                        let statusLabel = lang === 'en' ? 'Pending Staff Approval' : 'Chờ phục vụ duyệt';

                        if (res.status === 'confirmed') {
                          statusColor = 'bg-sky-500/10 text-[#0284c7] dark:text-[#38BDF8] border-sky-500/30';
                          statusDotType = 'available';
                          statusLabel = lang === 'en' ? 'Confirmed' : 'Đã duyệt thành công';
                        } else if (res.status === 'arrived') {
                          if (res.tableId?.status === 'serving' || !res.tableId?.status) {
                            statusColor = 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
                            statusDotType = 'serving';
                            statusLabel = lang === 'en' ? 'Arrived / In Service' : 'Khách đã đến';
                          } else {
                            statusColor = 'bg-slate-500/10 text-slate-500 dark:text-slate-400 border-slate-500/20';
                            statusDotType = 'offline';
                            statusLabel = lang === 'en' ? 'Completed Session' : 'Đã hoàn tất phiên';
                          }
                        } else if (res.status === 'completed') {
                          statusColor = 'bg-slate-500/10 text-slate-500 dark:text-slate-400 border-slate-500/20';
                          statusDotType = 'offline';
                          statusLabel = lang === 'en' ? 'Completed Session' : 'Đã hoàn tất phiên';
                        } else if (res.status === 'cancelled') {
                          statusColor = 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20';
                          statusDotType = 'cancelled';
                          statusLabel = lang === 'en' ? 'Cancelled' : 'Đã hủy';
                        }

                        const isPending = res.status === 'pending';
                        const isConfirmed = res.status === 'confirmed';
                        const isCompleted = res.status === 'completed' || (res.status === 'arrived' && res.tableId?.status === 'empty');
                        const canEnterTable = res.status === 'arrived' && res.tableId?.status === 'serving';
                        const targetTableId = res.tableId?._id || res.tableId;
                        const tableNameStr = formatTableName(res.tableId?.tableName, lang);

                        return (
                          <div
                            key={res._id}
                            className="bg-white dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/10 p-4 sm:p-5 rounded-3xl space-y-3.5 shadow-xs hover:border-[#38BDF8]/40 hover:shadow-md transition-all"
                          >
                            {/* Card Header */}
                            <div className="flex justify-between items-start gap-2">
                              <div>
                                <h4 className="font-extrabold text-slate-900 dark:text-white text-base">
                                  {res.customerName}
                                </h4>
                                <p className="text-xs text-[#0284c7] dark:text-[#38BDF8] font-bold mt-0.5">
                                  {res.customerPhone}
                                </p>
                              </div>
                              <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold border ${statusColor}`}>
                                <StatusDot status={statusDotType} ping={isPending || isConfirmed} size="sm" />
                                <span>{statusLabel}</span>
                              </div>
                            </div>

                            {/* Card Details Micro-Grid */}
                            <div className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-white/[0.03] border border-slate-200/60 dark:border-white/5 space-y-2 text-xs sm:text-sm">
                              <div className="flex justify-between items-center">
                                <span className="text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1.5">
                                  <AppIcon name="table_restaurant" className="text-sm text-slate-400" />
                                  {lang === 'en' ? 'Selected Table:' : lang === 'zh' ? '预订桌位：' : 'Bàn chọn:'}
                                </span>
                                <span className="font-black text-slate-900 dark:text-white">{tableNameStr}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1.5">
                                  <AppIcon name="schedule" className="text-sm text-slate-400" />
                                  {lang === 'en' ? 'Reservation Time:' : lang === 'zh' ? '入座时间：' : 'Thời gian nhận bàn:'}
                                </span>
                                <span className="font-extrabold text-slate-900 dark:text-white">
                                  {new Date(res.reservationTime).toLocaleString(lang === 'en' ? 'en-US' : lang === 'zh' ? 'zh-CN' : 'vi-VN')}
                                </span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1.5">
                                  <AppIcon name="groups" className="text-sm text-slate-400" />
                                  {lang === 'en' ? 'Guest Count:' : lang === 'zh' ? '顾客人数：' : 'Số lượng khách:'}
                                </span>
                                <span className="font-extrabold text-slate-900 dark:text-white">
                                  {res.guestCount} {lang === 'en' ? 'guests' : lang === 'zh' ? '人' : 'người'}
                                </span>
                              </div>

                              {isConfirmed && (
                                <div className="mt-2 pt-2 border-t border-slate-200/60 dark:border-white/5 flex justify-between items-center">
                                  <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                                    <AppIcon name="lock" className="text-sm text-[#0284c7] dark:text-[#38BDF8]" />
                                    Mã nhận bàn:
                                  </span>
                                  <span className="font-mono font-black tracking-widest text-xs text-slate-500 dark:text-slate-400 bg-white dark:bg-[#090D16] px-2.5 py-1 rounded-lg border border-slate-200/80 dark:border-white/10 shadow-xs">
                                    •••• (Bảo mật - chỉ cấp 1 lần)
                                  </span>
                                </div>
                              )}

                              {res.note && (
                                <div className="mt-2 pt-2 border-t border-slate-200/60 dark:border-white/5 text-xs text-amber-600 dark:text-amber-400 italic font-medium">
                                  {lang === 'en' ? 'Note: ' : lang === 'zh' ? '备注：' : 'Ghi chú: '}{res.note}
                                </div>
                              )}
                            </div>

                            {/* Actions Group */}
                            {canEnterTable && targetTableId && (
                              <button
                                type="button"
                                onClick={() => router.push(`/table/${targetTableId}`)}
                                className="w-full min-h-[50px] py-3.5 bg-slate-900 hover:bg-slate-800 dark:bg-sky-400 dark:hover:bg-sky-300 text-white dark:text-slate-950 font-black text-xs sm:text-sm uppercase tracking-wider rounded-2xl transition-all shadow-md active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38BDF8]"
                              >
                                <span>{lang === 'en' ? `GO TO TABLE ORDER (${tableNameStr})` : lang === 'zh' ? `进入桌位点餐 (${tableNameStr})` : `VÀO BÀN GỌI MÓN (${tableNameStr})`}</span>
                                <AppIcon name="arrow_forward" className="text-base" />
                              </button>
                            )}

                            {isCompleted && (
                              <div className="p-3.5 rounded-2xl bg-slate-100/70 dark:bg-white/[0.02] border border-slate-200/60 dark:border-white/5 text-xs text-slate-500 dark:text-slate-400 text-center font-medium leading-relaxed">
                                {lang === 'en' ? 'This reservation session has ended. Thank you for visiting KOHI Coffee!' : 'Phiên đặt bàn này đã kết thúc. Cảm ơn quý khách đã ghé thăm KOHI Coffee!'}
                              </div>
                            )}

                            {isPending && (
                              <div className="space-y-2.5">
                                <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-700 dark:text-amber-400 font-medium leading-relaxed">
                                  Đơn đặt bàn đang chờ nhân viên phục vụ duyệt. Quý khách vui lòng chờ trong giây lát.
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleCustomerCancelReservation(res._id)}
                                  className="w-full min-h-[46px] py-3 bg-rose-500/10 hover:bg-rose-500 hover:text-white text-rose-500 border border-rose-500/20 text-xs sm:text-sm font-bold rounded-2xl transition-all flex items-center justify-center cursor-pointer active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
                                >
                                  {lang === 'en' ? 'CANCEL THIS RESERVATION' : lang === 'zh' ? '取消此预订' : 'HỦY ĐƠN ĐẶT BÀN NÀY'}
                                </button>
                              </div>
                            )}

                            {isConfirmed && targetTableId && (
                              <div className="space-y-2.5">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setPinModalRes(res);
                                    setPinInput('');
                                    setPinError('');
                                  }}
                                  className="w-full min-h-[50px] py-3.5 bg-[#38BDF8] hover:bg-[#0284c7] text-[#090D16] hover:text-white font-black text-xs sm:text-sm uppercase tracking-wider rounded-2xl transition-all shadow-md active:scale-[0.98] cursor-pointer flex items-center justify-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38BDF8]"
                                >
                                  <AppIcon name="pin" className="text-base" />
                                  <span>{lang === 'en' ? `I HAVE ARRIVED - ENTER PIN (${tableNameStr})` : `TÔI ĐÃ ĐẾN - NHẬP MÃ VÀO BÀN (${tableNameStr})`}</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleCustomerCancelReservation(res._id)}
                                  className="w-full min-h-[46px] py-3 bg-rose-500/10 hover:bg-rose-500 hover:text-white text-rose-500 border border-rose-500/20 text-xs sm:text-sm font-bold rounded-2xl transition-all flex items-center justify-center cursor-pointer active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
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

        {/* BOOKING SUCCESS MODAL POPUP (Receipt / Voucher Card Style) */}
        <AnimatePresence>
          {bookingSuccess && (
            <div role="dialog" aria-modal="true" aria-labelledby="booking-success-title" className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 select-none overflow-y-auto">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setBookingSuccess(null)}
                className="fixed inset-0 bg-slate-950/70 backdrop-blur-md"
              />

              <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 15 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 15 }}
                transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                className="relative w-full max-w-md rounded-3xl bg-white dark:bg-[#0F172A] border border-slate-200/80 dark:border-white/10 p-6 sm:p-8 text-center space-y-5 shadow-2xl z-10 font-sans my-auto max-h-[92vh] flex flex-col overflow-y-auto scrollbar-thin"
              >
                {/* Status Icon */}
                <div className="mx-auto w-14 h-14 rounded-2xl bg-sky-500/10 dark:bg-sky-400/10 border border-[#38BDF8]/30 flex items-center justify-center text-[#0284c7] dark:text-[#38BDF8]">
                  <AppIcon name="check_circle" className="text-3xl" />
                </div>

                <div className="space-y-1.5">
                  <h3 id="booking-success-title" className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                    {bookingSuccess.status === 'confirmed' ? 'Đặt Bàn Đã Được Duyệt!' : 'Đã Gửi Yêu Cầu Giữ Chỗ!'}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                    {bookingSuccess.status === 'confirmed'
                      ? 'Nhân viên phục vụ đã duyệt đơn đặt bàn của quý khách.'
                      : 'Đơn đặt bàn của bạn đã gửi đến quán và đang chờ nhân viên phục vụ duyệt.'}
                  </p>
                </div>

                {/* Ticket / Check-in PIN Voucher */}
                {bookingSuccess.checkInCode ? (
                  <div className="p-4 rounded-2xl bg-sky-500/10 border border-[#38BDF8]/40 flex flex-col items-center justify-center gap-1.5 text-center shadow-xs">
                    <span className="text-[11px] font-extrabold text-[#0284c7] dark:text-[#38BDF8] tracking-widest uppercase">
                      MÃ NHẬN BÀN CỦA BẠN
                    </span>
                    <span className="font-mono font-black text-3xl sm:text-4xl tracking-[0.3em] text-[#090D16] dark:text-white bg-white dark:bg-[#090D16] px-6 py-2 rounded-2xl border border-[#38BDF8]/40 shadow-xs">
                      {bookingSuccess.checkInCode}
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                      Vui lòng nhập mã này khi tra cứu SĐT tại quán để vào bàn gọi món
                    </span>
                  </div>
                ) : (
                  <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-left flex items-start gap-3">
                    <AppIcon name="info" className="text-lg text-amber-600 shrink-0 mt-0.5" />
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

                {/* Receipt Details Container */}
                <div className="space-y-2 text-xs sm:text-sm text-left p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/10">
                  <div className="flex justify-between items-center px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-white/5">
                    <span className="text-slate-500 dark:text-slate-400 font-medium">
                      {lang === 'en' ? 'Customer Name' : lang === 'zh' ? '顾客姓名' : 'Khách hàng'}
                    </span>
                    <span className="font-extrabold text-slate-900 dark:text-white">{bookingSuccess.customerName}</span>
                  </div>

                  <div className="flex justify-between items-center px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-white/5">
                    <span className="text-slate-500 dark:text-slate-400 font-medium">
                      {lang === 'en' ? 'Phone Number' : lang === 'zh' ? '联系电话' : 'Số điện thoại'}
                    </span>
                    <span className="font-extrabold text-[#0284c7] dark:text-[#38BDF8]">{bookingSuccess.customerPhone}</span>
                  </div>

                  <div className="flex justify-between items-center px-3.5 py-2.5 rounded-xl bg-sky-500/10 border border-[#38BDF8]/30">
                    <span className="text-[#0284c7] dark:text-[#38BDF8] font-bold">
                      {lang === 'en' ? 'Reserved Table' : lang === 'zh' ? '预订桌位' : 'Bàn giữ chỗ'}
                    </span>
                    <span className="font-black text-[#0284c7] dark:text-[#38BDF8] tracking-wide">
                      {formatTableName(bookingSuccess.tableId?.tableName, lang)}
                    </span>
                  </div>

                  <div className="flex justify-between items-center px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-white/5">
                    <span className="text-slate-500 dark:text-slate-400 font-medium">
                      {lang === 'en' ? 'Reservation Time' : lang === 'zh' ? '入座时间' : 'Thời gian nhận bàn'}
                    </span>
                    <span className="font-extrabold text-slate-900 dark:text-white">
                      {new Date(bookingSuccess.reservationTime).toLocaleString(lang === 'en' ? 'en-US' : lang === 'zh' ? 'zh-CN' : 'vi-VN')}
                    </span>
                  </div>

                  <div className="flex justify-between items-center px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-white/5">
                    <span className="text-slate-500 dark:text-slate-400 font-medium">
                      {lang === 'en' ? 'Guest Count' : lang === 'zh' ? '顾客人数' : 'Số lượng khách'}
                    </span>
                    <span className="font-extrabold text-slate-900 dark:text-white">
                      {bookingSuccess.guestCount} {lang === 'en' ? 'guests' : lang === 'zh' ? '人' : 'người'}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setBookingSuccess(null)}
                  className="w-full min-h-[48px] py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 dark:bg-sky-400 dark:hover:bg-sky-300 text-white dark:text-slate-950 font-black text-xs sm:text-sm uppercase tracking-wider transition-all shadow-md active:scale-[0.98] cursor-pointer flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38BDF8]"
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
            <div role="dialog" aria-modal="true" aria-labelledby="pin-modal-title" className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 select-none overflow-y-auto">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setPinModalRes(null)}
                className="fixed inset-0 bg-slate-950/70 backdrop-blur-md"
              />
              <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 15 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 15 }}
                transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                className="relative w-full max-w-sm rounded-3xl bg-white dark:bg-[#0F172A] border border-slate-200/80 dark:border-white/10 p-6 sm:p-7 text-center space-y-5 shadow-2xl z-10 font-sans my-auto max-h-[92vh] flex flex-col overflow-y-auto scrollbar-thin"
              >
                <div className="mx-auto w-12 h-12 rounded-2xl bg-sky-500/10 text-[#0284c7] dark:text-[#38BDF8] flex items-center justify-center">
                  <AppIcon name="lock" className="text-2xl" />
                </div>

                <div className="space-y-1">
                  <h3 id="pin-modal-title" className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                    Nhập Mã Nhận Bàn
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                    Vui lòng nhập mã PIN 4 chữ số được cấp khi nhân viên phục vụ duyệt đơn để nhận{' '}
                    <strong className="text-slate-900 dark:text-slate-100 font-extrabold">
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
                  <PinInputBoxes
                    length={4}
                    value={pinInput}
                    onChange={(val) => {
                      setPinInput(val);
                      if (pinError) setPinError('');
                    }}
                    error={pinError}
                    autoFocus
                  />

                  <div className="flex gap-2.5 pt-1">
                    <button
                      type="button"
                      onClick={() => setPinModalRes(null)}
                      className="flex-1 min-h-[48px] border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 font-extrabold text-xs sm:text-sm rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
                    >
                      Đóng
                    </button>
                    <button
                      type="submit"
                      disabled={pinInput.length !== 4 || isVerifyingPin}
                      className="flex-1 min-h-[48px] bg-slate-900 hover:bg-slate-800 dark:bg-sky-400 dark:hover:bg-sky-300 text-white dark:text-slate-950 font-black text-xs sm:text-sm uppercase tracking-wider rounded-2xl transition-all shadow-md active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none cursor-pointer flex items-center justify-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38BDF8]"
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
            <div role="dialog" aria-modal="true" aria-labelledby="occupied-modal-title" className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 select-none overflow-y-auto">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setOccupiedData(null)}
                className="fixed inset-0 bg-slate-950/70 backdrop-blur-md"
              />
              <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 15 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 15 }}
                transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                className="relative w-full max-w-md rounded-3xl bg-white dark:bg-[#0F172A] border border-slate-200/80 dark:border-white/10 p-6 sm:p-7 space-y-5 shadow-2xl z-10 font-sans my-auto max-h-[92vh] flex flex-col overflow-y-auto scrollbar-thin"
              >
                <div className="space-y-1.5 text-left">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-extrabold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 mb-1">
                    <AppIcon name="warning" className="text-sm" />
                    <span>Bàn đang bận trước giờ hẹn</span>
                  </div>
                  <h3 id="occupied-modal-title" className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                    Bàn Hiện Đang Có Khách Ngồi
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                    Bàn <strong>{formatTableName(occupiedData.currentTable?.tableName, lang)}</strong> hiện đang phục vụ khách trước giờ hẹn của bạn.
                  </p>
                </div>

                <div className="space-y-2 text-left">
                  <span className="text-xs font-extrabold text-slate-700 dark:text-slate-300">
                    Gợi ý bàn trống sẵn sàng đón bạn ngay:
                  </span>
                  {occupiedData.suggestedTables.length === 0 ? (
                    <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-900 text-xs text-center text-slate-500 font-medium">
                      Hiện các bàn khác đều đang bận. Bạn vui lòng chờ đến giờ hẹn để nhận bàn cũ nhé!
                    </div>
                  ) : (
                    <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1.5 table-scroll-container scroll-smooth">
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
                          className="w-full min-h-[56px] p-3.5 rounded-2xl border border-slate-200/80 dark:border-white/10 hover:border-[#38BDF8] bg-slate-50/60 dark:bg-white/[0.02] hover:bg-sky-500/10 text-left transition-all flex justify-between items-center group cursor-pointer focus-visible:ring-2 focus-visible:ring-[#38BDF8] focus-visible:outline-none active:scale-[0.99]"
                        >
                          <div>
                            <div className="font-extrabold text-slate-900 dark:text-white text-sm group-hover:text-[#0284c7] dark:group-hover:text-[#38BDF8] transition-colors">
                              {formatTableName(tbl.tableName, lang)}
                            </div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                              Sức chứa: {tbl.capacity || 2} khách
                            </div>
                          </div>
                          <span className="min-h-[36px] px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 dark:bg-sky-400 dark:hover:bg-sky-300 text-white dark:text-slate-950 text-xs font-black rounded-xl shadow-xs transition-all flex items-center justify-center">
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
                    className="w-full min-h-[48px] border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 font-extrabold text-xs sm:text-sm rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
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
            <div role="dialog" aria-modal="true" aria-labelledby="onetime-code-title" className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 select-none overflow-y-auto">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-slate-950/75 backdrop-blur-md"
              />
              <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 15 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 15 }}
                transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                className="relative w-full max-w-sm rounded-3xl bg-white dark:bg-[#0F172A] border border-slate-200/80 dark:border-white/10 p-6 sm:p-7 text-center space-y-6 shadow-2xl z-10 font-sans my-auto max-h-[92vh] flex flex-col overflow-y-auto scrollbar-thin"
              >
                {/* Header */}
                <div className="space-y-1">
                  <div className="mx-auto w-12 h-12 rounded-2xl bg-sky-500/10 text-[#0284c7] dark:text-[#38BDF8] flex items-center justify-center mb-2">
                    <AppIcon name="verified" className="text-2xl" />
                  </div>
                  <h3 id="onetime-code-title" className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                    Mã Nhận Bàn
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    Đơn đặt bàn của bạn đã được nhân viên duyệt thành công.
                  </p>
                </div>

                {/* 4-digit Passcode Display (Minimalist Fintech / Apple OTP Style) */}
                <div className="py-1">
                  <div className="flex justify-center items-center gap-2.5 sm:gap-3">
                    {oneTimeCodeData.code.split('').map((digit: string, idx: number) => (
                      <div
                        key={idx}
                        className="w-12 h-14 sm:w-14 sm:h-16 rounded-2xl bg-slate-50 dark:bg-slate-900/90 border-2 border-slate-200 dark:border-slate-800 flex items-center justify-center font-mono text-2xl sm:text-3xl font-black text-slate-900 dark:text-white shadow-xs"
                      >
                        {digit}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Discreet Alert Notice */}
                <div className="text-[11px] text-amber-700 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 py-2.5 px-3.5 rounded-2xl text-center leading-relaxed font-medium">
                  Mã chỉ hiển thị <strong>1 lần duy nhất</strong>. Khi đến quán, bạn hãy bấm <strong>&ldquo;Tôi đã đến&rdquo;</strong> và nhập 4 số này để vào bàn.
                </div>

                {/* Action Button */}
                <button
                  type="button"
                  onClick={handleAcknowledgeOneTimeCode}
                  className="w-full min-h-[50px] bg-slate-900 hover:bg-slate-800 dark:bg-sky-400 dark:hover:bg-sky-300 text-white dark:text-slate-950 font-black text-xs sm:text-sm uppercase tracking-wider rounded-2xl transition-all shadow-md active:scale-[0.98] cursor-pointer flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38BDF8]"
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
      <footer className="shrink-0 bg-white/90 dark:bg-[#090D16]/95 border-t border-slate-200/80 dark:border-white/10 mt-auto w-full backdrop-blur-md">
        <div className="flex flex-col md:flex-row justify-between items-center w-full px-4 md:px-12 py-4 sm:py-5 max-w-7xl mx-auto gap-3 sm:gap-4">
          <div className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 text-center md:text-left leading-relaxed">
            <span className="font-semibold text-slate-700 dark:text-slate-300">© {new Date().getFullYear()} Kohi Coffee & Pastry.</span>{' '}
            <span className="text-slate-500 dark:text-slate-400 block sm:inline mt-0.5 sm:mt-0">
              Smart Online Reservation & QR Solution.
            </span>
          </div>
          <div className="flex items-center justify-center flex-wrap gap-x-3.5 sm:gap-x-5 gap-y-1 text-[11px] sm:text-xs font-medium">
            <Link href="/privacy" className="text-slate-500 dark:text-slate-400 hover:text-[#38BDF8] dark:hover:text-[#38BDF8] transition-colors">
              {lang === 'en' ? 'Privacy Policy' : lang === 'zh' ? '隐私政策' : 'Chính sách bảo mật'}
            </Link>
            <span className="text-slate-300 dark:text-slate-700 select-none text-[10px]">·</span>
            <Link href="/terms" className="text-slate-500 dark:text-slate-400 hover:text-[#38BDF8] dark:hover:text-[#38BDF8] transition-colors">
              {lang === 'en' ? 'Terms of Service' : lang === 'zh' ? '服务条款' : 'Điều khoản dịch vụ'}
            </Link>
            <span className="text-slate-300 dark:text-slate-700 select-none text-[10px]">·</span>
            <Link href="/contact" className="text-slate-500 dark:text-slate-400 hover:text-[#38BDF8] dark:hover:text-[#38BDF8] transition-colors">
              {lang === 'en' ? 'Contact Us' : lang === 'zh' ? '联系我们' : 'Liên hệ chúng tôi'}
            </Link>
          </div>
        </div>
      </footer>
        </div>
      </div>
    </div>
  );
}
