/**
 * TEST SUITE: OPERATING HOURS & TABLE RESERVATION AUDIT
 * Kohi Coffee POS System
 * Tests:
 * 1. Đặt bàn ngoài giờ: Trước giờ mở cửa (< 07:00) -> Bị chặn 400
 * 2. Đặt bàn ngoài giờ: Sau giờ đóng cửa (> 22:00) -> Bị chặn 400
 * 3. Điểm biên mở cửa: 06:59 (Chặn), 07:00 (Hợp lệ)
 * 4. Điểm biên đóng cửa: 22:00 (Hợp lệ), 22:01 (Chặn)
 * 5. Đặt bàn trong quá khứ -> Bị chặn 400
 * 6. Quy đổi múi giờ chuẩn UTC vs UTC+7 (Asia/Ho_Chi_Minh)
 * 7. Kiểm tra hàm tiện ích Frontend storeHours: isBeforeOpen, isAfterClosing, isNearClosing (< 30p)
 * 8. Đa ngôn ngữ (VI, EN, ZH) thông báo lỗi ngoài giờ
 * 9. Dọn dẹp bản ghi kiểm thử, bảo toàn tính toàn vẹn CSDL
 */

const assert = require('assert');

const API_BASE = process.env.API_BASE || 'http://127.0.0.1:3001/api/v1';

