/**
 * TEST SUITE 4: ADMIN PERSONA FLOW
 * Role: Quản trị viên (Admin / Chủ quán)
 * Dựa trên đặc tả nghiệp vụ tại reports.md (Mục 4.4)
 */

const assert = require('assert');

const API_BASE = process.env.API_BASE || 'http://localhost:3001/api/v1';

async function runAdminTests() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🧪 [TEST SUITE 4] BẮT ĐẦU KIỂM THỬ VAI TRÒ: QUẢN TRỊ VIÊN (ADMIN)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  let passedTests = 0;
  let totalTests = 0;
  let adminToken = '';
  let adminUser = null;

  function recordPass(testName) {
    totalTests++;
    passedTests++;
    console.log(`  ✅ [PASS] Test 4.${totalTests}: ${testName}`);
  }

  function recordFail(testName, error) {
    totalTests++;
    console.error(`  ❌ [FAIL] Test 4.${totalTests}: ${testName}\n     Lỗi: ${error.message}`);
    throw error;
  }

  // --------------------------------------------------------------------------
  // TEST 4.1: Đăng nhập Quản trị viên & Xác thực Toàn quyền Hệ thống
  // --------------------------------------------------------------------------
  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@kohi.vn', password: '123456' }),
    });

    assert.strictEqual(res.status, 200, 'Đăng nhập Admin phải trả về HTTP 200');
    const data = await res.json();
    assert(data.access_token, 'Phải có JWT Token trả về');
    assert.strictEqual(data.user?.role, 'admin', 'Role người dùng phải là admin');

    adminToken = data.access_token;
    adminUser = data.user;
    recordPass(`Đăng nhập Admin thành công (${adminUser.name}, Toàn quyền quản trị)`);
  } catch (err) {
    recordFail('Đăng nhập Admin thất bại', err);
  }

  // --------------------------------------------------------------------------
  // TEST 4.2: Quản lý Thực đơn & Chuẩn hóa Ảnh Cloudinary URL (Food CRUD)
  // --------------------------------------------------------------------------
  let createdFoodId = null;
  try {
    const cloudinaryImageUrl = 'https://res.cloudinary.com/dp1uvjzpc/image/upload/v1789465051/n28sjc1uzv3icf91ajmo.png';

    // Tạo món mới với ảnh Cloudinary chuẩn URL (tuân thủ CreateFoodDto whitelist)
    const newFoodPayload = {
      name: 'Matcha Latte Thượng Hạng (Test QA)',
      price: 55000,
      image: cloudinaryImageUrl,
      category: 'Trà Trái Cây',
      description: 'Matcha Uji Nhật Bản kết hợp bọt sữa tươi thanh mát.',
      isAvailable: true,
    };

    const resCreate = await fetch(`${API_BASE}/foods`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify(newFoodPayload),
    });

    assert([200, 201].includes(resCreate.status), `Admin tạo món mới phải thành công (Status: ${resCreate.status})`);
    const createdFood = await resCreate.json();
    assert(createdFood._id, 'Món mới tạo phải có ID');
    assert.strictEqual(createdFood.name, newFoodPayload.name);
    assert(createdFood.image.startsWith('https://res.cloudinary.com/'), 'Ảnh món PHẢI là link Cloudinary URL');
    assert(!createdFood.image.startsWith('data:image'), 'Ảnh món TUYỆT ĐỐI KHÔNG ĐƯỢC là Base64');

    createdFoodId = createdFood._id;

    // Cập nhật giá và trạng thái món
    const resUpdate = await fetch(`${API_BASE}/foods/${createdFoodId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ price: 60000, isAvailable: false }),
    });
    assert([200, 204].includes(resUpdate.status), 'Cập nhật món phải thành công');

    recordPass(`Tạo và cập nhật món ăn với ảnh Cloudinary chuẩn URL thành công (ID: ${createdFoodId.slice(-6).toUpperCase()})`);
  } catch (err) {
    recordFail('Quản lý món ăn với Cloudinary URL thất bại', err);
  }

  // --------------------------------------------------------------------------
  // TEST 4.3: Xóa món ăn vừa test khỏi thực đơn
  // --------------------------------------------------------------------------
  try {
    if (createdFoodId) {
      const resDelete = await fetch(`${API_BASE}/foods/${createdFoodId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      assert([200, 204].includes(resDelete.status), 'Xóa món phải thành công');
      recordPass(`Xóa món mẫu test khỏi thực đơn an toàn (ID: ${createdFoodId.slice(-6).toUpperCase()})`);
    }
  } catch (err) {
    recordFail('Xóa món thất bại', err);
  }

  // --------------------------------------------------------------------------
  // TEST 4.4: Quản lý Danh mục món (Categories Management)
  // --------------------------------------------------------------------------
  try {
    const resCats = await fetch(`${API_BASE}/categories`);
    assert.strictEqual(resCats.status, 200);
    const categories = await resCats.json();
    assert(Array.isArray(categories) && categories.length > 0, 'Phải có danh mục món');

    const sampleCat = categories[0];
    assert(sampleCat.name, 'Danh mục phải có tên');
    assert(sampleCat.icon, 'Danh mục phải có icon');
    assert(typeof sampleCat.order === 'number', 'Danh mục phải có thứ tự order');

    recordPass(`Admin kiểm tra danh mục món: ${categories.length} danh mục đã được kích hoạt`);
  } catch (err) {
    recordFail('Quản lý danh mục thất bại', err);
  }

  // --------------------------------------------------------------------------
  // TEST 4.5: Quản lý Nhân sự & Phân quyền (Users / Staff Management)
  // --------------------------------------------------------------------------
  let createdUserId = null;
  try {
    // 1. Lấy danh sách nhân viên
    const resUsers = await fetch(`${API_BASE}/users`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.strictEqual(resUsers.status, 200, 'Admin phải xem được danh sách nhân viên');
    const users = await resUsers.json();
    assert(Array.isArray(users) && users.length > 0);

    // 2. Tạo nhân viên mới
    const testEmployeePayload = {
      name: 'Nhân viên Thử việc QA',
      email: `test_waiter_${Date.now()}@kohi.vn`,
      password: 'password123',
      role: 'waiter',
      assignedShift: 'morning',
    };

    const resCreateUser = await fetch(`${API_BASE}/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify(testEmployeePayload),
    });

    assert([200, 201].includes(resCreateUser.status), 'Tạo tài khoản nhân viên phải thành công');
    const createdUser = await resCreateUser.json();
    assert(createdUser._id, 'Tài khoản nhân viên mới phải có ID');
    assert.strictEqual(createdUser.role, 'waiter');
    assert.strictEqual(createdUser.assignedShift, 'morning');

    createdUserId = createdUser._id;

    // 3. Xóa nhân viên mẫu sau khi test
    const resDeleteUser = await fetch(`${API_BASE}/users/${createdUserId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert([200, 204].includes(resDeleteUser.status), 'Xóa nhân viên mẫu phải thành công');

    recordPass(`Admin CRUD nhân sự thành công: Tạo nhân viên Waiter ca sáng & Dọn dẹp an toàn`);
  } catch (err) {
    recordFail('Quản lý nhân sự thất bại', err);
  }

  // --------------------------------------------------------------------------
  // TEST 4.6: Quản lý Chấm công & Phê duyệt Đổi ca (Attendance & Shift Swaps)
  // --------------------------------------------------------------------------
  try {
    // Admin xem toàn bộ dữ liệu chấm công của cả quán
    const resAllAtt = await fetch(`${API_BASE}/attendance`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.strictEqual(resAllAtt.status, 200, 'Admin phải xem được chấm công toàn nhân viên');
    const allAtt = await resAllAtt.json();
    assert(Array.isArray(allAtt));

    // Admin kiểm tra danh sách xin đổi ca
    const resSwaps = await fetch(`${API_BASE}/shift-swaps`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.strictEqual(resSwaps.status, 200, 'Admin phải xem được danh sách xin đổi ca');

    recordPass(`Admin giám sát chấm công (${allAtt.length} bản ghi) & Tiếp nhận yêu cầu đổi ca thành công`);
  } catch (err) {
    recordFail('Giám sát chấm công & đổi ca thất bại', err);
  }

  // --------------------------------------------------------------------------
  // TEST 4.7: Báo cáo Thống kê Doanh thu & Bảng xếp hạng món (Analytics)
  // --------------------------------------------------------------------------
  try {
    const resSummary = await fetch(`${API_BASE}/analytics/summary`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.strictEqual(resSummary.status, 200, 'Admin phải xem được báo cáo tổng quan');
    const summary = await resSummary.json();
    assert(summary.periodGross !== undefined || summary.todayGross !== undefined, 'Báo cáo phải có trường doanh thu (periodGross/todayGross)');

    const resTopFoods = await fetch(`${API_BASE}/analytics/top-foods`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.strictEqual(resTopFoods.status, 200, 'Admin phải xem được Top món bán chạy');
    const topFoods = await resTopFoods.json();
    assert(Array.isArray(topFoods), 'Top foods phải là một mảng');

    recordPass('Báo cáo thống kê tài chính & Top món bán chạy (Analytics Dashboard) chính xác');
  } catch (err) {
    recordFail('Lấy báo cáo thống kê thất bại', err);
  }

  // --------------------------------------------------------------------------
  // TEST 4.8: Quản lý Mã khuyến mãi (Coupons CRUD)
  // --------------------------------------------------------------------------
  let createdCouponId = null;
  try {
    const newCoupon = {
      code: `VIP${Date.now().toString().slice(-4)}`,
      type: 'percent',
      value: 15,
      minOrderAmount: 100000,
      maxDiscount: 30000,
      expiresAt: new Date(Date.now() + 7 * 86400000).toISOString(),
    };

    const resCoupon = await fetch(`${API_BASE}/coupons`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify(newCoupon),
    });

    assert([200, 201].includes(resCoupon.status), `Admin tạo coupon phải thành công (Status: ${resCoupon.status})`);
    const couponData = await resCoupon.json();
    assert(couponData._id, 'Coupon phải có ID');
    assert.strictEqual(couponData.code, newCoupon.code);

    createdCouponId = couponData._id;

    // Dọn dẹp coupon sau khi test
    const resDelCoupon = await fetch(`${API_BASE}/coupons/${createdCouponId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert([200, 204].includes(resDelCoupon.status));

    recordPass(`Admin tạo & quản lý mã ưu đãi thành công (Mã: ${newCoupon.code}, Giảm 15%)`);
  } catch (err) {
    recordFail('Quản lý mã giảm giá thất bại', err);
  }

  console.log(`\n🎉 KẾT QUẢ BỘ TEST 4 (ADMIN): ${passedTests}/${totalTests} TESTS ĐẠT CHUẨN 100%!\n`);
  return { passed: passedTests, total: totalTests };
}

if (require.main === module) {
  runAdminTests().catch(err => {
    console.error('Admin tests exited with error:', err);
    process.exit(1);
  });
}

module.exports = { runAdminTests };
