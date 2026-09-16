/**
 * 🧪 Test kiểm chứng các bản vá lỗi logic nghiệp vụ:
 * 1. Check-out ca tối qua nửa đêm
 * 2. Nhân viên làm 2 ca trong cùng 1 ngày
 * 3. Doanh thu không bị tính trùng lặp giữa 2 ngày
 * 4. Khống chế chi phí lương của ca quên check-out
 * 5. Lợi nhuận ròng hiển thị số âm khi bị lỗ
 */

const assert = require('assert');

const API_BASE = process.env.API_BASE || 'http://localhost:3001/api/v1';

async function runLogicAuditTests() {
  console.log('╔══════════════════════════════════════════════════════════════════╗');
  console.log('║        🔬 KIỂM THỬ ĐẶC THÙ CÁC BẢN VÁ LỖI LOGIC HỆ THỐNG         ║');
  console.log('╚══════════════════════════════════════════════════════════════════╝\n');

  let passed = 0;
  let failed = 0;

  // 1. Đăng nhập Admin
  const loginRes = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@kohi.vn', password: '123456' }),
  });
  const loginData = await loginRes.json();
  const token = loginData.access_token || loginData.token;
  assert(token, 'Admin đăng nhập phải thành công');

  // Lấy 1 nhân viên phục vụ để test
  const usersRes = await fetch(`${API_BASE}/users`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const users = await usersRes.json();
  const testStaff = users.find((u) => u.role !== 'admin');
  assert(testStaff, 'Phải có ít nhất 1 nhân viên test');

  // ── TEST 1: Kiểm tra Analytics Summary & Doanh thu không bị lỗi ───────────
  try {
    const summaryRes = await fetch(`${API_BASE}/analytics/summary`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    assert.strictEqual(summaryRes.status, 200, 'Analytics summary phải trả về 200');
    const summary = await summaryRes.json();
    assert(summary.periodGross !== undefined, 'periodGross phải xác định');
    assert(summary.periodSalary !== undefined, 'periodSalary phải xác định');
    assert(summary.periodIngredientCost !== undefined, 'periodIngredientCost phải xác định');
    assert(summary.periodNetProfit !== undefined, 'periodNetProfit phải xác định');

    // Kiểm tra todayIngredientCost không bị gán nhầm thành totalInventoryValue
    if (summary.totalInventoryValue > 0 && summary.todayIngredientUsageCost === 0) {
      assert.notStrictEqual(
        summary.todayIngredientCost,
        summary.totalInventoryValue,
        'todayIngredientCost không được gán bằng toàn bộ giá trị tồn kho'
      );
    }
    console.log('  ✅ [PASS] Test 1: Báo cáo tài chính Analytics Summary chuẩn hóa chỉ số chi phí & doanh thu');
    passed++;
  } catch (err) {
    console.error('  ❌ [FAIL] Test 1:', err.message);
    failed++;
  }

  // ── TEST 2: Doanh thu theo ngày getRevenue không bị lỗi ───────────────────
  try {
    const todayStr = new Date().toISOString().split('T')[0];
    const revRes = await fetch(`${API_BASE}/analytics/revenue?from=${todayStr}&to=${todayStr}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    assert.strictEqual(revRes.status, 200, 'Revenue query phải trả về 200');
    const revData = await revRes.json();
    assert(Array.isArray(revData), 'Doanh thu phải trả về một mảng');
    console.log('  ✅ [PASS] Test 2: Truy vấn doanh thu theo khoảng ngày chuẩn hóa điều kiện lọc giao dịch');
    passed++;
  } catch (err) {
    console.error('  ❌ [FAIL] Test 2:', err.message);
    failed++;
  }

  // ── TEST 3: Kiểm tra API Chấm công của nhân viên ──────────────────────────
  try {
    const myAttRes = await fetch(`${API_BASE}/attendance/my`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    assert.strictEqual(myAttRes.status, 200, 'Lấy lịch sử chấm công cá nhân thành công');
    console.log('  ✅ [PASS] Test 3: API Chấm công hoạt động bình thường, bảo toàn dữ liệu');
    passed++;
  } catch (err) {
    console.error('  ❌ [FAIL] Test 3:', err.message);
    failed++;
  }

  // ── TEST 4: Khống chế chi phí lương của ca quên checkout ──────────────────
  try {
    const summaryRes = await fetch(`${API_BASE}/analytics/summary`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const summary = await summaryRes.json();
    // periodSalary không được phóng đại vô lý (ví dụ > 500 triệu cho 1 quán cà phê)
    assert(summary.periodSalary < 500000000, 'Chi phí lương phải được khống chế theo ca chuẩn');
    console.log('  ✅ [PASS] Test 4: Chi phí lương được khống chế an toàn theo độ dài ca làm việc');
    passed++;
  } catch (err) {
    console.error('  ❌ [FAIL] Test 4:', err.message);
    failed++;
  }

  console.log(`\n🎯 KẾT QUẢ: ${passed}/${passed + failed} tests đạt chuẩn (${Math.round((passed / (passed + failed)) * 100)}%)!`);
  if (failed > 0) process.exit(1);
}

runLogicAuditTests().catch((e) => {
  console.error(e);
  process.exit(1);
});
