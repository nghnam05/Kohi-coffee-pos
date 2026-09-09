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

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

interface CouponItem {
  _id?: string;
  code: string;
  discountPercent?: number;
  discountAmount?: number;
  minOrderAmount?: number;
  description?: string;
  isActive?: boolean;
}

const DICTIONARY = {
  vi: {
    backToMenu: 'Quay lại Menu',
    heroTag: 'ƯU ĐÃI & TRẢI NGHIỆM ĐỘC QUYỀN',
    heroTitle: 'Theo Dõi Tiến Độ Đơn & Ưu Đãi Giảm Giá',
    heroDesc: 'Cập nhật trực tiếp quy trình chế biến của Barista ngay trên điện thoại và nhận ngay các mã khuyến mãi dành riêng cho bàn của bạn.',
    tableLabel: 'Bàn phục vụ',
    couponsTitle: 'Mã Giảm Giá Đang Khả Dụng',
    couponsSubtitle: 'Sao chép mã và dán vào ô Khuyến mãi trong giỏ hàng khi gửi đơn',
    copyCode: 'Sao chép',
    copiedCode: 'Đã sao chép mã giảm giá!',
    minOrder: 'Áp dụng cho đơn từ',
    discount: 'Giảm',
    trackerTitle: 'Trải Nghiệm Live Kitchen Tracker',
    trackerSubtitle: 'Minh bạch 100% từng bước pha chế món ăn thức uống',
    ctaOrder: 'Đặt Món & Dùng Ưu Đãi Ngay',
    steps: [
      {
        step: '01',
        title: 'Gửi Đơn Tại Bàn',
        desc: 'Đơn hàng kèm ghi chú tùy biến của bạn được gửi tức thì đến quầy thu ngân và quầy bar.',
      },
      {
        step: '02',
        title: 'Phục Vụ Duyệt Đơn',
        desc: 'Nhân viên xác nhận các yêu cầu đặc biệt và tự động in phiếu chế biến xuống khu vực Barista.',
      },
      {
        step: '03',
        title: 'Barista Pha Chế',
        desc: 'Thức uống được chiết xuất từ hạt cà phê Specialty tươi mới, cân chỉnh đá và đường chuẩn công thức.',
      },
      {
        step: '04',
        title: 'Sẵn Sàng Ra Món',
        desc: 'Món ăn & bánh ngọt được kiểm tra nhiệt độ và hình thức trước khi nhân viên mang ra bàn.',
      },
      {
        step: '05',
        title: 'Thưởng Thức Tại Chỗ',
        desc: 'Món được phục vụ tận bàn kèm lời chúc ngon miệng. Khách có thể thanh toán không tiền mặt bất cứ lúc nào.',
      },
    ],
  },
  en: {
    backToMenu: 'Back to Menu',
    heroTag: 'EXCLUSIVE OFFERS & EXPERIENCE',
    heroTitle: 'Live Order Tracking & Promo Coupons',
    heroDesc: 'Follow barista preparation stages live on your phone and claim exclusive discount vouchers for your table.',
    tableLabel: 'Serving Table',
    couponsTitle: 'Available Discount Coupons',
    couponsSubtitle: 'Copy code and paste into the Promo box in your cart',
    copyCode: 'Copy',
    copiedCode: 'Coupon code copied!',
    minOrder: 'Min order from',
    discount: 'Discount',
    trackerTitle: 'Live Kitchen Tracker Experience',
    trackerSubtitle: '100% transparent beverage & pastry crafting process',
    ctaOrder: 'Order & Apply Promo Now',
    steps: [
      {
        step: '01',
        title: 'Table Order Submitted',
        desc: 'Your personalized order and custom notes are instantly routed to the cashier and bar.',
      },
      {
        step: '02',
        title: 'Staff Approval',
        desc: 'Staff validates special requests and issues kitchen tickets for baristas.',
      },
      {
        step: '03',
        title: 'Barista Crafting',
        desc: 'Crafted using freshly ground specialty beans with precise ice and sugar ratios.',
      },
      {
        step: '04',
        title: 'Ready for Service',
        desc: 'Drinks & pastries undergo quality check before dispatching to your table.',
      },
      {
        step: '05',
        title: 'Served & Enjoyed',
        desc: 'Served directly at your table. Easily pay cashless with dynamic QR anytime.',
      },
    ],
  },
  zh: {
    backToMenu: '返回点单',
    heroTag: '专属优惠与服务体验',
    heroTitle: '实时订单追踪与优惠券',
    heroDesc: '在手机上实时查看咖啡制作进度，享受专属桌位优惠减免。',
    tableLabel: '当前就座桌号',
    couponsTitle: '当前可用优惠券',
    couponsSubtitle: '复制券码并在购物车优惠券输入框粘贴使用',
    copyCode: '复制',
    copiedCode: '优惠码已复制！',
    minOrder: '适用最低消费',
    discount: '优惠',
    trackerTitle: '厨房实时追踪体验',
    trackerSubtitle: '100% 透明可视化制作流程',
    ctaOrder: '立即使用优惠点餐',
    steps: [
      {
        step: '01',
        title: '桌位即时下单',
        desc: '包含个性化备注的订单秒速传达至收银台与吧台。',
      },
      {
        step: '02',
        title: '服务人员核准',
        desc: '核对定制需求并自动下发制作小票至咖啡师工位。',
      },
      {
        step: '03',
        title: '咖啡师用心冲煮',
        desc: '采用新鲜精品咖啡豆现磨萃取，精确调配冰度甜度。',
      },
      {
        step: '04',
        title: '制作完毕待送',
        desc: '饮品及甜点出餐前进行品温确认，确保最佳赏味风味。',
      },
      {
        step: '05',
        title: '送达桌位享用',
        desc: '专人送餐至桌，并支持随时使用 VietQR 便捷扫码支付。',
      },
    ],
  },
};

