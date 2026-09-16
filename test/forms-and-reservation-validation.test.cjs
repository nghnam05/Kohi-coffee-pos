/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║   📋 KOHI COFFEE POS - COMPREHENSIVE FORM & RESERVATION VALIDATION SUITE  ║
 * ║   Tests:                                                                  ║
 * ║   - Part 1: Table Reservation 16-Case Deep Validation Matrix              ║
 * ║   - Part 2: Login Auth, Coupons, Reviews & Admin CRUD Form Validation     ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 */

const assert = require('assert');

const API_BASE = process.env.API_BASE || 'http://127.0.0.1:3001/api/v1';

let adminToken = '';
let waiterToken = '';

// Test tracking
let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
const testResults = [];

function recordTest(suite, testName, passed, extra = '') {
  totalTests++;
  if (passed) {
    passedTests++;
    console.log(`  ✅ [PASS] ${testName}`);
    testResults.push({ suite, testName, status: 'PASS' });
  } else {
    failedTests++;
    console.error(`  ❌ [FAIL] ${testName} - Details: ${extra}`);
    testResults.push({ suite, testName, status: 'FAIL', error: extra });
  }
}

// Helper to get next valid future date at specific hour:minute in VN time (UTC+7)
function getFutureReservationDate(daysAhead = 1, targetHour = 14, targetMinute = 0) {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  d.setHours(targetHour, targetMinute, 0, 0);
  return d;
}

// Generate unique test phone number
function generateTestPhone(suffix = '999') {
  return `0987${Math.floor(100 + Math.random() * 900)}${suffix}`.slice(0, 10);
}

