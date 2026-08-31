'use client';

import React from 'react';
import { useTranslation, Lang } from '@/context/LanguageContext';

export type { Lang };

interface LanguageToggleSwitchProps {
  lang?: Lang;
  setLang?: (lang: Lang) => void;
}

export const LanguageToggleSwitch: React.FC<LanguageToggleSwitchProps> = ({
  lang: propLang,
  setLang: propSetLang,
}) => {
  const context = useTranslation();
  const lang = propLang || context.lang;
  const setLang = propSetLang || context.setLang;

  const cycleLang = () => {
    if (lang === 'vi') setLang('en');
    else if (lang === 'en') setLang('zh');
    else setLang('vi');
  };

  const getLangLabel = () => {
    if (lang === 'en') return 'EN';
    if (lang === 'zh') return 'ZH';
    return 'VI';
  };

  return (
    <button
      type="button"
      onClick={cycleLang}
      className="flex items-center justify-center gap-1 px-2.5 h-[28px] rounded-full bg-slate-100 dark:bg-[#0F172A] border border-slate-200/80 dark:border-slate-700/80 text-[11px] font-extrabold text-[#0284c7] dark:text-[#38BDF8] hover:border-[#38BDF8]/60 active:scale-95 transition-all cursor-pointer select-none shadow-xs shrink-0"
      title="Chuyển đổi ngôn ngữ (VI / EN / ZH)"
      aria-label="Chuyển đổi ngôn ngữ"
    >
      <span className="uppercase tracking-wide font-black">{getLangLabel()}</span>
      <span className="material-symbols-outlined text-[13px] opacity-80">translate</span>
    </button>
  );
};
