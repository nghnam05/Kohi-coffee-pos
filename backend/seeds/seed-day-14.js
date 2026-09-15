const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');

// 1. Parse .env to get MONGODB_URI
const envPath = fs.existsSync(path.join(__dirname, '.env'))
  ? path.join(__dirname, '.env')
  : path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const firstEq = trimmed.indexOf('=');
    if (firstEq === -1) return;
    const key = trimmed.slice(0, firstEq).trim();
    const value = trimmed.slice(firstEq + 1).trim();
    process.env[key] = value;
  });
}

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://namnh4581_db_user:50SAWO4UGkULnCaM@cluster1.5eudgkz.mongodb.net/kohi-coffee';

const CUSTOMER_NAMES = [
  'Nam Hoài', 'Lan Anh', 'Minh Tuấn', 'Hoàng Long', 'Thu Hà',
  'Đức Anh', 'Mai Phương', 'Bảo Ngọc', 'Thành Đạt', 'Khánh Linh',
  'Hữu Phước', 'Quỳnh Nga', 'Thanh Tùng', 'Thảo Nguyên', 'Văn Hưng',
  'Hồng Nhung', 'Quang Huy', 'Diệu Linh', 'Tiến Dũng', 'Kim Ngân',
  'Ngọc Trâm', 'Bảo Hân', 'Tuấn Kiệt', 'Gia Huy', 'Thúy Hằng'
];