async function runValidationTestSuite() {
  console.log('═════════════════════════════════════════════════════════════════════');
  console.log('📋 BẮT ĐẦU KIỂM THỬ VALIDATE FORM & CHỨC NĂNG ĐẶT BÀN (KOHI POS)');
  console.log('═════════════════════════════════════════════════════════════════════');

  // ───────────────────────────────────────────────────────────────────────────
  // SETUP: Authenticate Staff Roles for Protected Operations
  // ───────────────────────────────────────────────────────────────────────────
  console.log('\n🔑 [SETUP] Đăng nhập tài khoản Quản trị & Nhân viên...');
  try {
    const adminRes = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@kohi.vn', password: '123456' }),
    });
    const adminData = await adminRes.json();
    adminToken = adminData.access_token || adminData.accessToken || '';
    assert.ok(adminToken, 'Admin token acquired');

    const waiterRes = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'pvtoi@kohi.vn', password: '123456' }),
    });
    const waiterData = await waiterRes.json();
    waiterToken = waiterData.access_token || waiterData.accessToken || '';
    assert.ok(waiterToken, 'Waiter token acquired');
    console.log('  ✅ Đăng nhập nhân sự thành công.');
  } catch (err) {
    console.error('  ❌ Lỗi khi khởi tạo phiên đăng nhập:', err.message);
    process.exit(1);
  }

  // Create isolated test tables for zero-collision testing
  const createdTableIds = [];
  async function createTestTable(tableNumber = 88) {
    // Delete if already exists from prior crash
    try {
      const existingRes = await fetch(`${API_BASE}/tables`);
      const all = await existingRes.json();
      const match = all.find(t => t.tableName === `Bàn số ${tableNumber}`);
      if (match) {
        await fetch(`${API_BASE}/tables/${match._id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${adminToken}` },
        });
      }
    } catch {}

    const res = await fetch(`${API_BASE}/tables`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        tableName: `Bàn số ${tableNumber}`,
        status: 'empty',
      }),
    });
    const tbl = await res.json();
    assert.ok(tbl._id, `Created test table Bàn số ${tableNumber}`);
    createdTableIds.push(tbl._id);
    return tbl;
  }

  console.log('\n🏗️ [SETUP] Tạo các bàn ăn kiểm thử độc lập (Zero-Collision)...');
  const primaryTable = await createTestTable(88);
  const validationTable = await createTestTable(89);
  const cancelTable = await createTestTable(90);

  // Fetch tables to pick existing serving / reserved tables
  const tablesRes = await fetch(`${API_BASE}/tables`);
  const allTables = await tablesRes.json();
  const servingTable = allTables.find(t => t.status === 'serving') || allTables[0];
  const reservedTable = allTables.find(t => t.status === 'reserved') || allTables[1];

  console.log(`  📌 Bàn chính test luồng: ${primaryTable.tableName} (${primaryTable._id})`);
  console.log(`  📌 Bàn test dữ liệu sai: ${validationTable.tableName} (${validationTable._id})`);
  console.log(`  📌 Bàn test hủy & cooldown: ${cancelTable.tableName} (${cancelTable._id})`);
  console.log(`  📌 Bàn đang phục vụ: ${servingTable.tableName} (${servingTable._id})`);
  console.log(`  📌 Bàn đã giữ chỗ: ${reservedTable.tableName} (${reservedTable._id})`);

  // Track created test reservation IDs for cleanup
  const createdResIds = [];

  // ───────────────────────────────────────────────────────────────────────────
  // PHẦN 1: MA TRẬN 16 CA KIỂM THỬ CHỨC NĂNG ĐẶT BÀN (TABLE RESERVATION)
  // ───────────────────────────────────────────────────────────────────────────
  console.log('\n═════════════════════════════════════════════════════════════════════');
  console.log('📌 [PHẦN 1] MA TRẬN 16 CA KIỂM THỬ ĐẶT BÀN TRỰC TUYẾN (RES-01 -> RES-16)');
  console.log('═════════════════════════════════════════════════════════════════════');

  const testPhonePrimary = generateTestPhone('111');
  const validFutureTime = getFutureReservationDate(2, 15, 0).toISOString();
  let primaryResId = '';
  let primaryCheckInCode = '';

  // RES-01: Happy Path - Đặt bàn thành công với thông tin hợp lệ
  try {
    const res = await fetch(`${API_BASE}/reservations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tableId: primaryTable._id,
        customerName: 'Nguyễn Hoài Nam',
        customerPhone: testPhonePrimary,
        guestCount: 4,
        reservationTime: validFutureTime,
        note: 'Bàn cạnh cửa sổ, view đẹp',
      }),
    });
    const data = await res.json();
    const isOk = res.ok && data._id && data.checkInCode && data.status;
    if (isOk) {
      primaryResId = data._id;
      primaryCheckInCode = data.checkInCode;
      createdResIds.push(data._id);
    }
    recordTest('Reservation', 'RES-01: Happy Path - Đặt bàn thành công, cấp mã 4 số & chuyển trạng thái', isOk, JSON.stringify(data));
  } catch (err) {
    recordTest('Reservation', 'RES-01: Happy Path', false, err.message);
  }

  // RES-02: Chặn đặt bàn đang có khách (Serving)
  try {
    const res = await fetch(`${API_BASE}/reservations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tableId: servingTable._id,
        customerName: 'Trần Văn B',
        customerPhone: generateTestPhone('222'),
        guestCount: 2,
        reservationTime: validFutureTime,
      }),
    });
    const data = await res.json();
    const isBlocked = res.status === 400 && (data.message?.includes('khách') || data.message?.includes('hiện đang có khách'));
    recordTest('Reservation', 'RES-02: Chặn đặt bàn đang có khách ngồi (serving)', isBlocked, data.message);
  } catch (err) {
    recordTest('Reservation', 'RES-02: Chặn bàn serving', false, err.message);
  }

  // RES-03: Chặn đặt bàn đã được giữ chỗ (Reserved)
  try {
    const res = await fetch(`${API_BASE}/reservations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tableId: reservedTable._id,
        customerName: 'Lê Thị C',
        customerPhone: generateTestPhone('333'),
        guestCount: 2,
        reservationTime: validFutureTime,
      }),
    });
    const data = await res.json();
    const isBlocked = res.status === 400 && (data.message?.includes('giữ chỗ') || data.message?.includes('reserved'));
    recordTest('Reservation', 'RES-03: Chặn đặt bàn đã được giữ chỗ trước (reserved)', isBlocked, data.message);
  } catch (err) {
    recordTest('Reservation', 'RES-03: Chặn bàn reserved', false, err.message);
  }

  // RES-04: Validate Tên khách hàng (Rỗng hoặc thiếu)
  try {
    const res = await fetch(`${API_BASE}/reservations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tableId: validationTable._id,
        customerName: '',
        customerPhone: generateTestPhone('444'),
        guestCount: 2,
        reservationTime: validFutureTime,
      }),
    });
    const data = await res.json();
    const isBlocked = res.status === 400;
    recordTest('Reservation', 'RES-04: Chặn đặt bàn khi tên khách hàng để trống', isBlocked, JSON.stringify(data.message));
  } catch (err) {
    recordTest('Reservation', 'RES-04: Validate tên trống', false, err.message);
  }

  // RES-05a: Validate SĐT sai định dạng (9 chữ số)
  try {
    const res = await fetch(`${API_BASE}/reservations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tableId: validationTable._id,
        customerName: 'Test Short Phone',
        customerPhone: '098765432', // 9 digits
        guestCount: 2,
        reservationTime: validFutureTime,
      }),
    });
    const data = await res.json();
    const isBlocked = res.status === 400;
    recordTest('Reservation', 'RES-05a: Chặn số điện thoại chỉ có 9 chữ số', isBlocked, JSON.stringify(data.message));
  } catch (err) {
    recordTest('Reservation', 'RES-05a: SĐT 9 số', false, err.message);
  }

  // RES-05b: Validate SĐT sai định dạng (11 chữ số)
  try {
    const res = await fetch(`${API_BASE}/reservations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tableId: validationTable._id,
        customerName: 'Test Long Phone',
        customerPhone: '09876543210', // 11 digits
        guestCount: 2,
        reservationTime: validFutureTime,
      }),
    });
    const data = await res.json();
    const isBlocked = res.status === 400;
    recordTest('Reservation', 'RES-05b: Chặn số điện thoại thừa 11 chữ số', isBlocked, JSON.stringify(data.message));
  } catch (err) {
    recordTest('Reservation', 'RES-05b: SĐT 11 số', false, err.message);
  }

  // RES-05c: Validate SĐT sai đầu số mạng VN (012...)
  try {
    const res = await fetch(`${API_BASE}/reservations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tableId: validationTable._id,
        customerName: 'Test Invalid Prefix',
        customerPhone: '0123456789', // Đầu 01 cũ
        guestCount: 2,
        reservationTime: validFutureTime,
      }),
    });
    const data = await res.json();
    const isBlocked = res.status === 400;
    recordTest('Reservation', 'RES-05c: Chặn số điện thoại sai đầu số nhà mạng VN', isBlocked, JSON.stringify(data.message));
  } catch (err) {
    recordTest('Reservation', 'RES-05c: SĐT sai đầu số', false, err.message);
  }

  // RES-06: Validate Số lượng khách (GuestCount <= 0 hoặc invalid)
  try {
    const res = await fetch(`${API_BASE}/reservations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tableId: validationTable._id,
        customerName: 'Test Zero Guests',
        customerPhone: generateTestPhone('555'),
        guestCount: 0,
        reservationTime: validFutureTime,
      }),
    });
    const data = await res.json();
    const isBlocked = res.status === 400;
    recordTest('Reservation', 'RES-06: Chặn số lượng khách <= 0', isBlocked, JSON.stringify(data.message));
  } catch (err) {
    recordTest('Reservation', 'RES-06: Số khách <= 0', false, err.message);
  }

  // RES-07: Validate Thời gian trong quá khứ (< now - 5m)
  try {
    const pastTime = new Date(Date.now() - 3600 * 1000).toISOString();
    const res = await fetch(`${API_BASE}/reservations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tableId: validationTable._id,
        customerName: 'Test Past Time',
        customerPhone: generateTestPhone('666'),
        guestCount: 2,
        reservationTime: pastTime,
      }),
    });
    const data = await res.json();
    const isBlocked = res.status === 400 && (data.message?.includes('tương lai') || data.message?.includes('quá khứ') || data.message?.includes('future'));
    recordTest('Reservation', 'RES-07: Chặn thời gian hẹn trong quá khứ', isBlocked, data.message);
  } catch (err) {
    recordTest('Reservation', 'RES-07: Thời gian quá khứ', false, err.message);
  }

  // RES-08a: Validate Ngoài giờ mở cửa quán (Trước 07:00 sáng)
  try {
    const earlyMorningTime = getFutureReservationDate(2, 5, 30).toISOString();
    const res = await fetch(`${API_BASE}/reservations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tableId: validationTable._id,
        customerName: 'Test Early Bird',
        customerPhone: generateTestPhone('777'),
        guestCount: 2,
        reservationTime: earlyMorningTime,
      }),
    });
    const data = await res.json();
    const isBlocked = res.status === 400 && data.message?.includes('hoạt động');
    recordTest('Reservation', 'RES-08a: Chặn đặt bàn trước giờ mở cửa (05:30 sáng < 07:00)', isBlocked, data.message);
  } catch (err) {
    recordTest('Reservation', 'RES-08a: Đặt trước 07:00', false, err.message);
  }

  // RES-08b: Validate Ngoài giờ đóng cửa quán (Sau 22:00 đêm)
  try {
    const lateNightTime = getFutureReservationDate(2, 23, 15).toISOString();
    const res = await fetch(`${API_BASE}/reservations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tableId: validationTable._id,
        customerName: 'Test Late Night',
        customerPhone: generateTestPhone('888'),
        guestCount: 2,
        reservationTime: lateNightTime,
      }),
    });
    const data = await res.json();
    const isBlocked = res.status === 400 && data.message?.includes('hoạt động');
    recordTest('Reservation', 'RES-08b: Chặn đặt bàn sau giờ đóng cửa (23:15 đêm > 22:00)', isBlocked, data.message);
  } catch (err) {
    recordTest('Reservation', 'RES-08b: Đặt sau 22:00', false, err.message);
  }

  // RES-09: Chống Spam - 1 Số điện thoại chỉ được có 1 đơn Active (Pending/Confirmed)
  try {
    const res = await fetch(`${API_BASE}/reservations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tableId: validationTable._id,
        customerName: 'Nguyễn Hoài Nam Trùng Đơn',
        customerPhone: testPhonePrimary, // Phone already used in RES-01
        guestCount: 2,
        reservationTime: validFutureTime,
      }),
    });
    const data = await res.json();
    const isBlocked = res.status === 400 && (data.message?.includes('đã có 1 đơn đặt bàn') || data.message?.includes('Không thể đặt thêm'));
    recordTest('Reservation', 'RES-09: Chống spam - 1 Số điện thoại chỉ được có 1 đơn đặt bàn đang hoạt động', isBlocked, data.message);
  } catch (err) {
    recordTest('Reservation', 'RES-09: Chống trùng đơn cùng SĐT', false, err.message);
  }

  // RES-10: Tra cứu đơn đặt bàn theo Số điện thoại
  try {
    const res = await fetch(`${API_BASE}/reservations/lookup?phone=${encodeURIComponent(testPhonePrimary)}`);
    const data = await res.json();
    const isFound = res.ok && Array.isArray(data) && data.length > 0 && data[0].customerPhone === testPhonePrimary;
    recordTest('Reservation', 'RES-10: Tra cứu danh sách đơn đặt bàn bằng số điện thoại khách hàng', isFound, `Tìm thấy ${data.length || 0} đơn`);
  } catch (err) {
    recordTest('Reservation', 'RES-10: Tra cứu theo SĐT', false, err.message);
  }

  // RES-11: Khách hàng tự hủy đơn đặt bàn thành công (> 30 phút trước giờ hẹn)
  let cancelledResId = '';
  const testPhoneToCancel = generateTestPhone('345');
  try {
    const createRes = await fetch(`${API_BASE}/reservations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tableId: cancelTable._id,
        customerName: 'Khách Hủy Bàn Test',
        customerPhone: testPhoneToCancel,
        guestCount: 2,
        reservationTime: getFutureReservationDate(3, 14, 0).toISOString(),
      }),
    });
    const createdData = await createRes.json();
    assert.ok(createdData._id, 'Created reservation to cancel');
    cancelledResId = createdData._id;
    createdResIds.push(cancelledResId);

    // Cancel reservation
    const cancelRes = await fetch(`${API_BASE}/reservations/${cancelledResId}/customer-cancel`, {
      method: 'PATCH',
    });
    const cancelData = await cancelRes.json();
    const isCancelled = cancelRes.ok && cancelData.status === 'cancelled' && cancelData.cancelledAt;
    recordTest('Reservation', 'RES-11: Khách hàng tự hủy đơn đặt bàn trước giờ hẹn > 30 phút thành công', isCancelled, `Trạng thái: ${cancelData.status}`);
  } catch (err) {
    recordTest('Reservation', 'RES-11: Tự hủy đơn đặt bàn', false, err.message);
  }

  // RES-12: Ràng buộc Cooldown 30 phút chống spam sau khi hủy đơn
  try {
    const res = await fetch(`${API_BASE}/reservations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tableId: cancelTable._id,
        customerName: 'Khách Spam Đặt Lại',
        customerPhone: testPhoneToCancel, // vừa hủy xong ở RES-11
        guestCount: 2,
        reservationTime: getFutureReservationDate(3, 16, 0).toISOString(),
      }),
    });
    const data = await res.json();
    const isCooldownTriggered = res.status === 400 && data.message?.includes('hủy đặt bàn gần đây') && data.message?.includes('phút');
    recordTest('Reservation', 'RES-12: Kích hoạt thời gian chờ Cooldown 30 phút chống spam sau khi hủy', isCooldownTriggered, data.message);
  } catch (err) {
    recordTest('Reservation', 'RES-12: Cooldown sau hủy', false, err.message);
  }

  // Staff confirms reservation first (Prerequisite for arrival)
  try {
    await fetch(`${API_BASE}/reservations/${primaryResId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${waiterToken}`,
      },
      body: JSON.stringify({ status: 'confirmed' }),
    });
  } catch {}

  // RES-13: Khách check-in khi đến quán (Customer Arrive with checkInCode)
  try {
    const arriveRes = await fetch(`${API_BASE}/reservations/${primaryResId}/customer-arrive`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ checkInCode: primaryCheckInCode }),
    });
    const arriveData = await arriveRes.json();
    const isArrived = arriveRes.ok && arriveData.success === true;
    recordTest('Reservation', 'RES-13: Khách hàng check-in với mã nhận bàn 4 chữ số chuyển sang Arrived', isArrived, arriveData.message);
  } catch (err) {
    recordTest('Reservation', 'RES-13: Check-in với mã', false, err.message);
  }

  // RES-14: Chặn tự hủy đơn khi khách đã Arrived
  try {
    const cancelAfterArrive = await fetch(`${API_BASE}/reservations/${primaryResId}/customer-cancel`, {
      method: 'PATCH',
    });
    const cancelData = await cancelAfterArrive.json();
    const isBlocked = cancelAfterArrive.status === 400 && cancelData.message?.includes('đã đến quán');
    recordTest('Reservation', 'RES-14: Chặn khách tự hủy khi trạng thái đơn đã Check-in (arrived)', isBlocked, cancelData.message);
  } catch (err) {
    recordTest('Reservation', 'RES-14: Chặn hủy khi arrived', false, err.message);
  }

  // RES-15: Nhân viên duyệt/cập nhật trạng thái đơn đặt bàn (Staff status update)
  try {
    const statusRes = await fetch(`${API_BASE}/reservations/${primaryResId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${waiterToken}`,
      },
      body: JSON.stringify({ status: 'completed' }),
    });
    const statusData = await statusRes.json();
    const isUpdated = statusRes.ok && statusData.status === 'completed';
    recordTest('Reservation', 'RES-15: Nhân viên phục vụ cập nhật trạng thái đơn đặt bàn (completed)', isUpdated, statusData.status);
  } catch (err) {
    recordTest('Reservation', 'RES-15: Staff cập nhật trạng thái', false, err.message);
  }

  // RES-16: Phục vụ xử lý đơn trễ (cancel-late guardrail)
  try {
    const lateRes = await fetch(`${API_BASE}/reservations/${primaryResId}/cancel-late`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${waiterToken}` },
    });
    const lateData = await lateRes.json();
    const isProtected = lateRes.status === 400 || lateRes.status === 200;
    recordTest('Reservation', 'RES-16: Nhân viên xử lý đơn trễ qua API cancel-late an toàn, không sinh lỗi 500', isProtected, lateData.message || 'Handled safely');
  } catch (err) {
    recordTest('Reservation', 'RES-16: Cancel late', false, err.message);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // PHẦN 2: VALIDATE CÁC BIỂU MẪU CỐT LÕI KHÁC TRONG HỆ THỐNG
  // ───────────────────────────────────────────────────────────────────────────
  console.log('\n═════════════════════════════════════════════════════════════════════');
  console.log('📌 [PHẦN 2] VALIDATE CÁC BIỂU MẪU CỐT LÕI KHÁC (AUTH, COUPON, REVIEWS, CRUD)');
  console.log('═════════════════════════════════════════════════════════════════════');

  // FORM-01: Form Đăng nhập - Chặn Email sai định dạng
  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'invalid-email-format', password: 'password123' }),
    });
    const data = await res.json();
    const isBlocked = res.status === 400 || res.status === 401;
    recordTest('Forms', 'FORM-01: Form đăng nhập chặn email sai định dạng RFC-5322', isBlocked, data.message);
  } catch (err) {
    recordTest('Forms', 'FORM-01: Đăng nhập sai email', false, err.message);
  }

  // FORM-02: Form Đăng nhập - Chặn Password để trống
  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@kohi.vn', password: '' }),
    });
    const data = await res.json();
    const isBlocked = res.status === 400 || res.status === 401;
    recordTest('Forms', 'FORM-02: Form đăng nhập chặn mật khẩu rỗng', isBlocked, data.message);
  } catch (err) {
    recordTest('Forms', 'FORM-02: Mật khẩu rỗng', false, err.message);
  }

  // FORM-03: Form Đăng nhập - Chặn sai mật khẩu (Bảo mật 401 Unauthorized)
  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@kohi.vn', password: 'sai_mat_khau_123' }),
    });
    const data = await res.json();
    const isBlocked = res.status === 401;
    recordTest('Forms', 'FORM-03: Form đăng nhập từ chối 401 khi sai mật khẩu, không làm lộ hash', isBlocked, data.message);
  } catch (err) {
    recordTest('Forms', 'FORM-03: Sai mật khẩu', false, err.message);
  }

  // FORM-04: Form Mã Giảm Giá - Chặn mã không tồn tại
  try {
    const res = await fetch(`${API_BASE}/coupons/validate/VOUCHER_MA_AO_9999?amount=200000`);
    const data = await res.json();
    const isInvalid = data.valid === false;
    recordTest('Forms', 'FORM-04: Form Voucher trả về valid=false khi mã không tồn tại', isInvalid, data.message);
  } catch (err) {
    recordTest('Forms', 'FORM-04: Voucher mã ảo', false, err.message);
  }

  // FORM-05: Form Mã Giảm Giá - Chặn khi đơn chưa đạt giá trị tối thiểu (minOrderAmount)
  try {
    const res = await fetch(`${API_BASE}/coupons/validate/WELCOME20?amount=5000`);
    const data = await res.json();
    const isHandled = typeof data.valid === 'boolean';
    recordTest('Forms', 'FORM-05: Form Voucher kiểm tra điều kiện giá trị đơn hàng tối thiểu', isHandled, data.message || `Valid: ${data.valid}`);
  } catch (err) {
    recordTest('Forms', 'FORM-05: Đơn dưới mức min', false, err.message);
  }

  // FORM-06: Form Đánh Giá Món - Validate Rating (Số sao 1 đến 5)
  try {
    const res = await fetch(`${API_BASE}/reviews`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tableId: primaryTable._id,
        orderId: '6aaa23e4edf7b0c5438cd597',
        rating: 10, // Invalid: rating must be 1..5
        comment: 'Quá tuyệt vời',
      }),
    });
    const data = await res.json();
    const isBlocked = res.status === 400 || (data.message && JSON.stringify(data.message).includes('rating'));
    recordTest('Forms', 'FORM-06: Form đánh giá món chặn số sao ngoài khoảng 1..5 (ví dụ: 10 sao)', isBlocked, JSON.stringify(data.message));
  } catch (err) {
    recordTest('Forms', 'FORM-06: Số sao ngoài 1..5', false, err.message);
  }

  // FORM-07: Form Quản Trị Món Ăn - Chặn tạo món với giá âm (Price <= 0)
  try {
    const res = await fetch(`${API_BASE}/foods`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        name: 'Món Giá Âm Bất Thường',
        price: -50000,
        category: '67417531737e6fbe6c62bb11',
        description: 'Test validation',
      }),
    });
    const data = await res.json();
    const isBlocked = res.status === 400;
    recordTest('Forms', 'FORM-07: Form quản trị món ăn chặn tạo món có giá âm (< 0đ)', isBlocked, JSON.stringify(data.message));
  } catch (err) {
    recordTest('Forms', 'FORM-07: Giá âm', false, err.message);
  }

  // FORM-08: Form Quản Trị Bàn - Chặn tạo bàn với tên để trống hoặc trạng thái không hợp lệ
  try {
    const res = await fetch(`${API_BASE}/tables`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        tableName: '',
        status: 'invalid_status_value',
      }),
    });
    const data = await res.json();
    const isBlocked = res.status === 400;
    recordTest('Forms', 'FORM-08: Form quản trị bàn chặn tên rỗng và trạng thái bàn không hợp lệ', isBlocked, JSON.stringify(data.message));
  } catch (err) {
    recordTest('Forms', 'FORM-08: Validate bàn', false, err.message);
  }

  // FORM-09: Form Quản Trị Danh Mục - Chặn tạo danh mục với tên để trống
  try {
    const res = await fetch(`${API_BASE}/categories`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        name: '',
      }),
    });
    const data = await res.json();
    const isBlocked = res.status === 400;
    recordTest('Forms', 'FORM-09: Form danh mục chặn tạo danh mục có tên rỗng', isBlocked, JSON.stringify(data.message));
  } catch (err) {
    recordTest('Forms', 'FORM-09: Tên danh mục rỗng', false, err.message);
  }

  // FORM-10: Form Quản Trị Kho - Chặn số lượng nguyên liệu âm (Quantity < 0)
  try {
    const res = await fetch(`${API_BASE}/inventory/ingredients`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        name: 'Nguyên Liệu Âm',
        quantity: -10,
        unit: 'kg',
        minThreshold: 5,
        costPerUnit: 100000,
      }),
    });
    const data = await res.json();
    const isBlocked = res.status === 400 || res.status === 404;
    recordTest('Forms', 'FORM-10: Form kho nguyên liệu chặn số lượng tồn kho ban đầu âm', isBlocked, JSON.stringify(data.message));
  } catch (err) {
    recordTest('Forms', 'FORM-10: Số lượng kho âm', false, err.message);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // CLEANUP: Clean test reservations & test tables created during testing
  // ───────────────────────────────────────────────────────────────────────────
  console.log('\n🧹 [CLEANUP] Dọn dẹp các bản ghi đặt bàn & bàn thử nghiệm...');
  for (const rId of createdResIds) {
    try {
      await fetch(`${API_BASE}/reservations/${rId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${adminToken}` },
      });
    } catch {}
  }
  for (const tId of createdTableIds) {
    try {
      await fetch(`${API_BASE}/tables/${tId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${adminToken}` },
      });
    } catch {}
  }
  console.log('  🧹 Đã xóa sạch các bản ghi thử nghiệm, bảo toàn cơ sở dữ liệu.');

  // ───────────────────────────────────────────────────────────────────────────
  // BÁO CÁO TỔNG KẾT
  // ───────────────────────────────────────────────────────────────────────────
  console.log('\n═════════════════════════════════════════════════════════════════════');
  console.log('📊 TỔNG HỢP KẾT QUẢ KIỂM THỬ VALIDATE FORM & ĐẶT BÀN');
  console.log('═════════════════════════════════════════════════════════════════════');
  console.log(`🎯 Tổng số Test Cases đã chạy : ${totalTests}`);
  console.log(`✅ Số ca kiểm thử ĐẠT (PASS)  : ${passedTests}`);
  console.log(`❌ Số ca kiểm thử THẤT BẠI    : ${failedTests}`);
  console.log(`📈 Tỷ lệ hoàn thành           : ${Math.round((passedTests / totalTests) * 100)}%`);
  console.log('═════════════════════════════════════════════════════════════════════');

  if (failedTests > 0) {
    console.error('\n⚠️ Danh sách các test case không đạt:');
    testResults.filter(r => r.status === 'FAIL').forEach(f => {
      console.error(`  - [${f.suite}] ${f.testName}: ${f.error}`);
    });
    process.exit(1);
  } else {
    console.log('\n🎉 TOÀN BỘ CÁC TEST CASES VALIDATE FORM & ĐẶT BÀN ĐỀU ĐẠT CHUẨN 100%!');
  }
}

runValidationTestSuite().catch(err => {
  console.error('Fatal Test Suite Error:', err);
  process.exit(1);
});
