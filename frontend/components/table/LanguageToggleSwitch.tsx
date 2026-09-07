'use client';

import React, { useId } from 'react';
import { motion } from 'framer-motion';
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

  return (
    <div
      role="radiogroup"
      aria-label="Chuyển đổi ngôn ngữ (VI / EN / ZH)"
      className={`inline-flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-white/10 shadow-inner select-none shrink-0 ${className}`}
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
  );
};
