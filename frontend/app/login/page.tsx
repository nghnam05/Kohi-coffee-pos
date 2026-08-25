'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { ThemeToggleSwitch } from '@/components/table/ThemeToggleSwitch';
import { LanguageToggleSwitch, Lang } from '@/components/table/LanguageToggleSwitch';
import { BrandLogo } from '@/components/table/BrandLogo';
import CloudLoader from '../components/CloudLoader';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

export default function LoginPage() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [lang, setLang] = useState<Lang>('vi');

  useEffect(() => {
    setMounted(true);
    // If already logged in, redirect directly to dashboard
    if (localStorage.getItem('token')) {
      router.push('/dashboard');
    }
  }, [router]);

  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

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
      setEmailError(lang === 'vi' ? 'Email không được để trống.' : 'Email is required.');
      hasError = true;
    } else if (!emailRegex.test(cleanEmail)) {
      setEmailError(lang === 'vi' ? 'Định dạng email không hợp lệ.' : 'Invalid email format.');
      hasError = true;
    }

    if (!cleanPassword) {
      setPasswordError(lang === 'vi' ? 'Mật khẩu không được để trống.' : 'Password is required.');
      hasError = true;
    } else if (cleanPassword.length < 6) {
      setPasswordError(lang === 'vi' ? 'Mật khẩu phải có ít nhất 6 ký tự.' : 'Password must be at least 6 characters.');
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
        throw new Error(errData.message || (lang === 'vi' ? 'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.' : 'Login failed. Please check your credentials.'));
      }

      const data = await res.json();
      
      // Save user details & token
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
      emailLabel: 'Email đăng nhập',
      emailPlaceholder: 'Nhập email của bạn',
      passwordLabel: 'Mật khẩu',
      passwordPlaceholder: 'Nhập mật khẩu của bạn',
      rememberMe: 'Ghi nhớ đăng nhập',
      forgotPassword: 'Quên mật khẩu?',
      submitBtn: 'Đăng nhập',
      submittingBtn: 'Đang xử lý...',
    },
    en: {
      title: 'System Sign In',
      subtitle: 'Kohi Coffee Admin & Staff Portal',
      emailLabel: 'Email address',
      emailPlaceholder: 'Enter your Email',
      passwordLabel: 'Password',
      passwordPlaceholder: 'Enter your Password',
      rememberMe: 'Remember me',
      forgotPassword: 'Forgot password?',
      submitBtn: 'Sign In',
      submittingBtn: 'Signing in...',
    },
    zh: {
      title: '系统登录',
      subtitle: 'Kohi Coffee 管理员与员工入口',
      emailLabel: '登录邮箱',
      emailPlaceholder: '请输入您的邮箱',
      passwordLabel: '密码',
      passwordPlaceholder: '请输入您的密码',
      rememberMe: '记住登录',
      forgotPassword: '忘记密码？',
      submitBtn: '登录',
      submittingBtn: '正在登录...',
    },
  };

  const currText = (t as any)[lang] || t.vi;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#FFFFFF] dark:bg-[#090D16] p-6 transition-colors duration-300 font-sans text-[var(--text-primary)] relative">
      {/* Header controls: Language & Theme toggles */}
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6 flex items-center gap-2.5 z-10">
        <LanguageToggleSwitch lang={lang as Lang} setLang={(l) => setLang(l as any)} />
        <ThemeToggleSwitch isDark={theme === 'dark'} setTheme={setTheme} />
      </div>

      {/* Main Login Card */}
      <main className="w-full max-w-md bg-[#FFFFFF] dark:bg-[#11141A] rounded-3xl p-8 sm:p-10 shadow-2xl border border-[#E2E8F0] dark:border-[#222732] transition-colors duration-300">
        <div className="text-center mb-8 space-y-3 flex flex-col items-center">
          <BrandLogo onClick={() => router.push('/')} />
          <div>
            <h1 className="text-2xl font-black tracking-tight text-[var(--text-primary)] font-heading">
              {currText.title}
            </h1>
            <p className="text-xs text-[var(--text-secondary)] mt-1 font-sans">
              {currText.subtitle}
            </p>
          </div>
        </div>

        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          {/* Email Field */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="text-xs font-bold text-[var(--text-primary)] font-sans">
              {currText.emailLabel}
            </label>
            <div className={`border ${emailError ? 'border-red-500 ring-2 ring-red-500/20' : 'border-[#E2E8F0] dark:border-[#222732]'} bg-[#FFFFFF] dark:bg-[#0B1120] rounded-2xl h-12 flex items-center px-4 transition-all focus-within:border-[#3AA6FF] focus-within:ring-2 focus-within:ring-[#3AA6FF]/20`}>
              <span className="material-symbols-outlined text-[20px] text-[#64748B] dark:text-[#94A3B8] shrink-0">mail</span>
              <input
                id="email"
                type="email"
                placeholder={currText.emailPlaceholder}
                value={email}
                onChange={(e) => { setEmail(e.target.value); setEmailError(''); }}
                className="ml-3 bg-transparent border-none outline-none w-full text-xs font-semibold text-[var(--text-primary)] placeholder-[#94A3B8] font-sans"
              />
            </div>
            {emailError && <p className="text-[11px] text-red-500 font-bold ml-1">{emailError}</p>}
          </div>

          {/* Password Field */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="password" className="text-xs font-bold text-[var(--text-primary)] font-sans">
              {currText.passwordLabel}
            </label>
            <div className={`border ${passwordError ? 'border-red-500 ring-2 ring-red-500/20' : 'border-[#E2E8F0] dark:border-[#222732]'} bg-[#FFFFFF] dark:bg-[#0B1120] rounded-2xl h-12 flex items-center px-4 transition-all focus-within:border-[#3AA6FF] focus-within:ring-2 focus-within:ring-[#3AA6FF]/20`}>
              <span className="material-symbols-outlined text-[20px] text-[#64748B] dark:text-[#94A3B8] shrink-0">lock</span>
              <input
                id="password"
                type="password"
                placeholder={currText.passwordPlaceholder}
                value={password}
                onChange={(e) => { setPassword(e.target.value); setPasswordError(''); }}
                className="ml-3 bg-transparent border-none outline-none w-full text-xs font-semibold text-[var(--text-primary)] placeholder-[#94A3B8] font-sans"
              />
            </div>
            {passwordError && <p className="text-[11px] text-red-500 font-bold ml-1">{passwordError}</p>}
          </div>

          {/* Remember me & Forgot Password */}
          <div className="flex items-center justify-between mt-1 text-xs">
            <label className="flex items-center gap-2 cursor-pointer text-[var(--text-secondary)]">
              <input type="checkbox" className="w-4 h-4 rounded border-[#E2E8F0] dark:border-[#222732] text-[#3AA6FF] focus:ring-[#3AA6FF]" />
              <span className="font-medium">{currText.rememberMe}</span>
            </label>
            <span className="text-[#3AA6FF] hover:underline cursor-pointer font-bold">
              {currText.forgotPassword}
            </span>
          </div>

          {/* Error Banner */}
          {error && (
            <p className="text-red-500 text-xs font-bold flex items-center gap-1.5 bg-red-500/10 p-3 rounded-xl border border-red-500/20">
              <span className="material-symbols-outlined text-base">warning</span>
              <span>{error}</span>
            </p>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="mt-4 uiverse-btn w-full text-xs font-bold uppercase tracking-wider py-3.5 rounded-2xl shadow-lg hover:shadow-xl active:scale-95 transition-all disabled:opacity-75 flex items-center justify-center gap-3 min-h-[52px]"
          >
            {isLoading ? (
              <>
                <CloudLoader size={30} />
                <span>{currText.submittingBtn}</span>
              </>
            ) : (
              currText.submitBtn
            )}
          </button>
        </form>
      </main>
    </div>
  );
}
