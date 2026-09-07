/**
 * Tiện ích thời gian chuẩn theo múi giờ Việt Nam (Asia/Ho_Chi_Minh, UTC+7)
 * Đảm bảo hoạt động chính xác 100% trên mọi môi trường máy chủ (Local Windows, Docker, Railway, AWS...).
 */
export function getVietnamTime(date: Date = new Date()) {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Ho_Chi_Minh',
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  const parts = formatter.formatToParts(date);
  const m: Record<string, string> = {};
  for (const part of parts) {
    m[part.type] = part.value;
  }

  const year = parseInt(m.year, 10);
  const month = parseInt(m.month, 10) - 1; // 0-indexed (0 - 11)
  const day = parseInt(m.day, 10);
  let hour = parseInt(m.hour, 10);
  if (hour === 24) hour = 0; // Định dạng 0-23
  const minute = parseInt(m.minute, 10);
  const second = parseInt(m.second, 10);
  const totalMinutes = hour * 60 + minute;

  const timeStr = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
  const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

  // Khoảng thời gian bắt đầu và kết thúc ngày theo múi giờ Việt Nam (quy về Date UTC chuẩn MongoDB)
  // 00:00:00 VN = Date.UTC(year, month, day, 0 - 7h, 0, 0, 0)
  const startOfDay = new Date(Date.UTC(year, month, day, -7, 0, 0, 0));
  const endOfDay = new Date(Date.UTC(year, month, day, 16, 59, 59, 999));

  return {
    year,
    month,
    day,
    hour,
    minute,
    second,
    totalMinutes,
    timeStr,
    dateStr,
    startOfDay,
    endOfDay,
  };
}