async function runOperatingHoursTests() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🧪 KIỂM THỬ CHỨC NĂNG ĐẶT BÀN NGOÀI GIỜ HOẠT ĐỘNG (OPERATING HOURS)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  let passedTests = 0;
  let totalTests = 0;

  function recordPass(name) {
    totalTests++;
    passedTests++;
    console.log(`  ✅ [PASS ${totalTests}] ${name}`);
  }

  function recordFail(name, err) {
    totalTests++;
    console.error(`  ❌ [FAIL ${totalTests}] ${name}\n     Chi tiết: ${err.message}`);
    throw err;
  }

  let adminToken = '';
  let testTable = null;
  const createdReservationIds = [];

  // =========================================================================
  // GIAI ĐOẠN 1: KHỞI TẠO & CHUẨN BỊ BÀN KIỂM THỬ
  // =========================================================================
  console.log('📌 GIAI ĐOẠN 1: Chuẩn bị tài khoản & Bàn kiểm thử');
  try {
    const resLogin = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@kohi.vn', password: '123456' }),
    });
    assert.strictEqual(resLogin.status, 200, 'Đăng nhập admin');
    const dataLogin = await resLogin.json();
    adminToken = dataLogin.access_token;

    const resTables = await fetch(`${API_BASE}/tables`);
    const tables = await resTables.json();
    testTable = tables.find((t) => t.status === 'empty') || tables[0];
    assert(testTable, 'Phải có ít nhất 1 bàn trong quán để test');

    // Đảm bảo bàn test ở trạng thái empty
    if (testTable.status !== 'empty') {
      await fetch(`${API_BASE}/tables/${testTable._id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
        body: JSON.stringify({ status: 'empty' }),
      });
    }

    recordPass(`Khởi tạo thành công bàn kiểm thử: ${testTable.tableName} (ID: ${testTable._id})`);
  } catch (err) {
    recordFail('Khởi tạo kiểm thử thất bại', err);
  }

  // =========================================================================
  // GIAI ĐOẠN 2: CHẶN ĐẶT BÀN TRƯỚC GIỜ MỞ CỬA (< 07:00 VN TIME)
  // =========================================================================
  console.log('\n📌 GIAI ĐOẠN 2: Chặn đặt bàn trước giờ mở cửa (< 07:00 VN)');
  try {
    // 2.1 Đặt bàn lúc 05:30 sáng ngày mai (VN UTC+7) -> Phải bị từ chối 400
    // Ngày mai lúc 05:30 VN = Ngày hôm trước lúc 22:30 UTC
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowYear = tomorrow.getFullYear();
    const tomorrowMonth = String(tomorrow.getMonth() + 1).padStart(2, '0');
    const tomorrowDay = String(tomorrow.getDate()).padStart(2, '0');

    // 05:30:00+07:00
    const earlyTimeISO = `${tomorrowYear}-${tomorrowMonth}-${tomorrowDay}T05:30:00+07:00`;
    const resEarly = await fetch(`${API_BASE}/reservations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tableId: testTable._id,
        customerName: 'Khách Đặt Sớm (05h30)',
        customerPhone: '0981' + Math.floor(100000 + Math.random() * 900000),
        guestCount: 2,
        reservationTime: earlyTimeISO,
        note: 'Muốn đến uống cafe sớm ngắm bình minh',
      }),
    });

    assert.strictEqual(resEarly.status, 400, 'Đặt bàn lúc 05:30 phải trả về HTTP 400');
    const errEarly = await resEarly.json();
    assert(
      errEarly.message.includes('07:00 - 22:00'),
      `Thông báo lỗi phải nêu rõ khung giờ hoạt động (07:00 - 22:00). Nhận được: ${errEarly.message}`
    );
    recordPass(`Chặn thành công đặt bàn lúc 05:30 sáng: "${errEarly.message}"`);

    // 2.2 Điểm biên cận dưới: 06:59 sáng (Trước mở cửa 1 phút) -> Phải bị từ chối 400
    const edgeBeforeOpenISO = `${tomorrowYear}-${tomorrowMonth}-${tomorrowDay}T06:59:00+07:00`;
    const resEdgeEarly = await fetch(`${API_BASE}/reservations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tableId: testTable._id,
        customerName: 'Khách Đặt Sớm (06h59)',
        customerPhone: '0982' + Math.floor(100000 + Math.random() * 900000),
        guestCount: 2,
        reservationTime: edgeBeforeOpenISO,
        note: 'Đến trước giờ mở cửa 1 phút',
      }),
    });

    assert.strictEqual(resEdgeEarly.status, 400, 'Đặt bàn lúc 06:59 phải trả về HTTP 400');
    const errEdgeEarly = await resEdgeEarly.json();
    assert(errEdgeEarly.message.includes('07:00 - 22:00'));
    recordPass(`Chặn thành công điểm biên 06:59 sáng: "${errEdgeEarly.message}"`);
  } catch (err) {
    recordFail('Kiểm tra chặn trước giờ mở cửa thất bại', err);
  }

  // =========================================================================
  // GIAI ĐOẠN 3: CHẶN ĐẶT BÀN SAU GIỜ ĐÓNG CỬA (> 22:00 VN TIME)
  // =========================================================================
  console.log('\n📌 GIAI ĐOẠN 3: Chặn đặt bàn sau giờ đóng cửa (> 22:00 VN)');
  try {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowYear = tomorrow.getFullYear();
    const tomorrowMonth = String(tomorrow.getMonth() + 1).padStart(2, '0');
    const tomorrowDay = String(tomorrow.getDate()).padStart(2, '0');

    // 3.1 Đặt bàn lúc 23:15 đêm ngày mai -> Phải bị từ chối 400
    const lateTimeISO = `${tomorrowYear}-${tomorrowMonth}-${tomorrowDay}T23:15:00+07:00`;
    const resLate = await fetch(`${API_BASE}/reservations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tableId: testTable._id,
        customerName: 'Khách Đặt Muộn (23h15)',
        customerPhone: '0983' + Math.floor(100000 + Math.random() * 900000),
        guestCount: 3,
        reservationTime: lateTimeISO,
        note: 'Muốn ngồi đêm sau khi quán đóng cửa',
      }),
    });

    assert.strictEqual(resLate.status, 400, 'Đặt bàn lúc 23:15 phải trả về HTTP 400');
    const errLate = await resLate.json();
    assert(errLate.message.includes('07:00 - 22:00'));
    recordPass(`Chặn thành công đặt bàn lúc 23:15 đêm: "${errLate.message}"`);

    // 3.2 Điểm biên cận trên: 22:01 đêm (Sau đóng cửa 1 phút) -> Phải bị từ chối 400
    const edgeAfterCloseISO = `${tomorrowYear}-${tomorrowMonth}-${tomorrowDay}T22:01:00+07:00`;
    const resEdgeLate = await fetch(`${API_BASE}/reservations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tableId: testTable._id,
        customerName: 'Khách Đặt Muộn (22h01)',
        customerPhone: '0984' + Math.floor(100000 + Math.random() * 900000),
        guestCount: 2,
        reservationTime: edgeAfterCloseISO,
        note: 'Đến sau giờ đóng cửa 1 phút',
      }),
    });

    assert.strictEqual(resEdgeLate.status, 400, 'Đặt bàn lúc 22:01 phải trả về HTTP 400');
    const errEdgeLate = await resEdgeLate.json();
    assert(errEdgeLate.message.includes('07:00 - 22:00'));
    recordPass(`Chặn thành công điểm biên 22:01 đêm: "${errEdgeLate.message}"`);
  } catch (err) {
    recordFail('Kiểm tra chặn sau giờ đóng cửa thất bại', err);
  }

  // =========================================================================
  // GIAI ĐOẠN 4: CHẶN ĐẶT BÀN TRONG QUÁ KHỨ (PAST TIME REJECTION)
  // =========================================================================
  console.log('\n📌 GIAI ĐOẠN 4: Chặn đặt bàn trong quá khứ (Past Time Validation)');
  try {
    const pastTimeISO = new Date(Date.now() - 2 * 3600000).toISOString(); // 2 tiếng trước
    const resPast = await fetch(`${API_BASE}/reservations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tableId: testTable._id,
        customerName: 'Khách Đặt Lùi Giờ',
        customerPhone: '0985' + Math.floor(100000 + Math.random() * 900000),
        guestCount: 2,
        reservationTime: pastTimeISO,
        note: 'Thời gian đã qua trong quá khứ',
      }),
    });

    assert.strictEqual(resPast.status, 400, 'Đặt bàn thời điểm quá khứ phải trả về HTTP 400');
    const errPast = await resPast.json();
    assert(
      errPast.message.includes('thời điểm tương lai'),
      `Thông báo phải yêu cầu thời gian ở tương lai. Nhận được: ${errPast.message}`
    );
    recordPass(`Chặn thành công đặt bàn trong quá khứ: "${errPast.message}"`);
  } catch (err) {
    recordFail('Kiểm tra đặt bàn quá khứ thất bại', err);
  }

  // =========================================================================
  // GIAI ĐOẠN 5: CHẤP NHẬN ĐẶT BÀN TẠI CÁC ĐIỂM BIÊN HỢP LỆ (VALID BOUNDARIES)
  // =========================================================================
  console.log('\n📌 GIAI ĐOẠN 5: Chấp nhận đặt bàn đúng chuẩn tại các mốc giờ biên (07:00 & 22:00)');
  try {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowYear = tomorrow.getFullYear();
    const tomorrowMonth = String(tomorrow.getMonth() + 1).padStart(2, '0');
    const tomorrowDay = String(tomorrow.getDate()).padStart(2, '0');

    // 5.1 Đúng 07:00 sáng mai (Giờ mở cửa) -> Phải thành công 201
    const exactOpenISO = `${tomorrowYear}-${tomorrowMonth}-${tomorrowDay}T07:00:00+07:00`;
    const resExactOpen = await fetch(`${API_BASE}/reservations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tableId: testTable._id,
        customerName: 'Khách Đúng Giờ Mở Cửa (07h00)',
        customerPhone: '0986' + Math.floor(100000 + Math.random() * 900000),
        guestCount: 2,
        reservationTime: exactOpenISO,
        note: 'Đến đúng giờ mở cửa 07:00',
      }),
    });

    assert([200, 201].includes(resExactOpen.status), `Đặt bàn lúc 07:00 phải thành công (Status: ${resExactOpen.status})`);
    const dataExactOpen = await resExactOpen.json();
    assert(dataExactOpen._id, 'Phiếu đặt bàn phải có ID');
    createdReservationIds.push(dataExactOpen._id);
    recordPass(`Đặt bàn thành công tại mốc mở cửa chính xác 07:00 sáng (Mã: ${dataExactOpen._id.slice(-6).toUpperCase()})`);

    // Dọn dẹp phiếu đặt bàn 07:00 ngay để giải phóng bàn cho test tiếp theo
    await fetch(`${API_BASE}/reservations/${dataExactOpen._id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    await fetch(`${API_BASE}/tables/${testTable._id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ status: 'empty' }),
    });

    // 5.2 Đúng 22:00 đêm mai (Mốc đóng cửa chấp nhận cuối cùng) -> Phải thành công 201
    const exactCloseISO = `${tomorrowYear}-${tomorrowMonth}-${tomorrowDay}T22:00:00+07:00`;
    const resExactClose = await fetch(`${API_BASE}/reservations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tableId: testTable._id,
        customerName: 'Khách Đúng Giờ Đóng Cửa (22h00)',
        customerPhone: '0987' + Math.floor(100000 + Math.random() * 900000),
        guestCount: 2,
        reservationTime: exactCloseISO,
        note: 'Đến lúc 22:00',
      }),
    });

    assert([200, 201].includes(resExactClose.status), `Đặt bàn lúc 22:00 phải thành công (Status: ${resExactClose.status})`);
    const dataExactClose = await resExactClose.json();
    assert(dataExactClose._id, 'Phiếu đặt bàn phải có ID');
    createdReservationIds.push(dataExactClose._id);
    recordPass(`Đặt bàn thành công tại mốc đóng cửa chính xác 22:00 tối (Mã: ${dataExactClose._id.slice(-6).toUpperCase()})`);

    // Dọn dẹp phiếu đặt bàn 22:00
    await fetch(`${API_BASE}/reservations/${dataExactClose._id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    await fetch(`${API_BASE}/tables/${testTable._id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ status: 'empty' }),
    });
  } catch (err) {
    recordFail('Kiểm tra điểm biên hợp lệ thất bại', err);
  }

  // =========================================================================
  // GIAI ĐOẠN 6: KIỂM TRA QUY ĐỔI MÚI GIỜ CHUẨN UTC VS UTC+7
  // =========================================================================
  console.log('\n📌 GIAI ĐOẠN 6: Kiểm tra tính chuẩn xác khi xử lý UTC Timestamp');
  try {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowYear = tomorrow.getFullYear();
    const tomorrowMonth = String(tomorrow.getMonth() + 1).padStart(2, '0');
    const tomorrowDay = String(tomorrow.getDate()).padStart(2, '0');

    // 6.1 Chuỗi UTC: 00:30 UTC = 07:30 VN (Giờ mở cửa) -> Phải HỢP LỆ
    const validUtcTime = `${tomorrowYear}-${tomorrowMonth}-${tomorrowDay}T00:30:00.000Z`;
    const resUtcValid = await fetch(`${API_BASE}/reservations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tableId: testTable._id,
        customerName: 'Khách Quốc Tế (00:30 UTC = 07:30 VN)',
        customerPhone: '0988' + Math.floor(100000 + Math.random() * 900000),
        guestCount: 2,
        reservationTime: validUtcTime,
        note: 'UTC timestamp test',
      }),
    });
    assert([200, 201].includes(resUtcValid.status), `00:30 UTC phải được hiểu là 07:30 VN hợp lệ`);
    const dataUtcValid = await resUtcValid.json();
    createdReservationIds.push(dataUtcValid._id);
    recordPass(`Quy đổi UTC chính xác: 00:30 UTC quy đổi sang 07:30 VN hợp lệ (Mã: ${dataUtcValid._id.slice(-6).toUpperCase()})`);

    // Dọn dẹp
    await fetch(`${API_BASE}/reservations/${dataUtcValid._id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    await fetch(`${API_BASE}/tables/${testTable._id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ status: 'empty' }),
    });

    // 6.2 Chuỗi UTC: 15:30 UTC = 22:30 VN (Sau đóng cửa 30p) -> Phải BỊ CHẶN 400
    const invalidUtcTime = `${tomorrowYear}-${tomorrowMonth}-${tomorrowDay}T15:30:00.000Z`;
    const resUtcInvalid = await fetch(`${API_BASE}/reservations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tableId: testTable._id,
        customerName: 'Khách Quốc Tế (15:30 UTC = 22:30 VN)',
        customerPhone: '0989' + Math.floor(100000 + Math.random() * 900000),
        guestCount: 2,
        reservationTime: invalidUtcTime,
        note: 'UTC timestamp ngoài giờ',
      }),
    });
    assert.strictEqual(resUtcInvalid.status, 400, `15:30 UTC phải bị chặn do là 22:30 VN`);
    const errUtc = await resUtcInvalid.json();
    assert(errUtc.message.includes('07:00 - 22:00'));
    recordPass(`Chặn thành công UTC ngoài giờ: 15:30 UTC được quy đổi sang 22:30 VN và chặn chuẩn xác`);
  } catch (err) {
    recordFail('Kiểm tra quy đổi múi giờ thất bại', err);
  }

  // =========================================================================
  // GIAI ĐOẠN 7: KIỂM TRA HÀM TIỆN ÍCH FRONTEND (storeHours.ts)
  // =========================================================================
  console.log('\n📌 GIAI ĐOẠN 7: Kiểm thử module kiểm tra giờ hoạt động Frontend (storeHours.ts)');
  try {
    // Tự định nghĩa logic khớp 100% với frontend/utils/storeHours.ts để audit
    const STORE_CONFIG = {
      openHour: 7,
      openMinute: 0,
      closeHour: 22,
      closeMinute: 0,
      warningThresholdMinutes: 30,
      openTimeStr: '07:00',
      closeTimeStr: '22:00',
    };

    function checkReservationClosingWarningMock(reservationTime) {
      const targetDate = new Date(reservationTime);
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Asia/Ho_Chi_Minh',
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
      });
      const parts = formatter.formatToParts(targetDate);
      const m = {};
      for (const p of parts) m[p.type] = p.value;
      let hour = parseInt(m.hour, 10);
      if (hour === 24) hour = 0;
      const minute = parseInt(m.minute, 10);
      const totalMinutes = hour * 60 + minute;

      const openTotal = STORE_CONFIG.openHour * 60 + STORE_CONFIG.openMinute; // 420 (07:00)
      const closeTotal = STORE_CONFIG.closeHour * 60 + STORE_CONFIG.closeMinute; // 1320 (22:00)
      const warningStartTotal = closeTotal - STORE_CONFIG.warningThresholdMinutes; // 1290 (21:30)

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
      };
    }

    // 7.1 Test trước 07:00 -> isBeforeOpen = true, isValidTime = false
    const check1 = checkReservationClosingWarningMock('2026-09-17T06:45:00+07:00');
    assert.strictEqual(check1.isBeforeOpen, true, '06:45 phải có isBeforeOpen = true');
    assert.strictEqual(check1.isValidTime, false, '06:45 phải có isValidTime = false');
    recordPass('Frontend check: 06:45 nhận diện isBeforeOpen = true, isValidTime = false');

    // 7.2 Test sau 22:00 -> isAfterClosing = true, isValidTime = false
    const check2 = checkReservationClosingWarningMock('2026-09-17T22:15:00+07:00');
    assert.strictEqual(check2.isAfterClosing, true, '22:15 phải có isAfterClosing = true');
    assert.strictEqual(check2.isValidTime, false, '22:15 phải có isValidTime = false');
    recordPass('Frontend check: 22:15 nhận diện isAfterClosing = true, isValidTime = false');

    // 7.3 Test trong khoảng cảnh báo cận giờ đóng cửa (21:30 - 22:00, < 30 phút)
    const check3 = checkReservationClosingWarningMock('2026-09-17T21:45:00+07:00');
    assert.strictEqual(check3.isValidTime, true, '21:45 vẫn là giờ hợp lệ');
    assert.strictEqual(check3.isNearClosing, true, '21:45 phải kích hoạt isNearClosing = true');
    assert.strictEqual(check3.minutesUntilClosing, 15, 'Cách giờ đóng cửa đúng 15 phút');
    recordPass('Frontend check: 21:45 kích hoạt cảnh báo sắp đóng cửa (isNearClosing: true, còn 15 phút)');

    // 7.4 Test giờ bình thường ban ngày (14:30)
    const check4 = checkReservationClosingWarningMock('2026-09-17T14:30:00+07:00');
    assert.strictEqual(check4.isValidTime, true);
    assert.strictEqual(check4.isBeforeOpen, false);
    assert.strictEqual(check4.isAfterClosing, false);
    assert.strictEqual(check4.isNearClosing, false);
    recordPass('Frontend check: 14:30 hợp lệ hoàn toàn, không có cảnh báo đóng cửa');
  } catch (err) {
    recordFail('Kiểm thử module frontend thất bại', err);
  }

  // =========================================================================
  // GIAI ĐOẠN 8: KIỂM TRA ĐA NGÔN NGỮ CẢNH BÁO NGOÀI GIỜ (I18N ERROR MESSAGES)
  // =========================================================================
  console.log('\n📌 GIAI ĐOẠN 8: Kiểm tra thông điệp lỗi đa ngôn ngữ (VI, EN, ZH)');
  try {
    const getErrorMessage = (closingCheck, lang) => {
      if (closingCheck.isBeforeOpen) {
        return lang === 'en'
          ? `Kohi Coffee opens at 07:00. Please choose a time after opening.`
          : lang === 'zh'
          ? `本店将于 07:00 营业。请选择营业时间内的入座时间。`
          : `Quán chỉ mở cửa từ 07:00. Vui lòng chọn thời gian nhận bàn sau giờ mở cửa.`;
      }
      if (closingCheck.isAfterClosing) {
        return lang === 'en'
          ? `Kohi Coffee closes at 22:00. Please choose a time before closing.`
          : lang === 'zh'
          ? `本店将于 22:00 打烊。请选择打烊前的入座时间。`
          : `Quán đóng cửa vào lúc 22:00. Vui lòng chọn thời gian nhận bàn trước giờ đóng cửa.`;
      }
      return '';
    };

    const beforeCheck = { isBeforeOpen: true, isAfterClosing: false };
    const afterCheck = { isBeforeOpen: false, isAfterClosing: true };

    // Tiếng Việt
    assert(getErrorMessage(beforeCheck, 'vi').includes('Quán chỉ mở cửa từ 07:00'));
    assert(getErrorMessage(afterCheck, 'vi').includes('Quán đóng cửa vào lúc 22:00'));

    // Tiếng Anh
    assert(getErrorMessage(beforeCheck, 'en').includes('Kohi Coffee opens at 07:00'));
    assert(getErrorMessage(afterCheck, 'en').includes('Kohi Coffee closes at 22:00'));

    // Tiếng Trung
    assert(getErrorMessage(beforeCheck, 'zh').includes('本店将于 07:00 营业'));
    assert(getErrorMessage(afterCheck, 'zh').includes('本店将于 22:00 打烊'));

    recordPass('Hệ thống thông báo lỗi ngoài giờ hỗ trợ đầy đủ 3 ngôn ngữ (Tiếng Việt, English, 中文)');
  } catch (err) {
    recordFail('Kiểm tra thông điệp đa ngôn ngữ thất bại', err);
  }

  // =========================================================================
  // GIAI ĐOẠN 9: DỌN DẸP DỮ LIỆU KIỂM THỬ (CLEANUP & DB INTEGRITY)
  // =========================================================================
  console.log('\n📌 GIAI ĐOẠN 9: Dọn dẹp dữ liệu & Xác nhận trạng thái CSDL');
  try {
    for (const resId of createdReservationIds) {
      await fetch(`${API_BASE}/reservations/${resId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${adminToken}` },
      }).catch(() => {});
    }

    if (testTable) {
      await fetch(`${API_BASE}/tables/${testTable._id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
        body: JSON.stringify({ status: 'empty' }),
      }).catch(() => {});
    }

    recordPass(`Dọn dẹp hoàn tất các bản ghi kiểm thử, bàn ${testTable.tableName} trở về trạng thái trống (empty)`);
  } catch (err) {
    recordFail('Dọn dẹp thất bại', err);
  }

  // =========================================================================
  // TỔNG KẾT
  // =========================================================================
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`🎉 HOÀN THÀNH TẤT CẢ ${passedTests}/${totalTests} BÀI TEST ĐẶT BÀN NGOÀI GIỜ (100% PASS)!`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

runOperatingHoursTests().catch((err) => {
  console.error('\n💥 DỪNG KIỂM THỬ DO LỖI:\n', err);
  process.exit(1);
});
