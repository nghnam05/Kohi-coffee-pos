/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║   ☕ KOHI COFFEE POS - REAL-WORLD CUSTOMER ORDERING OPERATION TEST SUITE   ║
 * ║   Simulates 100% Real Operational Lifecycle:                               ║
 * ║   Customer -> Waiter -> Barista KDS -> Waiter Delivery -> Cashier -> Review║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 */

const assert = require('assert');

const API_BASE = process.env.API_BASE || 'http://127.0.0.1:3001/api/v1';

const TABLE_ID = '6a96c168831b75e296633678'; // Bàn số 4
let adminToken = '';
let waiterToken = '';
let baristaToken = '';

let testOrderId = '';
let testReviewId = '';
const initialSoldCountMap = new Map();

const auditLogs = [];
function logStep(stepNum, title, details = '') {
  const line = `[BƯỚC ${stepNum}] ${title} ${details ? '-> ' + details : ''}`;
  console.log(`\n🔹 ${line}`);
  auditLogs.push(line);
}

function assertSuccess(label, cond, extra = '') {
  if (!cond) {
    console.error(`  ❌ THẤT BẠI: ${label} ${extra}`);
    throw new Error(`Assertion failed: ${label}`);
  }
  console.log(`  ✅ THÀNH CÔNG: ${label} ${extra ? '(' + extra + ')' : ''}`);
}

