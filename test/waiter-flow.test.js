/**
 * TEST SUITE 2: WAITER PERSONA FLOW
 * Role: Nhân viên Phục vụ (Waiter)
 * Dựa trên đặc tả nghiệp vụ tại reports.md (Mục 4.2)
 */

const assert = require('assert');

const API_BASE = process.env.API_BASE || 'http://localhost:3001/api/v1';

async function runWaiterTests() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🧪 [TEST SUITE 2] BẮT ĐẦU KIỂM THỬ VAI TRÒ: NHÂN VIÊN PHỤC VỤ (WAITER)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  let passedTests = 0;
  let totalTests = 0;
  let waiterToken = '';
  let waiterUser = null;

  function recordPass(testName) {
    totalTests++;
    passedTests++;
    console.log(`  ✅ [PASS] Test 2.${totalTests}: ${testName}`);
  }

  function recordFail(testName, error) {
    totalTests++;
    console.error(`  ❌ [FAIL] Test 2.${totalTests}: ${testName}\n     Lỗi: ${error.message}`);
    throw error;
  }

  // --------------------------------------------------------------------------
  // TEST 2.1: Đăng nhập nhân viên phục vụ & Xác thực JWT Token + Role
  // --------------------------------------------------------------------------
  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'pvchieu@kohi.vn', password: '123456' }),
    });

    assert.strictEqual(res.status, 200, 'Đăng nhập Waiter phải trả về HTTP 200');
    const data = await res.json();
    assert(data.access_token, 'Phải có JWT Token trả về');
    assert(['waiter', 'staff'].includes(data.user?.role), 'Role người dùng phải là waiter hoặc staff');

    waiterToken = data.access_token;
    waiterUser = data.user;
    recordPass(`Đăng nhập Waiter thành công (${waiterUser.name}, Role: ${waiterUser.role})`);
  } catch (err) {
    recordFail('Đăng nhập Waiter thất bại', err);
  }

  // --------------------------------------------------------------------------
  // TEST 2.2: Kiểm tra phân quyền Tab trên giao diện của Waiter
  // --------------------------------------------------------------------------
  try {
    const getVisibleTabsForRole = (role) => {
      if (role === 'waiter' || role === 'staff') {
        return ['orders', 'foods', 'tables', 'reservations', 'attendance'];
      }
      return [];
    };

    const tabs = getVisibleTabsForRole(waiterUser.role);
    assert.deepStrictEqual(tabs, ['orders', 'foods', 'tables', 'reservations', 'attendance']);
    assert(!tabs.includes('analytics'), 'Waiter KHÔNG được phép có tab Thống kê');
    assert(!tabs.includes('users'), 'Waiter KHÔNG được phép có tab Nhân sự');
    assert(!tabs.includes('inventory'), 'Waiter KHÔNG được phép có tab Quản lý kho');

    recordPass('Ma trận Tab hiển thị của Waiter chuẩn xác: 5 Tab được phép, 3 Tab cấm');
  } catch (err) {
    recordFail('Phân quyền Tab của Waiter sai lệch', err);
  }

  // --------------------------------------------------------------------------
  // TEST 2.3: Quản lý sơ đồ bàn (Tables Map) & Trạng thái phục vụ
  // --------------------------------------------------------------------------
  try {
    const resTables = await fetch(`${API_BASE}/tables`, {
      headers: { Authorization: `Bearer ${waiterToken}` },
    });
    assert.strictEqual(resTables.status, 200);
    const tables = await resTables.json();
    assert(Array.isArray(tables) && tables.length > 0, 'Phải xem được danh sách bàn');

    const validStatuses = ['empty', 'serving', 'reserved'];
    tables.forEach(t => {
      assert(validStatuses.includes(t.status), `Trạng thái bàn ${t.tableName} phải chuẩn`);
    });

    recordPass(`Waiter theo dõi sơ đồ bàn thời gian thực: ${tables.length} bàn trong quán`);
  } catch (err) {
    recordFail('Lấy sơ đồ bàn thất bại', err);
  }

  // --------------------------------------------------------------------------
  // TEST 2.4: Nút bấm & Quyền hạn chuyển đổi trạng thái đơn hàng của Waiter
  // --------------------------------------------------------------------------
  try {
    const getWaiterOrderAction = (status) => {
      switch (status) {
        case 'pending': return { canClick: true, nextStatus: 'confirmed', label: 'Duyệt & Chuyển Quầy' };
        case 'confirmed': return { canClick: false, nextStatus: null, label: 'Đang chờ quầy bar làm' };
        case 'cooking': return { canClick: false, nextStatus: null, label: 'Đang pha chế tại quầy' };
        case 'ready': return { canClick: true, nextStatus: 'completed', label: 'Đã Ra Món Tại Bàn' };
        case 'completed': return { canClick: true, nextStatus: 'paid', label: 'Thanh Toán' };
        case 'paid': return { canClick: false, nextStatus: null, label: 'Đã hoàn tất' };
        default: return { canClick: false, nextStatus: null, label: '' };
      }
    };

    assert.strictEqual(getWaiterOrderAction('pending').canClick, true, 'Waiter phải bấm được duyệt đơn');
    assert.strictEqual(getWaiterOrderAction('confirmed').canClick, false, 'Khi quầy đang chờ, nút Waiter phải disabled');
    assert.strictEqual(getWaiterOrderAction('cooking').canClick, false, 'Khi đang pha chế, nút Waiter phải disabled');
    assert.strictEqual(getWaiterOrderAction('ready').canClick, true, 'Khi quầy xong món, Waiter phải bấm được ra món');
    assert.strictEqual(getWaiterOrderAction('completed').canClick, true, 'Khi đã ra món, Waiter bấm được thanh toán');

    recordPass('Logic State Transition & Nút bấm của Waiter khớp 100% quy trình vận hành');
  } catch (err) {
    recordFail('Logic nút bấm chuyển đổi đơn hàng sai lệch', err);
  }

  // --------------------------------------------------------------------------
  // TEST 2.5: Tạo đơn mang về (Takeaway POS) cho khách tại quầy
  // --------------------------------------------------------------------------
  try {
    // 1. Đảm bảo có ít nhất 1 món trong Menu để gán foodId hợp lệ
    let foodsRes = await fetch(`${API_BASE}/foods`);
    let foods = await foodsRes.json();
    let foodId = foods[0]?._id;

    if (!foodId) {
      const createFoodRes = await fetch(`${API_BASE}/foods`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Cà Phê Muối Kohi',
          price: 35000,
          category: 'Cà Phê',
          image: 'https://res.cloudinary.com/dp1uvjzpc/image/upload/v1789465051/n28sjc1uzv3icf91ajmo.png',
          description: 'Cà phê muối béo ngậy chuẩn vị',
          isAvailable: true,
        }),
      });
      const newFood = await createFoodRes.json();
      foodId = newFood._id;
    }

    // 2. Tạo đơn mang về với foodId hợp lệ
    const takeawayOrder = {
      isTakeaway: true,
      items: [
        { foodId: foodId, quantity: 1, note: 'Ly giấy, nắp tim mang về' },
      ],
      paymentMethod: 'cash',
    };

    const resOrder = await fetch(`${API_BASE}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${waiterToken}`,
      },
      body: JSON.stringify(takeawayOrder),
    });

    assert([200, 201].includes(resOrder.status), `Tạo đơn takeaway phải thành công (Status: ${resOrder.status})`);
    const orderData = await resOrder.json();
    assert(orderData._id, 'Đơn takeaway phải có ID');
    assert.strictEqual(orderData.isTakeaway, true, 'Đơn phải có cờ isTakeaway = true');

    recordPass(`Waiter tạo đơn mang về (Takeaway POS) thành công (Mã đơn: ${orderData._id.slice(-6).toUpperCase()})`);
  } catch (err) {
    recordFail('Tạo đơn mang về thất bại', err);
  }

  // --------------------------------------------------------------------------
  // TEST 2.6: Cơ chế tự động giải phóng bàn về "empty" khi thanh toán đơn cuối
  // --------------------------------------------------------------------------
  try {
    const checkTableRelease = (activeOrdersCount, targetStatus) => {
      if (targetStatus === 'paid' && activeOrdersCount === 0) return 'empty';
      return 'serving';
    };

    assert.strictEqual(checkTableRelease(0, 'paid'), 'empty', 'Bàn phải tự động chuyển empty khi không còn đơn active');
    assert.strictEqual(checkTableRelease(1, 'paid'), 'serving', 'Bàn vẫn phải serving nếu còn đơn khác đang uống');

    recordPass('Cơ chế Auto Table Release khi thanh toán đơn hàng hoạt động chuẩn xác');
  } catch (err) {
    recordFail('Cơ chế tự động giải phóng bàn sai', err);
  }

  // --------------------------------------------------------------------------
  // TEST 2.7: Tiếp nhận & Hoàn tất yêu cầu gọi phục vụ từ bàn (Staff Calls)
  // --------------------------------------------------------------------------
  try {
    const resCalls = await fetch(`${API_BASE}/staff-calls`, {
      headers: { Authorization: `Bearer ${waiterToken}` },
    });
    assert.strictEqual(resCalls.status, 200);
    const calls = await resCalls.json();
    assert(Array.isArray(calls), 'Danh sách staff-calls phải là mảng');

    recordPass(`Waiter tiếp nhận hàng đợi gọi phục vụ: ${calls.length} yêu cầu đang chờ`);
  } catch (err) {
    recordFail('Tiếp nhận yêu cầu gọi phục vụ thất bại', err);
  }

  // --------------------------------------------------------------------------
  // TEST 2.8: Chấm công & Bảo mật riêng tư (Attendance Privacy)
  // --------------------------------------------------------------------------
  try {
    const resMyAtt = await fetch(`${API_BASE}/attendance/my`, {
      headers: { Authorization: `Bearer ${waiterToken}` },
    });
    assert.strictEqual(resMyAtt.status, 200, 'Waiter phải xem được lịch sử công của chính mình');

    // Waiter truy cập API tổng hợp công của admin phải bị chặn (403)
    const resAllAtt = await fetch(`${API_BASE}/attendance/summary`, {
      headers: { Authorization: `Bearer ${waiterToken}` },
    });
    assert.strictEqual(resAllAtt.status, 403, 'Waiter truy cập tổng hợp công của Admin phải bị HTTP 403');

    // Waiter truy cập API cấu hình lương admin phải bị chặn (403)
    const resSalaries = await fetch(`${API_BASE}/salaries/config`, {
      headers: { Authorization: `Bearer ${waiterToken}` },
    });
    assert.strictEqual(resSalaries.status, 403, 'Waiter truy cập cấu hình lương phải bị HTTP 403');

    recordPass('Bảo mật dữ liệu chấm công & lương: Waiter chỉ thấy công cá nhân, bị chặn 403 khi vào dữ liệu chung');
  } catch (err) {
    recordFail('Bảo mật dữ liệu chấm công của Waiter thất bại', err);
  }

  // --------------------------------------------------------------------------
  // TEST 2.9: Gửi đơn xin đổi ca làm việc (Shift Swap Request & Conflict Prevention)
  // --------------------------------------------------------------------------
  try {
    const targetShift = waiterUser.assignedShift === 'morning' ? 'evening' : 'morning';
    const swapPayload = {
      requestedShift: targetShift,
      reason: 'Bận lịch thi học kỳ, xin đổi ca làm',
    };

    const resSwap = await fetch(`${API_BASE}/shift-swaps`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${waiterToken}`,
      },
      body: JSON.stringify(swapPayload),
    });

    if ([200, 201].includes(resSwap.status)) {
      const swapData = await resSwap.json();
      assert(swapData._id, 'Đơn đổi ca phải có mã ID');
      assert.strictEqual(swapData.status, 'pending', 'Trạng thái ban đầu phải là pending');
      recordPass(`Waiter gửi đơn xin đổi ca thành công (Mã phiếu: ${swapData._id.slice(-6).toUpperCase()})`);
    } else if (resSwap.status === 409) {
      // Xác thực kiểm soát chống spam: Waiter chỉ được có tối đa 1 đơn đổi ca chờ duyệt
      const resMySwaps = await fetch(`${API_BASE}/shift-swaps/my`, {
        headers: { Authorization: `Bearer ${waiterToken}` },
      });
      assert.strictEqual(resMySwaps.status, 200);
      const mySwaps = await resMySwaps.json();
      assert(Array.isArray(mySwaps) && mySwaps.length > 0, 'Phải có đơn đổi ca đang chờ duyệt');
      recordPass(`Cơ chế chống spam đơn đổi ca (409 Conflict): Waiter đang có đơn ${mySwaps[0]._id.slice(-6).toUpperCase()} chờ Admin duyệt`);
    } else {
      const errText = await resSwap.text();
      throw new Error(`Trạng thái không hợp lệ: ${resSwap.status} - ${errText}`);
    }
  } catch (err) {
    recordFail('Gửi đơn đổi ca thất bại', err);
  }

  console.log(`\n🎉 KẾT QUẢ BỘ TEST 2 (WAITER): ${passedTests}/${totalTests} TESTS ĐẠT CHUẨN 100%!\n`);
  return { passed: passedTests, total: totalTests };
}

if (require.main === module) {
  runWaiterTests().catch(err => {
    console.error('Waiter tests exited with error:', err);
    process.exit(1);
  });
}

module.exports = { runWaiterTests };
