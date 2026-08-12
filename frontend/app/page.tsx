'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { Html5Qrcode } from 'html5-qrcode';
import { playScanBeep, playWelcomeChime } from './utils/sound';
import { ThemeToggleSwitch } from '@/components/table/ThemeToggleSwitch';
import { LanguageToggleSwitch, Lang } from '@/components/table/LanguageToggleSwitch';
import { BrandLogo } from '@/components/table/BrandLogo';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

const translations = {
  vi: {
    welcome: 'Kohi Coffee & Pastry',
    heroTitle: 'Đặt Bàn & Giữ Chỗ Trực Tuyến',
    heroSubtitle: 'Thưởng thức cà phê rang xay thủ công & bánh ngọt tươi mới. Giữ chỗ trước để có vị trí đẹp nhất!',
    btnBookTab: 'Đặt Bàn Trực Tuyến',
    btnQrTab: 'Vào Bàn Qua Mã QR',
    btnLogin: 'Đăng nhập Nhân viên',
    selectTableLabel: '1. Chọn bàn ăn phù hợp',
    tableStatusEmpty: 'Bàn trống',
    tableStatusServing: 'Đang có khách',
    tableStatusReserved: 'Đã giữ chỗ',
    bookingFormTitle: '2. Nhập thông tin đặt bàn',
    customerNameLabel: 'Họ và tên khách hàng',
    customerNamePlaceholder: 'Ví dụ: Nguyễn Văn An',
    customerPhoneLabel: 'Số điện thoại liên hệ',
    customerPhonePlaceholder: 'Ví dụ: 0901234567',
    reservationTimeLabel: 'Thời gian nhận bàn',
    guestCountLabel: 'Số lượng khách hàng',
    selectedTableLabel: 'Bàn ăn được chọn',
    noTableSelected: 'Vui lòng bấm chọn 1 bàn ở sơ đồ bên trái',
    noteLabel: 'Ghi chú thêm',
    notePlaceholder: 'Ví dụ: Cần bàn gần cửa sổ, ghế trẻ em, không gian yên tĩnh...',
    btnSubmitBooking: 'XÁC NHẬN ĐẶT BÀN NGAY',
    bookingSuccessTitle: 'Đặt bàn thành công!',
    bookingSuccessSubtitle: 'Đơn đặt bàn của bạn đã được chuyển đến hệ thống Kohi Coffee.',
    manualLabel: 'HOẶC NHẬP SỐ BÀN THỦ CÔNG',
    manualPlaceholder: 'Ví dụ: Bàn 1, Bàn 2...',
    enterButton: 'VÀO BÀN NGAY',
    helpText: 'Cho phép truy cập camera để tự động quét mã QR trên bàn.',
    errEmpty: 'Vui lòng nhập số bàn hoặc quét mã QR!',
    errNotFound: 'Không tìm thấy bàn nào ứng với số hoặc tên: "{input}"',
  },
  en: {
    welcome: 'Kohi Coffee & Pastry',
    heroTitle: 'Online Table Reservation & Booking',
    heroSubtitle: 'Enjoy handcrafted specialty coffee & fresh pastries. Book in advance to secure the best seats!',
    btnBookTab: 'Reserve a Table',
    btnQrTab: 'Enter via Table QR',
    btnLogin: 'Staff Login',
    selectTableLabel: '1. Select Your Table',
    tableStatusEmpty: 'Available',
    tableStatusServing: 'Occupied',
    tableStatusReserved: 'Reserved',
    bookingFormTitle: '2. Reservation Details',
    customerNameLabel: 'Full Name',
    customerNamePlaceholder: 'E.g. John Doe',
    customerPhoneLabel: 'Phone Number',
    customerPhonePlaceholder: 'E.g. +84 901 234 567',
    reservationTimeLabel: 'Reservation Date & Time',
    guestCountLabel: 'Number of Guests',
    selectedTableLabel: 'Selected Table',
    noTableSelected: 'Please click on a table from the left map',
    noteLabel: 'Special Requests / Notes',
    notePlaceholder: 'E.g. Window seat, baby chair, quiet area...',
    btnSubmitBooking: 'CONFIRM RESERVATION NOW',
    bookingSuccessTitle: 'Booking Successful!',
    bookingSuccessSubtitle: 'Your table reservation has been recorded by Kohi Coffee.',
    manualLabel: 'OR ENTER TABLE NUMBER MANUALLY',
    manualPlaceholder: 'E.g. Table 1, Table 2...',
    enterButton: 'ENTER TABLE NOW',
    helpText: 'Allow camera access to automatically scan table QR codes.',
    errEmpty: 'Please enter a table number or scan a QR code!',
    errNotFound: 'No table found matching: "{input}"',
  },
  zh: {
    welcome: 'Kohi Coffee & Pastry',
    heroTitle: '在线预订桌位与留座',
    heroSubtitle: '享用手工精制咖啡与新鲜糕点。提前预订以获得最佳位置！',
    btnBookTab: '在线预订桌位',
    btnQrTab: '扫码入座',
    btnLogin: '员工登录',
    selectTableLabel: '1. 选择合适桌位',
    tableStatusEmpty: '空桌',
    tableStatusServing: '使用中',
    tableStatusReserved: '已预订',
    bookingFormTitle: '2. 填写预订信息',
    customerNameLabel: '顾客姓名',
    customerNamePlaceholder: '例如：张三',
    customerPhoneLabel: '联系电话',
    customerPhonePlaceholder: '例如：13800138000',
    reservationTimeLabel: '入座时间',
    guestCountLabel: '顾客人数',
    selectedTableLabel: '已选桌位',
    noTableSelected: '请在左侧地图中点击选择桌位',
    noteLabel: '特殊要求 / 备注',
    notePlaceholder: '例如：靠窗座位、婴儿椅、安静区域...',
    btnSubmitBooking: '立即确认预订',
    bookingSuccessTitle: '预订成功！',
    bookingSuccessSubtitle: '您的预订信息已成功提交至 Kohi Coffee。',
    manualLabel: '或手动输入桌号',
    manualPlaceholder: '例如：1号桌，2号桌...',
    enterButton: '立即入座',
    helpText: '允许使用摄像头以自动扫描桌上的二维码。',
    errEmpty: '请输入桌号或扫描二维码！',
    errNotFound: '未找到匹配桌号："{input}"',
  }
};

