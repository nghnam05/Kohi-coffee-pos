'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { playScanBeep, playWelcomeChime } from './utils/sound';

const translations = {
  vi: {
    welcome: 'Kohi Coffee & Pastry',
    subtitle: 'Hệ thống gọi món & thức uống QR thông minh',
    scanCamera: 'Quét mã QR bằng Camera',
    scanUpload: 'Tải ảnh mã QR lên để quét',
    or: 'Hoặc',
    manualLabel: 'HOẶC NHẬP SỐ BÀN THỦ CÔNG',
    manualPlaceholder: 'Ví dụ: Bàn 1, Bàn 2...',
    enterButton: 'VÀO BÀN',
    cameraStatus: 'Đang quét... Hãy căn mã QR vào chính giữa khung ngắm',
    cancelButton: 'Hủy & nhập thủ công',
    helpText: 'Hãy cho phép quyền truy cập máy ảnh để hệ thống tự động nhận dạng mã QR trên bàn.',
    errEmpty: 'Vui lòng nhập số bàn hoặc quét mã QR!',
    errInvalid: 'Mã QR quét được không chứa ID bàn hợp lệ!',
    errDecode: 'Không thể nhận diện mã QR từ tệp tin này. Hãy thử tải lên ảnh rõ nét hơn!',
    errCamera: 'Không thể khởi động camera. Vui lòng kiểm tra quyền truy cập camera trong cài đặt trình duyệt hoặc chuyển sang tab HTTPS bảo mật.',
    errNotFound: 'Không tìm thấy bàn nào ứng với số hoặc tên: "{input}"',
    errConnect: 'Lỗi kết nối đến máy chủ khi xác thực bàn.',
  },
  en: {
    welcome: 'Kohi Coffee & Pastry',
    subtitle: 'Smart QR Coffee & Pastry Ordering System',
    scanCamera: 'Scan Table QR via Camera',
    scanUpload: 'Upload QR Image to Scan',
    or: 'Or',
    manualLabel: 'OR ENTER TABLE NUMBER MANUALLY',
    manualPlaceholder: 'E.g. Table 1, Table 2...',
    enterButton: 'ENTER TABLE',
    cameraStatus: 'Scanning... Center the QR code in the viewfinder',
    cancelButton: 'Cancel & Enter Manually',
    helpText: 'Please allow camera access so the system can automatically read the QR code on your table.',
    errEmpty: 'Please enter a table number or scan a QR code!',
    errInvalid: 'The scanned QR code does not contain a valid Table ID!',
    errDecode: 'Could not read QR code from this image. Please try a clearer picture!',
    errCamera: 'Cannot start camera. Please check camera permissions in browser settings or switch to secure HTTPS.',
    errNotFound: 'No table found matching: "{input}"',
    errConnect: 'Connection error while validating the table.',
  }
};

