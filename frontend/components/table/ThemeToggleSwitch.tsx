'use client';

import React, { useId } from 'react';
import { motion } from 'framer-motion';

interface ThemeToggleSwitchProps {
  isDark: boolean;
  setTheme: (theme: string) => void;
  className?: string;
  size?: 'sm' | 'md';
}

export const ThemeToggleSwitch: React.FC<ThemeToggleSwitchProps> = ({
  isDark,
  setTheme,
  className = '',
}) => {
  const uniqueId = useId();

  return (
    <div
      role="radiogroup"
      aria-label="Chuyển đổi giao diện Sáng / Tối"
      className={`inline-flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-white/10 shadow-inner select-none shrink-0 ${className}`}
    >
      {/* Light mode option */}
      <button
        type="button"
        role="radio"
        aria-checked={!isDark}
        onClick={() => setTheme('light')}
        className={`relative flex items-center justify-center w-7 h-7 rounded-lg transition-all duration-200 cursor-pointer ${
          !isDark
            ? 'text-amber-500 font-bold'
            : 'text-slate-400 hover:text-slate-600 dark:text-slate-400 dark:hover:text-slate-200'
        }`}
        title="Giao diện Sáng (Light Mode)"
      >
        {!isDark && (
          <motion.div
            layoutId={`activeThemePill-${uniqueId}`}
            transition={{ type: 'spring', stiffness: 500, damping: 35 }}
            className="absolute inset-0 bg-white dark:bg-slate-900 rounded-lg shadow-xs border border-slate-200/80 dark:border-white/10"
          />
        )}
        <span className="material-symbols-outlined text-[17px] relative z-10 leading-none">
          light_mode
        </span>
      </button>

      {/* Dark mode option */}
      <button
        type="button"
        role="radio"
        aria-checked={isDark}
        onClick={() => setTheme('dark')}
        className={`relative flex items-center justify-center w-7 h-7 rounded-lg transition-all duration-200 cursor-pointer ${
          isDark
            ? 'text-sky-400 font-bold'
            : 'text-slate-400 hover:text-slate-600 dark:text-slate-400 dark:hover:text-slate-200'
        }`}
        title="Giao diện Tối (Dark Mode)"
      >
        {isDark && (
          <motion.div
            layoutId={`activeThemePill-${uniqueId}`}
            transition={{ type: 'spring', stiffness: 500, damping: 35 }}
            className="absolute inset-0 bg-white dark:bg-slate-900 rounded-lg shadow-xs border border-slate-200/80 dark:border-white/10"
          />
        )}
        <span className="material-symbols-outlined text-[17px] relative z-10 leading-none">
          dark_mode
        </span>
      </button>
    </div>
  );
};
