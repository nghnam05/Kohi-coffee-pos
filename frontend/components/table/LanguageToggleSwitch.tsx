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
      className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-[#151c2d] border border-slate-200/80 dark:border-slate-800/80 text-xs font-black text-[#0284c7] dark:text-[#38BDF8] hover:border-[#38BDF8]/60 active:scale-95 transition-all cursor-pointer min-h-[36px] select-none shadow-xs shrink-0"
      title="Chuyển đổi ngôn ngữ (VI / EN / ZH)"
      aria-label="Chuyển đổi ngôn ngữ"
    >
      <span className="uppercase tracking-wide font-extrabold">{getLangLabel()}</span>
      <span className="material-symbols-outlined text-[14px] opacity-80">translate</span>
    </button>
  );
};

