'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { useTheme } from 'next-themes';
import { BrandLogo } from '@/components/table/BrandLogo';
import { ThemeToggleSwitch } from '@/components/table/ThemeToggleSwitch';
import { LanguageToggleSwitch, Lang } from '@/components/table/LanguageToggleSwitch';
import { formatTableName } from '@/utils/format';
import { toast } from 'react-hot-toast';

const DICTIONARY = {
  vi: {
    backToMenu: 'Quay lại Menu',
    heroTag: 'LỜI CHÀO TỪ KOHI COFFEE',
    heroTitle: 'Chào mừng quý khách đến với Kohi Coffee & Pastry',
    heroDesc: 'Nơi từng giọt cà phê Specialty và từng chiếc bánh ngọt được chăm chút tỉ mỉ, mang đến cho bạn không gian thư giãn và nguồn cảm hứng bất tận.',
    tableLabel: 'Bàn phục vụ',
    featuresTitle: '4 Trải Nghiệm Công Nghệ Tại Bàn',
    featuresSubtitle: 'Gọi món nhanh chóng, cá nhân hóa khẩu vị và theo dõi trực tiếp',
    amenitiesTitle: 'Tiện Ích Dành Cho Bạn',
    amenitiesSubtitle: 'Mọi tiện nghi được chuẩn bị chu đáo để bạn thoải mái nhất',
    wifiTitle: 'Wifi Tốc Độ Cao',
    wifiName: 'Kohi Coffee Guest',
    wifiPass: 'kohi8888',
    copyPass: 'Sao chép',
    copiedPass: 'Đã sao chép mật khẩu!',
    hoursTitle: 'Giờ Mở Cửa Phục Vụ',
    hoursValue: '07:00 - 22:00 hàng ngày',
    spaceTitle: 'Không Gian & Ổ Cắm Điện',
    spaceDesc: 'Trang bị ổ cắm sạc tại bàn, điều hòa mát lạnh và khu vực ngoài trời thoáng đãng.',
    ctaBtn: 'Khám Phá Menu & Gọi Món Ngay',
    features: [
      {
        num: '01',
        title: 'Gọi Món Bằng Giọng Nói AI',
        desc: 'Nói tự nhiên món bạn thích. Kohi AI sẽ tự động phân tích tên món, số lượng, size và mức đường/đá vào giỏ hàng.',
        tag: 'KOHI VOICE AI',
      },
      {
        num: '02',
        title: 'Tùy Biến Thức Uống Chuẩn Gu',
        desc: 'Thoải mái tùy chỉnh lượng đá, độ ngọt (0% - 100%), đổi size ly và thêm đa dạng loại topping theo đúng sở thích.',
        tag: 'CÁ NHÂN HÓA',
      },
      {
        num: '03',
        title: 'Theo Dõi Tiến Độ Bếp Realtime',
        desc: 'Biết chính xác từng giai đoạn chế biến: từ lúc nhân viên duyệt đơn đến khi Barista pha chế và bưng ra tận bàn.',
        tag: 'MINH BẠCH',
      },
      {
        num: '04',
        title: 'Thanh Toán Không Tiền Mặt VietQR',
        desc: 'Quét mã QR thanh toán nhanh qua mọi ứng dụng ngân hàng, hoặc gọi nhân viên phục vụ chỉ với một chạm.',
        tag: 'TIỆN LỢI',
      },
    ],
  },
  en: {
    backToMenu: 'Back to Menu',
    heroTag: 'GREETINGS FROM KOHI COFFEE',
    heroTitle: 'Welcome to Kohi Coffee & Pastry',
    heroDesc: 'Where every cup of specialty coffee and fresh pastry is handcrafted to inspire your day with comfort and relaxation.',
    tableLabel: 'Serving Table',
    featuresTitle: '4 Smart Dining Experiences',
    featuresSubtitle: 'Instant voice ordering, custom recipes, and real-time tracking',
    amenitiesTitle: 'Store Amenities',
    amenitiesSubtitle: 'Thoughtfully prepared for your optimal comfort',
    wifiTitle: 'High-speed Wi-Fi',
    wifiName: 'Kohi Coffee Guest',
    wifiPass: 'kohi8888',
    copyPass: 'Copy',
    copiedPass: 'Password copied!',
    hoursTitle: 'Opening Hours',
    hoursValue: '07:00 - 22:00 Daily',
    spaceTitle: 'Workspace & Power Outlets',
    spaceDesc: 'Power sockets available at every table, quiet AC rooms and breezy open-air space.',
    ctaBtn: 'Explore Menu & Order Now',
    features: [
      {
        num: '01',
        title: 'AI Voice Ordering',
        desc: 'Order naturally with your voice. Kohi AI extracts item names, quantity, size, ice and sugar levels automatically.',
        tag: 'KOHI VOICE AI',
      },
      {
        num: '02',
        title: 'Personalized Customization',
        desc: 'Freely choose sweetness (0% - 100%), ice level, cup sizes and delicious toppings just the way you love.',
        tag: 'CUSTOMIZE',
      },
      {
        num: '03',
        title: 'Live Kitchen Progress Tracker',
        desc: 'Watch real-time preparation stages: from order confirmation, brewing, to table delivery.',
        tag: 'TRANSPARENCY',
      },
      {
        num: '04',
        title: 'Cashless VietQR Payment',
        desc: 'Scan dynamic VietQR to pay via any mobile banking app, or call waiter assistance in one tap.',
        tag: 'CONVENIENT',
      },
    ],
  },
  zh: {
    backToMenu: '返回点单',
    heroTag: 'KOHI COFFEE 欢迎您',
    heroTitle: '欢迎光临 Kohi Coffee & Pastry',
    heroDesc: '每一杯精品咖啡与精致甜点皆用心呈现，为您带来静谧舒适的美好时光。',
    tableLabel: '当前就座桌号',
    featuresTitle: '4 大智能就餐体验',
    featuresSubtitle: 'AI语音点餐、个性化定制与厨房制作实时追踪',
    amenitiesTitle: '店内便利设施',
    amenitiesSubtitle: '贴心周到的服务，尽享惬意空间',
    wifiTitle: '高速无线网络',
    wifiName: 'Kohi Coffee Guest',
    wifiPass: 'kohi8888',
    copyPass: '复制',
    copiedPass: '密码已复制！',
    hoursTitle: '营业时间',
    hoursValue: '每日 07:00 - 22:00',
    spaceTitle: '办公空间与充电插座',
    spaceDesc: '每桌均配有充电插座，冷气舒适区与户外休闲区任您选择。',
    ctaBtn: '浏览菜单并立即点单',
    features: [
      {
        num: '01',
        title: 'AI 语音点餐',
        desc: '用普通话或英语自然说出您的喜好，Kohi AI 自动识别数量、杯型与甜度冰量。',
        tag: 'KOHI VOICE AI',
      },
      {
        num: '02',
        title: '随心个性化口味',
        desc: '自由调整甜度（0% - 100%）、冰块多寡与杯型尺寸，搭配丰富的特色配料。',
        tag: '专属定制',
      },
      {
        num: '03',
        title: '制作进度实时看板',
        desc: '订单确认、咖啡师冲煮到出餐送达，全程透明可见。',
        tag: '全流程可视',
      },
      {
        num: '04',
        title: '便捷无现金支付',
        desc: '扫码 VietQR 即可极速付款，或一键呼叫服务员提供贴心协助。',
        tag: '高效便捷',
      },
    ],
  },
};

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

