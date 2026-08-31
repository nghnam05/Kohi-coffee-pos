'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { ThemeToggleSwitch } from '@/components/table/ThemeToggleSwitch';
import { LanguageToggleSwitch, Lang } from '@/components/table/LanguageToggleSwitch';
import { BrandLogo } from '@/components/table/BrandLogo';

export default function PrivacyPage() {
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
      badge: 'BẢO MẬT DỮ LIỆU & QUYỀN RIÊNG TƯ',
      title: 'Chính Sách Bảo Mật Kohi Coffee',
      lastUpdated: 'Cập nhật lần cuối: Tháng 8, 2026',
      intro: 'Kohi Coffee & Pastry cam kết bảo vệ tuyệt đối thông tin cá nhân và quyền riêng tư của quý khách hàng khi sử dụng dịch vụ đặt bàn trực tuyến, gọi món qua mã QR và thanh toán điện tử.',
      homeBtn: 'Trang chủ',
      sections: [
        {
          id: '1. Thu thập thông tin',
          title: '1. Thông Tin Thu Thập',
          desc: 'Chúng tôi chỉ thu thập các thông tin cần thiết phục vụ cho việc vận hành dịch vụ, bao gồm:',
          items: [
            'Họ tên và số điện thoại liên hệ khi quý khách thực hiện đặt bàn trực tuyến.',
            'Lịch sử chọn món và yêu cầu đặc biệt khi sử dụng dịch vụ gọi món tại bàn bằng QR.',
            'Mã giao dịch chuyển khoản ngân hàng VietQR hoặc MoMo để xác nhận thanh toán thành công.'
          ]
        },
        {
          id: '2. Mục đích sử dụng',
          title: '2. Mục Đích Sử Dụng Thông Tin',
          desc: 'Dữ liệu của quý khách được sử dụng duy nhất cho các mục đích hợp pháp dưới đây:',
          items: [
            'Xác nhận và duy trì vị trí giữ chỗ đặt bàn tại cửa hàng Kohi Coffee.',
            'Chuyển thông tin món ăn trực tiếp đến quầy pha chế / bếp để phục vụ quý khách nhanh chóng.',
            'Gửi thông báo xác nhận trạng thái đơn hàng và xuất hóa đơn điện tử.',
            'Nâng cao chất lượng dịch vụ và hỗ trợ xử lý sự cố kịp thời.'
          ]
        },
        {
          id: '3. Bảo mật & An toàn',
          title: '3. Bảo Mật & An Toàn Dữ Liệu',
          desc: 'Chúng tôi áp dụng các tiêu chuẩn bảo mật hiện đại nhất để ngăn chặn truy cập trái phép:',
          items: [
            'Toàn bộ kết nối giữa thiết bị của quý khách và hệ thống đều được mã hóa chuẩn SSL/TLS.',
            'Dữ liệu đặt bàn và lịch sử thanh toán được lưu trữ trên hạ tầng máy chủ bảo mật cao.',
            'Cam kết không chia sẻ, bán hoặc trao đổi thông tin khách hàng cho bất kỳ bên thứ ba nào vì mục đích thương mại.'
          ]
        },
        {
          id: '4. Quyền của khách hàng',
          title: '4. Quyền Hạn Của Khách Hàng',
          desc: 'Quý khách hoàn toàn có quyền chủ động đối với thông tin cá nhân của mình:',
          items: [
            'Tra cứu, kiểm tra hoặc hủy đơn đặt bàn trực tuyến bất kỳ lúc nào thông qua số điện thoại.',
            'Yêu cầu nhân viên cửa hàng hoặc quản trị viên hỗ trợ xóa dữ liệu cá nhân khỏi hệ thống.'
          ]
        }
      ],
      contactBoxTitle: 'Quý khách có thắc mắc về chính sách bảo mật?',
      contactBoxDesc: 'Vui lòng liên hệ bộ phận hỗ trợ khách hàng Kohi Coffee qua email hoặc hotline.',
      contactBtn: 'Liên hệ Hỗ trợ'
    },
    en: {
      badge: 'DATA PROTECTION & PRIVACY',
      title: 'Kohi Coffee Privacy Policy',
      lastUpdated: 'Last Updated: August 2026',
      intro: 'Kohi Coffee & Pastry is fully committed to protecting your personal data and privacy when using our online table reservation, QR table ordering, and electronic payment services.',
      homeBtn: 'Back to Home',
      sections: [
        {
          id: '1. Information Collection',
          title: '1. Information We Collect',
          desc: 'We only collect essential data required to provide seamless services:',
          items: [
            'Full name and phone number provided during online table reservations.',
            'Order item choices and special culinary notes submitted via QR table code.',
            'Transaction verification codes for VietQR bank transfers or MoMo digital payments.'
          ]
        },
        {
          id: '2. Purpose of Use',
          title: '2. How We Use Your Information',
          desc: 'Your data is strictly utilized for the following legitimate purposes:',
          items: [
            'Confirming and reserving your selected table session at Kohi Coffee store.',
            'Transmitting your order directly to the barista counter for prompt preparation.',
            'Notifying you of order status updates and generating digital receipts.',
            'Improving service quality and resolving customer inquiries effectively.'
          ]
        },
        {
          id: '3. Security & Safety',
          title: '3. Data Security & Safety',
          desc: 'We enforce stringent security standards to safeguard your information:',
          items: [
            'All data transmissions between your browser and our server are encrypted via SSL/TLS.',
            'Reservation records and transaction logs are stored on high-security server infrastructure.',
            'We never share, sell, or trade your personal information with third parties for commercial gain.'
          ]
        },
        {
          id: '4. Customer Rights',
          title: '4. Your Rights & Options',
          desc: 'You maintain full control over your personal information:',
          items: [
            'Look up, review, or cancel your active table reservation using your registered phone number.',
            'Request store management to delete your personal reservation record from our system.'
          ]
        }
      ],
      contactBoxTitle: 'Have questions about our Privacy Policy?',
      contactBoxDesc: 'Feel free to get in touch with Kohi Coffee support team via email or hotline.',
      contactBtn: 'Contact Support'
    },
    zh: {
      badge: '数据保护与隐私',
      title: 'Kohi Coffee 隐私政策',
      lastUpdated: '最后更新于：2026年8月',
      intro: 'Kohi Coffee & Pastry 致力于在您使用在线订桌、扫码点餐及电子支付服务时，严格保护您的个人数据与隐私安全。',
      homeBtn: '返回首页',
      sections: [
        {
          id: '1. 信息收集',
          title: '1. 收集的信息',
          desc: '我们仅收集提供优质服务所必需的信息：',
          items: [
            '在进行在线订桌时提供的姓名及联系电话。',
            '通过桌位二维码提交的点餐内容及特殊饮食要求。',
            '用于确认支付成功的 VietQR 银行转账或 MoMo 电子支付交易凭证。'
          ]
        },
        {
          id: '2. 使用目的',
          title: '2. 信息使用目的',
          desc: '您的个人信息仅用于以下合法用途：',
          items: [
            '确认并保留您在 Kohi Coffee 门店内预订的桌位。',
            '将点餐订单即时传输至吧台/厨房进行快速制作。',
            '发送订单状态通知及生成电子收据。',
            '提升整体服务质量并及时处理顾客问题。'
          ]
        },
        {
          id: '3. 安全保障',
          title: '3. 数据安全保障',
          desc: '我们采取严格的安全标准防止未经授权的访问：',
          items: [
            '您与服务器之间的所有数据传输均经过 SSL/TLS 标准加密。',
            '订桌及支付记录安全存储于高防护级别的服务器集群。',
            '绝不出售、出租或共享您的个人信息给任何第三方用于商业目的。'
          ]
        },
        {
          id: '4. 客户权利',
          title: '4. 您的权利',
          desc: '您对个人信息拥有完全的控制权：',
          items: [
            '随时通过手机号码查询、核对或取消您的在线预订。',
            '要求门店管理人员从系统中删除您的个人预订记录。'
          ]
        }
      ],
      contactBoxTitle: '对隐私政策有任何疑问？',
      contactBoxDesc: '欢迎通过电子邮件或热线与 Kohi Coffee 客服团队取得联系。',
      contactBtn: '联系客服'
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
            <Link href="/privacy" className="text-xs font-bold text-[#0284c7] dark:text-[#38BDF8] underline transition-colors">
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
