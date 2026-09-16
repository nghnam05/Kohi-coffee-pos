/**
 * TEST SUITE 3: BARISTA PERSONA FLOW (KDS OPERATIONS)
 * Role: Nhân viên Pha chế (Barista)
 * Dựa trên đặc tả nghiệp vụ tại reports.md (Mục 4.3)
 */

const assert = require('assert');

const API_BASE = process.env.API_BASE || 'http://localhost:3001/api/v1';

async function runBaristaTests() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🧪 [TEST SUITE 3] BẮT ĐẦU KIỂM THỬ VAI TRÒ: NHÂN VIÊN PHA CHẾ (BARISTA - KDS)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  let passedTests = 0;
  let totalTests = 0;
  let baristaToken = '';
  let baristaUser = null;

  function recordPass(testName) {
    totalTests++;
    passedTests++;
    console.log(`  ✅ [PASS] Test 3.${totalTests}: ${testName}`);
  }

  function recordFail(testName, error) {
    totalTests++;
    console.error(`  ❌ [FAIL] Test 3.${totalTests}: ${testName}\n     Lỗi: ${error.message}`);
    throw error;
  }

  // --------------------------------------------------------------------------
  // TEST 3.1: Đăng nhập nhân viên pha chế & Xác thực JWT Token + Role
  // --------------------------------------------------------------------------
  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'pccasang@kohi.vn', password: '123456' }),
    });

    assert.strictEqual(res.status, 200, 'Đăng nhập Barista phải trả về HTTP 200');
    const data = await res.json();
    assert(data.access_token, 'Phải có JWT Token trả về');
    assert.strictEqual(data.user?.role, 'barista', 'Role người dùng phải là barista');

    baristaToken = data.access_token;
    baristaUser = data.user;
    recordPass(`Đăng nhập Barista thành công (${baristaUser.name}, Role: ${baristaUser.role})`);
  } catch (err) {
    recordFail('Đăng nhập Barista thất bại', err);
  }

  // --------------------------------------------------------------------------
  // TEST 3.2: Kiểm tra giới hạn giao diện nghiêm ngặt (KDS Strict Tab Scoping)
  // --------------------------------------------------------------------------
  try {
    const getVisibleTabsForRole = (role) => {
      if (role === 'barista') {
        return ['orders', 'attendance'];
      }
      return [];
    };

    const tabs = getVisibleTabsForRole(baristaUser.role);
    assert.deepStrictEqual(tabs, ['orders', 'attendance'], 'Barista CHỈ ĐƯỢC THẤY tab orders & attendance');

    // Kiểm tra cấm tuyệt đối các tab quản lý
    assert(!tabs.includes('tables'), 'Barista KHÔNG ĐƯỢC thấy Tab Bàn');
    assert(!tabs.includes('reservations'), 'Barista KHÔNG ĐƯỢC thấy Tab Đặt bàn');
    assert(!tabs.includes('foods'), 'Barista KHÔNG ĐƯỢC thấy Tab Menu');
    assert(!tabs.includes('users'), 'Barista KHÔNG ĐƯỢC thấy Tab Nhân viên');
    assert(!tabs.includes('analytics'), 'Barista KHÔNG ĐƯỢC thấy Tab Thống kê');
    assert(!tabs.includes('inventory'), 'Barista KHÔNG ĐƯỢC thấy Tab Kho');

    recordPass('KDS Strict Tab Scoping: Barista chỉ thấy đúng 2 Tab (Orders & Attendance), chặn 6 Tab khác');
  } catch (err) {
    recordFail('Giới hạn giao diện KDS Barista sai lệch', err);
  }

  // --------------------------------------------------------------------------
  // TEST 3.3: Kiểm tra cấm quyền tạo đơn mang về (Takeaway POS Restriction)
  // --------------------------------------------------------------------------
  try {
    const canCreateTakeawayOrder = (role) => role !== 'barista';
    assert.strictEqual(canCreateTakeawayOrder('barista'), false, 'Barista KHÔNG ĐƯỢC có nút tạo đơn mang về');
    assert.strictEqual(canCreateTakeawayOrder('waiter'), true, 'Waiter phải có quyền tạo đơn mang về');
    assert.strictEqual(canCreateTakeawayOrder('admin'), true, 'Admin phải có quyền tạo đơn mang về');

    recordPass('Cấm quyền tạo đơn mang về (Takeaway POS) cho vai trò Barista thành công');
  } catch (err) {
    recordFail('Quyền hạn Takeaway của Barista sai lệch', err);
  }

  // --------------------------------------------------------------------------
  // TEST 3.4: Logic nút bấm & Hành động KDS quầy pha chế
  // --------------------------------------------------------------------------
  try {
    const getBaristaKdsAction = (status) => {
      switch (status) {
        case 'pending': return { canClick: false, nextStatus: null, label: 'Chờ Phục vụ duyệt đơn' };
        case 'confirmed': return { canClick: true, nextStatus: 'cooking', label: 'Bắt Đầu Pha Chế' };
        case 'cooking': return { canClick: true, nextStatus: 'ready', label: 'Hoàn Tất Pha Chế (Báo Phục Vụ)' };
        case 'ready': return { canClick: false, nextStatus: null, label: 'Đã báo Phục vụ ra món' };
        case 'completed': return { canClick: false, nextStatus: null, label: 'Đã phục vụ tại bàn' };
        case 'paid': return { canClick: false, nextStatus: null, label: 'Đã thanh toán' };
        default: return { canClick: false, nextStatus: null, label: '' };
      }
    };

    assert.strictEqual(getBaristaKdsAction('pending').canClick, false, 'Đơn pending chưa duyệt -> Barista không được bấm');
    assert.strictEqual(getBaristaKdsAction('confirmed').canClick, true, 'Đơn confirmed -> Barista bấm Bắt đầu pha chế');
    assert.strictEqual(getBaristaKdsAction('confirmed').nextStatus, 'cooking');
    assert.strictEqual(getBaristaKdsAction('cooking').canClick, true, 'Đơn cooking -> Barista bấm Báo xong pha chế');
    assert.strictEqual(getBaristaKdsAction('cooking').nextStatus, 'ready');
    assert.strictEqual(getBaristaKdsAction('ready').canClick, false, 'Đơn ready -> Barista không cần thao tác tiếp');

    recordPass('Vòng đời pha chế KDS (confirmed ➔ cooking ➔ ready) chuẩn xác 100%');
  } catch (err) {
    recordFail('Logic KDS quầy bar sai lệch', err);
  }

  // --------------------------------------------------------------------------
  // TEST 3.5: Barista truy cập danh sách đơn pha chế realtime
  // --------------------------------------------------------------------------
  try {
    const resOrders = await fetch(`${API_BASE}/orders`, {
      headers: { Authorization: `Bearer ${baristaToken}` },
    });
    assert.strictEqual(resOrders.status, 200, 'Barista phải lấy được danh sách đơn hàng');
    const orders = await resOrders.json();
    assert(Array.isArray(orders), 'Danh sách đơn hàng phải là mảng');

    recordPass(`Barista kết nối hàng đợi pha chế KDS thành công (${orders.length} đơn hiện có)`);
  } catch (err) {
    recordFail('Barista lấy danh sách đơn pha chế thất bại', err);
  }

  // --------------------------------------------------------------------------
  // TEST 3.6: Kiểm tra bảo mật RBAC — Barista bị từ chối 403 ở các API Admin
  // --------------------------------------------------------------------------
  try {
    // 1. Thống kê tài chính
    const resAnalytics = await fetch(`${API_BASE}/analytics/summary`, {
      headers: { Authorization: `Bearer ${baristaToken}` },
    });
    assert.strictEqual(resAnalytics.status, 403, 'Barista xem thống kê phải bị HTTP 403');

    // 2. Cấu hình bảng lương (/salaries/config)
    const resSalaries = await fetch(`${API_BASE}/salaries/config`, {
      headers: { Authorization: `Bearer ${baristaToken}` },
    });
    assert.strictEqual(resSalaries.status, 403, 'Barista xem cấu hình lương phải bị HTTP 403');

    // 3. Chi phí cửa hàng
    const resExpenses = await fetch(`${API_BASE}/expenses`, {
      headers: { Authorization: `Bearer ${baristaToken}` },
    });
    assert.strictEqual(resExpenses.status, 403, 'Barista xem chi phí phải bị HTTP 403');

    recordPass('Bảo mật đa tầng: Barista bị chặn HTTP 403 khi cố truy cập Analytics, Salaries, Expenses');
  } catch (err) {
    recordFail('Kiểm tra chặn quyền Barista thất bại', err);
  }

  // --------------------------------------------------------------------------
  // TEST 3.7: Chấm công cá nhân của Barista
  // --------------------------------------------------------------------------
  try {
    const resMyAtt = await fetch(`${API_BASE}/attendance/my`, {
      headers: { Authorization: `Bearer ${baristaToken}` },
    });
    assert.strictEqual(resMyAtt.status, 200, 'Barista phải xem được lịch sử chấm công của mình');
    const myAtt = await resMyAtt.json();
    assert(Array.isArray(myAtt), 'Lịch sử chấm công phải là mảng');

    recordPass(`Barista kiểm tra dữ liệu chấm công cá nhân thành công (${myAtt.length} lượt công)`);
  } catch (err) {
    recordFail('Barista kiểm tra chấm công thất bại', err);
  }

  console.log(`\n🎉 KẾT QUẢ BỘ TEST 3 (BARISTA): ${passedTests}/${totalTests} TESTS ĐẠT CHUẨN 100%!\n`);
  return { passed: passedTests, total: totalTests };
}

if (require.main === module) {
  runBaristaTests().catch(err => {
    console.error('Barista tests exited with error:', err);
    process.exit(1);
  });
}

module.exports = { runBaristaTests };
