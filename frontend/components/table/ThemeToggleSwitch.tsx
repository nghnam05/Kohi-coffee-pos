'use client';

import React, { useId, useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

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

  const [isOpen, setIsOpen] = useState(false);
  const [openUpward, setOpenUpward] = useState(false);
  const [alignLeft, setAlignLeft] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const toggleDropdown = () => {
    if (!isOpen && dropdownRef.current) {
      const rect = dropdownRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      setOpenUpward(spaceBelow < 150);
      setAlignLeft(rect.left < 140);
    }
    setIsOpen((prev) => !prev);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <>
      {/* MOBILE VIEW: Modern dropdown with elegant popup (< sm) */}
      <div ref={dropdownRef} className={`sm:hidden relative inline-block ${className}`}>
        <button
          type="button"
          onClick={toggleDropdown}
          className={`h-8 px-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/90 dark:hover:bg-slate-700/90 border transition-all cursor-pointer shadow-xs active:scale-95 flex items-center gap-1 font-sans ${
            isOpen
              ? 'border-sky-500 ring-2 ring-sky-500/20 bg-white dark:bg-slate-800'
              : 'border-slate-200 dark:border-white/10'
          }`}
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          aria-label="Chuyển đổi giao diện Sáng / Tối"
          title="Chuyển đổi giao diện"
        >
          <span
            className={`material-symbols-outlined text-[17px] leading-none ${
              !isDark ? 'text-amber-500' : 'text-sky-400'
            }`}
          >
            {!isDark ? 'light_mode' : 'dark_mode'}
          </span>
          <span
            className={`material-symbols-outlined text-[15px] text-slate-400 dark:text-slate-400 transition-transform duration-200 leading-none ${
              isOpen ? 'rotate-180 text-[#0284c7] dark:text-[#38BDF8]' : ''
            }`}
          >
            expand_more
          </span>
        </button>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: openUpward ? 4 : -4, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: openUpward ? 4 : -4, scale: 0.95 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
              className={`absolute ${
                openUpward ? 'bottom-full mb-1.5' : 'top-full mt-1.5'
              } ${
                alignLeft ? 'left-0' : 'right-0'
              } min-w-[145px] z-50 p-1.5 bg-white/95 dark:bg-[#0F172A]/95 backdrop-blur-xl border border-slate-200/90 dark:border-white/15 rounded-2xl shadow-xl shadow-black/10 dark:shadow-black/60 space-y-1 font-sans`}
              role="listbox"
            >
              {/* Light mode option */}
              <button
                type="button"
                role="option"
                aria-selected={!isDark}
                onClick={() => {
                  setTheme('light');
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs transition-all cursor-pointer text-left ${
                  !isDark
                    ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 font-black'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/70 font-semibold'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[17px] text-amber-500 leading-none">
                    light_mode
                  </span>
                  <span>Giao diện Sáng</span>
                </div>
                {!isDark && (
                  <span className="material-symbols-outlined text-[16px] text-amber-600 dark:text-amber-400 leading-none">
                    check
                  </span>
                )}
              </button>

              {/* Dark mode option */}
              <button
                type="button"
                role="option"
                aria-selected={isDark}
                onClick={() => {
                  setTheme('dark');
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs transition-all cursor-pointer text-left ${
                  isDark
                    ? 'bg-sky-500/10 text-[#0284c7] dark:text-[#38BDF8] font-black'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/70 font-semibold'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[17px] text-sky-400 leading-none">
                    dark_mode
                  </span>
                  <span>Giao diện Tối</span>
                </div>
                {isDark && (
                  <span className="material-symbols-outlined text-[16px] text-[#0284c7] dark:text-[#38BDF8] leading-none">
                    check
                  </span>
                )}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* DESKTOP VIEW: Segmented Pill Switch (>= sm) */}
      <div
        role="radiogroup"
        aria-label="Chuyển đổi giao diện Sáng / Tối"
        className={`hidden sm:inline-flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-white/10 shadow-inner select-none shrink-0 ${className}`}
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
    </>
  );
};