const REVIEW_COMMENTS = [
  'Cà phê kem muối béo ngậy vừa miệng, vị cà phê đậm đà rất ưng ý.',
  'Không gian quán yên tĩnh, mát mẻ, làm việc rất tập trung.',
  'Matcha dâu ngon đỉnh chóp, decor đồ uống đẹp mắt chụp hình siêu xinh.',
  'Bánh tart trứng nóng giòn thơm nức mũi, nhân viên phục vụ cực kỳ chu đáo.',
  'Sinh tố dâu cheesecake ngậy thơm không bị quá ngọt, sẽ ghé lại thường xuyên!',
  'Cà phê latte vẽ art đẹp, bọt sữa mịn, phục vụ nhanh nhẹn.',
  'Trà đào thơm thanh, miếng đào giòn ngọt, nhân viên thân thiện 10/10.',
  'Đá xay chocolate kem tươi béo bùi, không gian buổi tối chill cực kỳ.',
  'Bánh donut và macaron ngọt dịu, ăn kèm cà phê đen rất hợp vị.',
  'Đồ uống ra nhanh, bàn ghế sạch sẽ, nhân viên lễ phép và dễ thương.',
  'Cà phê caramel đậu phộng vị lạ mà cuốn, rất đáng thử!',
  'Trà chanh dây giải nhiệt quá đã, decor quán hiện đại và ấm cúng.',
  'Tào phớ trân châu đường đen thanh mát, trân châu dẻo dai vừa miệng.',
  'Cà phê kem trứng muối béo thơm không tanh, rất đậm đà.',
  'Bánh rán nhân khoai môn phô mai kéo sợi thơm phức, ăn kèm cafe chuẩn bài.'
];

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomItem(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function makeVNTime(year, month, day, hour, minute) {
  return new Date(Date.UTC(year, month - 1, day, hour - 7, minute, 0, 0));
}

async function runSeedDay14() {
  console.log('================================================================');
  console.log('🧹 XÓA BỎ DỮ LIỆU NGÀY 13/09/2026 & TẠO DỮ LIỆU CHUẨN NGÀY 14/09/2026');
  console.log('================================================================\n');

  console.log('[DB] Đang kết nối tới MongoDB Atlas...');
  await mongoose.connect(MONGODB_URI);
  const db = mongoose.connection.db;
  console.log('[DB] Kết nối thành công.\n');

  // Khung thời gian ngày 13/09/2026 (Giờ Việt Nam UTC+7)
  const startOfDay13 = makeVNTime(2026, 9, 13, 0, 0);
  const endOfDay13 = makeVNTime(2026, 9, 14, 0, 0);
  const filter13 = { $gte: startOfDay13, $lt: endOfDay13 };

  // Khung thời gian ngày 14/09/2026 (Giờ Việt Nam UTC+7)
  const startOfDay14 = makeVNTime(2026, 9, 14, 0, 0);
  const endOfDay14 = makeVNTime(2026, 9, 15, 0, 0);
  const filter14 = { $gte: startOfDay14, $lt: endOfDay14 };

  // --------------------------------------------------------------------------
  // BƯỚC 1: XÓA SẠCH DỮ LIỆU NGÀY 13/09/2026 (VÀ LÀM SẠCH NGÀY 14 NẾU CÓ)
  // --------------------------------------------------------------------------
  console.log('--- 1. XÓA BỎ TOÀN BỘ DỮ LIỆU GIAO DỊCH NGÀY 13/09/2026 ---');
  const collectionsToClean = [
    { name: 'orders', field: 'createdAt' },
    { name: 'payments', field: 'paidAt' },
    { name: 'attendances', field: 'date' },
    { name: 'expenses', field: 'date' },
    { name: 'ingredientusages', field: 'date' },
    { name: 'reviews', field: 'createdAt' },
    { name: 'reservations', field: 'reservationTime' },
    { name: 'staffcalls', field: 'createdAt' },
  ];

  for (const col of collectionsToClean) {
    // Xóa ngày 13
    const res13 = await db.collection(col.name).deleteMany({ [col.field]: filter13 });
    // Xóa ngày 14 (để tránh trùng lặp)
    const res14 = await db.collection(col.name).deleteMany({ [col.field]: filter14 });
    console.log(`  ✓ Đã xóa [${col.name.padEnd(18)}]: ${res13.deletedCount} bản ghi ngày 13/09, ${res14.deletedCount} bản ghi ngày 14/09`);
  }

  // Reset tất cả các bàn về trạng thái empty sạch sẽ
  await db.collection('tables').updateMany({}, {
    $set: {
      status: 'empty',
      currentSessionStartedAt: null,
      occupants: [],
      activeOrdersCount: 0,
    }
  });
  console.log('  ✓ Đã reset tất cả các bàn về trạng thái "empty".\n');

  // --------------------------------------------------------------------------
  // BƯỚC 2: TẢI MASTER DATA CƠ SỞ (FOODS, TABLES, USERS, INGREDIENTS)
  // --------------------------------------------------------------------------
  console.log('--- 2. LẤY DỮ LIỆU DANH MỤC & NHÂN SỰ ---');
  let foods = await db.collection('foods').find({}).toArray();
  let tables = await db.collection('tables').find({}).toArray();
  let users = await db.collection('users').find({}).toArray();
  let ingredients = await db.collection('ingredients').find({}).toArray();

  console.log(`  • Tổng số món trong Menu : ${foods.length}`);
  console.log(`  • Tổng số bàn cà phê     : ${tables.length}`);
  console.log(`  • Tổng số tài khoản      : ${users.length}`);
  console.log(`  • Tổng số nguyên vật liệu : ${ingredients.length}`);

  const staffUsers = users.filter(u => u.role !== 'admin');
  const pvSang = staffUsers.find(u => u.name === 'PV-SÁNG') || staffUsers[0];
  const pcSang = staffUsers.find(u => u.name === 'PC-SÁNG') || staffUsers[1];
  const pvChieu = staffUsers.find(u => u.name === 'PV-CHIỀU') || staffUsers[2];
  const pcChieu = staffUsers.find(u => u.name === 'PC-CHIỀU') || staffUsers[3];
  const pvToi = staffUsers.find(u => u.name === 'PV-TỐI') || staffUsers[4];
  const pcToi = staffUsers.find(u => u.name === 'PC-TỐI') || staffUsers[5];

  // --------------------------------------------------------------------------
  // BƯỚC 3: TẠO DỮ LIỆU ĐƠN HÀNG & DOANH THU CHO NGÀY 14/09/2026
  // --------------------------------------------------------------------------
  console.log('\n--- 3. TẠO ĐƠN HÀNG & HÓA ĐƠN DOANH THU NGÀY 14/09/2026 ---');
  const allOrders = [];
  const allPayments = [];
  const allReviews = [];

  // Xác định số hóa đơn bắt đầu
  const latestPayment = await db.collection('payments').find({}).sort({ invoiceCode: -1 }).limit(1).toArray();
  let invoiceSeq = 2000;
  if (latestPayment.length > 0 && latestPayment[0].invoiceCode) {
    const num = parseInt(latestPayment[0].invoiceCode.replace(/\D/g, ''), 10);
    if (!isNaN(num)) invoiceSeq = Math.max(invoiceSeq, num);
  }

  // Phân bổ 48 đơn hàng hoàn tất trong ngày 14/09:
  // - Ca sáng (07:15 - 11:45): 18 đơn
  // - Ca chiều (12:00 - 17:15): 20 đơn
  // - Ca tối (17:30 - 22:00): 10 đơn
  const timeSlots = [];
  for (let i = 0; i < 18; i++) {
    timeSlots.push({ h: getRandomInt(7, 11), m: getRandomInt(10, 55), staff: 'PV-SÁNG' });
  }
  for (let i = 0; i < 20; i++) {
    timeSlots.push({ h: getRandomInt(12, 16), m: getRandomInt(5, 55), staff: 'PV-CHIỀU' });
  }
  for (let i = 0; i < 10; i++) {
    timeSlots.push({ h: getRandomInt(17, 21), m: getRandomInt(10, 50), staff: 'PV-TỐI' });
  }

  timeSlots.sort((a, b) => (a.h * 60 + a.m) - (b.h * 60 + b.m));

  for (const slot of timeSlots) {
    invoiceSeq++;
    const assignedTable = getRandomItem(tables);
    const customerName = getRandomItem(CUSTOMER_NAMES);
    const randPay = Math.random();
    const paymentMethod = randPay < 0.55 ? 'bank_transfer' : (randPay < 0.85 ? 'cash' : 'momo');

    const orderTime = makeVNTime(2026, 9, 14, slot.h, slot.m);
    const paidTime = new Date(orderTime.getTime() + getRandomInt(8, 25) * 60000);

    const itemCount = getRandomInt(1, 3);
    const orderItems = [];
    for (let k = 0; k < itemCount; k++) {
      const f = getRandomItem(foods);
      orderItems.push({
        foodId: f._id,
        foodName: f.name,
        price: f.price,
        quantity: getRandomInt(1, 2),
        note: Math.random() < 0.35 ? getRandomItem(['Ít đá', '70% đường', 'Nhiều sữa', 'Nóng', 'Ít ngọt']) : '',
      });
    }

    const subtotal = orderItems.reduce((s, itm) => s + itm.price * itm.quantity, 0);
    let discountAmount = 0;
    let couponCode = null;
    if (subtotal >= 300000) {
      couponCode = 'KOHI10';
      discountAmount = Math.round(subtotal * 0.1);
    }
    const totalAmount = subtotal - discountAmount;
    const orderId = new mongoose.Types.ObjectId();

    const orderDoc = {
      _id: orderId,
      tableId: assignedTable._id,
      tableName: assignedTable.tableName,
      isTakeaway: Math.random() < 0.2,
      items: orderItems.map(i => ({
        foodId: i.foodId,
        quantity: i.quantity,
        note: i.note,
        orderedBy: customerName,
        isPaid: true,
        paidBy: customerName,
        paidAt: paidTime,
      })),
      totalAmount,
      status: 'paid',
      paymentStatus: 'paid',
      paymentMethod: paymentMethod === 'momo' ? 'momo' : (paymentMethod === 'bank_transfer' ? 'bank_transfer' : 'cash'),
      couponCode,
      discountAmount,
      customerName,
      customerPhone: '09' + getRandomInt(10000000, 99999999),
      paidAt: paidTime,
      paidAmount: totalAmount,
      isDeleted: false,
      createdAt: orderTime,
      updatedAt: paidTime,
    };
    allOrders.push(orderDoc);

    const paymentDoc = {
      _id: new mongoose.Types.ObjectId(),
      invoiceCode: `HD-${invoiceSeq}`,
      orderId: orderDoc._id,
      tableId: assignedTable._id,
      tableName: assignedTable.tableName,
      customerName,
      items: orderItems.map(i => ({
        foodId: i.foodId,
        foodName: i.foodName,
        price: i.price,
        quantity: i.quantity,
        total: i.price * i.quantity,
        note: i.note,
      })),
      subtotal,
      discountAmount,
      couponCode,
      totalAmount,
      paymentMethod: paymentMethod === 'bank_transfer' ? 'bank' : (paymentMethod === 'momo' ? 'momo' : 'cash'),
      transactionCode: paymentMethod !== 'cash' ? `FT${getRandomInt(10000000, 99999999)}` : null,
      staffName: slot.staff,
      paidAt: paidTime,
      isDeleted: false,
      createdAt: paidTime,
      updatedAt: paidTime,
    };
    allPayments.push(paymentDoc);

    // 25% đơn có đánh giá review
    if (Math.random() < 0.25) {
      allReviews.push({
        _id: new mongoose.Types.ObjectId(),
        orderId: orderDoc._id,
        foodId: orderItems[0].foodId,
        customerName,
        customerPhone: orderDoc.customerPhone,
        rating: Math.random() < 0.8 ? 5 : 4,
        comment: getRandomItem(REVIEW_COMMENTS),
        isDeleted: false,
        createdAt: new Date(paidTime.getTime() + getRandomInt(5, 30) * 60000),
        updatedAt: new Date(paidTime.getTime() + getRandomInt(5, 30) * 60000),
      });
    }
  }

  console.log(`  ✓ Đã tạo ${allOrders.length} đơn hàng ngày 14/09 (100% đã thanh toán).`);
  console.log(`  ✓ Đã tạo ${allPayments.length} hóa đơn giao dịch ngày 14/09.`);
  console.log(`  ✓ Đã tạo ${allReviews.length} đánh giá khách hàng.`);

  // --------------------------------------------------------------------------
  // BƯỚC 4: TẠO CHI PHÍ VẬN HÀNH NGÀY 14/09/2026 (EXPENSES)
  // --------------------------------------------------------------------------
  console.log('\n--- 4. TẠO CHI PHÍ HOẠT ĐỘNG NGÀY 14/09/2026 ---');
  const allExpenses = [];
  const expTime1 = makeVNTime(2026, 9, 14, 8, 30);
  allExpenses.push({
    _id: new mongoose.Types.ObjectId(),
    title: 'Đá bi sạch tinh khiết pha chế trong ngày',
    amount: 50000,
    date: expTime1,
    category: 'Đá & Đồ uống phụ',
    note: 'Nhập đá viên hàng ngày từ xưởng đá tinh khiết',
    createdBy: 'PV-SÁNG',
    createdAt: expTime1,
    updatedAt: expTime1,
  });

  const expTime2 = makeVNTime(2026, 9, 14, 14, 20);
  allExpenses.push({
    _id: new mongoose.Types.ObjectId(),
    title: 'Túi chữ T mang đi & nắp cầu ly nhựa mang về',
    amount: 120000,
    date: expTime2,
    category: 'Vật tư & Tiện ích',
    note: 'Bổ sung vật tư đóng gói đồ uống take-away trong ngày',
    createdBy: 'Admin',
    createdAt: expTime2,
    updatedAt: expTime2,
  });

  console.log(`  ✓ Đã tạo ${allExpenses.length} khoản chi phí phát sinh.`);

  // --------------------------------------------------------------------------
  // BƯỚC 5: TẠO ĐIỂM DANH ĐẦY ĐỦ 3 CA (ATTENDANCES) -> ĐỦ ĐIỀU KIỆN QUYẾT TOÁN
  // --------------------------------------------------------------------------
  console.log('\n--- 5. TẠO ĐIỂM DANH NHÂN VIÊN NGÀY 14/09/2026 (3 CA ĐÃ CHECKOUT) ---');
  const allAttendances = [];
  const dateOnly14 = makeVNTime(2026, 9, 14, 0, 0);

  // Ca Sáng (06:45 - 12:05)
  const morningShifts = [
    { staff: pvSang, shift: 'morning', inH: 6, inM: 45, outH: 12, outM: 5, note: 'Đúng giờ, mở cửa bàn ghế ngăn nắp' },
    { staff: pcSang, shift: 'morning', inH: 6, inM: 40, outH: 12, outM: 10, note: 'Kiểm tra máy pha, chuẩn bị quầy bar' }
  ];
  for (const ms of morningShifts) {
    const inTime = makeVNTime(2026, 9, 14, ms.inH, ms.inM);
    const outTime = makeVNTime(2026, 9, 14, ms.outH, ms.outM);
    const hours = parseFloat(((outTime.getTime() - inTime.getTime()) / (1000 * 60 * 60)).toFixed(2));
    allAttendances.push({
      _id: new mongoose.Types.ObjectId(),
      userId: ms.staff._id,
      date: dateOnly14,
      checkIn: inTime,
      checkOut: outTime,
      shift: ms.shift,
      totalHours: hours,
      note: ms.note,
      isManualEdit: false,
      isPaid: false,
      createdAt: inTime,
      updatedAt: outTime,
    });
  }

  // Ca Chiều (11:55 - 17:35)
  const afternoonShifts = [
    { staff: pvChieu, shift: 'afternoon', inH: 11, inM: 55, outH: 17, outM: 35, note: 'Đúng giờ, nhận bàn giao ca chu đáo' },
    { staff: pcChieu, shift: 'afternoon', inH: 11, inM: 50, outH: 17, outM: 40, note: 'Bổ sung nguyên liệu, pha chế kịp thời' }
  ];
  for (const as of afternoonShifts) {
    const inTime = makeVNTime(2026, 9, 14, as.inH, as.inM);
    const outTime = makeVNTime(2026, 9, 14, as.outH, as.outM);
    const hours = parseFloat(((outTime.getTime() - inTime.getTime()) / (1000 * 60 * 60)).toFixed(2));
    allAttendances.push({
      _id: new mongoose.Types.ObjectId(),
      userId: as.staff._id,
      date: dateOnly14,
      checkIn: inTime,
      checkOut: outTime,
      shift: as.shift,
      totalHours: hours,
      note: as.note,
      isManualEdit: false,
      isPaid: false,
      createdAt: inTime,
      updatedAt: outTime,
    });
  }

  // Ca Tối (17:20 - 22:35)
  const eveningShifts = [
    { staff: pvToi, shift: 'evening', inH: 17, inM: 25, outH: 22, outM: 35, note: 'Đúng giờ, vệ sinh bàn ghế ngăn nắp' },
    { staff: pcToi, shift: 'evening', inH: 17, inM: 20, outH: 22, outM: 45, note: 'Vệ sinh và xả áp máy cà phê cuối ngày' }
  ];
  for (const es of eveningShifts) {
    const inTime = makeVNTime(2026, 9, 14, es.inH, es.inM);
    const outTime = makeVNTime(2026, 9, 14, es.outH, es.outM);
    const hours = parseFloat(((outTime.getTime() - inTime.getTime()) / (1000 * 60 * 60)).toFixed(2));
    allAttendances.push({
      _id: new mongoose.Types.ObjectId(),
      userId: es.staff._id,
      date: dateOnly14,
      checkIn: inTime,
      checkOut: outTime,
      shift: es.shift,
      totalHours: hours,
      note: es.note,
      isManualEdit: false,
      isPaid: false,
      createdAt: inTime,
      updatedAt: outTime,
    });
  }

  console.log(`  ✓ Đã tạo ${allAttendances.length} bản ghi chấm công (toàn bộ 6 ca đã check-out).`);

  // --------------------------------------------------------------------------
  // BƯỚC 6: TẠO TIÊU HAO NGUYÊN LIỆU NGÀY 14/09/2026 (INGREDIENT USAGES)
  // --------------------------------------------------------------------------
  console.log('\n--- 6. TẠO TIÊU HAO NGUYÊN LIỆU NGÀY 14/09/2026 ---');
  const allIngredientUsages = [];
  const ingUsagePresets = [
    { key: 'Robusta', qty: 2.9, cost: 290000 },
    { key: 'Arabica', qty: 1.7, cost: 340000 },
    { key: 'Sữa Tươi', qty: 7.8, cost: 234000 },
    { key: 'Sữa Đặc', qty: 3.4, cost: 136000 },
    { key: 'Đường', qty: 2.6, cost: 52000 },
    { key: 'Matcha', qty: 0.38, cost: 266000 },
    { key: 'Kem Béo', qty: 1.9, cost: 133000 },
    { key: 'Siro', qty: 0.65, cost: 78000 },
  ];

  const usageRecordTime = makeVNTime(2026, 9, 14, 21, 45);
  for (const preset of ingUsagePresets) {
    const ing = ingredients.find(i => i.name.toLowerCase().includes(preset.key.toLowerCase()));
    if (ing) {
      allIngredientUsages.push({
        _id: new mongoose.Types.ObjectId(),
        ingredientId: ing._id,
        ingredientName: ing.name,
        quantityUsed: preset.qty,
        unit: ing.unit || 'kg',
        costPerUnit: Math.round(preset.cost / preset.qty),
        totalCost: preset.cost,
        reason: 'Pha chế phục vụ các đơn hàng trong ngày',
        date: usageRecordTime,
        recordedBy: 'PV-TỐI',
        createdAt: usageRecordTime,
        updatedAt: usageRecordTime,
      });
    }
  }
  console.log(`  ✓ Đã tạo ${allIngredientUsages.length} bản ghi tiêu hao nguyên vật liệu.`);

  // --------------------------------------------------------------------------
  // BƯỚC 7: LƯU TẤT CẢ VÀO CSDL
  // --------------------------------------------------------------------------
  console.log('\n--- 7. LƯU DỮ LIỆU VÀO MONGODB ATLAS ---');
  if (allOrders.length > 0) await db.collection('orders').insertMany(allOrders);
  if (allPayments.length > 0) await db.collection('payments').insertMany(allPayments);
  if (allReviews.length > 0) await db.collection('reviews').insertMany(allReviews);
  if (allExpenses.length > 0) await db.collection('expenses').insertMany(allExpenses);
  if (allAttendances.length > 0) await db.collection('attendances').insertMany(allAttendances);
  if (allIngredientUsages.length > 0) await db.collection('ingredientusages').insertMany(allIngredientUsages);

  // Đảm bảo tồn kho nguyên liệu
  for (const ing of ingredients) {
    await db.collection('ingredients').updateOne(
      { _id: ing._id },
      { $set: { status: 'in_stock' } }
    );
  }

  // --------------------------------------------------------------------------
  // BƯỚC 8: TỔNG HỢP VÀ BÁO CÁO KẾT QUẢ QUYẾT TOÁN TÀI CHÍNH
  // --------------------------------------------------------------------------
  const totalRev = allPayments.reduce((s, p) => s + (p.totalAmount || 0), 0);
  const totalIngCost = allIngredientUsages.reduce((s, i) => s + (i.totalCost || 0), 0);
  const totalExp = allExpenses.reduce((s, e) => s + (e.amount || 0), 0);
  const totalHours = allAttendances.reduce((s, a) => s + (a.totalHours || 0), 0);
  const totalSalary = Math.round(totalHours * 25000);
  const netProfit = totalRev - totalIngCost - totalExp - totalSalary;

  console.log('\n================================================================');
  console.log('📊 KẾT QUẢ QUYẾT TOÁN TÀI CHÍNH NGÀY 14/09/2026 (CHÍNH THỨC):');
  console.log('================================================================');
  console.log(`• 1. Tổng Doanh Thu (48 hóa đơn)   : ${totalRev.toLocaleString('vi-VN')} đ`);
  console.log(`• 2. Chi Phí Lương (6 ca làm việc)  : ${totalSalary.toLocaleString('vi-VN')} đ (${totalHours.toFixed(1)} giờ)`);
  console.log(`• 3. Tiền Nguyên Liệu Tiêu Hao      : ${totalIngCost.toLocaleString('vi-VN')} đ`);
  console.log(`• 4. Chi Phí Phát Sinh Vận Hành     : ${totalExp.toLocaleString('vi-VN')} đ`);
  console.log(`• 5. LỢI NHUẬN RÒNG CHÍNH THỨC     : ${netProfit.toLocaleString('vi-VN')} đ`);
  console.log('• Trạng Thái Quyết Toán            : ✅ ĐỦ ĐIỀU KIỆN QUYẾT TOÁN (CHÍNH THỨC)');
  console.log('  - Ca làm việc chưa checkout      : 0 ca');
  console.log('  - Đơn hàng chưa thanh toán       : 0 đơn');
  console.log('  - Bàn đang có khách ngồi         : 0 bàn');
  console.log('================================================================\n');

  await mongoose.disconnect();
  console.log('✨ HOÀN TẤT THÀNH CÔNG!');
}

runSeedDay14().catch((err) => {
  console.error('Lỗi khi thực hiện:', err);
  process.exit(1);
});
