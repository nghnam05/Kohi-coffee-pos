'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { motion, AnimatePresence } from 'framer-motion';
import { ThemeToggleSwitch } from '@/components/table/ThemeToggleSwitch';
import { LanguageToggleSwitch, Lang } from '@/components/table/LanguageToggleSwitch';
import { BrandLogo } from '@/components/table/BrandLogo';
import CloudLoader from '../components/CloudLoader';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

export default function LoginPage() {
  const router = useRouter();
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isForgotPasswordModalOpen, setIsForgotPasswordModalOpen] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [lang, setLang] = useState<Lang>('vi');

  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  useEffect(() => {
    setMounted(true);
    if (localStorage.getItem('token')) {
      router.push('/dashboard');
    }
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setEmailError('');
    setPasswordError('');

    const cleanEmail = email.trim();
    const cleanPassword = password.trim();

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    let hasError = false;

    if (!cleanEmail) {
      setEmailError(lang === 'vi' ? 'Email không được để trống.' : lang === 'zh' ? '邮箱不能为空。' : 'Email is required.');
      hasError = true;
    } else if (!emailRegex.test(cleanEmail)) {
      setEmailError(lang === 'vi' ? 'Định dạng email không hợp lệ.' : lang === 'zh' ? '邮箱格式不正确。' : 'Invalid email format.');
      hasError = true;
    }

    if (!cleanPassword) {
      setPasswordError(lang === 'vi' ? 'Mật khẩu không được để trống.' : lang === 'zh' ? '密码不能为空。' : 'Password is required.');
      hasError = true;
    } else if (cleanPassword.length < 6) {
      setPasswordError(lang === 'vi' ? 'Mật khẩu phải có ít nhất 6 ký tự.' : lang === 'zh' ? '密码长度至少为6个字符。' : 'Password must be at least 6 characters.');
      hasError = true;
    }

    if (hasError) return;

    setIsLoading(true);

    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, password: cleanPassword }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || (lang === 'vi' ? 'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.' : lang === 'zh' ? '登录失败，请检查凭据。' : 'Login failed. Please check your credentials.'));
      }

      const data = await res.json();
      
      localStorage.setItem('token', data.access_token || data.accessToken || data.token);
      localStorage.setItem('user', JSON.stringify(data.user || { email: cleanEmail, role: 'staff' }));
      
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : (lang === 'vi' ? 'Đăng nhập thất bại.' : 'Login failed.'));
    } finally {
      setIsLoading(false);
    }
  };

  if (!mounted) return null;

  const t = {
    vi: {
      title: 'Đăng nhập Hệ thống',
      subtitle: 'Cổng quản trị viên & nhân viên Kohi Coffee',
      emailLabel: 'EMAIL ĐĂNG NHẬP',
      emailPlaceholder: 'Nhập email của bạn',
      passwordLabel: 'MẬT KHẨU',
      passwordPlaceholder: 'Nhập mật khẩu của bạn',
      forgotPassword: 'Quên mật khẩu?',
      submitBtn: 'ĐĂNG NHẬP',
      submittingBtn: 'Đang xử lý...',
      forgotTitle: 'Liên hệ Quản trị viên (Admin)',
      forgotDesc: 'Để bảo mật thông tin nội bộ hệ thống Kohi Coffee, tính năng cấp lại mật khẩu bị giới hạn.',
      forgotActionText: 'Vui lòng liên hệ trực tiếp với Quản trị viên (Admin) hoặc Trưởng ca cửa hàng để được hỗ trợ tạo lại mật khẩu mới.',
      closeBtn: 'ĐÃ HIỂU & ĐÓNG',
      backToHome: 'Trang chủ',
    },
    en: {
      title: 'System Sign In',
      subtitle: 'Kohi Coffee Admin & Staff Portal',
      emailLabel: 'EMAIL ADDRESS',
      emailPlaceholder: 'Enter your email',
      passwordLabel: 'PASSWORD',
      passwordPlaceholder: 'Enter your password',
      forgotPassword: 'Forgot password?',
      submitBtn: 'SIGN IN',
      submittingBtn: 'Processing...',
      forgotTitle: 'Contact Administrator',
      forgotDesc: 'For internal security, self-service password reset is restricted.',
      forgotActionText: 'Please contact your Store Administrator (Admin) or Shift Leader directly to reset your account password.',
      closeBtn: 'UNDERSTOOD & CLOSE',
      backToHome: 'Home',
    },
    zh: {
      title: '系统登录',
      subtitle: 'Kohi Coffee 管理员与员工入口',
      emailLabel: '登录邮箱',
      emailPlaceholder: '请输入您的邮箱',
      passwordLabel: '密码',
      passwordPlaceholder: '请输入您的密码',
      forgotPassword: '忘记密码？',
      submitBtn: '登录',
      submittingBtn: '正在处理...',
      forgotTitle: '联系管理员',
      forgotDesc: '为保障系统内部安全，暂不支持自主重置密码。',
      forgotActionText: '请直接联系 Kohi Coffee 门店管理员或值班经理以重置密码。',
      closeBtn: '好的，关闭',
      backToHome: '首页',
    },
  };

  const currText = (t as any)[lang] || t.vi;
  const isDark = resolvedTheme === 'dark';

  return (
    <div className="min-h-screen flex flex-col justify-between bg-slate-50/60 dark:bg-[#070A10] text-slate-900 dark:text-slate-100 transition-colors duration-300 font-sans relative overflow-hidden selection:bg-[#0284c7] selection:text-white">
      {/* Ambient background glow effects */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-gradient-to-b from-sky-400/10 via-sky-400/5 to-transparent dark:from-sky-500/10 dark:via-sky-500/5 blur-3xl pointer-events-none" />

      {/* ── TOP HEADER CONTROLS ─────────────────────────────────────────── */}
      <header className="w-full relative z-20 px-4 py-4 sm:px-8 sm:py-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white dark:bg-[#111622] border border-slate-200/80 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 hover:border-[#0284c7] dark:hover:border-[#38BDF8] hover:text-[#0284c7] dark:hover:text-[#38BDF8] transition-all cursor-pointer active:scale-95 shadow-xs"
          >
            <span>{currText.backToHome}</span>
          </button>

          <div className="flex items-center gap-2 sm:gap-3">
            <LanguageToggleSwitch lang={lang as Lang} setLang={(l) => setLang(l as any)} />
            <ThemeToggleSwitch isDark={isDark} setTheme={setTheme} />
          </div>
        </div>
      </header>

      {/* ── MAIN LOGIN CARD ─────────────────────────────────────────────── */}
      <main className="flex-1 flex items-center justify-center px-4 py-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="w-full max-w-[420px] bg-white dark:bg-[#0F141F] border border-slate-200/90 dark:border-slate-800/90 rounded-3xl p-7 sm:p-9 shadow-xl dark:shadow-2xl relative overflow-hidden transition-all"
        >
          {/* Brand Header */}
          <div className="text-center mb-8 flex flex-col items-center">
            <BrandLogo onClick={() => router.push('/')} />
            <div className="mt-4 space-y-1">
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight font-heading">
                {currText.title}
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                {currText.subtitle}
              </p>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            {/* Email Field */}
            <div className="space-y-1.5 text-left">
              <label htmlFor="email" className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                {currText.emailLabel}
              </label>
              <div className={`border ${
                emailError
                  ? 'border-rose-500 ring-2 ring-rose-500/15'
                  : 'border-slate-200 dark:border-slate-800'
              } bg-slate-50/80 dark:bg-[#161D2C]/80 rounded-2xl h-11 flex items-center px-4 transition-all focus-within:border-[#0284c7] dark:focus-within:border-[#38BDF8] focus-within:ring-2 focus-within:ring-[#0284c7]/15 focus-within:bg-white dark:focus-within:bg-[#161D2C]`}>
                <input
                  id="email"
                  type="email"
                  placeholder={currText.emailPlaceholder}
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setEmailError(''); }}
                  className="bg-transparent border-none outline-none w-full text-xs font-semibold text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 font-sans"
                />
              </div>
              {emailError && <p className="text-[11px] text-rose-500 font-semibold ml-1">{emailError}</p>}
            </div>

            {/* Password Field */}
            <div className="space-y-1.5 text-left">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  {currText.passwordLabel}
                </label>
                <button
                  type="button"
                  onClick={() => setIsForgotPasswordModalOpen(true)}
                  className="text-[11px] font-bold text-[#0284c7] dark:text-[#38BDF8] hover:underline cursor-pointer transition-colors"
                >
                  {currText.forgotPassword}
                </button>
              </div>

              <div className={`border ${
                passwordError
                  ? 'border-rose-500 ring-2 ring-rose-500/15'
                  : 'border-slate-200 dark:border-slate-800'
              } bg-slate-50/80 dark:bg-[#161D2C]/80 rounded-2xl h-11 flex items-center px-4 transition-all focus-within:border-[#0284c7] dark:focus-within:border-[#38BDF8] focus-within:ring-2 focus-within:ring-[#0284c7]/15 focus-within:bg-white dark:focus-within:bg-[#161D2C]`}>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder={currText.passwordPlaceholder}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setPasswordError(''); }}
                  className="bg-transparent border-none outline-none w-full text-xs font-semibold text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 font-sans"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors focus:outline-none cursor-pointer shrink-0 ml-2 flex items-center justify-center"
                  title={showPassword ? 'Ẩn mật khẩu' : 'Hiển thị mật khẩu'}
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
              {passwordError && <p className="text-[11px] text-rose-500 font-semibold ml-1">{passwordError}</p>}
            </div>

            {/* Error Banner */}
            {error && (
              <div className="text-rose-500 text-xs font-semibold bg-rose-500/10 p-3 rounded-xl border border-rose-500/20 text-left">
                <span>{error}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="mt-3 w-full h-11 bg-[#0284c7] hover:bg-[#0369a1] dark:bg-[#38BDF8] dark:hover:bg-[#0284c7] text-white dark:text-slate-950 font-black rounded-xl shadow-md hover:shadow-lg hover:shadow-[#0284c7]/20 active:scale-[0.98] transition-all duration-200 disabled:opacity-60 flex items-center justify-center text-xs uppercase tracking-wider font-sans cursor-pointer"
            >
              {isLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <CloudLoader size={24} />
                  <span>{currText.submittingBtn}</span>
                </div>
              ) : (
                <span>{currText.submitBtn}</span>
              )}
            </button>
          </form>
        </motion.div>
      </main>

      {/* ── FOOTER ──────────────────────────────────────────────────────── */}
      <footer className="w-full relative z-20 py-4 text-center text-[11px] text-slate-400 dark:text-slate-500 font-medium">
        Kohi Coffee & Pastry Management System &copy; {new Date().getFullYear()}
      </footer>

      {/* ── FORGOT PASSWORD MODAL ───────────────────────────────────────── */}
      <AnimatePresence>
        {isForgotPasswordModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 select-none">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsForgotPasswordModalOpen(false)}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs"
            />

            {/* Modal Box */}
            <motion.div
              initial={{ scale: 0.96, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.96, opacity: 0, y: 10 }}
              transition={{ type: 'spring', stiffness: 400, damping: 28 }}
              className="relative w-full max-w-sm bg-white dark:bg-[#0F141F] border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl z-10 overflow-hidden text-center font-sans p-6 space-y-5"
            >
              <div className="space-y-1.5 pt-1">
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white font-heading">
                  {currText.forgotTitle}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-normal">
                  {currText.forgotDesc}
                </p>
              </div>

              <div className="p-4 bg-sky-50 dark:bg-sky-950/30 border border-sky-200/70 dark:border-sky-800/60 rounded-2xl text-left space-y-1.5 text-xs">
                <p className="text-[#0284c7] dark:text-[#38BDF8] font-bold">
                  {lang === 'en' ? 'Password Reset Guide:' : lang === 'zh' ? '重置密码指南：' : 'Hướng dẫn đặt lại mật khẩu:'}
                </p>
                <p className="text-slate-700 dark:text-slate-300 font-medium leading-relaxed">
                  {currText.forgotActionText}
                </p>
              </div>

              <button
                onClick={() => setIsForgotPasswordModalOpen(false)}
                className="w-full h-11 bg-[#0284c7] hover:bg-[#0369a1] dark:bg-[#38BDF8] dark:hover:bg-[#0284c7] text-white dark:text-slate-950 font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer"
              >
                {currText.closeBtn}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
