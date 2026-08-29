'use client';

// In-memory cache for fast lookups
const memoryCache: Record<string, string> = {};

const LOCAL_STORAGE_KEY = 'kohi_translate_cache_v1';

/**
 * Loads cache from localStorage on client side
 */
function getStorageCache(): Record<string, string> {
  if (typeof window === 'undefined') return memoryCache;
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    return raw ? JSON.parse(raw) : memoryCache;
  } catch (err) {
    return memoryCache;
  }
}

/**
 * Saves cache to localStorage
 */
function setStorageCache(key: string, value: string) {
  memoryCache[key] = value;
  if (typeof window === 'undefined') return;
  try {
    const current = getStorageCache();
    current[key] = value;
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(current));
  } catch (err) {
    // Ignore storage quota errors
  }
}

/**
 * Translates text dynamically using Google Translate API (gtx client)
 * with instant caching.
 */
export async function translateText(
  text: string,
  targetLang: 'vi' | 'en' | 'zh',
  sourceLang: string = 'vi'
): Promise<string> {
  if (!text || !text.trim()) return text;

  // If target language is Vietnamese and text is already in Vietnamese (or default), return as-is
  if (targetLang === 'vi' && sourceLang === 'vi') return text;

  const cacheKey = `${sourceLang}_${targetLang}_${text.trim().toLowerCase()}`;
  const cache = getStorageCache();

  if (cache[cacheKey]) {
    return cache[cacheKey];
  }

  try {
    const googleTarget = targetLang === 'zh' ? 'zh-CN' : targetLang;
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sourceLang}&tl=${googleTarget}&dt=t&q=${encodeURIComponent(
      text
    )}`;

    const res = await fetch(url);
    if (!res.ok) throw new Error('Translation fetch failed');

    const data = await res.json();
    if (Array.isArray(data) && Array.isArray(data[0])) {
      const translated = data[0].map((item: any) => item[0]).join('');
      if (translated) {
        setStorageCache(cacheKey, translated);
        return translated;
      }
    }
  } catch (err) {
    console.warn(`[Kohi Translate Error] Failed to translate: "${text}"`, err);
  }

  return text;
}

/**
 * Batch translates array of texts sequentially or in parallel
 */
export async function translateBatch(
  texts: string[],
  targetLang: 'vi' | 'en' | 'zh',
  sourceLang: string = 'vi'
): Promise<Record<string, string>> {
  const result: Record<string, string> = {};
  if (targetLang === 'vi') {
    texts.forEach((t) => (result[t] = t));
    return result;
  }

  await Promise.all(
    texts.map(async (text) => {
      result[text] = await translateText(text, targetLang, sourceLang);
    })
  );

  return result;
}
