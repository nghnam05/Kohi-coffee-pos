'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';

const translations = {
  vi: {
    welcome: 'Chika Restaurant Delivery',
    subtitle: 'Hệ thống đặt món QR thông minh',
    scanCamera: 'Quét mã QR bằng Camera',
    scanUpload: 'Tải ảnh mã QR lên để quét',
    or: 'Hoặc',
    manualLabel: 'Nhập nhanh số bàn ăn (Ví dụ: 1, 2...)',
    manualPlaceholder: 'Dành cho thiết bị thiếu camera...',
    enterButton: 'VÀO BÀN',
    cameraStatus: '📸 Đang quét... Hãy căn mã QR vào chính giữa khung ngắm',
    cancelButton: 'Hủy & nhập thủ công',
    helpText: 'Hãy cho phép quyền truy cập máy ảnh để hệ thống tự động nhận dạng mã QR được dán trực tiếp trên bàn ăn của bạn.',
    errEmpty: 'Vui lòng nhập số bàn hoặc quét mã QR!',
    errInvalid: 'Mã QR quét được không chứa ID bàn hợp lệ!',
    errDecode: 'Không thể nhận diện mã QR từ tệp tin này. Hãy thử tải lên ảnh rõ nét hơn!',
    errCamera: 'Không thể khởi động camera. Vui lòng kiểm tra quyền truy cập camera trong cài đặt trình duyệt hoặc chuyển sang tab HTTPS bảo mật.',
    errNotFound: 'Không tìm thấy bàn nào ứng với số hoặc tên: "{input}"',
    errConnect: 'Lỗi kết nối đến máy chủ khi xác thực bàn ăn.',
  },
  en: {
    welcome: 'Chika Restaurant Delivery',
    subtitle: 'Smart QR Ordering System',
    scanCamera: 'Scan Table QR via Camera',
    scanUpload: 'Upload QR Image to Scan',
    or: 'Or',
    manualLabel: 'Quickly enter table number (e.g. 1, 2...)',
    manualPlaceholder: 'For devices without camera...',
    enterButton: 'ENTER TABLE',
    cameraStatus: '📸 Scanning... Center the QR code in the viewfinder',
    cancelButton: 'Cancel & Enter Manually',
    helpText: 'Please allow camera access so the system can automatically read the QR code on your dining table.',
    errEmpty: 'Please enter a table number or scan a QR code!',
    errInvalid: 'The scanned QR code does not contain a valid Table ID!',
    errDecode: 'Could not read QR code from this image. Please try a clearer picture!',
    errCamera: 'Cannot start camera. Please check camera permissions in browser settings or switch to secure HTTPS.',
    errNotFound: 'No table found matching: "{input}"',
    errConnect: 'Connection error while validating the table.',
  }
};

