'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useTheme } from 'next-themes';
import { BrandLogo } from '@/components/table/BrandLogo';
import { ThemeToggleSwitch } from '@/components/table/ThemeToggleSwitch';

export default function NotFound() {
  const router = useRouter();
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted ? resolvedTheme === 'dark' : true;

  return (
    <div className="relative min-h-screen flex flex-col justify-between overflow-x-hidden bg-slate-50 dark:bg-[#0B0F17] text-slate-900 dark:text-white transition-colors duration-300">
      {/* Dynamic Ambient Background Glows */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[340px] sm:w-[600px] h-[340px] sm:h-[500px] bg-sky-400/15 dark:bg-sky-500/10 rounded-full blur-[100px] sm:blur-[140px]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-10 -right-20 w-72 sm:w-96 h-72 sm:h-96 bg-blue-500/10 dark:bg-sky-400/5 rounded-full blur-[90px]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-1/3 -left-20 w-64 sm:w-80 h-64 sm:h-80 bg-cyan-400/10 dark:bg-cyan-500/5 rounded-full blur-[80px]"
      />

      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 w-full backdrop-blur-xl bg-white/70 dark:bg-[#0B0F17]/70 border-b border-slate-200/80 dark:border-white/10 transition-colors">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between gap-4">
          <Link href="/" className="inline-flex focus:outline-hidden rounded-xl">
            <BrandLogo />
          </Link>

          <div className="flex items-center gap-2 sm:gap-3">
            {mounted && (
              <ThemeToggleSwitch
                isDark={isDark}
                setTheme={setTheme}
                className="hidden sm:inline-flex"
              />
            )}
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-white/10 transition-all cursor-pointer shadow-xs active:scale-95"
            >
              <span className="material-symbols-outlined text-[18px]">home</span>
              <span className="hidden xs:inline">Trang chủ</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Hero Section */}
      <main className="relative z-10 flex-1 flex items-center justify-center py-10 sm:py-16 px-4 sm:px-6">
        <div className="max-w-3xl w-full mx-auto text-center flex flex-col items-center">
          {/* Status Badge */}
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-sky-500/10 dark:bg-sky-400/10 border border-sky-500/20 dark:border-sky-400/20 text-sky-600 dark:text-sky-400 text-xs sm:text-sm font-bold tracking-wide uppercase shadow-xs mb-6"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-500" />
            </span>
            <span>Mã lỗi 404 • Không tìm thấy trang</span>
          </motion.div>

          {/* Interactive Coffee Cup & 404 Artwork */}
          <div className="relative my-2 sm:my-4 flex items-center justify-center select-none">
            {/* Giant Background Number */}
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.6, type: 'spring' }}
              className="text-[100px] xs:text-[130px] sm:text-[180px] md:text-[210px] font-black tracking-tighter leading-none text-transparent bg-clip-text bg-gradient-to-b from-slate-300 via-slate-100 to-transparent dark:from-slate-700/60 dark:via-slate-800/20 dark:to-transparent select-none drop-shadow-sm"
            >
              404
            </motion.div>

            {/* Floating Animated Coffee Cup Centerpiece */}
            <motion.div
              animate={{
                y: [0, -10, 0],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              className="absolute inset-0 m-auto w-32 h-32 sm:w-44 sm:h-44 flex flex-col items-center justify-center"
            >
              <div className="relative p-5 sm:p-7 rounded-3xl bg-white/90 dark:bg-[#0F172A]/90 backdrop-blur-2xl border border-slate-200/90 dark:border-white/15 shadow-xl dark:shadow-2xl shadow-sky-500/10">
                {/* Rising Steam Waves */}
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 flex items-center gap-1.5 opacity-70">
                  <motion.div
                    animate={{ y: [0, -8, 0], opacity: [0.3, 0.9, 0.3] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                    className="w-1 h-5 rounded-full bg-gradient-to-t from-sky-400 to-transparent"
                  />
                  <motion.div
                    animate={{ y: [0, -12, 0], opacity: [0.2, 0.8, 0.2] }}
                    transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut', delay: 0.4 }}
                    className="w-1.5 h-7 rounded-full bg-gradient-to-t from-sky-300 to-transparent"
                  />
                  <motion.div
                    animate={{ y: [0, -7, 0], opacity: [0.3, 0.9, 0.3] }}
                    transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut', delay: 0.8 }}
                    className="w-1 h-5 rounded-full bg-gradient-to-t from-sky-400 to-transparent"
                  />
                </div>

                {/* Coffee Icon */}
                <span className="material-symbols-outlined text-[52px] sm:text-[72px] text-sky-500 dark:text-sky-400 drop-shadow-md">
                  local_cafe
                </span>

                {/* Tiny Floating Coffee Bean Accent */}
                <motion.div
                  animate={{
                    rotate: [0, 20, 0],
                    scale: [1, 1.1, 1],
                  }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                  className="absolute -bottom-2 -right-2 w-7 h-7 rounded-full bg-sky-500 text-white flex items-center justify-center shadow-md text-xs font-bold"
                  title="Kohi Coffee"
                >
                  <span className="material-symbols-outlined text-[14px]">search_off</span>
                </motion.div>
              </div>
            </motion.div>
          </div>

          {/* Heading and Description */}
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="text-2xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white mt-4 sm:mt-6"
          >
            Tách cà phê này đã cạn rồi...
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.25 }}
            className="mt-3 sm:mt-4 text-sm sm:text-base md:text-lg text-slate-600 dark:text-slate-400 max-w-xl mx-auto leading-relaxed"
          >
            Đường dẫn bạn truy cập có thể đã đổi tên, bị xoá hoặc tạm thời không khả dụng. Đừng lo lắng, thực đơn thơm ngon và bàn uống ấm cúng tại <span className="font-semibold text-slate-900 dark:text-white">Kohi Coffee</span> vẫn luôn sẵn sàng!
          </motion.p>

          {/* Main Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.35 }}
            className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5 w-full max-w-md"
          >
            {/* Return to Home CTA */}
            <Link
              href="/"
              className="w-full sm:w-auto flex-1 inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-extrabold text-sm sm:text-base shadow-lg shadow-sky-500/25 active:scale-[0.98] transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px]">storefront</span>
              <span>Trở về Trang chủ</span>
            </Link>

            {/* Go Back CTA */}
            <button
              type="button"
              onClick={() => router.back()}
              className="w-full sm:w-auto flex-1 inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-white hover:bg-slate-50 dark:bg-slate-800/80 dark:hover:bg-slate-700/80 text-slate-800 dark:text-slate-100 font-bold text-sm sm:text-base border border-slate-200 dark:border-white/10 shadow-sm active:scale-[0.98] transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px]">arrow_back</span>
              <span>Quay lại trang trước</span>
            </button>
          </motion.div>

          {/* Quick Destination Bento Cards */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.45 }}
            className="mt-12 sm:mt-16 w-full grid grid-cols-1 sm:grid-cols-3 gap-3.5 text-left"
          >
            {/* Card 1: Explore Menu */}
            <Link
              href="/"
              className="group p-4 sm:p-5 rounded-2xl bg-white/70 dark:bg-[#0F172A]/70 hover:bg-white dark:hover:bg-[#0F172A] border border-slate-200/90 dark:border-white/10 hover:border-sky-400/50 dark:hover:border-sky-400/50 transition-all shadow-xs hover:shadow-md cursor-pointer backdrop-blur-md"
            >
              <div className="w-10 h-10 rounded-xl bg-sky-500/10 dark:bg-sky-400/10 text-sky-600 dark:text-sky-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-[22px]">restaurant_menu</span>
              </div>
              <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white flex items-center justify-between">
                <span>Thực đơn Kohi</span>
                <span className="material-symbols-outlined text-sm text-slate-400 group-hover:translate-x-1 transition-transform">
                  arrow_forward
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed line-clamp-2">
                Cà phê đặc sản, trà trái cây và bánh tươi chuẩn vị Nhật.
              </p>
            </Link>

            {/* Card 2: Table Order & QR */}
            <Link
              href="/dashboard"
              className="group p-4 sm:p-5 rounded-2xl bg-white/70 dark:bg-[#0F172A]/70 hover:bg-white dark:hover:bg-[#0F172A] border border-slate-200/90 dark:border-white/10 hover:border-sky-400/50 dark:hover:border-sky-400/50 transition-all shadow-xs hover:shadow-md cursor-pointer backdrop-blur-md"
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 dark:bg-emerald-400/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-[22px]">dashboard</span>
              </div>
              <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white flex items-center justify-between">
                <span>Bàn & POS</span>
                <span className="material-symbols-outlined text-sm text-slate-400 group-hover:translate-x-1 transition-transform">
                  arrow_forward
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed line-clamp-2">
                Khu vực quản lý sơ đồ bàn, đơn hàng realtime và báo cáo.
              </p>
            </Link>

            {/* Card 3: Contact & Support */}
            <Link
              href="/contact"
              className="group p-4 sm:p-5 rounded-2xl bg-white/70 dark:bg-[#0F172A]/70 hover:bg-white dark:hover:bg-[#0F172A] border border-slate-200/90 dark:border-white/10 hover:border-sky-400/50 dark:hover:border-sky-400/50 transition-all shadow-xs hover:shadow-md cursor-pointer backdrop-blur-md"
            >
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 dark:bg-purple-400/10 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-[22px]">contact_support</span>
              </div>
              <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white flex items-center justify-between">
                <span>Hỗ trợ & Liên hệ</span>
                <span className="material-symbols-outlined text-sm text-slate-400 group-hover:translate-x-1 transition-transform">
                  arrow_forward
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed line-clamp-2">
                Giải đáp thắc mắc, phản hồi chất lượng phục vụ 24/7.
              </p>
            </Link>
          </motion.div>
        </div>
      </main>

      {/* Modern Minimal Footer */}
      <footer className="w-full border-t border-slate-200/80 dark:border-white/10 py-5 px-4 sm:px-6 transition-colors">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800 dark:text-slate-200">Kohi Coffee & Pastry</span>
            <span>•</span>
            <span>Trải nghiệm cà phê nghệ thuật</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/" className="hover:text-sky-500 transition-colors">Trang chủ</Link>
            <Link href="/contact" className="hover:text-sky-500 transition-colors">Liên hệ</Link>
            <Link href="/privacy" className="hover:text-sky-500 transition-colors">Chính sách</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
