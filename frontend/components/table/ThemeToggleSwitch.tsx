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
      className={`relative inline-flex items-center shrink-0 w-[50px] h-[28px] p-[3px] rounded-full border transition-colors duration-300 cursor-pointer select-none active:scale-95 focus:outline-none ${
        isDark
          ? 'bg-[#0F172A] border-slate-700/80'
          : 'bg-slate-200/90 border-slate-300/90'
      } ${className}`}
      title={isDark ? 'Chuyển sang giao diện Sáng' : 'Chuyển sang giao diện Tối'}
      aria-label="Chuyển đổi giao diện Sáng/Tối"
    >
      {/* Sliding Thumb Indicator with Active Icon inside */}
      <motion.div
        className={`w-[20px] h-[20px] rounded-full flex items-center justify-center shadow-xs transition-colors duration-300 ${
          isDark
            ? 'bg-slate-800 border border-slate-600/80 text-amber-400'
            : 'bg-white border border-slate-200/80 text-amber-500'
        }`}
        animate={{
          x: isDark ? 22 : 0,
        }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      >
        <motion.span
          key={isDark ? 'dark' : 'light'}
          initial={{ scale: 0.5, rotate: -90, opacity: 0 }}
          animate={{ scale: 1, rotate: 0, opacity: 1 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="material-symbols-outlined text-[13px] font-bold select-none leading-none"
        >
          {isDark ? 'dark_mode' : 'light_mode'}
        </motion.span>
      </motion.div>
    </button>
  );
};