async function runOperationalSimulation() {
  console.log('═════════════════════════════════════════════════════════════════════');
  console.log('🚀 BẮT ĐẦU KIỂM THỬ MÔ PHỎNG VẬN HÀNH THẬT: LUỒNG ĐẶT MÓN TẠI BÀN');
  console.log('═════════════════════════════════════════════════════════════════════');

  // ───────────────────────────────────────────────────────────────────────────
  // BƯỚC 0: ĐĂNG NHẬP CÁC NHÂN SỰ VẬN HÀNH (Admin, Phục vụ, Pha chế)
  // ───────────────────────────────────────────────────────────────────────────
  logStep(0, 'Khởi tạo phiên & Đăng nhập các vai trò nhân sự');

  const adminRes = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@kohi.vn', password: '123456' }),
  });
  assert.strictEqual(adminRes.status, 200, 'Admin login status 200');
  const adminData = await adminRes.json();
  adminToken = adminData.access_token;
  assertSuccess('Admin đăng nhập', !!adminToken, 'Quản lý quầy & Thu ngân');

  const waiterRes = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'pvtoi@kohi.vn', password: '123456' }),
  });
  assert.strictEqual(waiterRes.status, 200, 'Waiter login status 200');
  const waiterData = await waiterRes.json();
  waiterToken = waiterData.access_token;
  assertSuccess('Nhân viên Phục vụ (Waiter) đăng nhập', !!waiterToken, 'Tên: PV-TỐI');

  const baristaRes = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'pctoi@kohi.vn', password: '123456' }),
  });
  assert.strictEqual(baristaRes.status, 200, 'Barista login status 200');
  const baristaData = await baristaRes.json();
  baristaToken = baristaData.access_token;
  assertSuccess('Nhân viên Pha chế (Barista KDS) đăng nhập', !!baristaToken, 'Tên: PC-TỐI');

  // Đảm bảo Bàn số 4 sẵn sàng (empty) trước khi khách vào
  await fetch(`${API_BASE}/tables/${TABLE_ID}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({ status: 'empty' }),
  });

  // ───────────────────────────────────────────────────────────────────────────
  // BƯỚC 1: KHÁCH HÀNG VÀO QUÁN, QUÉT MÃ QR BÀN SỐ 4 & XEM THỰC ĐƠN
  // ───────────────────────────────────────────────────────────────────────────
  logStep(1, 'Khách hàng quét mã QR Bàn số 4 & tải Menu trực tuyến');

  const tableRes = await fetch(`${API_BASE}/tables/${TABLE_ID}`);
  assert.strictEqual(tableRes.status, 200, 'Tải thông tin bàn');
  const tableData = await tableRes.json();
  assertSuccess('Xác thực bàn phục vụ', tableData.tableName === 'Bàn số 4' && tableData.status === 'empty', `Tên bàn: ${tableData.tableName}, Trạng thái ban đầu: ${tableData.status}`);

  const foodsRes = await fetch(`${API_BASE}/foods`);
  assert.strictEqual(foodsRes.status, 200, 'Tải danh mục món');
  const allFoods = await foodsRes.json();
  const availableFoods = allFoods.filter((f) => f.isAvailable);
  assertSuccess('Tải danh sách món sẵn sàng phục vụ', availableFoods.length > 0, `Có ${availableFoods.length} món sẵn có`);

  // Chọn 3 món đại diện: Cà phê phin, Caramel Macchiato, Americano đá
  const item1 = allFoods.find((f) => f.name.includes('Phin Nguyên Chất')) || allFoods[0];
  const item2 = allFoods.find((f) => f.name.includes('Caramel Macchiato')) || allFoods[1];
  const item3 = allFoods.find((f) => f.name.includes('Americano')) || allFoods[2];

  initialSoldCountMap.set(item1._id, item1.soldCount || 0);
  initialSoldCountMap.set(item2._id, item2.soldCount || 0);
  initialSoldCountMap.set(item3._id, item3.soldCount || 0);

  console.log(`  📌 Món 1: ${item1.name} (${item1.price.toLocaleString()}đ) - Đã bán: ${initialSoldCountMap.get(item1._id)}`);
  console.log(`  📌 Món 2: ${item2.name} (${item2.price.toLocaleString()}đ) - Đã bán: ${initialSoldCountMap.get(item2._id)}`);
  console.log(`  📌 Món 3: ${item3.name} (${item3.price.toLocaleString()}đ) - Đã bán: ${initialSoldCountMap.get(item3._id)}`);

  // ───────────────────────────────────────────────────────────────────────────
  // BƯỚC 2: KHÁCH CHỌN MÓN, TÙY BIẾN KHẨU VỊ & ÁP DỤNG MÃ GIẢM GIÁ
  // ───────────────────────────────────────────────────────────────────────────
  logStep(2, 'Khách hàng chọn số lượng, ghi chú Barista & nhập Voucher WELCOME20');

  const selectedItems = [
    {
      foodId: item1._id,
      quantity: 2,
      note: 'Ít đường (30%), nhiều đá, chuẩn vị Kohi',
    },
    {
      foodId: item2._id,
      quantity: 1,
      note: 'Uống nóng, thêm sốt caramel ngọt ngào',
    },
    {
      foodId: item3._id,
      quantity: 1,
      note: 'Đá riêng, không thêm syrup',
    },
  ];

  const subTotal = (item1.price * 2) + (item2.price * 1) + (item3.price * 1);
  assertSuccess('Tính tổng tiền giỏ hàng', subTotal === 137000, `Tạm tính: ${subTotal.toLocaleString()}đ`);

  // Kiểm tra tính hợp lệ của mã giảm giá WELCOME20
  const couponCheckRes = await fetch(`${API_BASE}/coupons/validate/WELCOME20?amount=${subTotal}`);
  assert.strictEqual(couponCheckRes.status, 200, 'Xác thực coupon');
  const couponResult = await couponCheckRes.json();
  assertSuccess('Áp dụng Voucher WELCOME20', couponResult.valid === true, `Giảm: ${couponResult.discountAmount.toLocaleString()}đ`);

  const expectedDiscount = Math.round(subTotal * 0.20);
  const expectedTotal = subTotal - expectedDiscount;
  assert.strictEqual(couponResult.discountAmount, expectedDiscount, 'Mức giảm 20% chính xác');

  // ───────────────────────────────────────────────────────────────────────────
  // BƯỚC 3: KHÁCH HÀNG GỬI ĐƠN ĐẶT MÓN (POST /orders) -> Trạng thái: PENDING
  // ───────────────────────────────────────────────────────────────────────────
  logStep(3, 'Khách hàng nhấn Xác nhận Đặt món -> Tạo đơn PENDING');

  const orderPayload = {
    tableId: TABLE_ID,
    customerName: 'Anh Nam (Khách Trải Nghiệm Bàn 4)',
    items: selectedItems,
    couponCode: 'WELCOME20',
    paymentMethod: 'bank_transfer',
  };

  const createOrderRes = await fetch(`${API_BASE}/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(orderPayload),
  });
  assert.strictEqual(createOrderRes.status, 201, 'Tạo đơn hàng thành công HTTP 201');
  const createdOrder = await createOrderRes.json();
  testOrderId = createdOrder._id;

  assertSuccess('Đơn hàng khởi tạo thành công', !!testOrderId, `Order ID: ${testOrderId}`);
  assertSuccess('Trạng thái khởi tạo', createdOrder.status === 'pending', 'status: pending');
  assertSuccess('Chiết khấu lưu vào DB', createdOrder.discountAmount === expectedDiscount, `Giảm giá: ${createdOrder.discountAmount.toLocaleString()}đ`);
  assertSuccess('Tổng tiền thanh toán cuối', createdOrder.totalAmount === expectedTotal, `Tổng: ${createdOrder.totalAmount.toLocaleString()}đ`);

  // Kiểm tra Bàn số 4 tự động chuyển trạng thái sang "serving" (đang phục vụ)
  const tableAfterOrderRes = await fetch(`${API_BASE}/tables/${TABLE_ID}`);
  const tableAfterOrder = await tableAfterOrderRes.json();
  assertSuccess('Bàn số 4 tự động nhận diện có khách', tableAfterOrder.status === 'serving', `Trạng thái bàn hiện tại: ${tableAfterOrder.status}`);

  // ───────────────────────────────────────────────────────────────────────────
  // BƯỚC 4: NHÂN VIÊN PHỤC VỤ DUYỆT ĐƠN -> Trạng thái: CONFIRMED
  // ───────────────────────────────────────────────────────────────────────────
  logStep(4, 'Phục vụ (Waiter) kiểm tra đơn trên POS & bấm Duyệt đơn');

  const waiterOrdersRes = await fetch(`${API_BASE}/orders/table/${TABLE_ID}`, {
    headers: { Authorization: `Bearer ${waiterToken}` },
  });
  assert.strictEqual(waiterOrdersRes.status, 200, 'Waiter lấy danh sách đơn');
  const waiterOrders = await waiterOrdersRes.json();
  const targetPendingOrder = waiterOrders.find((o) => o._id === testOrderId);
  assertSuccess('Phục vụ thấy đơn hàng của Bàn 4', !!targetPendingOrder, `Khách: ${targetPendingOrder.customerName}`);

  const confirmRes = await fetch(`${API_BASE}/orders/${testOrderId}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${waiterToken}` },
    body: JSON.stringify({ status: 'confirmed' }),
  });
  assert.strictEqual(confirmRes.status, 200, 'Duyệt đơn HTTP 200');
  const confirmedOrder = await confirmRes.json();
  assertSuccess('Đơn hàng chuyển sang Đã duyệt', confirmedOrder.status === 'confirmed', 'status: confirmed -> Đã chuyển tới quầy Barista KDS');

  // ───────────────────────────────────────────────────────────────────────────
  // BƯỚC 5: BARISTA TIẾP NHẬN ĐƠN TRÊN KDS & BẮT ĐẦU PHA CHẾ -> Trạng thái: COOKING
  // ───────────────────────────────────────────────────────────────────────────
  logStep(5, 'Barista nhận đơn trên màn hình KDS & bấm Bắt đầu pha chế');

  const cookingRes = await fetch(`${API_BASE}/orders/${testOrderId}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${baristaToken}` },
    body: JSON.stringify({ status: 'cooking' }),
  });
  assert.strictEqual(cookingRes.status, 200, 'Bắt đầu pha chế HTTP 200');
  const cookingOrder = await cookingRes.json();
  assertSuccess('Barista đang chuẩn bị món', cookingOrder.status === 'cooking', 'status: cooking -> Khách hàng thấy tiến trình "Đang pha chế"');

  // ───────────────────────────────────────────────────────────────────────────
  // BƯỚC 6: BARISTA HOÀN TẤT PHA CHẾ & BÁO SẴN SÀNG RA MÓN -> Trạng thái: READY
  // ───────────────────────────────────────────────────────────────────────────
  logStep(6, 'Barista hoàn tất 4 ly đồ uống & bấm Chuẩn bị xong (Ready)');

  const readyRes = await fetch(`${API_BASE}/orders/${testOrderId}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${baristaToken}` },
    body: JSON.stringify({ status: 'ready' }),
  });
  assert.strictEqual(readyRes.status, 200, 'Đồ uống sẵn sàng HTTP 200');
  const readyOrder = await readyRes.json();
  assertSuccess('Đồ uống đã làm xong tại quầy Bar', readyOrder.status === 'ready', 'status: ready -> Chuông báo và socket gửi tới nhân viên phục vụ');

  // ───────────────────────────────────────────────────────────────────────────
  // BƯỚC 7: PHỤC VỤ BƯNG ĐỒ UỐNG RA BÀN CHO KHÁCH -> Trạng thái: COMPLETED
  // ───────────────────────────────────────────────────────────────────────────
  logStep(7, 'Phục vụ mang thức uống ra Bàn số 4 & cập nhật Đã ra món');

  const completeRes = await fetch(`${API_BASE}/orders/${testOrderId}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${waiterToken}` },
    body: JSON.stringify({ status: 'completed' }),
  });
  assert.strictEqual(completeRes.status, 200, 'Ra món thành công HTTP 200');
  const completedOrder = await completeRes.json();
  assertSuccess('Khách đã nhận đủ đồ uống tại bàn', completedOrder.status === 'completed', 'status: completed -> Khách bắt đầu thưởng thức');

  // ───────────────────────────────────────────────────────────────────────────
  // BƯỚC 8: THANH TOÁN HÓA ĐƠN & TỰ ĐỘNG GIẢI PHÓNG BÀN -> Trạng thái: PAID
  // ───────────────────────────────────────────────────────────────────────────
  logStep(8, 'Khách hàng thanh toán chuyển khoản / Thu ngân xác nhận ĐÃ THANH TOÁN');

  const payRes = await fetch(`${API_BASE}/orders/${testOrderId}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({ status: 'paid' }),
  });
  assert.strictEqual(payRes.status, 200, 'Xác nhận thanh toán HTTP 200');
  const paidOrder = await payRes.json();
  assertSuccess('Đơn hàng thanh toán hoàn tất', paidOrder.status === 'paid' && paidOrder.paymentStatus === 'paid', 'status: paid, paymentStatus: paid');

  // Kiểm tra số lượng đã bán (soldCount) được tự động cộng dồn
  const updatedFoodsRes = await fetch(`${API_BASE}/foods`);
  const updatedFoods = await updatedFoodsRes.json();
  const updatedItem1 = updatedFoods.find((f) => f._id === item1._id);
  const updatedItem2 = updatedFoods.find((f) => f._id === item2._id);
  const updatedItem3 = updatedFoods.find((f) => f._id === item3._id);

  assertSuccess(
    'Cộng dồn số lượng đã bán (soldCount) món 1 (+2)',
    (updatedItem1.soldCount || 0) === initialSoldCountMap.get(item1._id) + 2,
    `Ban đầu: ${initialSoldCountMap.get(item1._id)} -> Hiện tại: ${updatedItem1.soldCount}`
  );
  assertSuccess(
    'Cộng dồn số lượng đã bán (soldCount) món 2 (+1)',
    (updatedItem2.soldCount || 0) === initialSoldCountMap.get(item2._id) + 1,
    `Ban đầu: ${initialSoldCountMap.get(item2._id)} -> Hiện tại: ${updatedItem2.soldCount}`
  );
  assertSuccess(
    'Cộng dồn số lượng đã bán (soldCount) món 3 (+1)',
    (updatedItem3.soldCount || 0) === initialSoldCountMap.get(item3._id) + 1,
    `Ban đầu: ${initialSoldCountMap.get(item3._id)} -> Hiện tại: ${updatedItem3.soldCount}`
  );

  // Kiểm tra Bàn số 4 tự động được giải phóng (empty)
  const tableAfterPayRes = await fetch(`${API_BASE}/tables/${TABLE_ID}`);
  const tableAfterPay = await tableAfterPayRes.json();
  assertSuccess('Bàn số 4 tự động giải phóng sẵn sàng đón khách mới', tableAfterPay.status === 'empty', `Trạng thái bàn: ${tableAfterPay.status}`);

  // ───────────────────────────────────────────────────────────────────────────
  // BƯỚC 9: KHÁCH HÀNG GỬI ĐÁNH GIÁ 5 SAO & NHẬN XÉT TRẢI NGHIỆM
  // ───────────────────────────────────────────────────────────────────────────
  logStep(9, 'Khách hàng gửi đánh giá 5 sao và nhận xét đồ uống trên giao diện');

  const reviewPayload = {
    orderId: testOrderId,
    tableId: TABLE_ID,
    overallStar: 5,
    overallComment: 'Cà phê rất thơm ngon chuẩn vị, nhân viên phục vụ chu đáo, Barista làm nhanh và chuẩn ghi chú!',
    ratings: [
      { foodId: item1._id, star: 5, comment: 'Cà phê phin đậm đà nguyên bản' },
      { foodId: item2._id, star: 5, comment: 'Caramel ngọt thanh, lớp foam mịn' },
      { foodId: item3._id, star: 5, comment: 'Americano thanh mát sảng khoái' },
    ],
  };

  const reviewRes = await fetch(`${API_BASE}/reviews`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(reviewPayload),
  });
  assert.strictEqual(reviewRes.status, 201, 'Gửi đánh giá HTTP 201');
  const reviewData = await reviewRes.json();
  testReviewId = reviewData._id;
  assertSuccess('Gửi đánh giá 5 sao thành công', !!testReviewId, `Review ID: ${testReviewId}, Sao: ${reviewData.overallStar}⭐`);

  // Kiểm tra truy xuất đánh giá theo orderId
  const getReviewRes = await fetch(`${API_BASE}/reviews/order/${testOrderId}`);
  assert.strictEqual(getReviewRes.status, 200, 'Lấy chi tiết đánh giá');
  const fetchedReview = await getReviewRes.json();
  assertSuccess('Hệ thống ghi nhận và liên kết đánh giá với đơn hàng', fetchedReview.overallStar === 5, `Nhận xét: "${fetchedReview.overallComment}"`);

  // ───────────────────────────────────────────────────────────────────────────
  // BƯỚC 10: DỌN DẸP DỮ LIỆU KIỂM THỬ (CLEANUP ARTIFACTS)
  // ───────────────────────────────────────────────────────────────────────────
  logStep(10, 'Dọn dẹp bản ghi kiểm thử để giữ database sạch sẽ');

  // Xóa review kiểm thử
  if (testReviewId) {
    const delReviewRes = await fetch(`${API_BASE}/reviews/${testReviewId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    console.log(`  🧹 Xóa Review kiểm thử (${testReviewId}): status ${delReviewRes.status}`);
  }

  // Khôi phục soldCount của các món về giá trị ban đầu để không làm sai lệch báo cáo kinh doanh thật
  await fetch(`${API_BASE}/foods/${item1._id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({ soldCount: initialSoldCountMap.get(item1._id) }),
  });
  await fetch(`${API_BASE}/foods/${item2._id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({ soldCount: initialSoldCountMap.get(item2._id) }),
  });
  await fetch(`${API_BASE}/foods/${item3._id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({ soldCount: initialSoldCountMap.get(item3._id) }),
  });
  console.log('  🧹 Khôi phục số liệu soldCount về trạng thái ban đầu');

  // Đảm bảo bàn số 4 ở trạng thái empty
  await fetch(`${API_BASE}/tables/${TABLE_ID}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({ status: 'empty' }),
  });
  console.log('  🧹 Đảm bảo Bàn số 4 ở trạng thái "empty"');

  console.log('\n═════════════════════════════════════════════════════════════════════');
  console.log('🎯 KẾT QUẢ KIỂM THỬ TOÀN DIỆN VẬN HÀNH THẬT: 10/10 GIAI ĐOẠN ĐẠT 100%!');
  console.log('═════════════════════════════════════════════════════════════════════');
}

runOperationalSimulation().catch((err) => {
  console.error('\n❌ LỖI TRONG QUÁ TRÌNH KIỂM THỬ:', err);
  process.exit(1);
});