export default function Home() {
  const router = useRouter();
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [lang, setLang] = useState<Lang>('vi');
  const [activeTab, setActiveTab] = useState<'reserve' | 'lookup' | 'qr'>('reserve');

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

  // QR Scanning & Manual Enter state
  const [manualInput, setManualInput] = useState('');
  const [error, setError] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const html5QrcodeRef = useRef<Html5Qrcode | null>(null);

  const t = (translations as any)[lang] || translations.vi;
  const isDark = resolvedTheme === 'dark';

  useEffect(() => {
    setMounted(true);
    const savedLang = localStorage.getItem('pho-beyond-lang') as Lang;
    if (savedLang && (savedLang === 'vi' || savedLang === 'en' || savedLang === 'zh')) {
      setLang(savedLang);
    }
    fetchTables();

    // Default datetime input to 2 hours from now
    const now = new Date();
    now.setHours(now.getHours() + 2);
    const pad = (n: number) => (n < 10 ? '0' + n : n);
    setReservationTime(`${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`);
  }, []);

  const fetchTables = async () => {
    try {
      const res = await fetch(`${API_BASE}/tables`);
      if (res.ok) {
        const data = await res.json();
        setTables(data);
        if (data.length > 0) {
          const firstEmpty = data.find((tbl: any) => tbl.status === 'empty') || data[0];
          setSelectedTable(firstEmpty);
        }
      }
    } catch (err) {
      console.error('Lỗi tải danh sách bàn:', err);
    }
  };

  const changeLanguage = (newLang: 'vi' | 'en') => {
    setLang(newLang);
    localStorage.setItem('pho-beyond-lang', newLang);
  };

  // Lookup reservations by phone number
  const handleLookupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const phone = lookupPhone.trim();
    if (!phone) {
      setError('Vui lòng nhập số điện thoại để tra cứu!');
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
    if (!confirm('Bạn có chắc chắn muốn hủy đơn đặt bàn này không?')) return;
    try {
      const res = await fetch(`${API_BASE}/reservations/${id}/customer-cancel`, {
        method: 'PATCH',
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || 'Không thể hủy đơn đặt bàn.');
      }
      playWelcomeChime();
      alert('Đã hủy đơn đặt bàn thành công!');
      handleLookupSubmit({ preventDefault: () => {} } as any);
      fetchTables();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Lỗi khi hủy đơn đặt bàn.');
    }
  };

  // Submit Table Reservation
  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTable) {
      setError(t.noTableSelected);
      return;
    }
    if (selectedTable.status === 'reserved' || selectedTable.status === 'serving') {
      setError(`Bàn ${selectedTable.tableName} đã có khách hoặc được giữ chỗ trước. Vui lòng chọn bàn khác.`);
      return;
    }
    if (!customerName.trim() || !customerPhone.trim()) {
      setError(t.errEmpty);
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

      // ⚡ Reset toàn bộ các giá trị trong form về trạng thái ban đầu
      setCustomerName('');
      setCustomerPhone('');
      setGuestCount(2);
      setNote('');
      const now = new Date();
      now.setHours(now.getHours() + 2);
      const pad = (n: number) => (n < 10 ? '0' + n : n);
      setReservationTime(`${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`);

      fetchTables();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Có lỗi xảy ra khi đặt bàn.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Manual Enter or QR Jump
  const handleManualEnter = async (e: React.FormEvent) => {
    e.preventDefault();
    const input = manualInput.trim();
    if (!input) {
      setError(t.errEmpty);
      return;
    }

    const isObjectId = /^[0-9a-fA-F]{24}$/.test(input);
    if (isObjectId) {
      router.push(`/table/${input}`);
      return;
    }

    const matchTable = tables.find(
      (tbl) =>
        tbl.tableName?.toLowerCase() === input.toLowerCase() ||
        String(tbl.tableName).replace(/\D/g, '') === input.replace(/\D/g, '')
    );

    if (matchTable) {
      playScanBeep();
      router.push(`/table/${matchTable._id}`);
    } else {
      setError(t.errNotFound.replace('{input}', input));
    }
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] font-sans flex flex-col justify-between transition-colors duration-300">
      {/* ── TOP APP HEADER BAR ────────────────────────────────────────────── */}
      <header className="w-full border-b border-[var(--border-color)] bg-[var(--bg-card)] sticky top-0 z-40 px-4 py-3 sm:px-8 shadow-xs">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <BrandLogo onClick={() => router.push('/')} />

          <div className="flex items-center gap-3">
            {/* Language Switcher Switch */}
            <LanguageToggleSwitch
              lang={lang as Lang}
              setLang={(l) => {
                setLang(l as any);
                localStorage.setItem('pho-beyond-lang', l);
              }}
            />

            {/* Theme Switcher */}
            <ThemeToggleSwitch isDark={isDark} setTheme={setTheme} />

            {/* Staff / Admin Login Button */}
            <button
              onClick={() => router.push('/login')}
              className="hidden sm:flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-[var(--bg-card-inner)] border border-[var(--border-color)] text-xs font-bold text-[var(--text-primary)] hover:border-[#2563EB] hover:text-[#2563EB] transition-all min-w-[130px] shrink-0"
            >
              <span className="material-symbols-outlined text-base">login</span>
              <span>{t.btnLogin}</span>
            </button>
          </div>
        </div>
      </header>

      {/* ── MAIN HERO SECTION ────────────────────────────────────────────── */}
      <main className="max-w-6xl mx-auto px-4 py-6 sm:py-10 w-full flex-1 space-y-8">
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <span className="inline-block px-3.5 py-1 bg-[#2563EB]/10 text-[#2563EB] dark:text-[#3B82F6] rounded-full text-xs font-bold tracking-wide uppercase">
            Smart Table Booking & QR Order
          </span>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-[var(--text-primary)] font-heading tracking-tight">
            {t.heroTitle}
          </h2>
          <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
            {t.heroSubtitle}
          </p>
        </div>

        {/* Tab Navigation: Đặt Bàn vs Tra Cứu vs Vào Bàn Mã QR */}
        <div className="flex justify-center border-b border-[var(--border-color)]">
          <div className="flex gap-4 sm:gap-8 text-xs sm:text-sm font-bold">
            <button
              onClick={() => {
                setActiveTab('reserve');
                setError('');
              }}
              className={`pb-3 px-2 flex items-center gap-2 border-b-2 transition-all ${
                activeTab === 'reserve'
                  ? 'border-[#2563EB] text-[#2563EB] dark:text-[#3B82F6]'
                  : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <span className="material-symbols-outlined text-lg">event_seat</span>
              <span>{t.btnBookTab}</span>
            </button>
            <button
              onClick={() => {
                setActiveTab('lookup');
                setError('');
              }}
              className={`pb-3 px-2 flex items-center gap-2 border-b-2 transition-all ${
                activeTab === 'lookup'
                  ? 'border-[#2563EB] text-[#2563EB] dark:text-[#3B82F6]'
                  : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <span className="material-symbols-outlined text-lg">search</span>
              <span>Tra Cứu Đặt Bàn</span>
            </button>
            <button
              onClick={() => {
                setActiveTab('qr');
                setError('');
              }}
              className={`pb-3 px-2 flex items-center gap-2 border-b-2 transition-all ${
                activeTab === 'qr'
                  ? 'border-[#2563EB] text-[#2563EB] dark:text-[#3B82F6]'
                  : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <span className="material-symbols-outlined text-lg">qr_code_scanner</span>
              <span>{t.btnQrTab}</span>
            </button>
          </div>
        </div>

        {/* ── TAB 1: TABLE RESERVATION FORM & MAP ──────────────────────────── */}
        {activeTab === 'reserve' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* LEFT: Table Selection Grid Map (7 cols) */}
            <div className="lg:col-span-7 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl p-5 sm:p-6 space-y-4 shadow-sm">
              <div className="flex justify-between items-center pb-2 border-b border-[var(--border-color)]">
                <div>
                  <h3 className="text-base font-extrabold text-[var(--text-primary)] font-heading">
                    {t.selectTableLabel}
                  </h3>
                  <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                    Bấm vào bàn bạn muốn đặt để giữ chỗ
                  </p>
                </div>

                <button
                  onClick={fetchTables}
                  className="p-1.5 rounded-lg bg-[var(--bg-card-inner)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all"
                  title="Cập nhật sơ đồ bàn"
                >
                  <span className="material-symbols-outlined text-sm">refresh</span>
                </button>
              </div>

              {/* Status legend */}
              <div className="flex gap-4 text-[11px] font-bold text-[var(--text-secondary)]">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span>{t.tableStatusEmpty}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  <span>{t.tableStatusReserved}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
                  <span>{t.tableStatusServing}</span>
                </div>
              </div>

              {/* Table Map Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
                {tables.length === 0 ? (
                  <div className="col-span-full text-center py-10 text-xs text-[var(--text-secondary)]">
                    Đang tải danh sách bàn từ máy chủ...
                  </div>
                ) : (
                  tables.map((tbl) => {
                    const isSelected = selectedTable?._id === tbl._id;
                    const isBookable = tbl.status !== 'reserved' && tbl.status !== 'serving';
                    let statusBg = 'border-slate-200 dark:border-slate-800 bg-[var(--bg-card-inner)]';
                    let statusDot = 'bg-emerald-500';
                    let statusText = t.tableStatusEmpty;

                    if (tbl.status === 'serving') {
                      statusDot = 'bg-slate-400';
                      statusText = t.tableStatusServing;
                      statusBg = 'border-slate-200 dark:border-slate-800/40 bg-slate-500/5 opacity-60 cursor-not-allowed';
                    } else if (tbl.status === 'reserved') {
                      statusDot = 'bg-amber-500';
                      statusText = t.tableStatusReserved;
                      statusBg = 'border-amber-500/30 bg-amber-500/5 opacity-75 cursor-not-allowed';
                    }

                    if (isSelected && isBookable) {
                      statusBg = 'border-[#2563EB] bg-[#2563EB]/10 ring-2 ring-[#2563EB]/40';
                    }

                    return (
                      <div
                        key={tbl._id}
                        onClick={() => setSelectedTable(tbl)}
                        className={`p-4 rounded-2xl border text-center space-y-2 cursor-pointer transition-all hover:scale-[1.02] active:scale-95 relative ${statusBg}`}
                      >
                        <div className="flex justify-between items-center">
                          <span className={`w-2 h-2 rounded-full ${statusDot}`} />
                          <span className="text-[10px] font-bold text-[var(--text-secondary)]">{statusText}</span>
                        </div>
                        <h4 className="text-base font-extrabold text-[var(--text-primary)]">{tbl.tableName}</h4>
                        <span className="text-[10px] text-[var(--text-secondary)] block font-medium">Tầng 1 — Khu máy lạnh</span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* RIGHT: Booking Form (5 cols) */}
            <div className="lg:col-span-5 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl p-5 sm:p-6 space-y-5 shadow-sm">
              <div>
                <h3 className="text-base font-extrabold text-[var(--text-primary)] font-heading">
                  {t.bookingFormTitle}
                </h3>
                <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                  Vui lòng điền đầy đủ thông tin để nhân viên nhận đơn
                </p>
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs font-bold flex items-center gap-2">
                  <span className="material-symbols-outlined text-base">error</span>
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleBookingSubmit} className="space-y-4 text-xs">
                {/* Selected Table Info Card */}
                <div className="p-3.5 rounded-2xl bg-[#2563EB]/10 border border-[#2563EB]/30 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase tracking-wider font-bold text-[var(--text-secondary)] block">
                      {t.selectedTableLabel}
                    </span>
                    <span className="text-sm font-black text-[#2563EB] dark:text-[#3B82F6]">
                      {selectedTable ? selectedTable.tableName : t.noTableSelected}
                    </span>
                  </div>
                  <span className="material-symbols-outlined text-xl text-[#2563EB] dark:text-[#3B82F6]">check_circle</span>
                </div>

                <div>
                  <label className="block font-bold text-[var(--text-primary)] mb-1.5">{t.customerNameLabel}</label>
                  <input
                    type="text"
                    required
                    placeholder={t.customerNamePlaceholder}
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full bg-[var(--bg-card-inner)] border border-[var(--border-color)] rounded-xl px-3.5 py-2.5 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[#2563EB]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[var(--text-primary)] mb-1.5">{t.customerPhoneLabel}</label>
                  <input
                    type="tel"
                    required
                    placeholder={t.customerPhonePlaceholder}
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full bg-[var(--bg-card-inner)] border border-[var(--border-color)] rounded-xl px-3.5 py-2.5 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[#2563EB]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-[var(--text-primary)] mb-1.5">{t.reservationTimeLabel}</label>
                    <input
                      type="datetime-local"
                      required
                      value={reservationTime}
                      onChange={(e) => setReservationTime(e.target.value)}
                      className="w-full bg-[var(--bg-card-inner)] border border-[var(--border-color)] rounded-xl px-3 py-2.5 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[#2563EB]"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-[var(--text-primary)] mb-1.5">{t.guestCountLabel}</label>
                    <input
                      type="number"
                      min={1}
                      max={20}
                      required
                      value={guestCount}
                      onChange={(e) => setGuestCount(Number(e.target.value))}
                      className="w-full bg-[var(--bg-card-inner)] border border-[var(--border-color)] rounded-xl px-3 py-2.5 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[#2563EB]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-[var(--text-primary)] mb-1.5">{t.noteLabel}</label>
                  <textarea
                    rows={2}
                    placeholder={t.notePlaceholder}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    className="w-full bg-[var(--bg-card-inner)] border border-[var(--border-color)] rounded-xl px-3.5 py-2 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[#2563EB]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || !selectedTable}
                  className="w-full py-3.5 bg-[#2563EB] hover:bg-blue-700 disabled:opacity-50 text-white font-extrabold rounded-2xl text-xs transition-all shadow-md active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-base">event_available</span>
                  <span>{isSubmitting ? 'Đang gửi thông tin...' : t.btnSubmitBooking}</span>
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ── TAB 2: LOOKUP & CUSTOMER CANCEL RESERVATIONS ──────────────────── */}
        {activeTab === 'lookup' && (
          <div className="max-w-2xl mx-auto bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
            <div className="text-center space-y-1">
              <h3 className="text-lg font-extrabold text-[var(--text-primary)] font-heading">
                Tra Cứu & Quản Lý Đơn Đặt Bàn
              </h3>
              <p className="text-xs text-[var(--text-secondary)]">
                Nhập số điện thoại của bạn để kiểm tra chi tiết đơn đặt bàn và thực hiện hủy nếu cần
              </p>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs font-bold flex items-center gap-2">
                <span className="material-symbols-outlined text-base">error</span>
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleLookupSubmit} className="flex gap-2">
              <input
                type="text"
                placeholder="Nhập số điện thoại (Ví dụ: 0987654321)..."
                value={lookupPhone}
                onChange={(e) => setLookupPhone(e.target.value)}
                className="flex-1 bg-[var(--bg-card-inner)] border border-[var(--border-color)] rounded-2xl px-4 py-3 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[#2563EB]"
              />
              <button
                type="submit"
                disabled={isSearchingLookup}
                className="px-5 py-3 bg-[#38BDF8] hover:bg-[#0284c7] text-[#090D16] font-black rounded-2xl text-xs transition-all shadow-md active:scale-95 flex items-center gap-1.5 shrink-0 cursor-pointer"
              >
                <span className="material-symbols-outlined text-base">search</span>
                <span>{isSearchingLookup ? 'Đang tìm...' : 'Tra cứu ngay'}</span>
              </button>
            </form>

            {hasSearchedLookup && (
              <div className="space-y-4 pt-2">
                {lookupResults.length === 0 ? (
                  <div className="bg-[var(--bg-card-inner)] border border-[var(--border-color)] rounded-2xl p-6 text-center text-xs text-[var(--text-secondary)]">
                    Không tìm thấy đơn đặt bàn nào với số điện thoại <span className="font-bold text-[#38BDF8]">{lookupPhone}</span>.
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-xs font-bold text-[var(--text-secondary)]">
                      Tìm thấy {lookupResults.length} đơn đặt bàn:
                    </p>

                    {lookupResults.map((res) => {
                      let statusBadge = 'bg-amber-500/10 text-amber-500 border-amber-500/30';
                      let statusLabel = 'Chờ xác nhận';

                      if (res.status === 'confirmed') {
                        statusBadge = 'bg-sky-500/10 text-sky-500 border-sky-500/30';
                        statusLabel = 'Đã xác nhận';
                      } else if (res.status === 'arrived') {
                        statusBadge = 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30';
                        statusLabel = 'Khách đã đến';
                      } else if (res.status === 'cancelled') {
                        statusBadge = 'bg-rose-500/10 text-rose-500 border-rose-500/30';
                        statusLabel = 'Đã hủy';
                      }

                      const canCancel = res.status === 'pending' || res.status === 'confirmed';
                      const isArrived = res.status === 'arrived';
                      const targetTableId = res.tableId?._id || res.tableId;

                      return (
                        <div
                          key={res._id}
                          className="bg-[var(--bg-card-inner)] border border-[var(--border-color)] p-4 sm:p-5 rounded-2xl space-y-3 shadow-xs"
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-black text-[var(--text-primary)] text-sm">
                                {res.customerName}
                              </h4>
                              <p className="text-xs text-[#38BDF8] font-bold mt-0.5">
                                {res.customerPhone}
                              </p>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-[10.5px] font-extrabold border ${statusBadge}`}>
                              {statusLabel}
                            </span>
                          </div>

                          <div className="py-2 border-t border-b border-[var(--border-color)]/60 space-y-1.5 text-xs">
                            <div className="flex justify-between">
                              <span className="text-[var(--text-secondary)]">Bàn ăn chọn:</span>
                              <span className="font-black text-[var(--text-primary)]">{res.tableId?.tableName || 'Bàn chọn'}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-[var(--text-secondary)]">Thời gian nhận bàn:</span>
                              <span className="font-extrabold text-[var(--text-primary)]">{new Date(res.reservationTime).toLocaleString('vi-VN')}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-[var(--text-secondary)]">Số lượng khách:</span>
                              <span className="font-extrabold text-[var(--text-primary)]">{res.guestCount} người</span>
                            </div>
                            {res.note && (
                              <div className="pt-1 text-[11px] text-amber-500 italic">
                                Ghi chú: {res.note}
                              </div>
                            )}
                          </div>

                          {isArrived && targetTableId && (
                            <button
                              onClick={() => router.push(`/table/${targetTableId}`)}
                              className="w-full py-2.5 bg-[#38BDF8] hover:bg-[#0284c7] text-[#090D16] font-black text-xs rounded-xl transition-all shadow-md active:scale-95 cursor-pointer"
                            >
                              VÀO BÀN GỌI MÓN ({res.tableId?.tableName || 'BÀN ĐẶT'})
                            </button>
                          )}

                          {canCancel && (
                            <button
                              onClick={() => handleCustomerCancelReservation(res._id)}
                              className="w-full py-2 bg-rose-500/10 hover:bg-rose-500 hover:text-white text-rose-500 border border-rose-500/30 text-xs font-bold rounded-xl transition-all flex items-center justify-center cursor-pointer"
                            >
                              HỦY ĐƠN ĐẶT BÀN NÀY
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

        {/* ── TAB 3: QUICK QR SCAN / MANUAL ENTER ─────────────────────────── */}
        {activeTab === 'qr' && (
          <div className="max-w-md mx-auto bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl p-6 space-y-6 shadow-sm text-center">
            <div>
              <h3 className="text-lg font-extrabold text-[var(--text-primary)] font-heading">
                Khách Hàng Đã Ngồi Tại Bàn
              </h3>
              <p className="text-xs text-[var(--text-secondary)] mt-1">
                Nhập số bàn hoặc quét mã QR trên mặt bàn để chọn món trực tiếp
              </p>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs font-bold flex items-center gap-2">
                <span className="material-symbols-outlined text-base">error</span>
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleManualEnter} className="space-y-4 text-xs text-left">
              <div>
                <label className="block font-bold text-[var(--text-primary)] mb-1.5">{t.manualLabel}</label>
                <input
                  type="text"
                  placeholder={t.manualPlaceholder}
                  value={manualInput}
                  onChange={(e) => setManualInput(e.target.value)}
                  className="w-full bg-[var(--bg-card-inner)] border border-[var(--border-color)] rounded-xl px-4 py-3 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[#2563EB]"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3.5 bg-[#2563EB] hover:bg-blue-700 text-white font-extrabold rounded-2xl text-xs transition-all shadow-md active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
              >
                <span className="material-symbols-outlined text-base">qr_code</span>
                <span>{t.enterButton}</span>
              </button>
            </form>
          </div>
        )}

        {/* ── BOOKING SUCCESS MODAL POPUP ──────────────────────────────────── */}
        {bookingSuccess && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <div className="relative w-full max-w-md rounded-[28px] bg-[var(--bg-card)] border border-[var(--border-color)] p-6 sm:p-8 text-center space-y-6 shadow-2xl animate-modal-in">
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 mx-auto flex items-center justify-center shadow-lg shadow-emerald-500/10 animate-pop-scale">
                <span className="material-symbols-outlined text-3xl font-black">check_circle</span>
              </div>

              <div className="space-y-2">
                <h3 className="text-2xl font-black text-[var(--text-primary)] font-heading tracking-tight">
                  {t.bookingSuccessTitle}
                </h3>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed font-medium px-2">
                  {t.bookingSuccessSubtitle}
                </p>
              </div>

              {/* Zebra Stripe / Card Info Container */}
              <div className="space-y-2 text-xs text-left p-2 rounded-2xl bg-[var(--bg-card-inner)] border border-[var(--border-color)]">
                {/* Row 1: Khách hàng */}
                <div className="flex justify-between items-center px-3.5 py-2.5 rounded-xl bg-slate-500/5 border border-slate-500/10">
                  <span className="text-[var(--text-secondary)] font-bold">Khách hàng</span>
                  <span className="font-extrabold text-[var(--text-primary)] text-sm">{bookingSuccess.customerName}</span>
                </div>

                {/* Row 2: Số điện thoại (Accent Skyblue) */}
                <div className="flex justify-between items-center px-3.5 py-2.5 rounded-xl bg-slate-500/10 border border-slate-500/10">
                  <span className="text-[var(--text-secondary)] font-bold">Số điện thoại</span>
                  <span className="font-extrabold text-[#38BDF8]">{bookingSuccess.customerPhone}</span>
                </div>

                {/* Row 3: Bàn đặt (Highlighted Accent Card) */}
                <div className="flex justify-between items-center px-3.5 py-2.5 rounded-xl bg-[#38BDF8]/10 border border-[#38BDF8]/25">
                  <span className="text-[#38BDF8] font-bold">Bàn ăn đặt giữ</span>
                  <span className="font-black text-[#38BDF8] text-sm tracking-wide">{bookingSuccess.tableId?.tableName || 'Bàn chọn'}</span>
                </div>

                {/* Row 4: Thời gian nhận bàn */}
                <div className="flex justify-between items-center px-3.5 py-2.5 rounded-xl bg-slate-500/5 border border-slate-500/10">
                  <span className="text-[var(--text-secondary)] font-bold">Thời gian nhận bàn</span>
                  <span className="font-extrabold text-[var(--text-primary)]">{new Date(bookingSuccess.reservationTime).toLocaleString('vi-VN')}</span>
                </div>

                {/* Row 5: Số lượng khách */}
                <div className="flex justify-between items-center px-3.5 py-2.5 rounded-xl bg-slate-500/10 border border-slate-500/10">
                  <span className="text-[var(--text-secondary)] font-bold">Số lượng khách</span>
                  <span className="font-extrabold text-[var(--text-primary)]">{bookingSuccess.guestCount} người</span>
                </div>
              </div>

              <button
                onClick={() => setBookingSuccess(null)}
                className="w-full py-4 rounded-2xl bg-[#38BDF8] hover:bg-[#0284c7] text-[#090D16] font-black text-xs sm:text-sm tracking-wide uppercase transition-all duration-200 shadow-lg shadow-[#38BDF8]/20 hover:shadow-xl hover:shadow-[#38BDF8]/30 active:scale-[0.98] cursor-pointer"
              >
                HOÀN TẤT & ĐÓNG
              </button>
            </div>
          </div>
        )}
      </main>

      {/* ── FOOTER ───────────────────────────────────────────────────────── */}
      <footer className="w-full py-4 text-center text-[11px] font-semibold text-[var(--text-secondary)] border-t border-[var(--border-color)]">
        © 2026 Kohi Coffee & Pastry • Smart Online Reservation & QR Solution
      </footer>
    </div>
  );
}