export default function WelcomePage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();

  const tableId = (params?.tableId as string) || '';
  const token = searchParams.get('token') || '';

  const [lang, setLang] = useState<Lang>('vi');
  const [tableName, setTableName] = useState<string>(() => {
    return searchParams.get('tableName') || '';
  });
  const { theme, setTheme } = useTheme();
  const isDark = theme !== 'light';

  useEffect(() => {
    const savedLang = localStorage.getItem('kohi_lang') as Lang;
    if (savedLang) setLang(savedLang);
  }, []);

  useEffect(() => {
    const paramTable = searchParams.get('tableName');
    if (paramTable) {
      setTableName(paramTable);
      return;
    }
    if (tableId) {
      fetch(`${API_BASE}/tables/${tableId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data?.tableName) {
            setTableName(data.tableName);
          }
        })
        .catch(() => {});
    }
  }, [tableId, searchParams]);

  const t = DICTIONARY[lang] || DICTIONARY.vi;

  const handleBackToTable = () => {
    const query = token ? `?token=${encodeURIComponent(token)}` : '';
    router.push(`/table/${tableId}${query}`);
  };

  const handleCopyWifi = () => {
    navigator.clipboard.writeText(t.wifiPass);
    toast.success(t.copiedPass);
  };

  return (
    <div className="fixed inset-0 w-full h-full flex flex-col overflow-hidden bg-slate-50 dark:bg-[#090D16] text-slate-900 dark:text-white font-sans selection:bg-[#38BDF8] selection:text-slate-950 transition-colors">
      {/* Top Fixed Header */}
      <header className="shrink-0 z-40 bg-white/95 dark:bg-[#090D16]/95 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div onClick={handleBackToTable} className="cursor-pointer" title={t.backToMenu}>
            <BrandLogo />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <LanguageToggleSwitch lang={lang} setLang={setLang} />
          <ThemeToggleSwitch isDark={isDark} setTheme={setTheme} />
        </div>
      </header>

      {/* Main Scrollable Body with data-lenis-prevent to guarantee smooth scrolling */}
      <main
        data-lenis-prevent
        className="flex-1 min-h-0 overflow-y-auto overscroll-contain w-full scrollbar-thin"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10 pb-32 sm:pb-16 space-y-8 sm:space-y-12">
          {/* Hero Welcome Banner */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-sky-500/10 via-[#38BDF8]/5 to-transparent border border-sky-500/30 p-6 sm:p-10 shadow-[0_10px_40px_rgba(56,189,248,0.1)]"
          >
            <div className="relative z-10 max-w-3xl space-y-3 sm:space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#38BDF8]/15 border border-[#38BDF8]/30 text-[#38BDF8] text-[10px] sm:text-xs font-black tracking-wider uppercase">
                <span className="w-1.5 h-1.5 rounded-full bg-[#38BDF8] animate-ping" />
                <span>{t.heroTag}</span>
              </div>

              <h1 className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight leading-snug">
                {t.heroTitle}
              </h1>

              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
                {t.heroDesc}
              </p>

              <div className="pt-2 flex flex-wrap items-center gap-3">
                <div className="px-4 py-2 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 backdrop-blur-md text-xs font-bold text-slate-700 dark:text-slate-200 shadow-sm">
                  <span>{t.tableLabel}: <strong className="text-[#38BDF8] font-black">{formatTableName(tableName || 'Bàn', lang)}</strong></span>
                </div>

                <button
                  type="button"
                  onClick={handleBackToTable}
                  className="px-6 py-2.5 rounded-2xl bg-[#38BDF8] hover:bg-sky-400 text-slate-950 font-black text-xs shadow-lg shadow-sky-500/25 transition-all active:scale-95 cursor-pointer uppercase tracking-wider"
                >
                  {t.ctaBtn}
                </button>
              </div>
            </div>

            {/* Decorative Glow */}
            <div className="absolute -right-16 -top-16 w-64 h-64 bg-[#38BDF8]/20 rounded-full blur-3xl pointer-events-none" />
          </motion.div>

          {/* 4 Smart Dining Experiences Grid (Zero Unnecessary Icons) */}
          <section className="space-y-4 sm:space-y-6">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                {t.featuresTitle}
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                {t.featuresSubtitle}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              {t.features.map((item, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: idx * 0.08 }}
                  className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-[#0D111A] border border-slate-200/80 dark:border-slate-800 hover:border-[#38BDF8]/50 shadow-sm hover:shadow-lg transition-all group flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="px-2.5 py-1 rounded-xl bg-sky-500/10 text-[#38BDF8] border border-sky-500/20 text-[10px] font-black uppercase tracking-wider">
                        {item.tag}
                      </span>
                      <span className="font-mono text-sm font-black text-slate-400 dark:text-slate-500 group-hover:text-[#38BDF8] transition-colors">
                        {item.num}
                      </span>
                    </div>
                    <h3 className="text-base font-black text-slate-900 dark:text-white mb-2 group-hover:text-[#38BDF8] transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-normal">
                      {item.desc}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </section>

          {/* Store Amenities Section */}
          <section className="space-y-4 sm:space-y-6">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                {t.amenitiesTitle}
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                {t.amenitiesSubtitle}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
              {/* Wifi Box */}
              <div className="p-5 rounded-3xl bg-white dark:bg-[#0D111A] border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-2 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-black uppercase tracking-wider">
                      WIFI FREE
                    </span>
                  </div>
                  <h4 className="text-sm font-black text-slate-900 dark:text-white mb-1">
                    {t.wifiTitle}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                    SSID: <strong className="text-slate-800 dark:text-slate-200">{t.wifiName}</strong>
                  </p>
                </div>
                <div className="pt-2 flex items-center justify-between p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <span className="text-xs font-mono font-black text-[#38BDF8]">{t.wifiPass}</span>
                  <button
                    type="button"
                    onClick={handleCopyWifi}
                    className="px-3 py-1 rounded-xl bg-[#38BDF8] text-slate-950 text-xs font-black active:scale-95 cursor-pointer"
                  >
                    {t.copyPass}
                  </button>
                </div>
              </div>

              {/* Opening Hours */}
              <div className="p-5 rounded-3xl bg-white dark:bg-[#0D111A] border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between">
                <div>
                  <span className="px-2 py-0.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-black uppercase tracking-wider mb-2 inline-block">
                    07:00 - 22:00
                  </span>
                  <h4 className="text-sm font-black text-slate-900 dark:text-white mb-1">
                    {t.hoursTitle}
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-300 font-semibold mt-1">
                    {t.hoursValue}
                  </p>
                </div>
                <div className="pt-3 text-[11px] text-slate-400 leading-relaxed border-t border-slate-100 dark:border-slate-800/80">
                  Phục vụ cả tuần, quầy bar chốt order trước 21:45.
                </div>
              </div>

              {/* Workspace & Outlets */}
              <div className="p-5 rounded-3xl bg-white dark:bg-[#0D111A] border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between">
                <div>
                  <span className="px-2 py-0.5 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20 text-[10px] font-black uppercase tracking-wider mb-2 inline-block">
                    TIỆN ÍCH BÀN
                  </span>
                  <h4 className="text-sm font-black text-slate-900 dark:text-white mb-1">
                    {t.spaceTitle}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                    {t.spaceDesc}
                  </p>
                </div>
                <div className="pt-3 text-[11px] text-slate-400 leading-relaxed border-t border-slate-100 dark:border-slate-800/80">
                  Thoải mái cắm sạc laptop và điện thoại làm việc.
                </div>
              </div>
            </div>
          </section>

          {/* Bottom Big CTA */}
          <div className="pt-4 text-center">
            <button
              type="button"
              onClick={handleBackToTable}
              className="w-full sm:w-auto px-10 py-4 rounded-2xl bg-[#38BDF8] hover:bg-sky-400 text-slate-950 font-black text-sm uppercase tracking-wider shadow-[0_0_30px_rgba(56,189,248,0.4)] transition-all active:scale-95 cursor-pointer"
            >
              {t.ctaBtn}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
