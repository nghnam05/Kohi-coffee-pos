'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { ThemeToggleSwitch } from '@/components/table/ThemeToggleSwitch';
import { LanguageToggleSwitch, Lang } from '@/components/table/LanguageToggleSwitch';
import { BrandLogo } from '@/components/table/BrandLogo';

export default function TermsPage() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [lang, setLang] = useState<Lang>('vi');

  useEffect(() => {
    setMounted(true);
    const savedLang = localStorage.getItem('pho-beyond-lang') as Lang;
    if (savedLang) setLang(savedLang);
  }, []);

  if (!mounted) return null;

  const isDark = theme === 'dark';

  const content = {
    vi: {
      badge: 'ĐIỀU KHOẢN & QUY ĐỊNH VẬN HÀNH',
      title: 'Điều Khoản Dịch Vụ Kohi Coffee',
      lastUpdated: 'Cập nhật lần cuối: Tháng 8, 2026',
      intro: 'Chào mừng quý khách đến với Kohi Coffee & Pastry. Bằng việc truy cập website, thực hiện đặt bàn trực tuyến hoặc quét mã QR gọi món tại bàn, quý khách đồng ý tuân thủ các điều khoản dịch vụ dưới đây.',
      homeBtn: 'Trang chủ',
      sections: [
        {
          id: '1. Quy định đặt bàn',
          title: '1. Quy Định Đặt Bàn & Giữ Chỗ',
          desc: 'Để đảm bảo công bằng cho tất cả khách hàng, các đơn đặt bàn trực tuyến tuân theo các quy định sau:',
          items: [
            'Thời gian giữ bàn tối đa: 15-20 phút so với giờ hẹn nhận bàn quý khách đã đăng ký.',
            'Nếu quá thời gian giữ bàn mà quý khách chưa tới và không liên hệ thông báo trước, hệ thống có thể tự động chuyển trạng thái bàn sang trống để phục vụ khách hàng khác.',
            'Quý khách có thể tự tra cứu và hủy đơn đặt bàn trực tuyến trước mốc giờ hẹn tối thiểu 30 phút.'
          ]
        },
        {
          id: '2. Gọi món qua QR',
          title: '2. Gọi Món & Phục Vụ Tại Bàn (QR Order)',
          desc: 'Quy trình gọi món bằng mã QR dán tại bàn:',
          items: [
            'Mã QR dán tại mỗi bàn đại diện cho vị trí ngồi thực tế của quý khách tại quán.',
            'Đơn hàng gửi đi sẽ được chuyển trực tiếp tới màn hình quầy pha chế / bếp để chuẩn bị.',
            'Quý khách vui lòng kiểm tra kỹ số lượng, loại thức uống và ghi chú (lượng đường, đá, v.v.) trước khi bấm xác nhận.'
          ]
        },
        {
          id: '3. Thanh toán & Hóa đơn',
          title: '3. Thanh Toán & Xuất Hóa Đơn',
          desc: 'Kohi Coffee hỗ trợ nhiều hình thức thanh toán tiện lợi:',
          items: [
            'Thanh toán Tiền mặt trực tiếp tại quầy hoặc nhân viên phục vụ tại bàn.',
            'Chuyển khoản ngân hàng nhanh qua mã VietQR hoặc ví điện tử MoMo.',
            'Giá niêm yết trên menu đã bao gồm các chi phí phục vụ. Quý khách có nhu cầu xuất hóa đơn đỏ vui lòng báo nhân viên trước khi thanh toán.'
          ]
        },
        {
          id: '4. Văn hóa & Không gian',
          title: '4. Quy Tắc Không Gian Cửa Hàng',
          desc: 'Kohi Coffee hướng tới trải nghiệm không gian cà phê văn minh, yên tĩnh:',
          items: [
            'Vui lòng giữ âm lượng nói chuyện và thiết bị điện tử ở mức vừa phải.',
            'Không mang thức ăn, nước uống bên ngoài vào cửa hàng (trừ sữa em bé).',
            'Không hút thuốc trong không gian máy lạnh (có khu vực sân vườn dành riêng cho người hút thuốc).'
          ]
        }
      ],
      contactBoxTitle: 'Cần hỗ trợ về quy định dịch vụ?',
      contactBoxDesc: 'Đội ngũ chăm sóc khách hàng Kohi Coffee sẵn sàng phản hồi quý khách 24/7.',
      contactBtn: 'Gửi thắc mắc'
    },
    en: {
      badge: 'OPERATIONAL TERMS & CONDITIONS',
      title: 'Kohi Coffee Terms of Service',
      lastUpdated: 'Last Updated: August 2026',
      intro: 'Welcome to Kohi Coffee & Pastry. By accessing our website, placing an online table reservation, or scanning QR code to order at your table, you agree to comply with the terms and conditions outlined below.',
      homeBtn: 'Back to Home',
      sections: [
        {
          id: '1. Reservation Policy',
          title: '1. Table Reservation & Grace Period',
          desc: 'To ensure fair service for all guests, online table bookings follow these terms:',
          items: [
            'Maximum table hold time is 15-20 minutes past your scheduled reservation arrival time.',
            'If you arrive late without prior notice, your table may be released to walk-in customers.',
            'You may look up and cancel your booking online up to 30 minutes before your scheduled arrival time.'
          ]
        },
        {
          id: '2. QR Code Ordering',
          title: '2. In-Store QR Table Ordering',
          desc: 'Guidelines for scanning QR code and ordering from your table:',
          items: [
            'The QR code placed on each table links directly to your active seating location.',
            'Submitted orders are dispatched directly to the barista kitchen display for instant preparation.',
            'Please verify item quantities, milk/sugar/ice customizations before submitting your order.'
          ]
        },
        {
          id: '3. Payment & Billing',
          title: '3. Payment & Digital Receipts',
          desc: 'Kohi Coffee provides flexible and secure payment methods:',
          items: [
            'Cash payment directly to table servers or cashier counter.',
            'Instant VietQR bank transfers or MoMo e-wallet payments.',
            'All listed menu prices include standard service fees. Please inform staff if you require an e-invoice.'
          ]
        },
        {
          id: '4. Store Etiquette',
          title: '4. Store Etiquette & Environment',
          desc: 'Kohi Coffee aims to provide a cozy and respectful atmosphere:',
          items: [
            'Please keep conversational and personal electronic device volume at a considerate level.',
            'Outside food and beverages are not permitted inside the coffee shop (except infant formula).',
            'Smoking is restricted to designated outdoor garden areas only.'
          ]
        }
      ],
      contactBoxTitle: 'Questions regarding our terms?',
      contactBoxDesc: 'Our Kohi Coffee support team is happy to assist you at any time.',
      contactBtn: 'Send Inquiry'
    },
    zh: {
      badge: '运营条款与规则',
      title: 'Kohi Coffee 服务条款',
      lastUpdated: '最后更新于：2026年8月',
      intro: '欢迎使用 Kohi Coffee & Pastry 服务。当您访问本网站、进行在线预订或扫描桌位二维码点餐时，即表示您同意遵守以下服务条款。',
      homeBtn: '返回首页',
      sections: [
        {
          id: '1. 订桌规则',
          title: '1. 桌位预订与保留规则',
          desc: '为保障所有顾客的公平就餐体验，在线订桌遵循以下规定：',
          items: [
            '桌位最多保留时间为预约入座时间起 15-20 分钟。',
            '如超出保留时间未到店且未提前通知，系统将自动释放桌位供其他顾客使用。',
            '您可在预约时间前至少 30 分钟自行在线查询并取消预订。'
          ]
        },
        {
          id: '2. 扫码点餐',
          title: '2. 扫码点餐与出餐服务',
          desc: '使用桌位二维码点餐的步骤与规范：',
          items: [
            '桌位上的二维码对应您在门店内实际就座的桌号。',
            '确认提交的订单将直接同步发送至吧台/厨房显示屏制作。',
            '提交前请仔细核对饮品数量、甜度及冰量要求。'
          ]
        },
        {
          id: '3. 支付与收据',
          title: '3. 支付方式与发票',
          desc: 'Kohi Coffee 支持多种便捷的支付手段：',
          items: [
            '现场现金支付给服务人员或收银台。',
            '通过 VietQR 银行码或 MoMo 电子钱包即时转账。',
            '菜单标注价格已包含标准服务费，如需开具发票请在结账前告知员工。'
          ]
        },
        {
          id: '4. 门店礼仪',
          title: '4. 门店环境与就餐礼仪',
          desc: 'Kohi Coffee 致力于营造文明、舒适的咖啡空间：',
          items: [
            '请保持适当的交谈音量，使用电子设备请佩戴耳机。',
            '谢绝外带食品及饮料进入店内（婴儿食品除外）。',
            '空调室内禁止吸烟，需吸烟者请至户外花园指定区域。'
          ]
        }
      ],
      contactBoxTitle: '对服务条款有疑问？',
      contactBoxDesc: 'Kohi Coffee 客服团队随时准备解答您的咨询。',
      contactBtn: '发送咨询'
    }
  };

  const t = content[lang] || content.vi;

  return (
    <div className="min-h-screen bg-slate-50/80 dark:bg-[#070A10] text-slate-900 dark:text-slate-100 transition-colors duration-300 font-sans flex flex-col justify-between antialiased">
      {/* Header */}
      <header className="bg-white/95 dark:bg-[#0F141F]/95 border-b border-slate-200 dark:border-slate-800 sticky top-0 left-0 w-full z-50 shadow-xs backdrop-blur-md">
        <div className="flex justify-between items-center w-full px-3 sm:px-6 md:px-12 py-2.5 sm:py-4 max-w-7xl mx-auto gap-2">
          <BrandLogo onClick={() => router.push('/')} />

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <LanguageToggleSwitch
              lang={lang}
              setLang={(l) => {
                setLang(l);
                localStorage.setItem('pho-beyond-lang', l);
              }}
            />
            <ThemeToggleSwitch isDark={isDark} setTheme={setTheme} />
            <Link
              href="/"
              className="bg-[#0284c7] hover:bg-[#0369a1] dark:bg-[#38BDF8] dark:hover:bg-[#0284c7] text-white dark:text-slate-950 transition-colors duration-200 px-3 sm:px-4 h-[28px] sm:h-[34px] rounded-full text-[11px] sm:text-xs font-bold shadow-xs whitespace-nowrap cursor-pointer active:scale-95 flex items-center shrink-0"
            >
              <span>{t.homeBtn}</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow pt-8 sm:pt-12 pb-16 px-4 md:px-12 w-full max-w-4xl mx-auto">
        {/* Title Hero Banner */}
        <div className="text-center mb-10">
          <span className="inline-flex items-center justify-center px-4 py-1.5 rounded-full bg-sky-500/10 dark:bg-sky-500/20 text-[#0284c7] dark:text-[#38BDF8] text-[11px] sm:text-xs font-bold uppercase tracking-wider mb-4 border border-sky-500/20">
            {t.badge}
          </span>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 dark:text-white mb-3 tracking-tight">
            {t.title}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
            {t.lastUpdated}
          </p>
        </div>

        {/* Intro Card */}
        <div className="bg-white dark:bg-[#0F141F] rounded-2xl p-6 sm:p-8 mb-8 border border-slate-200/90 dark:border-slate-800/90 shadow-xs">
          <p className="text-sm sm:text-base text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
            {t.intro}
          </p>
        </div>

        {/* Sections Grid */}
        <div className="space-y-6">
          {t.sections.map((section) => (
            <div
              key={section.id}
              className="bg-white dark:bg-[#0F141F] rounded-2xl p-6 sm:p-8 border border-slate-200/90 dark:border-slate-800/90 shadow-xs space-y-4"
            >
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#0284c7] dark:bg-[#38BDF8]" />
                {section.title}
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
                {section.desc}
              </p>
              <ul className="space-y-2.5 pt-1">
                {section.items.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                    <span className="text-[#0284c7] dark:text-[#38BDF8] font-bold mt-0.5">•</span>
                    <span className="leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Contact Support CTA Box */}
        <div className="mt-10 bg-gradient-to-r from-sky-500/10 via-sky-500/5 to-transparent dark:from-sky-500/20 dark:via-sky-500/10 dark:to-transparent border border-sky-500/20 rounded-2xl p-6 sm:p-8 text-center space-y-4">
          <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
            {t.contactBoxTitle}
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-xl mx-auto">
            {t.contactBoxDesc}
          </p>
          <div className="pt-2">
            <Link
              href="/contact"
              className="inline-flex items-center justify-center px-6 py-3 bg-[#0284c7] hover:bg-[#0369a1] dark:bg-[#38BDF8] dark:hover:bg-[#0284c7] text-white dark:text-slate-950 font-bold text-xs sm:text-sm rounded-xl transition-all shadow-md active:scale-95"
            >
              {t.contactBtn}
            </Link>
          </div>
        </div>
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
            <Link href="/terms" className="text-xs font-bold text-[#0284c7] dark:text-[#38BDF8] underline transition-colors">
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