export default function Home() {
  const router = useRouter();
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [tableId, setTableId] = useState('');
  const [error, setError] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [lang, setLang] = useState<'vi' | 'en'>('vi');
  const [welcomeModalOpen, setWelcomeModalOpen] = useState(false);
  const [welcomeTable, setWelcomeTable] = useState<{ _id: string; tableName: string; status: string } | null>(null);
  const html5QrcodeRef = useRef<Html5Qrcode | null>(null);

  const t = translations[lang];

  useEffect(() => {
    setMounted(true);
    const savedLang = localStorage.getItem('pho-beyond-lang') as 'vi' | 'en';
    if (savedLang && (savedLang === 'vi' || savedLang === 'en')) {
      setLang(savedLang);
    }
  }, []);

  // Cleanup scanner on unmount
  useEffect(() => {
    return () => {
      if (html5QrcodeRef.current) {
        if (html5QrcodeRef.current.isScanning) {
          html5QrcodeRef.current.stop().catch(err => console.error("Error stopping scanner", err));
        }
      }
    };
  }, []);

  const changeLanguage = (newLang: 'vi' | 'en') => {
    setLang(newLang);
    localStorage.setItem('pho-beyond-lang', newLang);
  };

  const handleStartOrder = async (e?: React.FormEvent, customInput?: string) => {
    if (e) e.preventDefault();
    const input = (customInput || tableId).trim();
    if (!input) {
      setError(t.errEmpty);
      return;
    }

    // 1. If it's already a 24-character hex string (ObjectId)
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(input);
    if (isObjectId) {
      try {
        setError('');
        const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
        const res = await fetch(`${API_BASE}/tables`);
        if (!res.ok) throw new Error(t.errConnect);
        const tablesList = await res.json();
        
        const found = tablesList.find((tb: any) => tb._id === input);
        if (found) {
          setWelcomeTable({ _id: found._id, tableName: found.tableName, status: found.status || 'empty' });
          setWelcomeModalOpen(true);
          playWelcomeChime();
        } else {
          router.push(`/table/${input}`);
        }
      } catch (err) {
        router.push(`/table/${input}`);
      }
      return;
    }

    // 2. Otherwise, treat it as a table number (e.g., "1", "2") and resolve its ObjectID
    try {
      setError('');
      const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
      const res = await fetch(`${API_BASE}/tables`);
      if (!res.ok) throw new Error(t.errConnect);
      
      const tablesList = await res.json();
      
      const found = tablesList.find((tb: any) => {
        const numOnly = tb.tableName.replace(/\D/g, ''); // "Bàn số 1" -> "1"
        return numOnly === input || tb.tableName.toLowerCase() === input.toLowerCase();
      });

      if (found) {
        setWelcomeTable({ _id: found._id, tableName: found.tableName, status: found.status || 'empty' });
        setWelcomeModalOpen(true);
        playWelcomeChime();
      } else {
        setError(t.errNotFound.replace('{input}', input));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t.errConnect);
    }
  };

  const startScanner = async () => {
    setError('');
    setIsScanning(true);
    
    setTimeout(async () => {
      try {
        if (html5QrcodeRef.current) {
          try {
            if (html5QrcodeRef.current.isScanning) {
              await html5QrcodeRef.current.stop();
            }
          } catch (e) {
            console.log("Previous scanner stop ignored", e);
          }
          html5QrcodeRef.current = null;
        }

        const container = document.getElementById("qr-reader");
        if (container) {
          container.innerHTML = "";
        }

        const scanner = new Html5Qrcode("qr-reader");
        html5QrcodeRef.current = scanner;

        await scanner.start(
          { facingMode: "environment" },
          {
            fps: 20,
            qrbox: (width: number, height: number) => {
              const minDimension = Math.min(width, height);
              const qrboxSize = Math.floor(minDimension * 0.8);
              return { width: qrboxSize, height: qrboxSize };
            },
            aspectRatio: 1.0,
            formatsToSupport: [ Html5QrcodeSupportedFormats.QR_CODE ],
            experimentalFeatures: { useBarCodeDetectorIfSupported: true }
          } as any,
          (decodedText) => {
            handleScanSuccess(decodedText, scanner);
          },
          () => {}
        );
      } catch (err) {
        console.error("Camera access failed", err);
        setError(t.errCamera);
        setIsScanning(false);
      }
    }, 300);
  };

  const stopScanner = async () => {
    if (html5QrcodeRef.current) {
      try {
        if (html5QrcodeRef.current.isScanning) {
          await html5QrcodeRef.current.stop();
        }
      } catch (err) {
        console.error("Failed to stop scanner", err);
      }
    }
    setIsScanning(false);
  };

  const handleScanSuccess = async (decodedText: string, scannerInstance: Html5Qrcode) => {
    try {
      if (scannerInstance.isScanning) {
        await scannerInstance.stop();
      }
    } catch (err) {
      console.error(err);
    }
    setIsScanning(false);

    let parsedId = decodedText.trim();
    if (parsedId.includes('/table/')) {
      const parts = parsedId.split('/table/');
      parsedId = parts[parsedId.length - 1].split('?')[0].split('/')[0];
    }

    if (parsedId) {
      playScanBeep();
      handleStartOrder(undefined, parsedId);
    } else {
      setError(t.errInvalid);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError('');
    const tempDiv = document.createElement('div');
    tempDiv.id = 'qr-reader-temp';
    tempDiv.style.display = 'none';
    document.body.appendChild(tempDiv);

    try {
      const html5QrCode = new Html5Qrcode("qr-reader-temp");
      const decodedText = await html5QrCode.scanFile(file, true);
      document.body.removeChild(tempDiv);

      let parsedId = decodedText.trim();
      if (parsedId.includes('/table/')) {
        const parts = parsedId.split('/table/');
        parsedId = parts[parsedId.length - 1].split('?')[0].split('/')[0];
      }

      if (parsedId) {
        playScanBeep();
        handleStartOrder(undefined, parsedId);
      } else {
        setError(t.errInvalid);
      }
    } catch (err) {
      console.error(err);
      setError(t.errDecode);
      try { document.body.removeChild(tempDiv); } catch (e) {}
    }
  };

  if (!mounted) return null;

  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-between relative overflow-x-hidden bg-[var(--bg-primary)] text-[var(--text-primary)] font-sans antialiased selection:bg-[var(--brand-primary)] selection:text-white transition-colors duration-300">
      
      {/* ── Top Navigation Bar ────────────────────────────────────────────── */}
      <header className="w-full max-w-7xl mx-auto flex justify-end items-center px-4 sm:px-8 md:px-12 py-4 sm:py-6 z-20 gap-2.5 sm:gap-3">
        {/* Language Segmented Toggle */}
        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] p-1 rounded-[var(--radius-full)] backdrop-blur-md flex items-center shadow-[var(--shadow-card)] transition-all">
          <button
            onClick={() => changeLanguage('vi')}
            className={`px-3 sm:px-3.5 py-1 sm:py-1.5 rounded-[var(--radius-full)] text-[10px] sm:text-xs font-bold tracking-wider transition-all duration-200 ${
              lang === 'vi' 
                ? 'bg-[var(--brand-primary)] text-white shadow-sm' 
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            VI
          </button>
          <button
            onClick={() => changeLanguage('en')}
            className={`px-3 sm:px-3.5 py-1 sm:py-1.5 rounded-[var(--radius-full)] text-[10px] sm:text-xs font-bold tracking-wider transition-all duration-200 ${
              lang === 'en' 
                ? 'bg-[var(--brand-primary)] text-white shadow-sm' 
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            EN
          </button>
        </div>

        {/* Theme Switcher Button */}
        <button
          onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
          className="w-9 h-9 sm:w-10 sm:h-10 rounded-[var(--radius-full)] bg-[var(--bg-card)] hover:bg-[var(--bg-primary)] border border-[var(--border-color)] flex items-center justify-center backdrop-blur-md text-[var(--brand-primary)] transition-all shadow-[var(--shadow-card)] active:scale-95"
          aria-label="Toggle Theme"
        >
          {resolvedTheme === 'dark' ? (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
          )}
        </button>
      </header>

      {/* ── Main Responsive Content Canvas ───────────────────────────────── */}
      <main className="relative z-10 w-full max-w-[480px] sm:max-w-[540px] md:max-w-[580px] px-4 sm:px-6 md:px-0 flex flex-col items-center justify-center my-auto py-4 sm:py-8 md:py-12">
        
        {/* Central Card */}
        <div className="w-full bg-[var(--bg-card)] backdrop-blur-xl border border-[var(--border-color)] rounded-[var(--radius-lg)] p-6 sm:p-8 md:p-10 flex flex-col items-center gap-6 sm:gap-7 relative overflow-hidden shadow-[var(--shadow-card-hover)] transition-all">
          
          {/* Subtle internal brand glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-32 bg-[var(--brand-primary)]/10 rounded-full blur-[60px] pointer-events-none" />

          {/* Brand Header */}
          <div className="flex flex-col items-center text-center gap-2.5 sm:gap-3 z-10">
            {/* Vector Coffee Cup Badge */}
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-[var(--radius-full)] bg-[var(--brand-primary)]/10 border border-[var(--brand-primary)]/30 flex items-center justify-center shadow-md relative mb-0.5 sm:mb-1">
              <svg className="w-8 h-8 sm:w-10 sm:h-10 text-[var(--brand-primary)] filter drop-shadow-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 8h1a4 4 0 1 1 0 8h-1" />
                <path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z" />
                <line x1="6" y1="2" x2="6" y2="4" />
                <line x1="10" y1="2" x2="10" y2="4" />
                <line x1="14" y1="2" x2="14" y2="4" />
              </svg>
            </div>
            
            <h1 className="font-logo text-2xl sm:text-3xl md:text-4xl text-[var(--text-primary)] font-bold tracking-tight uppercase select-none">
              Kohi Coffee
            </h1>

            <div className="flex items-center justify-center gap-2 my-0.5">
              <span className="h-px w-6 sm:w-8 bg-[var(--border-color)]" />
              <span className="text-[9.5px] sm:text-[10px] font-semibold tracking-[0.04em] text-[var(--accent)] uppercase">
                SPECIALTY & PASTRY
              </span>
              <span className="h-px w-6 sm:w-8 bg-[var(--border-color)]" />
            </div>

            <p className="text-[13.5px] font-normal leading-[1.55] text-[var(--text-secondary)] mt-0.5 max-w-[320px]">
              {t.subtitle}
            </p>
          </div>

          {/* Action Area: Camera Scanning or Action Buttons */}
          {isScanning ? (
            <div className="w-full space-y-4 sm:space-y-5 z-10 animate-fade-in">
              <div className="relative overflow-hidden rounded-[var(--radius-lg)] border-2 border-[var(--brand-primary)] bg-black aspect-square shadow-[var(--shadow-card-hover)]">
                <div id="qr-reader" className="w-full h-full object-cover overflow-hidden" />
                
                {/* Viewfinder Overlay */}
                <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
                  <div className="w-[80%] h-[80%] border-2 border-dashed border-[var(--brand-primary)]/60 rounded-[var(--radius-md)] relative">
                    <div className="absolute -top-1 -left-1 w-5 h-5 border-t-4 border-l-4 border-[var(--brand-primary)] rounded-tl-lg" />
                    <div className="absolute -top-1 -right-1 w-5 h-5 border-t-4 border-r-4 border-[var(--brand-primary)] rounded-tr-lg" />
                    <div className="absolute -bottom-1 -left-1 w-5 h-5 border-b-4 border-l-4 border-[var(--brand-primary)] rounded-bl-lg" />
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 border-b-4 border-r-4 border-[var(--brand-primary)] rounded-br-lg" />
                    
                    <div className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[var(--brand-primary)] to-transparent top-0 animate-scan" />
                  </div>
                </div>
              </div>

              <div className="text-center space-y-3">
                <p className="text-xs font-semibold text-[var(--brand-primary)] animate-pulse px-2">
                  {t.cameraStatus}
                </p>
                <button
                  type="button"
                  onClick={stopScanner}
                  className="px-6 py-2.5 bg-[var(--bg-primary)] hover:bg-[var(--bg-card)] text-[var(--text-secondary)] text-xs font-semibold rounded-[var(--radius-sm)] transition-all border border-[var(--border-color)]"
                >
                  {t.cancelButton}
                </button>
              </div>
            </div>
          ) : (
            <div className="w-full space-y-4 sm:space-y-5 z-10">
              {/* Primary Action Buttons */}
              <div className="space-y-3">
                <button
                  onClick={startScanner}
                  className="w-full bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] text-white font-semibold py-3.5 sm:py-4 rounded-[var(--radius-md)] flex items-center justify-center gap-2.5 sm:gap-3 shadow-md hover:scale-[1.01] active:scale-[0.99] transition-all text-xs sm:text-[14px] tracking-wider uppercase"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>{t.scanCamera}</span>
                </button>

                <label className="w-full bg-[var(--bg-primary)] hover:bg-[var(--bg-card)] border border-[var(--border-color)] hover:border-[var(--brand-primary)] text-[var(--text-primary)] font-semibold py-3 sm:py-3.5 rounded-[var(--radius-md)] flex items-center justify-center gap-2.5 transition-all cursor-pointer text-xs sm:text-[14px] tracking-wide">
                  <svg className="w-4 h-4 text-[var(--brand-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  <span>{t.scanUpload}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Divider */}
              <div className="w-full flex items-center gap-4 my-1">
                <div className="flex-1 h-px bg-[var(--border-color)]" />
                <span className="text-[10px] font-semibold text-[var(--text-tertiary)] uppercase tracking-widest">{t.or}</span>
                <div className="flex-1 h-px bg-[var(--border-color)]" />
              </div>

              {/* Manual Table Number Entry Form */}
              <form onSubmit={handleStartOrder} className="space-y-3">
                <div>
                  <label htmlFor="table-id" className="block text-[10px] font-semibold text-[var(--text-secondary)] uppercase tracking-widest mb-2 flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5 text-[var(--text-tertiary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span>{t.manualLabel}</span>
                  </label>
                  
                  <div className="flex gap-2 w-full">
                    <div className="relative flex-1">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] select-none">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                        </svg>
                      </span>
                      <input
                        id="table-id"
                        type="text"
                        placeholder={t.manualPlaceholder}
                        value={tableId}
                        onChange={(e) => {
                          setTableId(e.target.value);
                          setError('');
                        }}
                        className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-[var(--radius-sm)] py-3 pl-10 pr-3 text-[var(--text-primary)] placeholder:[var(--text-tertiary)] focus:border-[var(--brand-primary)] outline-none text-xs font-semibold transition-all"
                      />
                    </div>
                    
                    <button
                      type="submit"
                      className="bg-[var(--brand-primary)]/10 text-[var(--brand-primary)] hover:bg-[var(--brand-primary)] hover:text-white px-4 sm:px-5 rounded-[var(--radius-sm)] font-semibold transition-all flex items-center justify-center text-xs tracking-wider uppercase active:scale-95 gap-1 shrink-0 border border-[var(--brand-primary)]/20"
                    >
                      <span>{t.enterButton}</span>
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                      </svg>
                    </button>
                  </div>

                  {error && (
                    <div className="text-red-500 text-xs font-semibold mt-3 flex items-center gap-1.5 px-1 animate-pulse">
                      <svg className="w-4 h-4 shrink-0 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <span>{error}</span>
                    </div>
                  )}
                </div>
              </form>
            </div>
          )}

          {/* Footer note */}
          <div className="w-full border-t border-[var(--border-color)] pt-4 sm:pt-5 text-center text-[10.5px] leading-relaxed font-normal text-[var(--text-secondary)] z-10">
            {t.helpText}
          </div>
        </div>
      </main>

      <footer className="w-full py-4 text-center text-[11px] font-semibold text-[var(--text-tertiary)] z-10">
        © 2026 Kohi Coffee & Pastry • Smart QR Solution
      </footer>

      {/* ── Welcome Modal Popup (Responsive Light/Dark Glassmorphism Modal) ─────── */}
      {welcomeModalOpen && welcomeTable && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/70 backdrop-blur-md select-none text-center animate-fade-in">
          {welcomeTable.status === 'reserved' ? (
            // RESERVED / BOOKED WARNING MODAL
            <div className="relative w-full max-w-sm overflow-hidden rounded-2xl sm:rounded-[28px] bg-white dark:bg-zinc-900 border border-red-200 dark:border-red-500/30 p-6 sm:p-8 flex flex-col items-center justify-center shadow-2xl transition-all">
              <button 
                onClick={() => setWelcomeModalOpen(false)}
                className="absolute right-4 top-4 w-8 h-8 rounded-full flex items-center justify-center bg-slate-100 dark:bg-zinc-800 text-slate-400 dark:text-zinc-400 hover:text-slate-700 dark:hover:text-white transition-colors"
              >
                ✕
              </button>

              <div className="w-12 h-1.5 rounded-full bg-red-500 mb-6" />

              <h3 className="text-lg sm:text-xl font-black text-red-600 dark:text-red-400 tracking-tight leading-tight flex items-center gap-2">
                <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span>{lang === 'vi' ? 'Bàn đã có khách hẹn!' : 'Table is Reserved!'}</span>
              </h3>
              <p className="text-[10px] text-red-500 dark:text-red-400/80 font-extrabold uppercase tracking-widest mt-1">
                {lang === 'vi' ? 'Không thể truy cập' : 'Access Restricted'}
              </p>

              <div className="w-full mt-6 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-500/20 rounded-2xl p-5 flex flex-col items-center justify-center relative overflow-hidden">
                <span className="text-[10px] font-black text-red-500 dark:text-red-400/70 uppercase tracking-widest">
                  {lang === 'vi' ? 'THÔNG TIN BÀN BẬN' : 'RESERVED TABLE'}
                </span>
                <span className="text-2xl font-black text-red-600 dark:text-red-400 mt-1.5 uppercase tracking-wide">
                  {welcomeTable.tableName}
                </span>
              </div>

              <p className="text-[11.5px] font-semibold text-slate-600 dark:text-zinc-400 leading-relaxed mt-5 px-1">
                {lang === 'vi' 
                  ? 'Rất tiếc, bàn này đã được giữ chỗ từ quản trị viên. Quý khách vui lòng liên hệ Barista tại quầy Kohi Coffee để được hỗ trợ đổi bàn khác.' 
                  : 'We are sorry, this table is currently reserved. Please contact the Barista at the counter to be relocated.'}
              </p>

              <button
                onClick={() => setWelcomeModalOpen(false)}
                className="w-full mt-6 py-3.5 text-xs font-black text-slate-700 dark:text-zinc-200 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 rounded-2xl transition-all active:scale-95 border border-slate-200 dark:border-zinc-700 tracking-widest uppercase"
              >
                {lang === 'vi' ? 'QUAY LẠI & CHỌN BÀN KHÁC' : 'GO BACK & CHOOSE ANOTHER'}
              </button>
            </div>
          ) : (
            // STANDARD WELCOME MODAL
            <div className="relative w-full max-w-sm overflow-hidden rounded-[var(--radius-lg)] bg-[var(--bg-card)] border border-[var(--border-color)] p-6 sm:p-8 flex flex-col items-center justify-center shadow-[var(--shadow-card-hover)] transition-all animate-pulse-once">
              <button 
                onClick={() => setWelcomeModalOpen(false)}
                className="absolute right-4 top-4 w-8 h-8 rounded-[var(--radius-full)] flex items-center justify-center bg-[var(--bg-primary)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors"
              >
                ✕
              </button>

              <div className="w-12 h-1 rounded-full bg-[var(--brand-primary)] mb-5" />

              <div className="text-center space-y-1.5 mb-2">
                <h2 className="font-logo text-3xl text-[var(--text-primary)] font-extrabold tracking-tight uppercase leading-none select-none">
                  Kohi Coffee
                </h2>
                <h3 className="text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-[0.04em] leading-none mt-1">
                  {lang === 'vi' ? 'Xin kính chào quý khách!' : 'Warmly Welcomes You!'}
                </h3>
              </div>

              <div className="w-full mt-5 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-[var(--radius-md)] p-5 flex flex-col items-center justify-center relative overflow-hidden">
                <div className="absolute -top-10 -right-10 w-20 h-20 bg-[var(--brand-primary)]/10 rounded-full blur-xl pointer-events-none" />
                <div className="absolute -bottom-10 -left-10 w-20 h-20 bg-[var(--brand-primary)]/10 rounded-full blur-xl pointer-events-none" />
                
                <span className="text-[9px] font-semibold text-[var(--brand-primary)] uppercase tracking-wider mb-1.5">
                  ✦ {lang === 'vi' ? 'THÔNG TIN BÀN CÀ PHÊ' : 'TABLE INFORMATION'} ✦
                </span>
                <span className="text-3xl font-bold text-[var(--text-primary)] uppercase tracking-wide">
                  {welcomeTable.tableName}
                </span>
                <span className="text-[9px] font-semibold text-[var(--text-tertiary)] mt-1.5 uppercase tracking-wider">
                  Mã bàn: {welcomeTable._id.slice(-6).toUpperCase()}
                </span>
              </div>

              <p className="text-[11px] font-normal text-[var(--text-secondary)] leading-relaxed mt-5 px-1 text-center">
                {lang === 'vi' 
                  ? 'Hệ thống gọi món trực tuyến đã sẵn sàng. Vui lòng bấm tiếp tục bên dưới để xem thực đơn & chọn thức uống gửi tới quầy pha chế.' 
                  : 'Smart digital table menu is fully loaded. Click continue below to view menu and order directly to the Barista.'}
              </p>

              <button
                onClick={() => {
                  setWelcomeModalOpen(false);
                  router.push(`/table/${welcomeTable._id}`);
                }}
                className="group relative w-full mt-6 overflow-hidden rounded-[var(--radius-md)] bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] py-3.5 sm:py-4 text-xs font-semibold text-white shadow-md transition-all active:scale-95"
              >
                <div className="flex items-center justify-center gap-2 tracking-widest uppercase">
                  <span>{lang === 'vi' ? 'XEM THỰC ĐƠN & GỌI MÓN' : 'VIEW MENU & PLACE ORDER'}</span>
                  <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </div>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
