'use client';

import React from 'react';

export type Lang = 'vi' | 'en' | 'zh';

interface LanguageToggleSwitchProps {
  lang: Lang;
  setLang: (lang: Lang) => void;
}

export const LanguageToggleSwitch: React.FC<LanguageToggleSwitchProps> = ({ lang, setLang }) => {
  const languages: { id: Lang; label: string; flag: string }[] = [
    { id: 'vi', label: 'VI', flag: '🇻🇳' },
    { id: 'en', label: 'EN', flag: '🇬🇧' },
    { id: 'zh', label: 'ZH', flag: '🇨🇳' },
  ];

  return (
    <div className="flex items-center gap-0.5 p-1 bg-slate-100 dark:bg-[#151c2d] border border-slate-200/80 dark:border-slate-800/80 rounded-xl max-w-full overflow-hidden shrink">
      {languages.map((l) => {
        const isActive = lang === l.id;
        return (
          <button
            key={l.id}
            type="button"
            onClick={() => setLang(l.id)}
            className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10.5px] font-black tracking-tight transition-all cursor-pointer select-none outline-none focus-visible:ring-2 focus-visible:ring-[#38BDF8] active:scale-95 shrink-0 ${
              isActive
                ? 'bg-[#38BDF8] text-slate-950 shadow-xs'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800/60'
            }`}
          >
            <span className="text-[10px] leading-none">{l.flag}</span>
            <span>{l.label}</span>
          </button>
        );
      })}
    </div>
  );
};