export default function PromotionsPage() {
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
  const [coupons, setCoupons] = useState<CouponItem[]>([]);

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

  useEffect(() => {
    const fetchCoupons = async () => {
      try {
        const res = await fetch(`${API_BASE}/coupons`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            setCoupons(data.filter((c: CouponItem) => c.isActive !== false));
          } else {
            setCoupons([
              {
                code: 'KOHINEW',
                discountPercent: 10,
                minOrderAmount: 50000,
                description: 'Giảm 10% tổng hóa đơn cho khách lần đầu ghé quán',
              },
              {
                code: 'HAPPYHOUR',
                discountAmount: 20000,
                minOrderAmount: 80000,
                description: 'Giảm ngay 20.000đ khung giờ vàng đặt món',
              },
              {
                code: 'KOHICOFFEE',
                discountPercent: 15,
                minOrderAmount: 100000,
                description: 'Giảm 15% khi thưởng thức combo cà phê và bánh ngọt',
              },
            ]);
          }
        }
      } catch {
        setCoupons([
          {
            code: 'KOHINEW',
            discountPercent: 10,
            minOrderAmount: 50000,
            description: 'Giảm 10% cho khách gọi món tại bàn',
          },
          {
            code: 'HAPPYHOUR',
            discountAmount: 20000,
            minOrderAmount: 80000,
            description: 'Giảm ngay 20.000đ cho đơn từ 80.000đ',
          },
        ]);
      }
    };

    fetchCoupons();
  }, []);

  const t = DICTIONARY[lang] || DICTIONARY.vi;

  const handleBackToTable = () => {
    const query = token ? `?token=${encodeURIComponent(token)}` : '';
    router.push(`/table/${tableId}${query}`);
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success(`${t.copiedCode} (${code})`);
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

      {/* Main Scrollable Body with data-lenis-prevent */}
      <main
        data-lenis-prevent
        className="flex-1 min-h-0 overflow-y-auto overscroll-contain w-full scrollbar-thin"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10 pb-32 sm:pb-16 space-y-8 sm:space-y-12">
          {/* Hero Experience Banner */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-500/10 via-[#38BDF8]/5 to-transparent border border-emerald-500/30 p-6 sm:p-10 shadow-[0_10px_40px_rgba(16,185,129,0.1)]"
          >
            <div className="relative z-10 max-w-3xl space-y-3 sm:space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10px] sm:text-xs font-black tracking-wider uppercase">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
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
                  {t.ctaOrder}
                </button>
              </div>
            </div>

            {/* Decorative Glow */}
            <div className="absolute -right-16 -top-16 w-64 h-64 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
          </motion.div>

          {/* Coupons List Section */}
          <section className="space-y-4 sm:space-y-6">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                {t.couponsTitle}
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                {t.couponsSubtitle}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {coupons.map((coupon, idx) => (
                <motion.div
                  key={coupon.code || idx}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: idx * 0.08 }}
                  className="relative p-5 rounded-3xl bg-white dark:bg-[#0D111A] border border-slate-200/80 dark:border-slate-800 hover:border-[#38BDF8]/60 shadow-sm hover:shadow-xl transition-all flex flex-col justify-between group overflow-hidden"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2.5">
                      <span className="px-3 py-1 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-black tracking-wider">
                        {coupon.discountPercent
                          ? `${t.discount} ${coupon.discountPercent}%`
                          : `${t.discount} ${(coupon.discountAmount ?? 0).toLocaleString('vi-VN')} đ`}
                      </span>
                      <span className="text-[10px] text-slate-400 font-semibold">
                        {t.minOrder} {(coupon.minOrderAmount ?? 0).toLocaleString('vi-VN')} đ
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-4 leading-relaxed">
                      {coupon.description || 'Ưu đãi đặc quyền khi thưởng thức tại quán'}
                    </h3>
                  </div>

                  {/* Coupon Code Pill with Copy Action */}
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                    <span className="font-mono font-black text-sm tracking-widest text-[#38BDF8]">
                      {coupon.code}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopyCode(coupon.code)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#38BDF8]/15 hover:bg-[#38BDF8] text-[#38BDF8] hover:text-slate-950 text-xs font-black transition-colors active:scale-95 cursor-pointer border border-[#38BDF8]/30"
                    >
                      <span className="material-symbols-outlined text-sm">content_copy</span>
                      <span>{t.copyCode}</span>
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </section>

          {/* Live Kitchen Tracker Process (Zero Unnecessary Icons - Clean Typography Timeline) */}
          <section className="space-y-4 sm:space-y-6">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                {t.trackerTitle}
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                {t.trackerSubtitle}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 sm:gap-4">
              {t.steps.map((step, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: idx * 0.08 }}
                  className="p-5 rounded-3xl bg-white dark:bg-[#0D111A] border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between group hover:border-[#38BDF8]/50 transition-all"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-base font-black text-[#38BDF8] font-mono">
                        {step.step}
                      </span>
                      <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                        GIAI ĐOẠN {idx + 1}
                      </span>
                    </div>
                    <h4 className="text-sm font-black text-slate-900 dark:text-white mb-1.5 group-hover:text-[#38BDF8] transition-colors">
                      {step.title}
                    </h4>
                    <p className="text-[11.5px] text-slate-500 dark:text-slate-400 leading-relaxed font-normal">
                      {step.desc}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </section>

          {/* Bottom Big CTA */}
          <div className="pt-4 text-center">
            <button
              type="button"
              onClick={handleBackToTable}
              className="w-full sm:w-auto px-10 py-4 rounded-2xl bg-[#38BDF8] hover:bg-sky-400 text-slate-950 font-black text-sm uppercase tracking-wider shadow-[0_0_30px_rgba(56,189,248,0.4)] transition-all active:scale-95 cursor-pointer"
            >
              {t.ctaOrder}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
