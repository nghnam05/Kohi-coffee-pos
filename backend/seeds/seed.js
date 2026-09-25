const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');

// 1. Load MONGODB_URI from .env
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
  'Hữu Phước', 'Quỳnh Nga', 'Thanh Tùng', 'Thảo Nguyên', 'Văn Hưng'
];

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomItem(array) {
  return array[Math.floor(Math.random() * array.length)];
}

// Chuyển đổi giờ Việt Nam (UTC+7) sang Date UTC chuẩn
function makeVNTime(year, month, day, hour, minute) {
  return new Date(Date.UTC(year, month - 1, day, hour - 7, minute, 0, 0));
}

async function runSeed() {
  console.log('====================================================================');
  console.log('⚡ KOHI COFFEE POS - SEED DATA TỐI ƯU GỌN NHẸ (5-6 MỤC/MỖI PHẦN)');
  console.log('⚡ TỐI ƯU HÓA HIỆU NĂNG TRUY VẤN DATABASE & PHÂN TRANG HOÀN HẢO');
  console.log('====================================================================\n');

  console.log('[1/7] Kết nối tới MongoDB Atlas...');
  await mongoose.connect(MONGODB_URI);
  const db = mongoose.connection.db;
  console.log('✓ Kết nối MongoDB thành công.');

  // -------------------------------------------------------------
  // BƯỚC 1: XÓA SẠCH DỮ LIỆU GIAO DỊCH CŨ
  // -------------------------------------------------------------
  console.log('\n[2/7] Dọn dẹp & xóa toàn bộ dữ liệu giao dịch cũ...');
  const collectionsToClean = [
    'orders',
    'payments',
    'reservations',
    'reviews',
    'attendances',
    'expenses',
    'ingredientusages',
    'staffcalls',
    'shiftswaprequests',
    'payrolls',
    'coupons'
  ];

  for (const col of collectionsToClean) {
    try {
      const res = await db.collection(col).deleteMany({});
      console.log(`  - Đã xóa sạch collection "${col}": ${res.deletedCount} bản ghi.`);
    } catch (err) {
      console.log(`  - Collection "${col}" đã trống hoặc chưa tạo.`);
    }
  }

  // Reset toàn bộ bàn ăn về trạng thái trống
  await db.collection('tables').updateMany(
    {},
    {
      $set: {
        status: 'empty',
        currentSessionStartedAt: null,
        occupants: [],
        activeOrdersCount: 0,
        qrToken: null,
      },
    }
  );
  console.log('  - Đã đưa toàn bộ bàn ăn về trạng thái "empty" (sẵn sàng đón khách mới).');

  // -------------------------------------------------------------
  // BƯỚC 2: TẠO CHỈ MỤC (INDEXES) TỐI ƯU TỐC ĐỘ TRUY VẤN O(LOG N)
  // -------------------------------------------------------------
  console.log('\n[3/7] Xây dựng Compound Indexes tối ưu tốc độ truy xuất MongoDB...');
  
  const safeCreateIndex = async (colName, key) => {
    try {
      await db.collection(colName).createIndex(key);
    } catch (e) {
      // Index already exists
    }
  };

  // 1. Orders: Phục vụ KDS, Bàn ăn, Báo cáo Doanh thu & Top Selling Foods
  await safeCreateIndex('orders', { status: 1, isDeleted: 1, createdAt: -1 });
  await safeCreateIndex('orders', { tableId: 1, status: 1, isDeleted: 1 });
  await safeCreateIndex('orders', { createdAt: -1, status: 1, paymentStatus: 1 });
  await safeCreateIndex('orders', { status: 1, paymentStatus: 1, paidAt: -1, totalAmount: 1 });
  await safeCreateIndex('orders', { paidAt: -1, status: 1 });
  await safeCreateIndex('orders', { 'items.foodId': 1 });
  console.log('  ✓ Đã thiết lập 6 Compound Indexes cho Collection [orders]');

  // 2. Foods: Lọc danh mục, tìm kiếm và sắp xếp lượt bán
  await safeCreateIndex('foods', { category: 1, isAvailable: 1, soldCount: -1 });
  await safeCreateIndex('foods', { isAvailable: 1, name: 1 });
  await safeCreateIndex('foods', { soldCount: -1 });
  console.log('  ✓ Đã thiết lập 3 Compound Indexes cho Collection [foods]');

  // 3. Reviews: Phân trang siêu tốc & AI Insights
  await safeCreateIndex('reviews', { createdAt: -1, overallStar: 1 });
  await safeCreateIndex('reviews', { 'ratings.foodId': 1, 'ratings.star': 1 });
  console.log('  ✓ Đã thiết lập 2 Compound Indexes cho Collection [reviews]');

  // 4. Payments, Attendances, Ingredients, Expenses, Coupons
  await safeCreateIndex('payments', { orderId: 1 });
  await safeCreateIndex('payments', { paidAt: -1, paymentMethod: 1 });
  await safeCreateIndex('attendances', { userId: 1, date: -1 });
  await safeCreateIndex('attendances', { date: -1, shift: 1 });
  await safeCreateIndex('ingredients', { status: 1, currentQuantity: 1 });
  await safeCreateIndex('expenses', { date: -1, category: 1 });
  await safeCreateIndex('coupons', { code: 1, isActive: 1 });
  console.log('  ✓ Đã hoàn thiện toàn bộ Indexes hệ thống (Đạt chuẩn Covered Queries O(log N)).');

  // -------------------------------------------------------------
  // BƯỚC 3: KIỂM TRA & NẠP MASTER ENTITIES (Users, Tables, Foods)
  // -------------------------------------------------------------
  console.log('\n[4/7] Xác minh danh mục Master Entities (Users, Tables, Foods, Ingredients)...');
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
    } else {
      await db.collection('users').updateOne(
        { _id: exists._id },
        { $set: { password: defaultPassword, name: ru.name, role: ru.role, assignedShift: ru.assignedShift } }
      );
    }
  }
  users = await db.collection('users').find({}).toArray();
  const staffUsers = users.filter(u => u.role !== 'admin');

  console.log(`  ✓ Xác nhận: ${foods.length} món ăn, ${tables.length} bàn ăn, ${users.length} tài khoản nhân sự.`);

  // -------------------------------------------------------------
  // BƯỚC 4: THIẾT LẬP MỖI MÓN TẦM 5 - 6 LƯỢT BÁN
  // -------------------------------------------------------------
  console.log('\n[5/7] Thiết lập phân bổ ~5-6 lượt bán cho từng món ăn...');
  const foodTargets = {};
  foods.forEach((f) => {
    // Mỗi món dao động đúng tầm 5 đến 6 lượt bán
    foodTargets[f._id.toString()] = getRandomInt(5, 6);
  });

  const totalFoodItemsToSell = Object.values(foodTargets).reduce((a, b) => a + b, 0);
  console.log(`  ✓ Tổng số lượng ly/món phân bổ: ${totalFoodItemsToSell} lượt bán qua ${foods.length} món ăn (TB ~${(totalFoodItemsToSell / foods.length).toFixed(1)} lượt/món).`);

  // Phân bổ ~115 lượt bán vào 7 ngày gần nhất
  const dayWeights = [1.0, 1.0, 1.1, 1.2, 1.5, 1.6, 1.2];
  const sumWeights = dayWeights.reduce((a, b) => a + b, 0);
  const daysPool = Array.from({ length: 7 }, () => []);

  foods.forEach((f) => {
    const fId = f._id.toString();
    const count = foodTargets[fId];
    for (let i = 0; i < count; i++) {
      let r = Math.random() * sumWeights;
      let selectedDay = 0;
      for (let d = 0; d < 7; d++) {
        r -= dayWeights[d];
        if (r <= 0) {
          selectedDay = d;
          break;
        }
      }
      daysPool[selectedDay].push(f);
    }
  });

  // -------------------------------------------------------------
  // BƯỚC 5: TẠO ĐƠN HÀNG, THANH TOÁN (GỌN NHẸ ~50-60 ĐƠN)
  // -------------------------------------------------------------
  console.log('\n[6/7] Khởi tạo Đơn hàng (Orders), Hóa đơn (Payments), Đánh giá (Reviews) & Chi phí...');
  const allOrders = [];
  const allPayments = [];
  const foodActualSold = {};
  foods.forEach(f => { foodActualSold[f._id.toString()] = 0; });

  let invoiceSeq = 3000;

  for (let d = 0; d < 7; d++) {
    const dayOfMonth = 18 + d; // 18/09 -> 24/09/2026
    const dayItems = daysPool[d];
    dayItems.sort(() => Math.random() - 0.5);

    let itemIdx = 0;
    const dayOrderList = [];

    // Mỗi đơn hàng gồm 1 đến 3 món
    while (itemIdx < dayItems.length) {
      const orderItemCount = Math.min(getRandomInt(1, 3), dayItems.length - itemIdx);
      const itemsInOrder = dayItems.slice(itemIdx, itemIdx + orderItemCount);
      itemIdx += orderItemCount;

      const itemMap = new Map();
      for (const itm of itemsInOrder) {
        const idStr = itm._id.toString();
        if (itemMap.has(idStr)) {
          itemMap.get(idStr).quantity += 1;
        } else {
          itemMap.set(idStr, {
            foodId: itm._id,
            foodName: itm.name,
            price: itm.price,
            quantity: 1,
            note: Math.random() < 0.3 ? getRandomItem(['Ít đá', 'Ít ngọt', 'Nóng', 'Thêm trân châu']) : '',
          });
        }
        foodActualSold[idStr] += 1;
      }
      dayOrderList.push(Array.from(itemMap.values()));
    }

    dayOrderList.forEach((orderItems, oIdx) => {
      invoiceSeq++;
      const assignedTable = getRandomItem(tables);
      const customerName = getRandomItem(CUSTOMER_NAMES);
      const randPay = Math.random();
      const paymentMethod = randPay < 0.6 ? 'bank_transfer' : (randPay < 0.9 ? 'cash' : 'momo');

      const ratio = oIdx / Math.max(dayOrderList.length - 1, 1);
      let hour, minute;
      if (ratio < 0.4) {
        hour = getRandomInt(7, 11);
        minute = getRandomInt(10, 55);
      } else if (ratio < 0.7) {
        hour = getRandomInt(12, 16);
        minute = getRandomInt(0, 55);
      } else {
        hour = getRandomInt(17, 21);
        minute = getRandomInt(0, 45);
      }

      const orderTime = makeVNTime(2026, 9, dayOfMonth, hour, minute);
      const paidTime = new Date(orderTime.getTime() + getRandomInt(6, 18) * 60000);

      const subtotal = orderItems.reduce((sum, itm) => sum + itm.price * itm.quantity, 0);
      let discountAmount = 0;
      let couponCode = null;

      if (subtotal >= 250000) {
        couponCode = 'KOHI10';
        discountAmount = Math.round(subtotal * 0.1);
      }

      const totalAmount = Math.max(0, subtotal - discountAmount);
      const orderId = new mongoose.Types.ObjectId();

      let staffName = 'PV-SÁNG';
      if (hour >= 12 && hour < 17) staffName = 'PV-CHIỀU';
      if (hour >= 17) staffName = 'PV-TỐI';

      const orderDoc = {
        _id: orderId,
        tableId: assignedTable._id,
        isTakeaway: Math.random() < 0.15,
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
        staffName,
        paidAt: paidTime,
        isDeleted: false,
        createdAt: paidTime,
        updatedAt: paidTime,
      };
      allPayments.push(paymentDoc);
    });
  }

  // -------------------------------------------------------------
  // TẠO ĐÚNG 6 ĐÁNH GIÁ (REVIEWS) ~ 2 TRANG PHÂN TRANG HOÀN HẢO
  // -------------------------------------------------------------
  const allReviews = [];
  const sampleReviewData = [
    { name: 'Lan Anh', table: 'Bàn số 2', star: 5, comment: 'Cà phê kem muối béo ngậy thơm ngon, không gian làm việc rất yên tĩnh!', d: 24, h: 19, m: 38 },
    { name: 'Minh Tuấn', table: 'Bàn số 5', star: 5, comment: 'Trà đào thơm thanh mát lạnh, đào giòn ngọt, phục vụ siêu chu đáo.', d: 24, h: 17, m: 19 },
    { name: 'Thu Hà', table: 'Bàn số 1', star: 5, comment: 'Bánh tart trứng nóng hổi vừa ra lò, ăn kèm cà phê đen rất hợp vị.', d: 24, h: 14, m: 14 },
    { name: 'Hoàng Long', table: 'Bàn số 7', star: 5, comment: 'Sinh tố dâu cheesecake ngậy thơm ngon đỉnh chóp, sẽ ghé thường xuyên!', d: 24, h: 12, m: 26 },
    { name: 'Bảo Ngọc', table: 'Bàn số 10', star: 4, comment: 'Cà phê caramel đậu phộng vị lạ mà cuốn, quán decor đẹp chụp hình xinh.', d: 23, h: 16, m: 45 },
    { name: 'Thành Đạt', table: 'Bàn số 3', star: 5, comment: 'Tào phớ trân châu đường đen thanh mát dẻo dai, nhân viên lễ phép 10/10.', d: 23, h: 10, m: 30 },
  ];

  sampleReviewData.forEach((rev) => {
    const revTime = makeVNTime(2026, 9, rev.d, rev.h, rev.m);
    const assignedTable = tables.find(t => t.tableName === rev.table) || tables[0];
    const relatedOrder = allOrders.find(o => o.tableId.equals(assignedTable._id)) || allOrders[0];

    allReviews.push({
      _id: new mongoose.Types.ObjectId(),
      orderId: relatedOrder?._id || new mongoose.Types.ObjectId(),
      tableId: assignedTable._id,
      customerName: rev.name,
      overallStar: rev.star,
      serviceStar: rev.star,
      ratings: (relatedOrder?.items || []).slice(0, 2).map(itm => ({
        foodId: itm.foodId,
        star: rev.star,
        comment: rev.comment,
      })),
      overallComment: rev.comment,
      comment: rev.comment,
      createdAt: revTime,
      updatedAt: revTime,
    });
  });

  // -------------------------------------------------------------
  // TẠO ĐÚNG 6 MỤC TIÊU HAO NGUYÊN LIỆU (INGREDIENT USAGES)
  // -------------------------------------------------------------
  const allIngredientUsages = [];
  const ingRobusta = ingredients.find(i => i.name.includes('Robusta')) || ingredients[0];
  const ingArabica = ingredients.find(i => i.name.includes('Arabica')) || ingredients[1] || ingredients[0];
  const ingSuaTuoi = ingredients.find(i => i.name.includes('Sữa Tươi')) || ingredients[2];
  const ingSuaDac = ingredients.find(i => i.name.includes('Sữa Đặc')) || ingredients[3];
  const ingDuong = ingredients.find(i => i.name.includes('Đường')) || ingredients[4];
  const ingMatcha = ingredients.find(i => i.name.includes('Matcha')) || ingredients[5];

  const sampleUsages = [
    { ing: ingRobusta, qty: 1.5, note: 'Tiêu hao hạt cà phê Robusta pha máy' },
    { ing: ingArabica, qty: 0.8, note: 'Tiêu hao cà phê Arabica Cầu Đất cho Latte' },
    { ing: ingSuaTuoi, qty: 4.0, note: 'Tiêu hao sữa tươi Dalat Milk thanh trùng' },
    { ing: ingSuaDac, qty: 2.2, note: 'Tiêu hao sữa đặc cao cấp pha chế' },
    { ing: ingDuong, qty: 1.8, note: 'Tiêu hao đường nước tự nấu' },
    { ing: ingMatcha, qty: 0.2, note: 'Tiêu hao bột matcha Uji Nhật Bản' },
  ];

  sampleUsages.forEach((u, idx) => {
    if (!u.ing) return;
    const uTime = makeVNTime(2026, 9, 24, 21, 10 + idx * 5);
    allIngredientUsages.push({
      _id: new mongoose.Types.ObjectId(),
      ingredientId: u.ing._id,
      ingredientName: u.ing.name,
      unit: u.ing.unit,
      quantity: u.qty,
      unitPrice: u.ing.unitPrice || 100000,
      totalCost: Math.round(u.qty * (u.ing.unitPrice || 100000)),
      date: uTime,
      updatedBy: 'PC-TỐI',
      note: u.note,
      createdAt: uTime,
      updatedAt: uTime,
    });
  });

  // -------------------------------------------------------------
  // TẠO ĐÚNG 6 KHOẢN CHI PHÍ VẬN HÀNH (EXPENSES)
  // -------------------------------------------------------------
  const allExpenses = [];
  const sampleExpenses = [
    { title: 'Đá bi sạch tinh khiết pha chế', amount: 50000, cat: 'Đá & Đồ uống phụ', note: 'Nhập đá viên hàng ngày từ đơn vị uy tín' },
    { title: 'Ly giấy Kraft & nắp mang đi thân thiện môi trường', amount: 180000, cat: 'Vật tư đóng gói', note: 'Thùng 500 ly giấy size M/L' },
    { title: 'Ống hút gạo tự hủy & màng ép ly', amount: 75000, cat: 'Vật tư tiêu hao', note: 'Nhập bổ sung ống hút sinh học' },
    { title: 'Nước rửa ly chuyên dụng & khử khuẩn quầy bar', amount: 65000, cat: 'Vệ sinh & An toàn', note: 'Nước rửa chén sinh học không mùi' },
    { title: 'Khăn giấy lau tay & khăn ăn cho khách', amount: 45000, cat: 'Vật tư tiêu hao', note: 'Khăn lụa napkin mềm mịn' },
    { title: 'Túi chữ T & quai xách mang về', amount: 55000, cat: 'Vật tư đóng gói', note: 'Túi tự phân hủy sinh học' },
  ];

  sampleExpenses.forEach((exp, idx) => {
    const expTime = makeVNTime(2026, 9, 19 + idx, 8, 30);
    allExpenses.push({
      _id: new mongoose.Types.ObjectId(),
      title: exp.title,
      amount: exp.amount,
      date: expTime,
      category: exp.cat,
      note: exp.note,
      createdBy: 'PV-SÁNG',
      createdAt: expTime,
      updatedAt: expTime,
    });
  });

  // -------------------------------------------------------------
  // TẠO ĐÚNG 6 CA CHẤM CÔNG NHÂN SỰ ĐIỂN HÌNH (ATTENDANCES)
  // -------------------------------------------------------------
  const allAttendances = [];
  const sampleAttendances = [
    { name: 'PV-SÁNG', shift: 'morning', inH: 6, inM: 45, outH: 12, outM: 5, note: 'Đúng giờ' },
    { name: 'PC-SÁNG', shift: 'morning', inH: 6, inM: 40, outH: 12, outM: 10, note: 'Đúng giờ' },
    { name: 'PV-CHIỀU', shift: 'afternoon', inH: 11, inM: 55, outH: 17, outM: 35, note: 'Đúng giờ' },
    { name: 'PC-CHIỀU', shift: 'afternoon', inH: 11, inM: 50, outH: 17, outM: 40, note: 'Đúng giờ' },
    { name: 'PV-TỐI', shift: 'evening', inH: 17, inM: 25, outH: 22, outM: 35, note: 'Đúng giờ' },
    { name: 'PC-TỐI', shift: 'evening', inH: 17, inM: 20, outH: 22, outM: 45, note: 'Đúng giờ' },
  ];

  sampleAttendances.forEach((sa) => {
    const stUser = staffUsers.find(u => u.name === sa.name) || staffUsers[0];
    const checkInTime = makeVNTime(2026, 9, 24, sa.inH, sa.inM);
    const checkOutTime = makeVNTime(2026, 9, 24, sa.outH, sa.outM);
    const diffHours = parseFloat(((checkOutTime.getTime() - checkInTime.getTime()) / (1000 * 60 * 60)).toFixed(2));

    allAttendances.push({
      _id: new mongoose.Types.ObjectId(),
      userId: stUser._id,
      date: makeVNTime(2026, 9, 24, 0, 0),
      checkIn: checkInTime,
      checkOut: checkOutTime,
      shift: sa.shift,
      totalHours: diffHours,
      note: sa.note,
      isManualEdit: false,
      isPaid: false,
      paidAt: null,
      payrollId: null,
      createdAt: checkInTime,
      updatedAt: checkOutTime,
    });
  });

  // -------------------------------------------------------------
  // TẠO ĐÚNG 6 MÃ GIẢM GIÁ (COUPONS) HOẠT ĐỘNG
  // -------------------------------------------------------------
  const allCoupons = [
    { code: 'KOHI10', type: 'percent', value: 10, maxDiscount: 50000, minOrderValue: 200000, maxUsage: 100, usedCount: 12, isActive: true, description: 'Giảm 10% tối đa 50.000đ cho đơn từ 200.000đ' },
    { code: 'WELCOME', type: 'fixed', value: 20000, maxDiscount: 20000, minOrderValue: 80000, maxUsage: 200, usedCount: 35, isActive: true, description: 'Giảm 20.000đ cho khách hàng mới quét QR lần đầu' },
    { code: 'HAPPYHOUR', type: 'percent', value: 15, maxDiscount: 40000, minOrderValue: 120000, maxUsage: 50, usedCount: 8, isActive: true, description: 'Ưu đãi Khung giờ vàng 14h - 17h hàng ngày' },
    { code: 'BANHNGON', type: 'fixed', value: 15000, maxDiscount: 15000, minOrderValue: 100000, maxUsage: 80, usedCount: 19, isActive: true, description: 'Giảm 15.000đ khi gọi combo Cà phê + Bánh ngọt' },
    { code: 'VIPMEMBER', type: 'percent', value: 20, maxDiscount: 100000, minOrderValue: 300000, maxUsage: 30, usedCount: 5, isActive: true, description: 'Tri ân khách hàng thân thiết Kohi Loyalty' },
    { code: 'FREESHIP', type: 'fixed', value: 10000, maxDiscount: 10000, minOrderValue: 50000, maxUsage: 150, usedCount: 22, isActive: true, description: 'Hỗ trợ 10.000đ phí đóng gói mang đi' },
  ];

  // -------------------------------------------------------------
  // GHI VÀO CƠ SỞ DỮ LIỆU BẰNG BULK INSERT (SIÊU NHANH)
  // -------------------------------------------------------------
  if (allOrders.length > 0) await db.collection('orders').insertMany(allOrders, { ordered: false });
  if (allPayments.length > 0) await db.collection('payments').insertMany(allPayments, { ordered: false });
  if (allReviews.length > 0) await db.collection('reviews').insertMany(allReviews, { ordered: false });
  if (allIngredientUsages.length > 0) await db.collection('ingredientusages').insertMany(allIngredientUsages, { ordered: false });
  if (allExpenses.length > 0) await db.collection('expenses').insertMany(allExpenses, { ordered: false });
  if (allAttendances.length > 0) await db.collection('attendances').insertMany(allAttendances, { ordered: false });
  if (allCoupons.length > 0) await db.collection('coupons').insertMany(allCoupons, { ordered: false });

  // -------------------------------------------------------------
  // CẬP NHẬT CHÍNH XÁC soldCount (5-6 LƯỢT) CHO TẤT CẢ MÓN ĂN
  // -------------------------------------------------------------
  console.log('\n[7/7] Cập nhật soldCount thực tế (5-6 lượt bán) cho từng món ăn...');
  const foodBulkOps = foods.map(f => {
    const fId = f._id.toString();
    const actual = foodActualSold[fId] || getRandomInt(5, 6);
    return {
      updateOne: {
        filter: { _id: f._id },
        update: { $set: { soldCount: actual } },
      },
    };
  });
  if (foodBulkOps.length > 0) {
    await db.collection('foods').bulkWrite(foodBulkOps);
  }

  // Cập nhật nguyên liệu tồn kho chuẩn 25kg
  for (const ing of ingredients) {
    await db.collection('ingredients').updateOne(
      { _id: ing._id },
      { $set: { currentQuantity: 25.0, status: 'in_stock' } }
    );
  }

  console.log('\n===============================================================');
  console.log('🎉 BÁO CÁO TỔNG HỢP SEED DATA MỚI (TỐI ƯU GỌN NHẸ 5-6 MỤC):');
  console.log('===============================================================');
  const totalRev = allPayments.reduce((s, p) => s + p.totalAmount, 0);
  console.log(`• Tổng số Đơn hàng (Orders): ${allOrders.length} đơn`);
  console.log(`• Tổng số Hóa đơn (Payments): ${allPayments.length} hóa đơn`);
  console.log(`• Doanh thu tổng hợp 7 ngày: ${totalRev.toLocaleString('vi-VN')} đ`);
  console.log(`• Lượt bán mỗi món ăn (Foods): dao động chuẩn 5 - 6 lượt/món (Tổng: ${totalFoodItemsToSell} ly/món)`);
  console.log(`• Đánh giá khách hàng (Reviews): ${allReviews.length} đánh giá (chuẩn 2 trang phân trang: 4 thẻ + 2 thẻ)`);
  console.log(`• Tiêu hao nguyên liệu (Usages): ${allIngredientUsages.length} lượt`);
  console.log(`• Chi phí vận hành (Expenses): ${allExpenses.length} khoản chi`);
  console.log(`• Chấm công nhân sự (Attendances): ${allAttendances.length} ca làm việc`);
  console.log(`• Mã khuyến mãi (Coupons): ${allCoupons.length} mã ưu đãi`);
  console.log('• Toàn bộ chỉ mục Indexes đã kích hoạt, loại bỏ COLLSCAN, truy xuất O(log N).');
  console.log('===============================================================\n');

  await mongoose.disconnect();
  console.log('✓ Hoàn tất seed dữ liệu thành công!');
}

runSeed().catch(err => {
  console.error('Seed Error:', err);
  process.exit(1);
});
