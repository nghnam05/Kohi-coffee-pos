export type Lang = 'vi' | 'en' | 'zh';

/**
 * Format table name according to selected language
 * e.g. "Bàn 1" -> "Table 1" (en) / "1号桌" (zh) / "Bàn số 1" (vi)
 */
export const formatTableName = (rawName?: string | null, lang: Lang = 'vi'): string => {
  if (!rawName) return lang === 'en' ? 'Table' : lang === 'zh' ? '桌号' : 'Bàn';
  
  const numMatch = rawName.match(/\d+/);
  const num = numMatch ? numMatch[0] : '';

  if (lang === 'en') {
    return num ? `Table ${num}` : rawName.replace(/Bàn số/gi, 'Table').replace(/Bàn/gi, 'Table');
  }
  if (lang === 'zh') {
    return num ? `${num}号桌` : rawName;
  }
  return num ? `Bàn số ${num}` : rawName;
};

/**
 * Format table name with floor location according to selected language
 * e.g. "Table 1 (Floor 1)" (en) / "1号桌 (1楼)" (zh) / "Bàn số 1 (Tầng 1)" (vi)
 */
export const formatTableLocation = (rawName?: string | null, lang: Lang = 'vi'): string => {
  const nameStr = formatTableName(rawName, lang);
  if (lang === 'en') return `${nameStr} (Floor 1)`;
  if (lang === 'zh') return `${nameStr} (1楼)`;
  return `${nameStr} (Tầng 1)`;
};
