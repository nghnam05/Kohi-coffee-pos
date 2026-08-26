'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface ThemeToggleSwitchProps {
  isDark: boolean;
  setTheme: (theme: string) => void;
  className?: string;
}

export const ThemeToggleSwitch: React.FC<ThemeToggleSwitchProps> = ({
  isDark,
  setTheme,
  className = '',
}) => {
  const toggleTheme = () => {
    setTheme(isDark ? 'light' : 'dark');
  };

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`relative inline-flex items-center w-[60px] h-[30px] p-[4px] rounded-full border transition-all duration-300 ease-in-out cursor-pointer select-none font-sans active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)] ${
        isDark
          ? 'bg-[#0B0F17] border-slate-700/80 shadow-inner hover:border-slate-600'
          : 'bg-slate-200/90 border-slate-300/90 shadow-inner hover:border-slate-400'
      } ${className}`}
      title={isDark ? 'Chuyển sang giao diện Sáng' : 'Chuyển sang giao diện Tối'}
      aria-label="Chuyển đổi giao diện Sáng/Tối"
    >
      {/* Background Ambient Icons */}
      <div className="w-full flex items-center justify-between px-1.5 pointer-events-none select-none">
        <span className={`material-symbols-outlined text-[12px] transition-all duration-300 ${
          isDark ? 'text-slate-500 opacity-60' : 'text-amber-500 opacity-0'
        }`}>
          light_mode
        </span>
        <span className={`material-symbols-outlined text-[12px] transition-all duration-300 ${
          isDark ? 'text-sky-400 opacity-0' : 'text-slate-400 opacity-60'
        }`}>
          dark_mode
        </span>
      </div>

      {/* Sliding Thumb Indicator (Exact 4px padding on Top, Bottom, Left, Right) */}
      <motion.div
        className={`absolute top-[3px] left-[4px] w-[22px] h-[22px] rounded-full flex items-center justify-center shadow-md transition-colors duration-300 ${
          isDark
            ? 'bg-slate-800 border border-slate-600/80 text-amber-400'
            : 'bg-white border border-slate-200/80 text-amber-500'
        }`}
        animate={{
          x: isDark ? 30 : 0,
        }}
        transition={{ type: 'spring', stiffness: 450, damping: 28 }}
      >
        <motion.span
          key={isDark ? 'dark' : 'light'}
          initial={{ scale: 0.5, rotate: -60, opacity: 0 }}
          animate={{ scale: 1, rotate: 0, opacity: 1 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="material-symbols-outlined text-[13px] leading-none select-none font-bold"
        >
          {isDark ? 'dark_mode' : 'light_mode'}
        </motion.span>
      </motion.div>
    </button>
  );
};
