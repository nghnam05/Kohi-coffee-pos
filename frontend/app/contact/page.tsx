'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { toast } from 'react-hot-toast';
import { ThemeToggleSwitch } from '@/components/table/ThemeToggleSwitch';
import { LanguageToggleSwitch, Lang } from '@/components/table/LanguageToggleSwitch';
import { BrandLogo } from '@/components/table/BrandLogo';

export default function ContactPage() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [lang, setLang] = useState<Lang>('vi');

  // Form State
  const [name, setName] = useState('');
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [subject, setSubject] = useState('booking');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setMounted(true);
    const savedLang = localStorage.getItem('pho-beyond-lang') as Lang;
    if (savedLang) setLang(savedLang);
  }, []);

  if (!mounted) return null;

  const isDark = theme === 'dark';

  const content = {
    vi: {
      badge: 'LIÊN HỆ & TƯ VẤN HỖ TRỢ',
      title: 'Kết Nối Với Kohi Coffee',
      subtitle: 'Chúng tôi luôn lắng nghe và hân hạnh được phục vụ quý khách 24/7. Hãy gửi tin nhắn hoặc ghé thăm quán trực tiếp!',
      homeBtn: 'Trang chủ',
      infoTitle: 'Thông Tin Cửa Hàng',
      addressLabel: 'ĐỊA CHỈ TRỤ SỞ',
      addressValue: '123 Đường Nguyễn Huệ, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh',
      hotlineLabel: 'HOTLINE HỖ TRỢ',
      hotlineValue: '1900 6868 - 0901 234 567',
      emailLabel: 'EMAIL LIÊN HỆ',
      emailValue: 'support@kohi.vn / info@kohi.vn',
      hoursLabel: 'GIỜ MỞ CỬA',
      hoursValue: '07:00 AM - 10:30 PM (Thứ 2 - Chủ Nhật)',

      formTitle: 'Gửi Tin Nhắn Cho Kohi',
      nameLabel: 'HỌ VÀ TÊN KHÁCH HÀNG',
      namePlaceholder: 'Ví dụ: Nguyễn Văn An',
      contactLabel: 'EMAIL HOẶC SỐ ĐIỆN THOẠI',
      contactPlaceholder: 'Ví dụ: 0901234567 hoặc an@example.com',
      subjectLabel: 'CHỦ ĐỀ LIÊN HỆ',
      subjects: {
        booking: 'Hỗ trợ đặt bàn / Tiệc sinh nhật',
        feedback: 'Góp ý chất lượng món & dịch vụ',
        partnership: 'Hợp tác kinh doanh & Cung ứng',
        other: 'Yêu cầu khác'
      },
      messageLabel: 'NỘI DUNG TƯ VẤN / GÓP Ý',
      messagePlaceholder: 'Vui lòng nhập chi tiết nội dung quý khách muốn liên hệ...',
      submitBtn: 'GỬI TIN NHẮN NGAY',
      submittingBtn: 'ĐANG GỬI TIN NHẮN...',
      successToast: 'Đã gửi yêu cầu liên hệ thành công! Nhân viên Kohi Coffee sẽ phản hồi sớm nhất.',
    },
    en: {
      badge: 'CONTACT & CUSTOMER SUPPORT',
      title: 'Get In Touch With Kohi Coffee',
      subtitle: 'We are always happy to hear from you. Drop us a message or visit our coffee shop in person!',
      homeBtn: 'Back to Home',
      infoTitle: 'Store Location & Info',
      addressLabel: 'STORE ADDRESS',
      addressValue: '123 Nguyen Hue Street, Ben Nghe Ward, District 1, Ho Chi Minh City',
      hotlineLabel: 'CUSTOMER HOTLINE',
      hotlineValue: '+84 1900 6868 / +84 901 234 567',
      emailLabel: 'EMAIL CONTACT',
      emailValue: 'support@kohi.vn / info@kohi.vn',
      hoursLabel: 'OPENING HOURS',
      hoursValue: '07:00 AM - 10:30 PM (Monday - Sunday)',

      formTitle: 'Send Us a Message',
      nameLabel: 'FULL NAME',
      namePlaceholder: 'E.g. John Smith',
      contactLabel: 'EMAIL OR PHONE NUMBER',
      contactPlaceholder: 'E.g. john@example.com or +84901234567',
      subjectLabel: 'INQUIRY SUBJECT',
      subjects: {
        booking: 'Table Reservation / Party Event',
        feedback: 'Service & Menu Feedback',
        partnership: 'Business Partnership & Supply',
        other: 'Other Inquiries'
      },
      messageLabel: 'YOUR MESSAGE',
      messagePlaceholder: 'Write your message details here...',
      submitBtn: 'SEND MESSAGE NOW',
      submittingBtn: 'SENDING MESSAGE...',
      successToast: 'Message sent successfully! Kohi Coffee team will reach out to you shortly.',
    },
    zh: {
      badge: '联系与客户支持',
      title: '与 Kohi Coffee 取得联系',
      subtitle: '我们随时乐意倾听您的需求。欢迎在线给我们留言或亲临门店体验！',
      homeBtn: '返回首页',
      infoTitle: '门店地址与联系方式',
      addressLabel: '门店地址',
      addressValue: '胡志明市第一郡阮惠街 123 号',
      hotlineLabel: '服务热线',
      hotlineValue: '+84 1900 6868 / +84 901 234 567',
      emailLabel: '电子邮箱',
      emailValue: 'support@kohi.vn / info@kohi.vn',
      hoursLabel: '营业时间',
      hoursValue: '07:00 AM - 10:30 PM（周一至周日）',

      formTitle: '发送留言给 Kohi',
      nameLabel: '顾客姓名',
      namePlaceholder: '例如：张伟',
      contactLabel: '邮箱或联系电话',
      contactPlaceholder: '例如：zhangwei@example.com 或 0901234567',
      subjectLabel: '咨询主题',
      subjects: {
        booking: '预订桌位 / 派对包场',
        feedback: '菜品与服务反馈',
        partnership: '商务合作与供应',
        other: '其他咨询'
      },
      messageLabel: '留言内容',
      messagePlaceholder: '请输入您想咨询或反馈的详细内容...',
      submitBtn: '立即发送留言',
      submittingBtn: '正在发送...',
      successToast: '留言发送成功！Kohi Coffee 客服团队将尽快回复您。',
    }
  };

  const t = content[lang] || content.vi;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !emailOrPhone.trim() || !message.trim()) {
      toast.error(lang === 'en' ? 'Please fill out all required fields.' : 'Vui lòng điền đầy đủ các thông tin bắt buộc.');
      return;
    }
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      toast.success(t.successToast);
      setName('');
      setEmailOrPhone('');
      setMessage('');
    }, 800);
  };

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
      <main className="flex-grow pt-8 sm:pt-12 pb-16 px-4 md:px-12 w-full max-w-6xl mx-auto">
        {/* Title Hero Banner */}
        <div className="text-center mb-10">
          <span className="inline-flex items-center justify-center px-4 py-1.5 rounded-full bg-sky-500/10 dark:bg-sky-500/20 text-[#0284c7] dark:text-[#38BDF8] text-[11px] sm:text-xs font-bold uppercase tracking-wider mb-4 border border-sky-500/20">
            {t.badge}
          </span>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 dark:text-white mb-3 tracking-tight">
            {t.title}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium max-w-2xl mx-auto leading-relaxed">
            {t.subtitle}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Contact Cards */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white dark:bg-[#0F141F] rounded-2xl p-6 sm:p-7 border border-slate-200/90 dark:border-slate-800/90 shadow-xs space-y-5">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white pb-3 border-b border-slate-200 dark:border-slate-800">
                {t.infoTitle}
              </h2>

              {/* Address */}
              <div className="space-y-1">
                <span className="text-[10.5px] font-extrabold text-[#0284c7] dark:text-[#38BDF8] uppercase tracking-wider block">
                  {t.addressLabel}
                </span>
                <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 font-medium leading-relaxed">
                  {t.addressValue}
                </p>
              </div>

              {/* Hotline */}
              <div className="space-y-1">
                <span className="text-[10.5px] font-extrabold text-[#0284c7] dark:text-[#38BDF8] uppercase tracking-wider block">
                  {t.hotlineLabel}
                </span>
                <p className="text-xs sm:text-sm text-slate-900 dark:text-white font-extrabold font-mono">
                  {t.hotlineValue}
                </p>
              </div>

              {/* Email */}
              <div className="space-y-1">
                <span className="text-[10.5px] font-extrabold text-[#0284c7] dark:text-[#38BDF8] uppercase tracking-wider block">
                  {t.emailLabel}
                </span>
                <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 font-medium">
                  {t.emailValue}
                </p>
              </div>

              {/* Opening Hours */}
              <div className="space-y-1 pt-2 border-t border-slate-200 dark:border-slate-800">
                <span className="text-[10.5px] font-extrabold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">
                  {t.hoursLabel}
                </span>
                <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 font-bold">
                  {t.hoursValue}
                </p>
              </div>
            </div>

            {/* Atmosphere Card */}
            <div className="bg-gradient-to-br from-[#0284c7]/10 via-[#0284c7]/5 to-transparent dark:from-[#38BDF8]/20 dark:via-[#38BDF8]/10 dark:to-transparent border border-[#0284c7]/20 dark:border-[#38BDF8]/20 rounded-2xl p-6 space-y-2">
              <h3 className="text-base font-extrabold text-[#0284c7] dark:text-[#38BDF8]">
                Kohi Coffee & Pastry
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                {lang === 'en'
                  ? 'Experience artisanal espresso, Vietnamese egg coffee, and freshly baked pastries in a quiet, cozy atmosphere.'
                  : 'Thưởng thức cà phê rang xay thủ công, cà phê trứng hảo hạng và bánh ngọt tươi mới trong không gian yên tĩnh, ấm cúng.'}
              </p>
            </div>
          </div>

          {/* Right Column: Contact Form */}
          <div className="lg:col-span-7 bg-white dark:bg-[#0F141F] rounded-2xl p-6 sm:p-8 border border-slate-200/90 dark:border-slate-800/90 shadow-xs space-y-6">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mb-1">
                {t.formTitle}
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
                {lang === 'en' ? 'Fill out the form below and we will get back to you.' : 'Vui lòng điền thông tin bên dưới để được nhân viên tư vấn hỗ trợ nhanh nhất.'}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase">
                  {t.nameLabel}
                </label>
                <input
                  type="text"
                  required
                  placeholder={t.namePlaceholder}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-[#161D2C] border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0284c7] dark:focus:ring-[#38BDF8]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase">
                  {t.contactLabel}
                </label>
                <input
                  type="text"
                  required
                  placeholder={t.contactPlaceholder}
                  value={emailOrPhone}
                  onChange={(e) => setEmailOrPhone(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-[#161D2C] border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0284c7] dark:focus:ring-[#38BDF8]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase">
                  {t.subjectLabel}
                </label>
                <select
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-[#161D2C] border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0284c7] dark:focus:ring-[#38BDF8]"
                >
                  <option value="booking">{t.subjects.booking}</option>
                  <option value="feedback">{t.subjects.feedback}</option>
                  <option value="partnership">{t.subjects.partnership}</option>
                  <option value="other">{t.subjects.other}</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase">
                  {t.messageLabel}
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder={t.messagePlaceholder}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-[#161D2C] border border-slate-200 dark:border-slate-800 rounded-xl p-4 text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0284c7] dark:focus:ring-[#38BDF8] resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-[#0284c7] hover:bg-[#0369a1] dark:bg-[#38BDF8] dark:hover:bg-[#0284c7] text-white dark:text-slate-950 text-xs sm:text-sm font-extrabold py-3.5 sm:py-4 rounded-xl shadow-md transition-all uppercase tracking-wider cursor-pointer active:scale-98 disabled:opacity-50 min-h-[44px]"
              >
                <span>{isSubmitting ? t.submittingBtn : t.submitBtn}</span>
              </button>
            </form>
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
            <Link href="/terms" className="text-xs text-slate-500 dark:text-slate-400 hover:text-[#0284c7] dark:hover:text-[#38BDF8] underline transition-colors">
              {lang === 'en' ? 'Terms of Service' : lang === 'zh' ? '服务条款' : 'Điều khoản dịch vụ'}
            </Link>
            <Link href="/contact" className="text-xs font-bold text-[#0284c7] dark:text-[#38BDF8] underline transition-colors">
              {lang === 'en' ? 'Contact Us' : lang === 'zh' ? '联系我们' : 'Liên hệ chúng tôi'}
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
