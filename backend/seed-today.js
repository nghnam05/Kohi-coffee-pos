const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');

// 1. Manually parse .env to get MONGODB_URI
const envPath = path.join(__dirname, '.env');
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

async function runSeedToday() {
  console.log('[DB] Connecting to MongoDB Atlas...');
  await mongoose.connect(MONGODB_URI);
  const db = mongoose.connection.db;
  console.log('[DB] Connected successfully.');

  // Xác định ngày hôm nay theo giờ Việt Nam (UTC+7)
  const now = new Date();
  const vnNow = new Date(now.getTime() + 7 * 3600 * 1000);
  const year = vnNow.getUTCFullYear();
  const month = vnNow.getUTCMonth() + 1; // 1-12
  const day = vnNow.getUTCDate();
  const currentHour = vnNow.getUTCHours();
  const currentMinute = vnNow.getUTCMinutes();

  console.log(`\n📅 Ngày thực hiện Seed: ${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year} (Thời gian hiện tại: ${String(currentHour).padStart(2, '0')}:${String(currentMinute).padStart(2, '0')} VN)`);

  const startOfToday = makeVNTime(year, month, day, 0, 0);
  const endOfToday = makeVNTime(year, month, day + 1, 0, 0);

  console.log('\n--- 1. Dọn dẹp dữ liệu giao dịch của riêng ngày hôm nay ---');
  const deleteFilter = { $gte: startOfToday, $lt: endOfToday };

  const delOrders = await db.collection('orders').deleteMany({ createdAt: deleteFilter });
  const delPayments = await db.collection('payments').deleteMany({ paidAt: deleteFilter });
  const delAtt = await db.collection('attendances').deleteMany({ date: deleteFilter });
  const delExp = await db.collection('expenses').deleteMany({ date: deleteFilter });
  const delIng = await db.collection('ingredientusages').deleteMany({ date: deleteFilter });
  const delRev = await db.collection('reviews').deleteMany({ createdAt: deleteFilter });

  console.log(`- Đã xóa ${delOrders.deletedCount} đơn hàng hôm nay.`);
  console.log(`- Đã xóa ${delPayments.deletedCount} hóa đơn thanh toán hôm nay.`);
  console.log(`- Đã xóa ${delAtt.deletedCount} bản ghi điểm danh hôm nay.`);
  console.log(`- Đã xóa ${delExp.deletedCount} khoản chi phí hôm nay.`);
  console.log(`- Đã xóa ${delIng.deletedCount} bản ghi tiêu hao nguyên liệu hôm nay.`);
  console.log(`- Đã xóa ${delRev.deletedCount} đánh giá hôm nay.`);

  // Reset tất cả các bàn về trạng thái ban đầu
  await db.collection('tables').updateMany({}, {
    $set: {
      status: 'empty',
      currentSessionStartedAt: null,
      occupants: [],
      activeOrdersCount: 0,
      qrToken: null,
    }
  });
  console.log('- Đã reset trạng thái bàn về "empty".');

  console.log('\n--- 2. Lấy dữ liệu cơ sở (Foods, Tables, Users, Ingredients) ---');
  let foods = await db.collection('foods').find({}).toArray();
  let tables = await db.collection('tables').find({}).toArray();
  let users = await db.collection('users').find({}).toArray();
  let ingredients = await db.collection('ingredients').find({}).toArray();

  if (tables.length < 12) {
    for (let i = 1; i <= 12; i++) {
      const tName = `Bàn số ${i}`;
      const exists = tables.find(t => t.tableName === tName);
      if (!exists) {
        await db.collection('tables').insertOne({
          tableName: tName,
          status: 'empty',
          capacity: i <= 4 ? 2 : (i <= 8 ? 4 : 6),
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
    }
    tables = await db.collection('tables').find({}).toArray();
  }

  // Đảm bảo các tài khoản nhân sự và quản trị viên
  const defaultPassword = await bcrypt.hash('123456', 10);
  const requiredUsers = [
    { name: 'Quản trị viên Kohi Coffee', email: 'admin@kohi.vn', role: 'admin', assignedShift: 'morning' },
    { name: 'PV-SÁNG', email: 'pvcasang@kohi.vn', role: 'staff', assignedShift: 'morning' },
    { name: 'PC-SÁNG', email: 'pccasang@kohi.vn', role: 'barista', assignedShift: 'morning' },
    { name: 'PV-CHIỀU', email: 'pvchieu@kohi.vn', role: 'staff', assignedShift: 'afternoon' },
    { name: 'PC-CHIỀU', email: 'pcchieu@kohi.vn', role: 'barista', assignedShift: 'afternoon' },
    { name: 'PV-TỐI', email: 'pvtoi@kohi.vn', role: 'waiter', assignedShift: 'evening' },
    { name: 'PC-TỐI', email: 'pctoi@kohi.vn', role: 'barista', assignedShift: 'evening' }
  ];

  for (const ru of requiredUsers) {
    const exists = users.find(u => u.email === ru.email);
    if (!exists) {
      await db.collection('users').insertOne({
        ...ru,
        password: defaultPassword,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }
  }
  users = await db.collection('users').find({}).toArray();

  const staffUsers = users.filter(u => u.role !== 'admin');
  const pvSang = staffUsers.find(u => u.name === 'PV-SÁNG') || staffUsers[0];
  const pcSang = staffUsers.find(u => u.name === 'PC-SÁNG') || staffUsers[1];
  const pvChieu = staffUsers.find(u => u.name === 'PV-CHIỀU') || staffUsers[2];
  const pcChieu = staffUsers.find(u => u.name === 'PC-CHIỀU') || staffUsers[3];
  const pvToi = staffUsers.find(u => u.name === 'PV-TỐI') || staffUsers[4];
  const pcToi = staffUsers.find(u => u.name === 'PC-TỐI') || staffUsers[5];

  console.log('\n--- 3. Tạo Đơn Hàng & Doanh Thu Hôm Nay ---');
  const allOrders = [];
  const allPayments = [];
  const allReviews = [];

  // Tìm hóa đơn lớn nhất trong DB để tăng tiếp mã HD
  const latestPayment = await db.collection('payments').find({}).sort({ invoiceCode: -1 }).limit(1).toArray();
  let invoiceSeq = 1500;
  if (latestPayment.length > 0 && latestPayment[0].invoiceCode) {
    const num = parseInt(latestPayment[0].invoiceCode.replace(/\D/g, ''), 10);
    if (!isNaN(num)) invoiceSeq = num;
  }

  // 1. Phân bổ các đơn đã hoàn tất trong ngày: Ca sáng (07:15 - 11:45), Ca chiều (12:00 - 17:00), Đầu ca tối (17:00 - 17:40)
  const completedOrdersCount = getRandomInt(45, 52);
  const timeSlots = [];
  // Ca sáng (~18 đơn)
  for (let i = 0; i < 18; i++) {
    timeSlots.push({ h: getRandomInt(7, 11), m: getRandomInt(10, 55), staff: 'PV-SÁNG' });
  }
  // Ca chiều (~22 đơn)
  for (let i = 0; i < 22; i++) {
    timeSlots.push({ h: getRandomInt(12, 16), m: getRandomInt(5, 55), staff: 'PV-CHIỀU' });
  }
  // Ca tối (~8 đơn đã thanh toán)
  for (let i = 0; i < Math.max(completedOrdersCount - 40, 6); i++) {
    timeSlots.push({ h: 17, m: getRandomInt(5, 40), staff: 'PV-TỐI' });
  }

  timeSlots.sort((a, b) => (a.h * 60 + a.m) - (b.h * 60 + b.m));

  for (const slot of timeSlots) {
    invoiceSeq++;
    const assignedTable = getRandomItem(tables);
    const customerName = getRandomItem(CUSTOMER_NAMES);
    const randPay = Math.random();
    const paymentMethod = randPay < 0.55 ? 'bank_transfer' : (randPay < 0.9 ? 'cash' : 'momo');

    const orderTime = makeVNTime(year, month, day, slot.h, slot.m);
    const paidTime = new Date(orderTime.getTime() + getRandomInt(6, 22) * 60000);

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
      isTakeaway: Math.random() < 0.18,
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

    // 20% đơn có review chân thực
    if (Math.random() < 0.22) {
      allReviews.push({
        _id: new mongoose.Types.ObjectId(),
        orderId: orderDoc._id,
        foodId: orderItems[0].foodId,
        customerName,
        customerPhone: orderDoc.customerPhone,
        rating: Math.random() < 0.75 ? 5 : 4,
        comment: getRandomItem(REVIEW_COMMENTS),
        isDeleted: false,
        createdAt: new Date(paidTime.getTime() + getRandomInt(5, 30) * 60000),
        updatedAt: new Date(paidTime.getTime() + getRandomInt(5, 30) * 60000),
      });
    }
  }

  // 2. Tạo 3 đơn đang phục vụ tại bàn thực tế lúc này (quán có khách đang ngồi)
  const activeTablesConfig = [
    {
      tableIndex: 1, // Bàn số 2
      customerName: 'Bảo Ngọc',
      status: 'cooking',
      minuteAgo: 12,
      foodsToPick: ['Muối', 'Tart']
    },
    {
      tableIndex: 4, // Bàn số 5
      customerName: 'Minh Tuấn',
      status: 'ready',
      minuteAgo: 25,
      foodsToPick: ['Cheesecake', 'Latte', 'Donut']
    },
    {
      tableIndex: 7, // Bàn số 8
      customerName: 'Hoàng Long',
      status: 'confirmed',
      minuteAgo: 5,
      foodsToPick: ['Đào', 'Đen']
    }
  ];

  const updatedTableIds = [];

  for (const cfg of activeTablesConfig) {
    const tbl = tables[cfg.tableIndex] || tables[0];
    const orderTime = new Date(Date.now() - cfg.minuteAgo * 60000);

    const matchedFoods = foods.filter(f => cfg.foodsToPick.some(k => f.name.toLowerCase().includes(k.toLowerCase())));
    const chosenFoods = matchedFoods.length > 0 ? matchedFoods : [foods[0], foods[1]];

    const orderItems = chosenFoods.map(f => ({
      foodId: f._id,
      quantity: 1,
      note: 'Dùng tại bàn',
      orderedBy: cfg.customerName,
      isPaid: false,
    }));

    const subtotal = chosenFoods.reduce((s, f) => s + f.price, 0);
    const orderId = new mongoose.Types.ObjectId();

    const activeOrderDoc = {
      _id: orderId,
      tableId: tbl._id,
      tableName: tbl.tableName,
      isTakeaway: false,
      items: orderItems,
      totalAmount: subtotal,
      status: cfg.status,
      paymentStatus: 'unpaid',
      paymentMethod: 'cash',
      customerName: cfg.customerName,
      customerPhone: '09' + getRandomInt(10000000, 99999999),
      isDeleted: false,
      createdAt: orderTime,
      updatedAt: orderTime,
    };
    allOrders.push(activeOrderDoc);

    // Cập nhật trạng thái bàn sang "serving"
    await db.collection('tables').updateOne(
      { _id: tbl._id },
      {
        $set: {
          status: 'serving',
          currentSessionStartedAt: orderTime,
          occupants: [{ customerName: cfg.customerName, joinedAt: orderTime }],
          activeOrdersCount: 1,
        }
      }
    );
    updatedTableIds.push(tbl.tableName);
  }

  console.log(`- Đã tạo ${allOrders.length} đơn hàng (${allPayments.length} đã thanh toán, ${activeTablesConfig.length} đơn đang phục vụ).`);
  console.log(`- Bàn đang có khách: ${updatedTableIds.join(', ')}.`);
  console.log(`- Đã tạo ${allReviews.length} đánh giá khách hàng hôm nay.`);

  console.log('\n--- 4. Tạo Chi Phí Hoạt Động Hôm Nay (Expenses) ---');
  const allExpenses = [];
  const expTime1 = makeVNTime(year, month, day, 8, 30);
  allExpenses.push({
    _id: new mongoose.Types.ObjectId(),
    title: 'Đá bi sạch tinh khiết pha chế trong ngày',
    amount: 50000,
    date: expTime1,
    category: 'Đá & Đồ uống phụ',
    note: 'Nhập đá viên hàng ngày từ nhà cung cấp đá tinh khiết',
    createdBy: 'PV-SÁNG',
    createdAt: expTime1,
    updatedAt: expTime1,
  });

  const expTime2 = makeVNTime(year, month, day, 14, 15);
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

  console.log(`- Đã tạo ${allExpenses.length} khoản chi phí vận hành hôm nay.`);

  console.log('\n--- 5. Tạo Điểm Danh Nhân Viên Hôm Nay (3 Ca) ---');
  const allAttendances = [];
  const dateOnly = makeVNTime(year, month, day, 0, 0);

  // Ca Sáng (06:45 - 12:05) -> Đã xong
  const morningShifts = [
    { staff: pvSang, shift: 'morning', inH: 6, inM: 45, outH: 12, outM: 5, note: 'Đúng giờ, mở cửa bàn ghế ngăn nắp' },
    { staff: pcSang, shift: 'morning', inH: 6, inM: 40, outH: 12, outM: 10, note: 'Kiểm tra máy pha, chuẩn bị quầy bar' }
  ];
  for (const ms of morningShifts) {
    const inTime = makeVNTime(year, month, day, ms.inH, ms.inM);
    const outTime = makeVNTime(year, month, day, ms.outH, ms.outM);
    const hours = parseFloat(((outTime.getTime() - inTime.getTime()) / (1000 * 60 * 60)).toFixed(2));
    allAttendances.push({
      _id: new mongoose.Types.ObjectId(),
      userId: ms.staff._id,
      date: dateOnly,
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

  // Ca Chiều (11:55 - 17:35) -> Đã xong
  const afternoonShifts = [
    { staff: pvChieu, shift: 'afternoon', inH: 11, inM: 55, outH: 17, outM: 35, note: 'Đúng giờ, nhận bàn giao ca chu đáo' },
    { staff: pcChieu, shift: 'afternoon', inH: 11, inM: 50, outH: 17, outM: 40, note: 'Bổ sung nguyên liệu, pha chế kịp thời' }
  ];
  for (const as of afternoonShifts) {
    const inTime = makeVNTime(year, month, day, as.inH, as.inM);
    const outTime = makeVNTime(year, month, day, as.outH, as.outM);
    const hours = parseFloat(((outTime.getTime() - inTime.getTime()) / (1000 * 60 * 60)).toFixed(2));
    allAttendances.push({
      _id: new mongoose.Types.ObjectId(),
      userId: as.staff._id,
      date: dateOnly,
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

  // Ca Tối (17:20 - 22:35) -> Hoàn tất điểm danh để báo cáo tài chính đủ ca trong ngày
  const eveningShifts = [
    { staff: pvToi, shift: 'evening', inH: 17, inM: 25, outH: 22, outM: 35, note: 'Đúng giờ, vệ sinh bàn ghế ngăn nắp' },
    { staff: pcToi, shift: 'evening', inH: 17, inM: 20, outH: 22, outM: 45, note: 'Vệ sinh và xả áp máy cà phê cuối ngày' }
  ];
  for (const es of eveningShifts) {
    const inTime = makeVNTime(year, month, day, es.inH, es.inM);
    const outTime = makeVNTime(year, month, day, es.outH, es.outM);
    const hours = parseFloat(((outTime.getTime() - inTime.getTime()) / (1000 * 60 * 60)).toFixed(2));
    allAttendances.push({
      _id: new mongoose.Types.ObjectId(),
      userId: es.staff._id,
      date: dateOnly,
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

  console.log(`- Đã tạo ${allAttendances.length} bản ghi điểm danh hôm nay (đủ 3 ca x 2 nhân sự).`);

  console.log('\n--- 6. Tạo Tiêu Hao Nguyên Liệu Hôm Nay (Ingredient Usages) ---');
  const allIngredientUsages = [];
  const ingUsagePresets = [
    { key: 'Robusta', qty: 2.8, cost: 280000 },
    { key: 'Arabica', qty: 1.6, cost: 320000 },
    { key: 'Sữa Tươi', qty: 7.5, cost: 225000 },
    { key: 'Sữa Đặc', qty: 3.2, cost: 128000 },
    { key: 'Đường', qty: 2.5, cost: 50000 },
    { key: 'Matcha', qty: 0.35, cost: 245000 },
    { key: 'Kem Béo', qty: 1.8, cost: 126000 },
    { key: 'Siro', qty: 0.6, cost: 72000 },
  ];

  const usageRecordTime = makeVNTime(year, month, day, 21, 30);
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

  console.log(`- Đã tạo ${allIngredientUsages.length} bản ghi tiêu hao nguyên liệu hôm nay.`);

  console.log('\n--- 7. Lưu tất cả vào Cơ sở dữ liệu ---');
  if (allOrders.length > 0) await db.collection('orders').insertMany(allOrders);
  if (allPayments.length > 0) await db.collection('payments').insertMany(allPayments);
  if (allReviews.length > 0) await db.collection('reviews').insertMany(allReviews);
  if (allExpenses.length > 0) await db.collection('expenses').insertMany(allExpenses);
  if (allAttendances.length > 0) await db.collection('attendances').insertMany(allAttendances);
  if (allIngredientUsages.length > 0) await db.collection('ingredientusages').insertMany(allIngredientUsages);

  // Đảm bảo tồn kho nguyên liệu sẵn sàng
  for (const ing of ingredients) {
    await db.collection('ingredients').updateOne(
      { _id: ing._id },
      { $set: { status: 'in_stock' } }
    );
  }

  // Tổng kết số liệu hôm nay
  const totalRev = allPayments.reduce((s, p) => s + (p.totalAmount || 0), 0);
  const totalIngCost = allIngredientUsages.reduce((s, i) => s + (i.totalCost || 0), 0);
  const totalExp = allExpenses.reduce((s, e) => s + (e.amount || 0), 0);
  const totalHours = allAttendances.reduce((s, a) => s + (a.totalHours || 0), 0);
  const totalSalary = Math.round(totalHours * 25000);
  const netProfit = totalRev - totalIngCost - totalExp - totalSalary;

  console.log('\n=============================================');
  console.log(`🎉 BÁO CÁO DỮ LIỆU ĐÃ SEED CHO HÔM NAY (${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}):`);
  console.log(`• Doanh thu bán hàng hôm nay: ${totalRev.toLocaleString('vi-VN')} đ (${allPayments.length} hóa đơn)`);
  console.log(`• Đơn hàng đang phục vụ trực tiếp: ${activeTablesConfig.length} đơn (${updatedTableIds.join(', ')})`);
  console.log(`• Chi phí lương nhân viên (6 ca): ${totalSalary.toLocaleString('vi-VN')} đ (${totalHours.toFixed(1)} giờ làm)`);
  console.log(`• Chi phí nguyên liệu tiêu hao: ${totalIngCost.toLocaleString('vi-VN')} đ`);
  console.log(`• Chi phí phát sinh vận hành: ${totalExp.toLocaleString('vi-VN')} đ`);
  console.log(`• Lợi nhuận ròng hôm nay: ${netProfit.toLocaleString('vi-VN')} đ`);
  console.log('=============================================\n');

  await mongoose.disconnect();
}

runSeedToday().catch(err => {
  console.error('Lỗi khi seed dữ liệu hôm nay:', err);
  process.exit(1);
});
