/**
 * Quản lý khung giờ hoạt động và cảnh báo giờ đóng cửa của Kohi Coffee
 * Chuẩn khung giờ: 07:00 - 22:00 hàng ngày (Múi giờ Việt Nam UTC+7)
 */

export const STORE_CONFIG = {
  openHour: 7,
  openMinute: 0,
  closeHour: 22,
  closeMinute: 0,
  warningThresholdMinutes: 30, // Cảnh báo khi thời gian đặt bàn / ngồi tại bàn cách giờ đóng cửa <= 30 phút
  openTimeStr: '07:00',
  closeTimeStr: '22:00',
};

export interface ReservationClosingCheck {
  isValidTime: boolean;
  isBeforeOpen: boolean;
  isAfterClosing: boolean;
  isNearClosing: boolean;
  minutesUntilClosing: number;
  reservationTimeStr: string;
  closingTimeStr: string;
  openingTimeStr: string;
}

export interface CurrentClosingCheck {
  isClosed: boolean;
  isNearClosing: boolean;
  minutesUntilClosing: number;
  closingTimeStr: string;
  currentTimeStr: string;
}

/**
 * Trích xuất giờ, phút của Date theo múi giờ Việt Nam (UTC+7)
 */
export function getVNTimeParts(date: Date = new Date()) {
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Ho_Chi_Minh',
      hour12: false,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
    const parts = formatter.formatToParts(date);
    const m: Record<string, string> = {};
    for (const p of parts) {
      m[p.type] = p.value;
    }
    const hour = parseInt(m.hour, 10) === 24 ? 0 : parseInt(m.hour, 10);
    const minute = parseInt(m.minute, 10);
    return {
      year: parseInt(m.year, 10),
      month: parseInt(m.month, 10),
      day: parseInt(m.day, 10),
      hour,
      minute,
      totalMinutes: hour * 60 + minute,
      timeStr: `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`,
    };
  } catch {
    // Fallback sang local time nếu Intl gặp sự cố
    const hour = date.getHours();
    const minute = date.getMinutes();
    return {
      year: date.getFullYear(),
      month: date.getMonth() + 1,
      day: date.getDate(),
      hour,
      minute,
      totalMinutes: hour * 60 + minute,
      timeStr: `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`,
    };
  }
}

/**
 * Kiểm tra thời gian đặt bàn của khách so với giờ đóng cửa
 * - isBeforeOpen: Đặt trước 07:00
 * - isAfterClosing: Đặt sau 22:00
 * - isNearClosing: Đặt trong khoảng 21:30 - 22:00 (< 30 phút trước khi đóng cửa)
 */
export function checkReservationClosingWarning(reservationTime: string | Date): ReservationClosingCheck {
  const targetDate = new Date(reservationTime);
  if (isNaN(targetDate.getTime())) {
    return {
      isValidTime: false,
      isBeforeOpen: false,
      isAfterClosing: false,
      isNearClosing: false,
      minutesUntilClosing: 0,
      reservationTimeStr: '',
      closingTimeStr: STORE_CONFIG.closeTimeStr,
      openingTimeStr: STORE_CONFIG.openTimeStr,
    };
  }

  const { totalMinutes, timeStr } = getVNTimeParts(targetDate);
  const openTotal = STORE_CONFIG.openHour * 60 + STORE_CONFIG.openMinute; // 7 * 60 = 420
  const closeTotal = STORE_CONFIG.closeHour * 60 + STORE_CONFIG.closeMinute; // 22 * 60 = 1320
  const warningStartTotal = closeTotal - STORE_CONFIG.warningThresholdMinutes; // 1320 - 30 = 1290 (21:30)

  const isBeforeOpen = totalMinutes < openTotal;
  const isAfterClosing = totalMinutes > closeTotal;
  const isNearClosing = totalMinutes >= warningStartTotal && totalMinutes <= closeTotal;
  const minutesUntilClosing = Math.max(0, closeTotal - totalMinutes);

  return {
    isValidTime: !isBeforeOpen && !isAfterClosing,
    isBeforeOpen,
    isAfterClosing,
    isNearClosing,
    minutesUntilClosing,
    reservationTimeStr: timeStr,
    closingTimeStr: STORE_CONFIG.closeTimeStr,
    openingTimeStr: STORE_CONFIG.openTimeStr,
  };
}

/**
 * Kiểm tra thời điểm hiện tại đối với bàn khách đang ngồi tại quán
 * - isClosed: Đã quá 22:00
 * - isNearClosing: Đang trong khoảng 21:30 - 22:00 (còn <= 30 phút)
 */
export function checkCurrentStoreClosingStatus(): CurrentClosingCheck {
  const { totalMinutes, timeStr } = getVNTimeParts(new Date());
  const closeTotal = STORE_CONFIG.closeHour * 60 + STORE_CONFIG.closeMinute; // 1320
  const warningStartTotal = closeTotal - STORE_CONFIG.warningThresholdMinutes; // 1290 (21:30)

  const isClosed = totalMinutes >= closeTotal;
  const isNearClosing = totalMinutes >= warningStartTotal && totalMinutes < closeTotal;
  const minutesUntilClosing = Math.max(0, closeTotal - totalMinutes);

  return {
    isClosed,
    isNearClosing,
    minutesUntilClosing,
    closingTimeStr: STORE_CONFIG.closeTimeStr,
    currentTimeStr: timeStr,
  };
}
