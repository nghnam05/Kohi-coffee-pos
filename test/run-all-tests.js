/**
 * MASTER QA TEST RUNNER — KOHI COFFEE POS SYSTEM
 * Comprehensive Multi-Persona Test Execution Engine
 * Dựa trên đặc tả nghiệp vụ tại reports.md
 */

const { runCustomerTests } = require('./customer-flow.test.js');
const { runWaiterTests } = require('./waiter-flow.test.js');
const { runBaristaTests } = require('./barista-kds-flow.test.js');
const { runAdminTests } = require('./admin-flow.test.js');

async function main() {
  console.log('╔══════════════════════════════════════════════════════════════════╗');
  console.log('║        🚀 KOHI COFFEE POS — MASTER QA AUDIT & TEST RUNNER        ║');
  console.log('║     Role-Based Verification based on reports.md Specifications   ║');
  console.log('╚══════════════════════════════════════════════════════════════════╝\n');

  const startTime = Date.now();
  const results = [];

  try {
    // 1. Suite 1: Customer
    const r1 = await runCustomerTests();
    results.push({ name: 'Persona 1: Khách hàng (Customer Flow)', ...r1, status: 'PASSED' });
  } catch (err) {
    results.push({ name: 'Persona 1: Khách hàng (Customer Flow)', passed: 0, total: 8, status: 'FAILED', error: err.message });
  }

  try {
    // 2. Suite 2: Waiter
    const r2 = await runWaiterTests();
    results.push({ name: 'Persona 2: Nhân viên Phục vụ (Waiter Flow)', ...r2, status: 'PASSED' });
  } catch (err) {
    results.push({ name: 'Persona 2: Nhân viên Phục vụ (Waiter Flow)', passed: 0, total: 9, status: 'FAILED', error: err.message });
  }

  try {
    // 3. Suite 3: Barista
    const r3 = await runBaristaTests();
    results.push({ name: 'Persona 3: Nhân viên Pha chế (Barista KDS)', ...r3, status: 'PASSED' });
  } catch (err) {
    results.push({ name: 'Persona 3: Nhân viên Pha chế (Barista KDS)', passed: 0, total: 7, status: 'FAILED', error: err.message });
  }

  try {
    // 4. Suite 4: Admin
    const r4 = await runAdminTests();
    results.push({ name: 'Persona 4: Quản trị viên (Admin Master)', ...r4, status: 'PASSED' });
  } catch (err) {
    results.push({ name: 'Persona 4: Quản trị viên (Admin Master)', passed: 0, total: 8, status: 'FAILED', error: err.message });
  }

  const durationSec = ((Date.now() - startTime) / 1000).toFixed(2);
  const totalPassed = results.reduce((sum, r) => sum + r.passed, 0);
  const totalTests = results.reduce((sum, r) => sum + r.total, 0);
  const allPassed = results.every(r => r.status === 'PASSED');

  console.log('\n╔══════════════════════════════════════════════════════════════════╗');
  console.log('║               📊 BÁO CÁO TỔNG KẾT KIỂM THỬ (QA REPORT)           ║');
  console.log('╚══════════════════════════════════════════════════════════════════╝');
  console.table(results.map(r => ({
    'Bộ Kiểm Thử': r.name,
    'Số Test Đạt': `${r.passed}/${r.total}`,
    'Tỷ lệ': `${Math.round((r.passed / r.total) * 100)}%`,
    'Trạng thái': r.status === 'PASSED' ? '✅ THÀNH CÔNG' : '❌ THẤT BẠI',
  })));

  console.log(`⏱️ Thời gian thực thi: ${durationSec} giây`);
  console.log(`🎯 Tổng điểm kiểm thử: ${totalPassed}/${totalTests} Test Cases (${Math.round((totalPassed / totalTests) * 100)}%)`);

  if (allPassed) {
    console.log('\n🏆 TẤT CẢ 4 BỘ TEST CASE THEO TỪNG VAI TRÒ ĐÃ ĐẠT CHUẨN 100% — ZERO BUGS!');
    process.exit(0);
  } else {
    console.error('\n⚠️ PHÁT HIỆN TEST CASE THẤT BẠI TRONG QUÁ TRÌNH KIỂM THỬ!');
    process.exit(1);
  }
}

main();
