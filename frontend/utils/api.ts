/**
 * Utility to sanitize environment URLs (removing accidental newlines, tabs, spaces, and trailing slashes)
 */
export const cleanUrl = (url?: string, fallback: string = ''): string => {
  if (!url) return fallback;
  return url.trim().replace(/[\r\n\t]+/g, '').replace(/\/+$/, '');
};

export const API_BASE = cleanUrl(
  process.env.NEXT_PUBLIC_API_URL,
  'http://localhost:3001/api/v1'
);

export const SOCKET_BASE = cleanUrl(
  process.env.NEXT_PUBLIC_SOCKET_URL,
  'http://localhost:3001'
);
