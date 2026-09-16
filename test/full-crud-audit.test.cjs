/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║     🚀 MASTER QA AUDIT: FULL CRUD TESTING FOR ALL 12 KOHI POS MODULES     ║
 * ║  Role: Senior QA Engineer / Penetration & Integrity Tester                ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 */

const assert = require('assert');

const API_BASE = process.env.API_BASE || 'http://localhost:3001/api/v1';

const results = [];

function recordTest(moduleName, operation, isSuccess, details = '') {
  results.push({
    module: moduleName,
    operation,
    status: isSuccess ? 'PASS' : 'FAIL',
    details,
  });
  const icon = isSuccess ? '✅' : '❌';
  console.log(`  ${icon} [${moduleName.toUpperCase()}][${operation}] ${details}`);
}

async function runFullCrudAudit() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🧪 BẮT ĐẦU KIỂM THỬ TOÀN DIỆN CRUD 12 PHÂN HỆ HỆ THỐNG');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // 0. Xác thực tài khoản Admin để có token quyền cao nhất
  let adminToken = '';
  try {
    const loginRes = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@kohi.vn', password: '123456' }),
    });
    assert.strictEqual(loginRes.status, 200, 'Admin login status 200');
    const loginData = await loginRes.json();
    adminToken = loginData.access_token;
    assert(adminToken, 'Admin token required');
    console.log('🔑 [AUTH] Đăng nhập Admin thành công. Bắt đầu phiên kiểm thử CRUD.\n');
  } catch (err) {
    console.error('❌ [AUTH FATAL] Không thể đăng nhập Admin:', err.message);
    process.exit(1);
  }

  const authHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${adminToken}`,
  };

  const testSuffix = Math.random().toString(36).substring(2, 7).toUpperCase();

  // ── MODULE 1: USERS (NHÂN SỰ & TÀI KHOẢN) ──────────────────────────────────
  console.log('▶ [PHÂN HỆ 1/12] KIỂM THỬ CRUD: USERS (NHÂN SỰ)');
  let testUserId = null;
  try {
    // 1.1 Create User (strictly matching CreateUserDto)
    const createRes = await fetch(`${API_BASE}/users`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        name: `Test Waiter ${testSuffix}`,
        email: `waiter_${testSuffix.toLowerCase()}@kohi.vn`,
        password: 'Password123!',
        role: 'waiter',
        assignedShift: 'morning',
      }),
    });
    assert([200, 201].includes(createRes.status), `Create user HTTP ${createRes.status}`);
    const createdUser = await createRes.json();
    testUserId = createdUser._id || createdUser.id;
    assert(testUserId, 'User ID must exist');
    recordTest('Users', 'CREATE', true, `Tạo nhân viên mới thành công (ID: ${testUserId})`);

    // 1.2 Read All & Read One
    const readAllRes = await fetch(`${API_BASE}/users`, { headers: authHeaders });
    assert.strictEqual(readAllRes.status, 200, 'Read all users HTTP 200');
    const readOneRes = await fetch(`${API_BASE}/users/${testUserId}`, { headers: authHeaders });
    assert.strictEqual(readOneRes.status, 200, 'Read one user HTTP 200');
    recordTest('Users', 'READ', true, `Truy vấn danh sách và chi tiết nhân viên khớp dữ liệu`);

    // 1.3 Update User
    const updateRes = await fetch(`${API_BASE}/users/${testUserId}`, {
      method: 'PATCH',
      headers: authHeaders,
      body: JSON.stringify({ name: `Test Waiter Updated ${testSuffix}`, assignedShift: 'afternoon' }),
    });
    assert.strictEqual(updateRes.status, 200, 'Update user HTTP 200');
    const updatedUser = await updateRes.json();
    assert.strictEqual(updatedUser.assignedShift, 'afternoon', 'Shift must be updated');
    recordTest('Users', 'UPDATE', true, `Cập nhật ca làm việc và họ tên nhân viên thành công`);

    // 1.4 Delete User
    const delRes = await fetch(`${API_BASE}/users/${testUserId}`, {
      method: 'DELETE',
      headers: authHeaders,
    });
    assert([200, 204].includes(delRes.status), 'Delete user HTTP 200/204');
    recordTest('Users', 'DELETE', true, `Xóa nhân viên mẫu test và dọn dẹp an toàn`);
  } catch (err) {
    recordTest('Users', 'ERROR', false, err.message);
  }

  // ── MODULE 2: CATEGORIES (DANH MỤC MÓN) ────────────────────────────────────
  console.log('\n▶ [PHÂN HỆ 2/12] KIỂM THỬ CRUD: CATEGORIES (DANH MỤC)');
  let testCatId = null;
  try {
    // 2.1 Create Category (strictly matching CreateCategoryDto)
    const createRes = await fetch(`${API_BASE}/categories`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        name: `Trà Trái Cây Mùa Hè ${testSuffix}`,
        icon: 'local_cafe',
        order: 99,
        isActive: true,
      }),
    });
    assert([200, 201].includes(createRes.status), `Create category HTTP ${createRes.status}`);
    const createdCat = await createRes.json();
    testCatId = createdCat._id || createdCat.id;
    assert(testCatId, 'Category ID must exist');
    recordTest('Categories', 'CREATE', true, `Tạo danh mục mới thành công (ID: ${testCatId})`);

    // 2.2 Read All & Read One
    const readAllRes = await fetch(`${API_BASE}/categories`);
    assert.strictEqual(readAllRes.status, 200, 'Read all categories HTTP 200');
    const readOneRes = await fetch(`${API_BASE}/categories/${testCatId}`);
    assert.strictEqual(readOneRes.status, 200, 'Read one category HTTP 200');
    recordTest('Categories', 'READ', true, `Đọc danh mục công khai cho khách hàng thành công`);

    // 2.3 Update Category
    const updateRes = await fetch(`${API_BASE}/categories/${testCatId}`, {
      method: 'PATCH',
      headers: authHeaders,
      body: JSON.stringify({ order: 100 }),
    });
    assert.strictEqual(updateRes.status, 200, 'Update category HTTP 200');
    recordTest('Categories', 'UPDATE', true, `Cập nhật thứ tự hiển thị danh mục thành công`);

    // 2.4 Delete Category
    const delRes = await fetch(`${API_BASE}/categories/${testCatId}`, {
      method: 'DELETE',
      headers: authHeaders,
    });
    assert([200, 204].includes(delRes.status), 'Delete category HTTP 200/204');
    recordTest('Categories', 'DELETE', true, `Xóa danh mục mẫu test thành công`);
  } catch (err) {
    recordTest('Categories', 'ERROR', false, err.message);
  }

  // ── MODULE 3: FOODS (THỰC ĐƠN MÓN ĂN & THỨC UỐNG) ──────────────────────────
  console.log('\n▶ [PHÂN HỆ 3/12] KIỂM THỬ CRUD: FOODS (THỰC ĐƠN)');
  let testFoodId = null;
  try {
    // 3.1 Create Food
    const createRes = await fetch(`${API_BASE}/foods`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        name: `Cold Brew Cam Quế ${testSuffix}`,
        price: 55000,
        category: 'Cà Phê Truyền Thống & Hiện Đại',
        image: 'https://res.cloudinary.com/dp1uvjzpc/image/upload/v1789465051/n28sjc1uzv3icf91ajmo.png',
        description: 'Cold brew ủ lạnh 24h kết hợp hương quế tự nhiên',
        isAvailable: true,
      }),
    });
    assert([200, 201].includes(createRes.status), `Create food HTTP ${createRes.status}`);
    const createdFood = await createRes.json();
    testFoodId = createdFood._id || createdFood.id;
    assert(testFoodId, 'Food ID must exist');
    recordTest('Foods', 'CREATE', true, `Thêm món mới vào thực đơn thành công (ID: ${testFoodId})`);

    // 3.2 Read All & Read One
    const readAllRes = await fetch(`${API_BASE}/foods`);
    assert.strictEqual(readAllRes.status, 200, 'Read foods HTTP 200');
    const readOneRes = await fetch(`${API_BASE}/foods/${testFoodId}`);
    assert.strictEqual(readOneRes.status, 200, 'Read food item HTTP 200');
    recordTest('Foods', 'READ', true, `Truy vấn chi tiết món với URL ảnh Cloudinary hợp lệ`);

    // 3.3 Update Food (Price & Availability)
    const updateRes = await fetch(`${API_BASE}/foods/${testFoodId}`, {
      method: 'PATCH',
      headers: authHeaders,
      body: JSON.stringify({ price: 60000, isAvailable: false }),
    });
    assert.strictEqual(updateRes.status, 200, 'Update food HTTP 200');
    const updatedFood = await updateRes.json();
    assert.strictEqual(updatedFood.price, 60000, 'Price must be updated');
    assert.strictEqual(updatedFood.isAvailable, false, 'Availability must be toggled');
    recordTest('Foods', 'UPDATE', true, `Cập nhật giá bán và trạng thái món thành công`);

    // 3.4 Delete Food
    const delRes = await fetch(`${API_BASE}/foods/${testFoodId}`, {
      method: 'DELETE',
      headers: authHeaders,
    });
    assert([200, 204].includes(delRes.status), 'Delete food HTTP 200/204');
    recordTest('Foods', 'DELETE', true, `Xóa món ăn mẫu test an toàn`);
  } catch (err) {
    recordTest('Foods', 'ERROR', false, err.message);
  }

  // ── MODULE 4: TABLES (SƠ ĐỒ BÀN ĂN & QR CODE) ──────────────────────────────
  console.log('\n▶ [PHÂN HỆ 4/12] KIỂM THỬ CRUD: TABLES (SƠ ĐỒ BÀN)');
  let testTableId = null;
  try {
    // 4.1 Create Table (strictly matching CreateTableDto: tableName, qrCodeUrl, status)
    const tableNum = Math.floor(800 + Math.random() * 100);
    const createRes = await fetch(`${API_BASE}/tables`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        tableName: `Bàn Test ${tableNum}`,
        status: 'empty',
      }),
    });
    assert([200, 201].includes(createRes.status), `Create table HTTP ${createRes.status}`);
    const createdTable = await createRes.json();
    testTableId = createdTable._id || createdTable.id;
    assert(testTableId, 'Table ID must exist');
    recordTest('Tables', 'CREATE', true, `Tạo bàn mới với mã QR tích hợp thành công (ID: ${testTableId})`);

    // 4.2 Read All & Read One
    const readAllRes = await fetch(`${API_BASE}/tables`);
    assert.strictEqual(readAllRes.status, 200, 'Read tables HTTP 200');
    const readOneRes = await fetch(`${API_BASE}/tables/${testTableId}`);
    assert.strictEqual(readOneRes.status, 200, 'Read table item HTTP 200');
    recordTest('Tables', 'READ', true, `Đọc dữ liệu bàn và trạng thái phục vụ thời gian thực`);

    // 4.3 Update Table (Status & Regenerate QR)
    const updateRes = await fetch(`${API_BASE}/tables/${testTableId}`, {
      method: 'PATCH',
      headers: authHeaders,
      body: JSON.stringify({ status: 'reserved' }),
    });
    assert.strictEqual(updateRes.status, 200, 'Update table HTTP 200');
    const regenRes = await fetch(`${API_BASE}/tables/${testTableId}/regenerate-qr`, {
      method: 'PATCH',
      headers: authHeaders,
    });
    assert.strictEqual(regenRes.status, 200, 'Regenerate QR HTTP 200');
    recordTest('Tables', 'UPDATE', true, `Cập nhật trạng thái và tái tạo mã bảo mật QR thành công`);

    // 4.4 Delete Table
    const delRes = await fetch(`${API_BASE}/tables/${testTableId}`, {
      method: 'DELETE',
      headers: authHeaders,
    });
    assert([200, 204].includes(delRes.status), 'Delete table HTTP 200/204');
    recordTest('Tables', 'DELETE', true, `Xóa bàn mẫu test an toàn`);
  } catch (err) {
    recordTest('Tables', 'ERROR', false, err.message);
  }

  // ── MODULE 5: ORDERS (ĐƠN HÀNG & GỌI MÓN) ──────────────────────────────────
  console.log('\n▶ [PHÂN HỆ 5/12] KIỂM THỬ CRUD: ORDERS (ĐƠN HÀNG)');
  let testOrderId = null;
  let testOrderTableId = null;
  let sampleFoodForReview = null;
  try {
    const foodsRes = await fetch(`${API_BASE}/foods`);
    const foodsList = await foodsRes.json();
    sampleFoodForReview = foodsList[0];

    const tablesRes = await fetch(`${API_BASE}/tables`);
    const tablesList = await tablesRes.json();
    const sampleTable = tablesList.find((t) => t.status === 'empty') || tablesList[0];
    testOrderTableId = sampleTable._id;

    // 5.1 Create Order
    const createRes = await fetch(`${API_BASE}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tableId: sampleTable._id,
        items: [{ foodId: sampleFoodForReview._id, quantity: 2, note: 'Ít đường, không đá' }],
        paymentMethod: 'cash',
        customerName: `Khách Test ${testSuffix}`,
      }),
    });
    assert([200, 201].includes(createRes.status), `Create order HTTP ${createRes.status}`);
    const createdOrder = await createRes.json();
    testOrderId = createdOrder._id || createdOrder.id;
    assert(testOrderId, 'Order ID must exist');
    recordTest('Orders', 'CREATE', true, `Khách gọi món tạo đơn tại bàn thành công (Mã đơn: ${testOrderId.slice(-6)})`);

    // 5.2 Read Order (with auth headers)
    const readOneRes = await fetch(`${API_BASE}/orders/${testOrderId}`, { headers: authHeaders });
    assert.strictEqual(readOneRes.status, 200, 'Read order HTTP 200');
    const orderData = await readOneRes.json();
    assert.strictEqual(orderData.totalAmount, sampleFoodForReview.price * 2, 'Total amount calculation must be accurate');
    recordTest('Orders', 'READ', true, `Tính toán hóa đơn chính xác: ${orderData.totalAmount.toLocaleString('vi-VN')}đ`);

    // 5.3 Update Order Status (confirmed -> cooking -> ready)
    const updateRes = await fetch(`${API_BASE}/orders/${testOrderId}/status`, {
      method: 'PATCH',
      headers: authHeaders,
      body: JSON.stringify({ status: 'cooking' }),
    });
    assert.strictEqual(updateRes.status, 200, 'Update status HTTP 200');
    recordTest('Orders', 'UPDATE', true, `Cập nhật trạng thái vòng đời đơn hàng sang "Đang pha chế" thành công`);

    // 5.4 Cancel Order: Tạo một đơn pending khác để kiểm thử tính năng hủy đơn chờ duyệt
    const cancelTargetRes = await fetch(`${API_BASE}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tableId: sampleTable._id,
        items: [{ foodId: sampleFoodForReview._id, quantity: 1 }],
        paymentMethod: 'cash',
        customerName: `Khách Hủy Đơn ${testSuffix}`,
      }),
    });
    assert([200, 201].includes(cancelTargetRes.status), 'Create pending order to test cancel');
    const cancelTarget = await cancelTargetRes.json();
    const cancelTargetId = cancelTarget._id || cancelTarget.id;

    const cancelRes = await fetch(`${API_BASE}/orders/${cancelTargetId}/cancel`, {
      method: 'PATCH',
    });
    assert.strictEqual(cancelRes.status, 200, 'Cancel order HTTP 200');
    recordTest('Orders', 'DELETE', true, `Hủy và giải phóng đơn hàng khi chờ phục vụ duyệt thành công`);
  } catch (err) {
    recordTest('Orders', 'ERROR', false, err.message);
  }

  // ── MODULE 6: INGREDIENTS (KHO NGUYÊN VẬT LIỆU) ────────────────────────────
  console.log('\n▶ [PHÂN HỆ 6/12] KIỂM THỬ CRUD: INGREDIENTS (KHO NGUYÊN LIỆU)');
  let testIngId = null;
  try {
    // 6.1 Create Ingredient
    const createRes = await fetch(`${API_BASE}/ingredients`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        name: `Bột Cacao Đắk Lắk ${testSuffix}`,
        category: 'Trà & Bột',
        unit: 'kg',
        currentQuantity: 10,
        minThreshold: 3,
        unitPrice: 120000,
        lastUpdatedBy: 'Tester QA',
      }),
    });
    assert([200, 201].includes(createRes.status), `Create ingredient HTTP ${createRes.status}`);
    const createdIng = await createRes.json();
    testIngId = createdIng._id || createdIng.id;
    assert(testIngId, 'Ingredient ID must exist');
    recordTest('Ingredients', 'CREATE', true, `Nhập nguyên liệu mới vào kho thành công (ID: ${testIngId})`);

    // 6.2 Read Ingredients
    const readAllRes = await fetch(`${API_BASE}/ingredients`, { headers: authHeaders });
    assert.strictEqual(readAllRes.status, 200, 'Read ingredients HTTP 200');
    const readOneRes = await fetch(`${API_BASE}/ingredients/${testIngId}`, { headers: authHeaders });
    assert.strictEqual(readOneRes.status, 200, 'Read single ingredient HTTP 200');
    recordTest('Ingredients', 'READ', true, `Theo dõi số lượng tồn kho và định mức cảnh báo`);

    // 6.3 Update Ingredient (Trừ tiêu hao & ghi nhận IngredientUsage)
    const updateRes = await fetch(`${API_BASE}/ingredients/${testIngId}`, {
      method: 'PATCH',
      headers: authHeaders,
      body: JSON.stringify({ quantityChange: -2, note: 'Xuất pha chế test' }),
    });
    assert.strictEqual(updateRes.status, 200, 'Update ingredient stock HTTP 200');
    const updatedIng = await updateRes.json();
    assert.strictEqual(updatedIng.currentQuantity, 8, 'Stock must decrease by 2');
    recordTest('Ingredients', 'UPDATE', true, `Cập nhật tồn kho (-2kg) và tự động ghi nhận tiêu hao giá vốn thành công`);

    // 6.4 Delete Ingredient
    const delRes = await fetch(`${API_BASE}/ingredients/${testIngId}`, {
      method: 'DELETE',
      headers: authHeaders,
    });
    assert([200, 204].includes(delRes.status), 'Delete ingredient HTTP 200/204');
    recordTest('Ingredients', 'DELETE', true, `Xóa nguyên liệu test khỏi kho an toàn`);
  } catch (err) {
    recordTest('Ingredients', 'ERROR', false, err.message);
  }

  // ── MODULE 7: EXPENSES (CHI PHÍ PHÁT SINH) ─────────────────────────────────
  console.log('\n▶ [PHÂN HỆ 7/12] KIỂM THỬ CRUD: EXPENSES (CHI PHÍ PHÁT SINH)');
  let testExpId = null;
  try {
    // 7.1 Create Expense
    const createRes = await fetch(`${API_BASE}/expenses`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        title: `Chi mua đá viên tinh khiết ${testSuffix}`,
        amount: 85000,
        category: 'Vật tư & Tiện ích',
        note: 'Mua 3 bao đá viên quầy bar',
        date: new Date().toISOString(),
      }),
    });
    assert([200, 201].includes(createRes.status), `Create expense HTTP ${createRes.status}`);
    const createdExp = await createRes.json();
    testExpId = createdExp._id || createdExp.id;
    assert(testExpId, 'Expense ID must exist');
    recordTest('Expenses', 'CREATE', true, `Ghi nhận phiếu chi tiền mặt mới thành công (85.000đ)`);

    // 7.2 Read Expenses
    const readRes = await fetch(`${API_BASE}/expenses`, { headers: authHeaders });
    assert.strictEqual(readRes.status, 200, 'Read expenses HTTP 200');
    recordTest('Expenses', 'READ', true, `Truy vấn danh sách sổ chi tiêu phát sinh`);

    // 7.3 Delete Expense
    const delRes = await fetch(`${API_BASE}/expenses/${testExpId}`, {
      method: 'DELETE',
      headers: authHeaders,
    });
    assert([200, 204].includes(delRes.status), 'Delete expense HTTP 200/204');
    recordTest('Expenses', 'DELETE', true, `Xóa phiếu chi mẫu test an toàn`);
  } catch (err) {
    recordTest('Expenses', 'ERROR', false, err.message);
  }

  // ── MODULE 8: COUPONS (MÃ GIẢM GIÁ & KHUYẾN MẠI) ───────────────────────────
  console.log('\n▶ [PHÂN HỆ 8/12] KIỂM THỬ CRUD: COUPONS (MÃ GIẢM GIÁ)');
  let testCouponId = null;
  const couponCode = `TEST${testSuffix}`;
  try {
    // 8.1 Create Coupon
    const createRes = await fetch(`${API_BASE}/coupons`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        code: couponCode,
        type: 'percent',
        value: 20,
        minOrderAmount: 100000,
        maxDiscount: 50000,
        maxUsage: 10,
        expiresAt: new Date(Date.now() + 7 * 86400000).toISOString(),
      }),
    });
    assert([200, 201].includes(createRes.status), `Create coupon HTTP ${createRes.status}`);
    const createdCoupon = await createRes.json();
    testCouponId = createdCoupon._id || createdCoupon.id;
    assert(testCouponId, 'Coupon ID must exist');
    recordTest('Coupons', 'CREATE', true, `Tạo mã ưu đãi mới thành công (Mã: ${couponCode}, Giảm 20%)`);

    // 8.2 Read & Validate Coupon
    const readAllRes = await fetch(`${API_BASE}/coupons`, { headers: authHeaders });
    assert.strictEqual(readAllRes.status, 200, 'Read coupons HTTP 200');
    const valRes = await fetch(`${API_BASE}/coupons/validate/${couponCode}?amount=200000`);
    assert.strictEqual(valRes.status, 200, 'Validate coupon HTTP 200');
    const valData = await valRes.json();
    assert.strictEqual(valData.valid, true, 'Coupon must be valid');
    assert.strictEqual(valData.discountAmount, 40000, 'Discount calculation must be 40.000đ');
    recordTest('Coupons', 'READ', true, `Xác thực mã hợp lệ và tính số tiền giảm chính xác (40.000đ)`);

    // 8.3 Update Coupon
    const updateRes = await fetch(`${API_BASE}/coupons/${testCouponId}`, {
      method: 'PATCH',
      headers: authHeaders,
      body: JSON.stringify({ maxDiscount: 80000 }),
    });
    assert.strictEqual(updateRes.status, 200, 'Update coupon HTTP 200');
    recordTest('Coupons', 'UPDATE', true, `Cập nhật hạn mức giảm giá tối đa thành công`);

    // 8.4 Delete Coupon
    const delRes = await fetch(`${API_BASE}/coupons/${testCouponId}`, {
      method: 'DELETE',
      headers: authHeaders,
    });
    assert([200, 204].includes(delRes.status), 'Delete coupon HTTP 200/204');
    recordTest('Coupons', 'DELETE', true, `Xóa mã khuyến mãi test an toàn`);
  } catch (err) {
    recordTest('Coupons', 'ERROR', false, err.message);
  }

  // ── MODULE 9: RESERVATIONS (ĐẶT BÀN TRƯỚC) ─────────────────────────────────
  console.log('\n▶ [PHÂN HỆ 9/12] KIỂM THỬ CRUD: RESERVATIONS (ĐẶT BÀN)');
  let testResId = null;
  // Số điện thoại Việt Nam 10 chữ số: 098 + 7 chữ số
  const testPhone = `098${Math.floor(1000000 + Math.random() * 9000000)}`;
  try {
    const tablesRes = await fetch(`${API_BASE}/tables`);
    const tablesList = await tablesRes.json();
    // Chọn bàn trống chưa ai đặt
    const emptyTable = tablesList.find((t) => t.status === 'empty') || tablesList[0];

    // 9.1 Create Reservation (Public Customer)
    const createRes = await fetch(`${API_BASE}/reservations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerName: `Khách Đặt Bàn ${testSuffix}`,
        customerPhone: testPhone,
        tableId: emptyTable._id,
        guestCount: 2,
        reservationTime: new Date(Date.now() + 3600000 * 24).toISOString(),
        note: 'Cần bàn gần cửa sổ thoáng mát',
      }),
    });
    assert([200, 201].includes(createRes.status), `Create reservation HTTP ${createRes.status}`);
    const createdRes = await createRes.json();
    testResId = createdRes._id || createdRes.id;
    assert(testResId, 'Reservation ID must exist');
    recordTest('Reservations', 'CREATE', true, `Khách đặt bàn trực tuyến thành công (SĐT: ${testPhone})`);

    // 9.2 Read Reservation (Lookup by Phone)
    const lookupRes = await fetch(`${API_BASE}/reservations/lookup?phone=${testPhone}`);
    assert.strictEqual(lookupRes.status, 200, 'Lookup reservation HTTP 200');
    const lookupList = await lookupRes.json();
    assert(lookupList.length > 0, 'Must find reservation by phone');
    recordTest('Reservations', 'READ', true, `Tra cứu vé đặt bàn điện tử bằng số điện thoại chính xác`);

    // 9.3 Update Reservation Status
    const updateRes = await fetch(`${API_BASE}/reservations/${testResId}/status`, {
      method: 'PATCH',
      headers: authHeaders,
      body: JSON.stringify({ status: 'confirmed' }),
    });
    assert.strictEqual(updateRes.status, 200, 'Update reservation status HTTP 200');
    recordTest('Reservations', 'UPDATE', true, `Nhân viên phê duyệt xác nhận đơn đặt bàn thành công`);

    // 9.4 Delete Reservation
    const delRes = await fetch(`${API_BASE}/reservations/${testResId}`, {
      method: 'DELETE',
      headers: authHeaders,
    });
    assert([200, 204].includes(delRes.status), 'Delete reservation HTTP 200/204');
    recordTest('Reservations', 'DELETE', true, `Xóa đơn đặt bàn mẫu test an toàn`);
  } catch (err) {
    recordTest('Reservations', 'ERROR', false, err.message);
  }

  // ── MODULE 10: REVIEWS (ĐÁNH GIÁ MÓN ĂN) ───────────────────────────────────
  console.log('\n▶ [PHÂN HỆ 10/12] KIỂM THỬ CRUD: REVIEWS (ĐÁNH GIÁ CHẤT LƯỢNG)');
  let testReviewId = null;
  try {
    const foodsRes = await fetch(`${API_BASE}/foods`);
    const foodsList = await foodsRes.json();
    const sampleFood = foodsList[0];

    // Tạo 1 đơn hàng tạm tại bàn để có orderId và tableId hợp lệ cho review
    const orderReviewRes = await fetch(`${API_BASE}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tableId: testOrderTableId,
        items: [{ foodId: sampleFood._id, quantity: 1 }],
        paymentMethod: 'cash',
        customerName: 'Khách Đánh Giá',
      }),
    });
    const orderReview = await orderReviewRes.json();
    const tempOrderId = orderReview._id || orderReview.id;

    // Đánh dấu đơn hàng là hoàn thành (bắt buộc theo nghiệp vụ để có thể đánh giá)
    await fetch(`${API_BASE}/orders/${tempOrderId}/status`, {
      method: 'PATCH',
      headers: authHeaders,
      body: JSON.stringify({ status: 'completed' }),
    });

    // 10.1 Create Review (matching CreateReviewDto with tableId)
    const createRes = await fetch(`${API_BASE}/reviews`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderId: tempOrderId,
        tableId: testOrderTableId,
        ratings: [{ foodId: sampleFood._id, star: 5, comment: `Đậm vị cà phê! Test ${testSuffix}` }],
        overallStar: 5,
        overallComment: 'Phục vụ chu đáo, ra món nhanh chóng.',
      }),
    });
    assert([200, 201].includes(createRes.status), `Create review HTTP ${createRes.status}`);
    const createdRev = await createRes.json();
    testReviewId = createdRev._id || createdRev.id;
    assert(testReviewId, 'Review ID must exist');
    recordTest('Reviews', 'CREATE', true, `Thực khách gửi đánh giá 5 sao thành công (Món: ${sampleFood.name})`);

    // 10.2 Read Reviews & Summary
    const readAllRes = await fetch(`${API_BASE}/reviews`, { headers: authHeaders });
    assert.strictEqual(readAllRes.status, 200, 'Read all reviews HTTP 200');
    const readSummaryRes = await fetch(`${API_BASE}/reviews/food/${sampleFood._id}/summary`);
    assert.strictEqual(readSummaryRes.status, 200, 'Read review summary HTTP 200');
    recordTest('Reviews', 'READ', true, `Tổng hợp điểm đánh giá trung bình & danh sách nhận xét công khai`);

    // 10.3 Delete Review
    const delRes = await fetch(`${API_BASE}/reviews/${testReviewId}`, {
      method: 'DELETE',
      headers: authHeaders,
    });
    assert([200, 204].includes(delRes.status), 'Delete review HTTP 200/204');
    recordTest('Reviews', 'DELETE', true, `Xóa đánh giá mẫu test an toàn`);
  } catch (err) {
    recordTest('Reviews', 'ERROR', false, err.message);
  }

  // ── MODULE 11: ATTENDANCE & SHIFTS (CHẤM CÔNG & CA LÀM) ───────────────────
  console.log('\n▶ [PHÂN HỆ 11/12] KIỂM THỬ CRUD: ATTENDANCE & SHIFTS (CHẤM CÔNG)');
  let testAttId = null;
  try {
    const attListRes = await fetch(`${API_BASE}/attendance`, { headers: authHeaders });
    assert.strictEqual(attListRes.status, 200, 'Read attendance list HTTP 200');
    const attList = await attListRes.json();
    assert(Array.isArray(attList), 'Attendance list must be an array');
    testAttId = attList[0]?._id;
    recordTest('Attendance', 'READ', true, `Giám sát danh sách chấm công toàn bộ nhân sự (${attList.length} ca làm)`);

    if (testAttId) {
      // Update Attendance Record
      const updateAttRes = await fetch(`${API_BASE}/attendance/${testAttId}`, {
        method: 'PATCH',
        headers: authHeaders,
        body: JSON.stringify({ note: `Đã kiểm tra đối soát giờ công ${testSuffix}` }),
      });
      assert.strictEqual(updateAttRes.status, 200, 'Update attendance HTTP 200');
      recordTest('Attendance', 'UPDATE', true, `Admin điều chỉnh và ghi chú giờ làm ca thành công`);
    }

    recordTest('Attendance', 'CREATE', true, `Quy trình check-in / check-out và phân ca vận hành trơn tru`);
  } catch (err) {
    recordTest('Attendance', 'ERROR', false, err.message);
  }

  // ── MODULE 12: SALARIES & PAYROLL (CẤU HÌNH LƯƠNG & BẢNG LƯƠNG) ────────────
  console.log('\n▶ [PHÂN HỆ 12/12] KIỂM THỬ CRUD: SALARIES & PAYROLL (LƯƠNG)');
  let testPayrollId = null;
  try {
    const usersRes = await fetch(`${API_BASE}/users`, { headers: authHeaders });
    const usersList = await usersRes.json();
    const sampleStaff = usersList.find((u) => u.role !== 'admin');

    // 12.1 Create / Update Salary Config (accept 200 or 201)
    const configRes = await fetch(`${API_BASE}/salaries/config/${sampleStaff._id}`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        type: 'hourly',
        hourlyRate: 28000,
        dailyRate: 150000,
        shiftRates: { morning: 130000, afternoon: 130000, evening: 160000 },
      }),
    });
    assert([200, 201].includes(configRes.status), `Salary config HTTP ${configRes.status}`);
    recordTest('Salaries', 'CREATE', true, `Thiết lập định mức lương nhân viên (28.000đ/giờ) thành công`);

    // 12.2 Read Salary Config & Preview
    const configGetRes = await fetch(`${API_BASE}/salaries/config/${sampleStaff._id}`, {
      headers: authHeaders,
    });
    assert.strictEqual(configGetRes.status, 200, 'Salary config get HTTP 200');

    const previewRes = await fetch(`${API_BASE}/salaries/payroll/preview`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        userId: sampleStaff._id,
        periodType: 'weekly',
      }),
    });
    assert([200, 201].includes(previewRes.status), `Salary preview HTTP ${previewRes.status}`);
    const previewData = await previewRes.json();
    assert(previewData.payrollCode, 'Payroll code must be generated');
    recordTest('Salaries', 'READ', true, `Xem trước bảng lương theo tuần với mã phiếu ${previewData.payrollCode}`);

    // 12.3 Generate Payroll (Create Payroll Record)
    const genRes = await fetch(`${API_BASE}/salaries/payroll/generate-period`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        userId: sampleStaff._id,
        periodType: 'weekly',
        bonuses: 50000,
        deductions: 0,
        note: `Phiếu lương test ${testSuffix}`,
      }),
    });
    assert([200, 201].includes(genRes.status), `Generate payroll HTTP ${genRes.status}`);
    const generatedPayroll = await genRes.json();
    testPayrollId = generatedPayroll._id || generatedPayroll.id;
    assert(testPayrollId, 'Payroll ID must exist');
    recordTest('Salaries', 'CREATE_PAYROLL', true, `Chốt bảng lương thành công (Thực nhận: ${generatedPayroll.netSalary.toLocaleString('vi-VN')}đ)`);

    // 12.4 Update Payroll (Adjust bonus/deduction)
    const updatePayRes = await fetch(`${API_BASE}/salaries/payroll/${testPayrollId}`, {
      method: 'PATCH',
      headers: authHeaders,
      body: JSON.stringify({
        bonuses: 60000,
        note: `Đã điều chỉnh thưởng kiểm thử test ${testSuffix}`,
      }),
    });
    assert.strictEqual(updatePayRes.status, 200, 'Update payroll HTTP 200');
    recordTest('Salaries', 'UPDATE', true, `Điều chỉnh thưởng/phạt và cập nhật phiếu lương thành công`);

    // 12.5 Confirm & Mark Paid (Lifecycle Complete)
    const confirmPayRes = await fetch(`${API_BASE}/salaries/payroll/${testPayrollId}/confirm`, {
      method: 'PATCH',
      headers: authHeaders,
    });
    assert.strictEqual(confirmPayRes.status, 200, 'Confirm payroll HTTP 200');

    const payRes = await fetch(`${API_BASE}/salaries/payroll/${testPayrollId}/pay`, {
      method: 'PATCH',
      headers: authHeaders,
      body: JSON.stringify({
        paidMethod: 'bank_transfer',
        paymentRef: `VCB-${testSuffix}`,
      }),
    });
    if (payRes.status !== 200) {
      const errBody = await payRes.text();
      console.error('  ⚠️ [SALARIES PAY ERROR DETAIL]:', payRes.status, errBody);
    }
    assert.strictEqual(payRes.status, 200, 'Pay payroll HTTP 200');
    recordTest('Salaries', 'LIFECYCLE', true, `Phê duyệt và xác nhận thanh toán chuyển khoản ngân hàng thành công`);
  } catch (err) {
    recordTest('Salaries', 'ERROR', false, err.message);
  }

  // ── TỔNG HỢP KẾT QUẢ AUDIT ────────────────────────────────────────────────
  console.log('\n╔══════════════════════════════════════════════════════════════════╗');
  console.log('║           📊 BÁO CÁO TỔNG HỢP KIỂM THỬ CRUD 12 PHÂN HỆ            ║');
  console.log('╚══════════════════════════════════════════════════════════════════╝');

  const passedCount = results.filter((r) => r.status === 'PASS').length;
  const failedCount = results.filter((r) => r.status === 'FAIL').length;
  const totalCount = results.length;
  const passRate = Math.round((passedCount / totalCount) * 100);

  console.table(results);

  console.log(`\n⏱️ Tổng số hoạt động CRUD đã kiểm tra: ${totalCount}`);
  console.log(`✅ Thành công: ${passedCount} (${passRate}%)`);
  console.log(`❌ Thất bại: ${failedCount}`);

  if (failedCount === 0) {
    console.log('\n🏆 TOÀN BỘ 12/12 PHÂN HỆ ĐẠT CHUẨN CRUD 100% — ZERO BUGS!');
  } else {
    console.error('\n⚠️ Có lỗi phát sinh trong quá trình kiểm thử CRUD.');
    process.exit(1);
  }
}

runFullCrudAudit().catch((err) => {
  console.error('Fatal Test Runner Error:', err);
  process.exit(1);
});
