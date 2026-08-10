'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
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
  const [lang, setLang] = useState<'vi' | 'en'>('vi');

  useEffect(() => {
    setMounted(true);
    // If already logged in, redirect directly to dashboard
    if (localStorage.getItem('token')) {
      router.push('/dashboard');
    }
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError(lang === 'vi' ? 'Vui lòng điền đầy đủ email và mật khẩu!' : 'Please fill in both email and password!');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || (lang === 'vi' ? 'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.' : 'Login failed. Please check your credentials.'));
      }

      const data = await res.json();
      
      // Save user details & token
      localStorage.setItem('token', data.access_token || data.accessToken || data.token);
      localStorage.setItem('user', JSON.stringify(data.user || { email, role: 'staff' }));
      
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
  };

  const currText = t[lang];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--bg-primary)] p-6 transition-colors duration-300 font-sans text-[var(--text-primary)]">
      {/* Header controls: Language & Theme toggles */}
      <div className="absolute top-6 right-6 flex items-center gap-3">
        {/* Language Switcher */}
        <div className="flex bg-[var(--bg-card)] border border-[var(--border-color)] rounded-full p-1 shadow-sm">
          <button
            type="button"
            onClick={() => setLang('vi')}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
              lang === 'vi'
                ? 'bg-[var(--brand-primary)] text-white shadow-sm'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            🇻🇳 VI
          </button>
          <button
            type="button"
            onClick={() => setLang('en')}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
              lang === 'en'
                ? 'bg-[var(--brand-primary)] text-white shadow-sm'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            🇬🇧 EN
          </button>
        </div>

        {/* Theme Toggle */}
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="p-3 rounded-full bg-[var(--bg-card)] text-[var(--text-primary)] border border-[var(--border-color)] shadow-sm hover:border-[var(--brand-primary)] transition-all"
          aria-label="Toggle Dark Mode"
        >
          {theme === 'dark' ? (
            <svg className="w-5 h-5 text-[var(--brand-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          ) : (
            <svg className="w-5 h-5 text-[var(--text-secondary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          )}
        </button>
      </div>

      {/* Main Login Card */}
      <main className="w-full max-w-md bg-[var(--bg-card)] rounded-3xl p-8 sm:p-10 shadow-2xl border border-[var(--border-color)] transition-colors duration-300">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-black tracking-tight text-[var(--text-primary)]">
            {currText.title}
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mt-2">
            {currText.subtitle}
          </p>
        </div>

        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          {/* Email Field */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="text-xs font-semibold text-[var(--text-primary)]">
              {currText.emailLabel}
            </label>
            <div className="border border-[var(--border-color)] bg-[var(--bg-card-inner)] rounded-2xl h-12 flex items-center px-4 transition-all focus-within:border-[var(--brand-primary)] focus-within:ring-2 focus-within:ring-[var(--brand-primary)]/20">
              <svg xmlns="http://www.w3.org/2000/svg" width={20} height={20} viewBox="0 0 32 32" className="fill-[var(--text-tertiary)] shrink-0">
                <g data-name="Layer 3" id="Layer_3">
                  <path d="m30.853 13.87a15 15 0 0 0 -29.729 4.082 15.1 15.1 0 0 0 12.876 12.918 15.6 15.6 0 0 0 2.016.13 14.85 14.85 0 0 0 7.715-2.145 1 1 0 1 0 -1.031-1.711 13.007 13.007 0 1 1 5.458-6.529 2.149 2.149 0 0 1 -4.158-.759v-10.856a1 1 0 0 0 -2 0v1.726a8 8 0 1 0 .2 10.325 4.135 4.135 0 0 0 7.83.274 15.2 15.2 0 0 0 .823-7.455zm-14.853 8.13a6 6 0 1 1 6-6 6.006 6.006 0 0 1 -6 6z" />
                </g>
              </svg>
              <input
                id="email"
                type="email"
                placeholder={currText.emailPlaceholder}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="ml-3 bg-transparent border-none outline-none w-full text-sm text-[var(--text-primary)] placeholder-[var(--text-tertiary)]"
                required
              />
            </div>
          </div>

          {/* Password Field */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="password" className="text-xs font-semibold text-[var(--text-primary)]">
              {currText.passwordLabel}
            </label>
            <div className="border border-[var(--border-color)] bg-[var(--bg-card-inner)] rounded-2xl h-12 flex items-center px-4 transition-all focus-within:border-[var(--brand-primary)] focus-within:ring-2 focus-within:ring-[var(--brand-primary)]/20">
              <svg xmlns="http://www.w3.org/2000/svg" width={20} height={20} viewBox="-64 0 512 512" className="fill-[var(--text-tertiary)] shrink-0">
                <path d="m336 512h-288c-26.453125 0-48-21.523438-48-48v-224c0-26.476562 21.546875-48 48-48h288c26.453125 0 48 21.523438 48 48v224c0 26.476562-21.546875 48-48 48zm-288-288c-8.8125 0-16 7.167969-16 16v224c0 8.832031 7.1875 16 16 16h288c8.8125 0 16-7.167969 16-16v-224c0-8.832031-7.1875-16-16-16zm0 0" />
                <path d="m304 224c-8.832031 0-16-7.167969-16-16v-80c0-52.929688-43.070312-96-96-96s-96 43.070312-96 96v80c0 8.832031-7.167969 16-16 16s-16-7.167969-16-16v-80c0-70.59375 57.40625-128 128-128s128 57.40625 128 128v80c0 8.832031-7.167969 16-16 16zm0 0" />
              </svg>
              <input
                id="password"
                type="password"
                placeholder={currText.passwordPlaceholder}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="ml-3 bg-transparent border-none outline-none w-full text-sm text-[var(--text-primary)] placeholder-[var(--text-tertiary)]"
                required
              />
            </div>
          </div>

          {/* Remember me & Forgot Password */}
          <div className="flex items-center justify-between mt-1 text-xs">
            <label className="flex items-center gap-2 cursor-pointer text-[var(--text-secondary)]">
              <input type="checkbox" className="w-4 h-4 rounded border-[var(--border-color)] text-[var(--brand-primary)] focus:ring-[var(--brand-primary)]" />
              <span>{currText.rememberMe}</span>
            </label>
            <span className="text-[var(--brand-primary)] hover:underline cursor-pointer font-medium">
              {currText.forgotPassword}
            </span>
          </div>

          {/* Error Banner */}
          {error && (
            <p className="text-red-500 text-xs font-semibold flex items-center gap-1.5 bg-red-500/10 p-3 rounded-xl border border-red-500/20">
              <span>⚠️</span> {error}
            </p>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="mt-4 kohi-btn-primary w-full text-sm py-3.5 rounded-2xl shadow-lg hover:shadow-xl active:scale-95 transition-all disabled:opacity-75 flex items-center justify-center gap-3 min-h-[52px]"
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