import { playScanBeep, playWelcomeChime } from './utils/sound';

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
      
      // Find a table where digits inside tableName match the input, or matches exactly
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
    
    // Let DOM update and create scanner
    setTimeout(async () => {
      try {
        // 1. Safe cleanup of any pre-existing scanner reference
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

        // 2. Clear target DOM element to avoid element busy/already initialized crashes
        const container = document.getElementById("qr-reader");
        if (container) {
          container.innerHTML = "";
        }

        // 3. Initialize fresh scanner instance
        const scanner = new Html5Qrcode("qr-reader");
        html5QrcodeRef.current = scanner;

        await scanner.start(
          { facingMode: "environment" },
          {
            fps: 20, // HIGH speed frames for instant scanning response
            qrbox: (width, height) => {
              const minDimension = Math.min(width, height);
              const qrboxSize = Math.floor(minDimension * 0.8); // Larger scan box for easier detection
              return {
                width: qrboxSize,
                height: qrboxSize
              };
            },
            aspectRatio: 1.0, // Prevent stretching distortion
            formatsToSupport: [ Html5QrcodeSupportedFormats.QR_CODE ], // ONLY QR format -> saves massive CPU & decodes instantly!
            experimentalFeatures: {
              useBarCodeDetectorIfSupported: true // Native hardware acceleration
            }
          },
          (decodedText) => {
            handleScanSuccess(decodedText, scanner);
          },
          () => {
            // Silence scanning frame errors
          }
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
    
    // Parse URL (e.g., http://localhost:3000/table/65a0c01be5fe6910cab58701)
    if (parsedId.includes('/table/')) {
      const parts = parsedId.split('/table/');
      parsedId = parts[parts.length - 1].split('?')[0].split('/')[0];
    }

    if (parsedId) {
      // Play a beautiful QR success chime
      playScanBeep();
      
      // Execute redirection
      handleStartOrder(undefined, parsedId);
    } else {
      setError(t.errInvalid);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError('');
    
    // Create a temporary element for file scanning
    const tempDiv = document.createElement('div');
    tempDiv.id = 'qr-reader-temp';
    tempDiv.style.display = 'none';
    document.body.appendChild(tempDiv);

    try {
      const html5QrCode = new Html5Qrcode("qr-reader-temp");
      const decodedText = await html5QrCode.scanFile(file, true);
      
      // Cleanup temp element
      document.body.removeChild(tempDiv);

      let parsedId = decodedText.trim();
      
      // Parse URL (e.g., http://localhost:3000/table/65a0c01be5fe6910cab58701)
      if (parsedId.includes('/table/')) {
        const parts = parsedId.split('/table/');
        parsedId = parts[parts.length - 1].split('?')[0].split('/')[0];
      }

      if (parsedId) {
        // Success audio chime
        playScanBeep();

        // Redirection
        handleStartOrder(undefined, parsedId);
      } else {
        setError(t.errInvalid);
      }
    } catch (err) {
      console.error(err);
      setError(t.errDecode);
      try {
        document.body.removeChild(tempDiv);
      } catch (e) {}
    }
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-zinc-950 p-6 transition-colors duration-300 font-sans antialiased text-slate-800 dark:text-zinc-200">
      {/* Top control bar: Language and Theme Switcher */}
      <div className="absolute top-6 right-6 z-10 flex items-center gap-3">
        {/* Language Segmented Toggle */}
        <div className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800/85 p-1 rounded-2xl flex items-center shadow-sm">
          <button
            onClick={() => changeLanguage('vi')}
            className={`px-3 py-1.5 rounded-xl text-[10px] font-black tracking-wider transition-all duration-200 ${
              lang === 'vi' 
                ? 'bg-orange-500 text-white shadow-sm' 
                : 'text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200'
            }`}
          >
            🇻🇳 VI
          </button>
          <button
            onClick={() => changeLanguage('en')}
            className={`px-3 py-1.5 rounded-xl text-[10px] font-black tracking-wider transition-all duration-200 ${
              lang === 'en' 
                ? 'bg-orange-500 text-white shadow-sm' 
                : 'text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200'
            }`}
          >
            🇬🇧 EN
          </button>
        </div>

        {/* Theme switcher */}
        <button
          onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
          className="p-3 rounded-2xl bg-white dark:bg-zinc-900 text-slate-700 dark:text-zinc-200 shadow-sm border border-slate-100 dark:border-zinc-800/80 hover:scale-105 active:scale-95 transition-all"
          aria-label="Toggle Theme"
        >
          {resolvedTheme === 'dark' ? (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
          )}
        </button>
      </div>

      <main className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-[2.5rem] p-8 shadow-[0_10px_40px_rgba(0,0,0,0.03)] border border-slate-150 dark:border-zinc-800/60 transition-colors duration-300 animate-pulse-once">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-orange-500/10 text-orange-500 rounded-3xl flex items-center justify-center text-3xl mx-auto mb-4 shadow-sm border border-orange-500/10">
            🍜
          </div>
          <h1 className="flex flex-col items-center justify-center">
            <span className="font-logo text-4xl text-orange-500 dark:text-orange-400 font-normal leading-normal select-none">
              Chika Restaurant
            </span>
            <span className="text-[10px] uppercase font-black tracking-[0.25em] text-slate-500 dark:text-zinc-400 -mt-1 mb-2">
              Delivery
            </span>
          </h1>
          <p className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest">
            {t.subtitle}
          </p>
        </div>

        {/* Live Camera Scanner Container */}
        {isScanning ? (
          <div className="space-y-6 animate-fade-in">
            <div className="relative overflow-hidden rounded-[2rem] border border-orange-500 bg-black aspect-square shadow-inner">
              <div id="qr-reader" className="w-full h-full object-cover overflow-hidden" />
              
              {/* Elegant Viewfinder Overlay */}
              <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
                {/* Center scan square boundaries */}
                <div className="w-[80%] h-[80%] border-2 border-dashed border-white/40 rounded-3xl relative">
                  {/* Corner brackets */}
                  <div className="absolute -top-1.5 -left-1.5 w-6 h-6 border-t-4 border-l-4 border-orange-500 rounded-tl-xl" />
                  <div className="absolute -top-1.5 -right-1.5 w-6 h-6 border-t-4 border-r-4 border-orange-500 rounded-tr-xl" />
                  <div className="absolute -bottom-1.5 -left-1.5 w-6 h-6 border-b-4 border-l-4 border-orange-500 rounded-bl-xl" />
                  <div className="absolute -bottom-1.5 -right-1.5 w-6 h-6 border-b-4 border-r-4 border-orange-500 rounded-br-xl" />
                  
                  {/* Glowing dynamic scan line */}
                  <div className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-orange-500 to-transparent top-0 animate-scan shadow-[0_0_8px_rgba(240,84,35,0.8)]" />
                </div>
              </div>
            </div>

            <div className="text-center space-y-3">
              <p className="text-xs font-bold text-orange-500 animate-pulse px-4">
                {t.cameraStatus}
              </p>
              <button
                type="button"
                onClick={stopScanner}
                className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-750 text-slate-700 dark:text-zinc-200 text-xs font-bold rounded-xl transition-all"
              >
                {t.cancelButton}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Primary Action: QR scanner trigger */}
            <div className="space-y-3">
              <button
                onClick={startScanner}
                className="group relative flex w-full items-center justify-center gap-3 rounded-2xl py-4 bg-orange-500 text-white font-extrabold shadow-lg shadow-orange-500/20 hover:bg-orange-600 hover:scale-[1.01] active:scale-[0.99] transition-all text-sm tracking-wide"
              >
                <span className="text-lg">📸</span>
                <span>{t.scanCamera}</span>
                <span className="absolute right-4 opacity-50 group-hover:translate-x-1 transition-transform">→</span>
              </button>

              <label className="group flex w-full items-center justify-center gap-2 rounded-2xl py-3 border border-dashed border-slate-200 dark:border-zinc-855 hover:border-orange-500 dark:hover:border-orange-500/50 bg-slate-50/50 dark:bg-zinc-900 text-slate-500 dark:text-zinc-400 font-bold hover:text-orange-500 dark:hover:text-orange-500/80 cursor-pointer transition-all text-xs">
                <span>📁</span>
                <span>{t.scanUpload}</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>

            <div className="flex items-center gap-3 my-4">
              <div className="h-px bg-slate-150 dark:bg-zinc-800/80 flex-1" />
              <span className="text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-widest">{t.or}</span>
              <div className="h-px bg-slate-150 dark:bg-zinc-800/80 flex-1" />
            </div>

            {/* Fallback Option: Manual entry */}
            <form onSubmit={handleStartOrder} className="space-y-3.5">
              <div>
                <label htmlFor="table-id" className="block text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-widest mb-2.5">
                  ✦ {lang === 'vi' ? 'HOẶC NHẬP SỐ BÀN THỦ CÔNG' : 'OR ENTER TABLE NUMBER MANUALLY'} ✦
                </label>
                <div className="relative flex items-center bg-slate-50 dark:bg-zinc-800/40 border border-slate-100 dark:border-zinc-800/85 rounded-2xl p-1 focus-within:border-orange-500/80 focus-within:ring-4 focus-within:ring-orange-500/10 transition-all duration-300">
                  <div className="flex items-center justify-center pl-3.5 pr-2 text-slate-400 dark:text-zinc-500">
                    <span className="text-base select-none">🪑</span>
                  </div>
                  <input
                    id="table-id"
                    type="text"
                    placeholder={lang === 'vi' ? 'Ví dụ: Bàn 1, Bàn 2...' : 'E.g. Table 1, Table 2...'}
                    value={tableId}
                    onChange={(e) => {
                      setTableId(e.target.value);
                      setError('');
                    }}
                    className="w-full bg-transparent text-slate-900 dark:text-white pl-1 pr-24 py-3 text-xs font-black outline-none placeholder-slate-400 dark:placeholder-zinc-550"
                  />
                  <button
                    type="submit"
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 h-10 px-4 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-[10px] font-black tracking-widest uppercase transition-all shadow-md shadow-orange-500/10 hover:shadow-orange-500/20 active:scale-95 flex items-center justify-center gap-1"
                  >
                    <span>{lang === 'vi' ? 'VÀO BÀN' : 'ENTER'}</span>
                    <span className="text-[11px]">➔</span>
                  </button>
                </div>
                {error && (
                  <div className="text-red-500 text-xs font-semibold mt-3 flex items-center gap-1.5 px-1 animate-pulse">
                    <span>⚠️</span>
                    <span>{error}</span>
                  </div>
                )}
              </div>
            </form>
          </div>
        )}

        <div className="mt-8 border-t border-slate-100 dark:border-zinc-800/80 pt-6 text-center text-[10.5px] leading-relaxed font-semibold text-slate-400 dark:text-zinc-550">
          {t.helpText}
        </div>
      </main>

      {/* Welcome Modal Popup (Minimalist / No Icon) */}
      {welcomeModalOpen && welcomeTable && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md select-none text-center">
          {welcomeTable.status === 'reserved' ? (
            // RESERVED / BOOKED WARNING MODAL BLOCK
            <div className="relative w-full max-w-sm overflow-hidden rounded-3xl bg-white/95 dark:bg-zinc-900/95 border border-red-200/40 dark:border-red-955/20 p-6 sm:p-8 flex flex-col items-center justify-center shadow-2xl transition-all">
              {/* Absolute close button */}
              <button 
                onClick={() => setWelcomeModalOpen(false)}
                className="absolute right-4 top-4 w-8 h-8 rounded-full flex items-center justify-center bg-gray-100 dark:bg-zinc-800 text-gray-400 hover:text-gray-600 dark:hover:text-zinc-200 transition-colors"
              >
                ✕
              </button>

              {/* Red warning bar */}
              <div className="w-12 h-1.5 rounded-full bg-red-500 mb-6" />

              {/* Warning Header */}
              <h3 className="text-xl font-black text-red-600 dark:text-red-500 tracking-tight leading-tight flex items-center gap-1.5">
                <span>⚠️</span> {lang === 'vi' ? 'Bàn đã có khách hẹn!' : 'Table is Reserved!'}
              </h3>
              <p className="text-[10px] text-red-500 font-extrabold uppercase tracking-widest mt-1">
                {lang === 'vi' ? 'Không thể truy cập' : 'Access Restricted'}
              </p>

              {/* Red-border Table Details Box */}
              <div className="w-full mt-6 bg-red-50/50 dark:bg-red-955/10 border border-red-100 dark:border-red-950/30 rounded-2xl p-5 flex flex-col items-center justify-center relative overflow-hidden">
                <span className="text-[10px] font-black text-red-400 dark:text-red-500/75 uppercase tracking-widest">
                  {lang === 'vi' ? 'THÔNG TIN BÀN BẬN' : 'RESERVED TABLE'}
                </span>
                <span className="text-2xl font-black text-red-650 dark:text-red-400 mt-1.5 uppercase tracking-wide">
                  🪑 {welcomeTable.tableName}
                </span>
              </div>

              {/* Body Text */}
              <p className="text-[11.5px] font-semibold text-slate-500 dark:text-zinc-405 leading-relaxed mt-5 px-1">
                {lang === 'vi' 
                  ? 'Rất tiếc, bàn ăn này đã được giữ chỗ hoặc có khách đặt lịch hẹn trước từ quản trị viên. Quý khách vui lòng liên hệ nhân viên phục vụ tại quầy Chika Restaurant để được hỗ trợ đổi bàn khác.' 
                  : 'We are sorry, this table is currently reserved or locked by restaurant administrators. Please contact the staff at the reception counter to be relocated to another table.'}
              </p>

              {/* Close/Acknowledge Button */}
              <button
                onClick={() => setWelcomeModalOpen(false)}
                className="w-full mt-6 py-4 text-xs font-black text-slate-700 dark:text-zinc-200 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-750 rounded-2xl transition-all active:scale-95 border border-slate-200/20 dark:border-zinc-700/30 tracking-widest uppercase"
              >
                {lang === 'vi' ? 'QUAY LẠI & CHỌN BÀN KHÁC' : 'GO BACK & CHOOSE ANOTHER'}
              </button>
            </div>
          ) : (
            // STANDARD WELCOME MODAL
            <div className="relative w-full max-w-sm overflow-hidden rounded-3xl bg-white/95 dark:bg-zinc-900/95 border border-stone-200/50 dark:border-zinc-800/80 p-6 sm:p-8 flex flex-col items-center justify-center shadow-2xl hover:shadow-orange-500/5 transition-all animate-pulse-once">
              {/* Absolute close button */}
              <button 
                onClick={() => setWelcomeModalOpen(false)}
                className="absolute right-4 top-4 w-8 h-8 rounded-full flex items-center justify-center bg-gray-100 dark:bg-zinc-800 text-gray-400 hover:text-gray-655 dark:hover:text-zinc-200 transition-colors"
              >
                ✕
              </button>

              {/* Elegant Brand Accent Indicator at top */}
              <div className="w-12 h-1 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 mb-5" />

              {/* Calligraphy brand heading */}
              <div className="text-center space-y-1.5 mb-2">
                <h2 className="font-logo text-4xl text-orange-500 dark:text-orange-400 font-normal leading-none select-none">
                  Chika Restaurant
                </h2>
                <h3 className="text-[11px] font-black text-slate-800 dark:text-zinc-200 uppercase tracking-[0.2em] leading-none mt-1">
                  {lang === 'vi' ? 'Xin kính chào quý khách!' : 'Warmly Welcomes You!'}
                </h3>
              </div>

              {/* Table Details Box */}
              <div className="w-full mt-6 bg-gradient-to-br from-orange-500/5 to-amber-500/5 dark:from-orange-500/10 dark:to-amber-500/10 border border-orange-500/15 dark:border-orange-500/20 rounded-2xl p-5 flex flex-col items-center justify-center relative overflow-hidden">
                <div className="absolute -top-10 -right-10 w-20 h-20 bg-orange-500/10 rounded-full blur-xl pointer-events-none" />
                <div className="absolute -bottom-10 -left-10 w-20 h-20 bg-amber-500/10 rounded-full blur-xl pointer-events-none" />
                
                <span className="text-[9px] font-extrabold text-orange-600 dark:text-orange-400 uppercase tracking-widest mb-1.5">
                  ✦ {lang === 'vi' ? 'THÔNG TIN BÀN ĂN' : 'TABLE INFORMATION'} ✦
                </span>
                <span className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-wide flex items-center gap-1.5">
                  {welcomeTable.tableName}
                </span>
                <span className="text-[9px] font-bold text-slate-400 dark:text-zinc-500 mt-1.5 uppercase tracking-wider">
                  Mã bàn: {welcomeTable._id.slice(-6).toUpperCase()}
                </span>
              </div>

              {/* Help guidelines */}
              <p className="text-[11px] font-semibold text-slate-400 dark:text-zinc-550 leading-relaxed mt-5 px-1 text-center">
                {lang === 'vi' 
                  ? 'Hệ thống gọi món thông minh trực tuyến đã sẵn sàng. Vui lòng bấm tiếp tục bên dưới để xem thực đơn & gửi món trực tiếp tới nhà bếp.' 
                  : 'Smart digital table menu is fully loaded. Click continue below to view menu, choose dishes and order directly to the kitchen.'}
              </p>

              {/* Huge Glowing Interactive Action Button */}
              <button
                onClick={() => {
                  setWelcomeModalOpen(false);
                  router.push(`/table/${welcomeTable._id}`);
                }}
                className="group relative w-full mt-6 overflow-hidden rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 py-4 text-xs font-black text-white shadow-xl shadow-orange-500/25 transition-all hover:shadow-orange-500/40 active:scale-95"
              >
                {/* Button inner glow and animations */}
                <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="flex items-center justify-center gap-2 tracking-widest uppercase">
                  <span>{lang === 'vi' ? 'XEM THỰC ĐƠN & GỌI MÓN' : 'VIEW MENU & PLACE ORDER'}</span>
                  <span className="text-sm transition-transform group-hover:translate-x-1">🚀</span>
                </div>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
