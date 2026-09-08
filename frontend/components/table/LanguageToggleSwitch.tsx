'use client';

import React, { useId, useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation, Lang } from '@/context/LanguageContext';

export type { Lang };

interface LanguageToggleSwitchProps {
  lang?: Lang;
  setLang?: (lang: Lang) => void;
  className?: string;
}

const LANGUAGES: { code: Lang; label: string; title: string }[] = [
  { code: 'vi', label: 'VI', title: 'Tiếng Việt' },
  { code: 'en', label: 'EN', title: 'English' },
  { code: 'zh', label: 'ZH', title: '中文' },
];

export const LanguageToggleSwitch: React.FC<LanguageToggleSwitchProps> = ({
  lang: propLang,
  setLang: propSetLang,
  className = '',
}) => {
  const context = useTranslation();
  const lang = propLang || context.lang;
  const setLang = propSetLang || context.setLang;
  const uniqueId = useId();

  const [isOpen, setIsOpen] = useState(false);
  const [openUpward, setOpenUpward] = useState(false);
  const [alignLeft, setAlignLeft] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const toggleDropdown = () => {
    if (!isOpen && dropdownRef.current) {
      const rect = dropdownRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      setOpenUpward(spaceBelow < 170);
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

  const currentItem = LANGUAGES.find((item) => item.code === lang) || LANGUAGES[0];

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
          aria-label="Chọn ngôn ngữ"
        >
          <span className="text-[11px] font-black text-[#0284c7] dark:text-[#38BDF8] tracking-tight">
            {currentItem.label}
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
              } min-w-[150px] z-50 p-1.5 bg-white/95 dark:bg-[#0F172A]/95 backdrop-blur-xl border border-slate-200/90 dark:border-white/15 rounded-2xl shadow-xl shadow-black/10 dark:shadow-black/60 space-y-1 font-sans`}
              role="listbox"
            >
              {LANGUAGES.map((item) => {
                const isActive = lang === item.code;
                return (
                  <button
                    key={item.code}
                    type="button"
                    role="option"
                    aria-selected={isActive}
                    onClick={() => {
                      setLang(item.code);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs transition-all cursor-pointer text-left ${
                      isActive
                        ? 'bg-sky-50 dark:bg-sky-500/15 text-[#0284c7] dark:text-[#38BDF8] font-black'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/70 font-semibold'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-black px-1.5 py-0.5 rounded-md border ${
                          isActive
                            ? 'bg-sky-500/20 text-[#0284c7] dark:text-[#38BDF8] border-sky-500/30'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200/50 dark:border-white/5'
                        }`}
                      >
                        {item.label}
                      </span>
                      <span>{item.title}</span>
                    </div>
                    {isActive && (
                      <span className="material-symbols-outlined text-[16px] text-[#0284c7] dark:text-[#38BDF8] leading-none">
                        check
                      </span>
                    )}
                  </button>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* DESKTOP VIEW: Segmented Pill Switch (>= sm) */}
      <div
        role="radiogroup"
        aria-label="Chuyển đổi ngôn ngữ (VI / EN / ZH)"
        className={`hidden sm:inline-flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-white/10 shadow-inner select-none shrink-0 ${className}`}
      >
        {LANGUAGES.map((item) => {
          const isActive = lang === item.code;
          return (
            <button
              key={item.code}
              type="button"
              role="radio"
              aria-checked={isActive}
              onClick={() => setLang(item.code)}
              className={`relative flex items-center justify-center px-2 h-7 rounded-lg text-[11px] font-black transition-all duration-200 cursor-pointer font-sans ${
                isActive
                  ? 'text-[#0284c7] dark:text-[#38BDF8]'
                  : 'text-slate-400 hover:text-slate-600 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
              title={item.title}
            >
              {isActive && (
                <motion.div
                  layoutId={`activeLangPill-${uniqueId}`}
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                  className="absolute inset-0 bg-white dark:bg-slate-900 rounded-lg shadow-xs border border-slate-200/80 dark:border-white/10"
                />
              )}
              <span className="relative z-10 tracking-tight">{item.label}</span>
            </button>
          );
        })}
      </div>
    </>
  );
};
