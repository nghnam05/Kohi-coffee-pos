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
  'Trà chanh dây giải nhiệt mùa hè quá đã, decor quán hiện đại và ấm cúng.',
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

// Chuyển đổi giờ Việt Nam (UTC+7) sang Date UTC chuẩn
function makeVNTime(year, month, day, hour, minute) {
  return new Date(Date.UTC(year, month - 1, day, hour - 7, minute, 0, 0));
}

async function runSeed() {
  console.log('[DB] Connecting to MongoDB Atlas...');
  await mongoose.connect(MONGODB_URI);
  const db = mongoose.connection.db;
  console.log('[DB] Connected successfully.');

  console.log('\n--- 1. Clearing Previous Transaction Data ---');
  const collectionsToClean = [
    'orders',
    'payments',
    'reviews',
    'attendances',
    'expenses',
    'ingredientusages',
    'staffcalls',
    'payrolls'
  ];

  for (const col of collectionsToClean) {
    const res = await db.collection(col).deleteMany({});
    console.log(`- Cleared "${col}": ${res.deletedCount} document(s) deleted.`);
  }

  // Reset tables
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
  console.log('- Reset all tables to status "empty".');

  console.log('\n--- 2. Checking Base Entities (Users, Foods, Tables, Ingredients) ---');
  let foods = await db.collection('foods').find({}).toArray();
  let tables = await db.collection('tables').find({}).toArray();
  let users = await db.collection('users').find({}).toArray();
  let ingredients = await db.collection('ingredients').find({}).toArray();

  // Ensure 12 tables exist
  if (tables.length < 12) {
    console.log('[Seed] Ensuring 12 tables exist...');
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

  // Ensure Admin and Staff users exist
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
  const pvSang = staffUsers.find(u => u.name === 'PV-SÁNG') || staffUsers[0];
  const pcSang = staffUsers.find(u => u.name === 'PC-SÁNG') || staffUsers[1];
  const pvChieu = staffUsers.find(u => u.name === 'PV-CHIỀU') || staffUsers[2];
  const pcChieu = staffUsers.find(u => u.name === 'PC-CHIỀU') || staffUsers[3];
  const pvToi = staffUsers.find(u => u.name === 'PV-TỐI') || staffUsers[4];
  const pcToi = staffUsers.find(u => u.name === 'PC-TỐI') || staffUsers[5];

  console.log(`Base entities verified: ${foods.length} foods, ${tables.length} tables, ${users.length} users, ${ingredients.length} ingredients.`);

  console.log('\n--- 3. Setting Up Target Sales Per Food (25 - 55 items/food) ---');
  const foodTargets = {};
  foods.forEach(f => {
    const name = f.name.toLowerCase();
    if (name.includes('muối') || name.includes('latte') || name.includes('matcha dâu') || name.includes('tart') || name.includes('đen')) {
      foodTargets[f._id.toString()] = getRandomInt(48, 58);
    } else if (name.includes('cheesecake') || name.includes('đào') || name.includes('donut') || name.includes('caramel') || name.includes('socola')) {
      foodTargets[f._id.toString()] = getRandomInt(38, 46);
    } else {
      foodTargets[f._id.toString()] = getRandomInt(26, 34);
    }
  });

  const totalTargetSold = Object.values(foodTargets).reduce((a, b) => a + b, 0);
  console.log(`Total food items to be distributed: ${totalTargetSold} across ${foods.length} foods.`);

  // 13 Days distribution weights:
  const dayWeights = [
    1.0,  // Day 1 (Tue)
    1.0,  // Day 2 (Wed)
    1.05, // Day 3 (Thu)
    1.15, // Day 4 (Fri)
    1.75, // Day 5 (Sat) - Weekend peak
    1.70, // Day 6 (Sun) - Weekend peak
    1.0,  // Day 7 (Mon)
    1.25, // Day 8 (Tue) - Electricity bill day
    1.05, // Day 9 (Wed)
    1.1,  // Day 10 (Thu)
    1.2,  // Day 11 (Fri)
    1.8,  // Day 12 (Sat) - Weekend peak
    1.75  // Day 13 (Sun - Today)
  ];
  const sumWeights = dayWeights.reduce((a, b) => a + b, 0);

  const daysPool = Array.from({ length: 13 }, () => []);

  foods.forEach(f => {
    const fId = f._id.toString();
    const count = foodTargets[fId];
    for (let i = 0; i < count; i++) {
      let r = Math.random() * sumWeights;
      let selectedDay = 0;
      for (let d = 0; d < 13; d++) {
        r -= dayWeights[d];
        if (r <= 0) {
          selectedDay = d;
          break;
        }
      }
      daysPool[selectedDay].push(f);
    }
  });

  console.log('\n--- 4. Generating Orders, Payments, and Reviews (01/09 - 13/09) ---');
  const allOrders = [];
  const allPayments = [];
  const allReviews = [];
  const foodActualSold = {};
  foods.forEach(f => { foodActualSold[f._id.toString()] = 0; });

  let invoiceSeq = 1000;

  for (let d = 0; d < 13; d++) {
    const dayNumber = d + 1; // 1 -> 13
    const dayItems = daysPool[d];
    dayItems.sort(() => Math.random() - 0.5);

    let itemIdx = 0;
    const dayOrderList = [];

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
            note: Math.random() < 0.4 ? getRandomItem(['Ít đá', '70% đường', 'Nhiều sữa', 'Nóng', 'Không đường', 'Ít ngọt']) : '',
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
      const paymentMethod = randPay < 0.55 ? 'bank_transfer' : (randPay < 0.9 ? 'cash' : 'momo');

      const ratio = oIdx / Math.max(dayOrderList.length - 1, 1);
      let hour, minute;
      if (ratio < 0.35) {
        hour = getRandomInt(7, 11);
        minute = getRandomInt(15, 55);
      } else if (ratio < 0.65) {
        hour = getRandomInt(12, 16);
        minute = getRandomInt(0, 55);
      } else {
        hour = getRandomInt(17, 21);
        minute = getRandomInt(0, 45);
      }

      const orderTime = makeVNTime(2026, 9, dayNumber, hour, minute);
      const paidTime = new Date(orderTime.getTime() + getRandomInt(5, 20) * 60000);

      const subtotal = orderItems.reduce((sum, itm) => sum + itm.price * itm.quantity, 0);
      let discountAmount = 0;
      let couponCode = null;

      if (subtotal >= 300000) {
        couponCode = 'KOHI10';
        discountAmount = Math.round(subtotal * 0.1);
      }

      const totalAmount = subtotal - discountAmount;
      const orderId = new mongoose.Types.ObjectId();

      let staffName = 'PV-SÁNG';
      if (hour >= 12 && hour < 17) staffName = 'PV-CHIỀU';
      if (hour >= 17) staffName = 'PV-TỐI';

      const orderDoc = {
        _id: orderId,
        tableId: assignedTable._id,
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
        staffName,
        paidAt: paidTime,
        isDeleted: false,
        createdAt: paidTime,
        updatedAt: paidTime,
      };
      allPayments.push(paymentDoc);

      if (Math.random() < 0.42) {
        const reviewTime = new Date(paidTime.getTime() + getRandomInt(15, 60) * 60000);
        const overallStar = Math.random() < 0.88 ? 5 : 4;
        const reviewDoc = {
          _id: new mongoose.Types.ObjectId(),
          orderId: orderDoc._id,
          tableId: assignedTable._id,
          ratings: orderItems.map(i => ({
            foodId: i.foodId,
            star: overallStar,
            comment: getRandomItem(['Rất ngon!', 'Đậm đà chuẩn vị', 'Tuyệt vời', 'Thơm ngon vừa miệng', 'Rất thích']),
          })),
          overallStar,
          overallComment: getRandomItem(REVIEW_COMMENTS),
          createdAt: reviewTime,
          updatedAt: reviewTime,
        };
        allReviews.push(reviewDoc);
      }
    });
  }

  console.log(`Generated ${allOrders.length} orders, ${allPayments.length} payments, ${allReviews.length} reviews.`);

  console.log('\n--- 5. Generating Daily Ingredient Usages (Proportional to Sales) ---');
  const allIngredientUsages = [];

  const ingRobusta = ingredients.find(i => i.name.includes('Robusta')) || ingredients[0];
  const ingArabica = ingredients.find(i => i.name.includes('Arabica')) || ingredients[1] || ingredients[0];
  const ingSuaTuoi = ingredients.find(i => i.name.includes('Sữa Tươi')) || ingredients[2];
  const ingSuaDac = ingredients.find(i => i.name.includes('Sữa Đặc')) || ingredients[3];
  const ingDuong = ingredients.find(i => i.name.includes('Đường')) || ingredients[4];
  const ingMatcha = ingredients.find(i => i.name.includes('Matcha')) || ingredients[5];
  const ingKemBeo = ingredients.find(i => i.name.includes('Kem Béo')) || ingredients[6];
  const ingSiro = ingredients.find(i => i.name.includes('Siro')) || ingredients[7];

  for (let d = 1; d <= 13; d++) {
    const isWeekend = (d === 5 || d === 6 || d === 12 || d === 13);
    const multiplier = isWeekend ? 1.5 : 1.0;
    const usageTime = makeVNTime(2026, 9, d, 21, 30);

    const dayUsages = [
      {
        ing: ingRobusta,
        qty: parseFloat(((1.1 + Math.random() * 0.3) * multiplier).toFixed(2)),
        note: 'Tiêu hao hạt cà phê Robusta pha máy & pha phin',
      },
      {
        ing: ingArabica,
        qty: parseFloat(((0.6 + Math.random() * 0.2) * multiplier).toFixed(2)),
        note: 'Tiêu hao hạt cà phê Arabica Cầu Đất cho Latte & Espresso',
      },
      {
        ing: ingSuaTuoi,
        qty: parseFloat(((3.8 + Math.random() * 0.8) * multiplier).toFixed(1)),
        note: 'Tiêu hao sữa tươi thanh trùng Dalat Milk',
      },
      {
        ing: ingSuaDac,
        qty: parseFloat(((2.2 + Math.random() * 0.5) * multiplier).toFixed(1)),
        note: 'Tiêu hao sữa đặc Ngôi Sao Phương Nam / Ông Thọ',
      },
      {
        ing: ingDuong,
        qty: parseFloat(((1.4 + Math.random() * 0.4) * multiplier).toFixed(1)),
        note: 'Tiêu hao đường nước nấu sẵn',
      },
      {
        ing: ingMatcha,
        qty: parseFloat(((0.12 + Math.random() * 0.04) * multiplier).toFixed(2)),
        note: 'Tiêu hao bột matcha Uji các món Matcha Latte, Dâu, Xoài',
      },
      {
        ing: ingKemBeo,
        qty: parseFloat(((1.1 + Math.random() * 0.4) * multiplier).toFixed(1)),
        note: 'Tiêu hao kem béo Rich đánh kem muối & kem cheese',
      },
      {
        ing: ingSiro,
        qty: parseFloat(((0.2 + Math.random() * 0.06) * multiplier).toFixed(2)),
        note: 'Tiêu hao siro đào, vải, dâu trang trí & pha chế',
      },
    ];

    for (const u of dayUsages) {
      if (!u.ing) continue;
      const totalCost = Math.round(u.qty * u.ing.unitPrice);
      allIngredientUsages.push({
        _id: new mongoose.Types.ObjectId(),
        ingredientId: u.ing._id,
        ingredientName: u.ing.name,
        unit: u.ing.unit,
        quantity: u.qty,
        unitPrice: u.ing.unitPrice,
        totalCost,
        date: usageTime,
        updatedBy: 'PC-TỐI',
        note: u.note,
        createdAt: usageTime,
        updatedAt: usageTime,
      });
    }
  }

  console.log(`Generated ${allIngredientUsages.length} ingredient usage records.`);

  console.log('\n--- 6. Generating Rich Daily Incidental Expenses (01/09 - 13/09) ---');
  const allExpenses = [];

  const specificExpenses = {
    1: [
      { title: 'Nhập ly giấy Kraft, ống hút gạo & túi mang về', amount: 320000, cat: 'Vật tư & Tiện ích', note: 'Nhập vật tư đóng gói mang về đầu tháng' }
    ],
    2: [
      { title: 'Khăn giấy napkin in logo quán & nước tẩy quầy bar', amount: 115000, cat: 'Vật tư & Tiện ích', note: 'Vệ sinh định kỳ đầu tuần' }
    ],
    3: [
      { title: 'Cước Internet cáp quang VNPT & Nhạc nền Spotify', amount: 380000, cat: 'Vật tư & Tiện ích', note: 'Gói cước viễn thông & bản quyền nhạc cafe' }
    ],
    4: [
      { title: 'Bổ sung 10 ly thủy tinh cao & thìa inox quấy', amount: 180000, cat: 'Dụng cụ & Thiết bị', note: 'Thay thế ly vỡ phục vụ tại quán' }
    ],
    5: [
      { title: 'Hoa tươi trang trí quầy order & bàn khách', amount: 150000, cat: 'Trang trí & Không gian', note: 'Hoa tươi cắm bàn ngày thứ Bảy' },
      { title: 'Thay lõi lọc nước tinh khiết máy pha cà phê', amount: 260000, cat: 'Bảo trì & Sửa chữa', note: 'Bảo dưỡng định kỳ hệ thống lọc nước máy Espresso' }
    ],
    6: [
      { title: 'Dung dịch rửa tay khô sát khuẩn & túi rác sinh học', amount: 75000, cat: 'Vật tư & Tiện ích', note: 'Vật tư vệ sinh phục vụ khách Chủ Nhật' }
    ],
    7: [
      { title: 'Bảo dưỡng, căn chỉnh cối xay cà phê Eureka', amount: 250000, cat: 'Bảo trì & Sửa chữa', note: 'Kỹ thuật viên vệ sinh lưỡi xay & cân lại độ mịn' }
    ],
    8: [
      { title: 'Hóa đơn điện lực (điều hòa, tủ mát) & nước sạch', amount: 950000, cat: 'Vật tư & Tiện ích', note: 'Thanh toán tiền điện sinh hoạt & nước kỳ tháng 8' }
    ],
    9: [
      { title: 'Mua trà túi lọc Oolong test đồ uống mới & chanh tươi', amount: 95000, cat: 'Đồ uống phụ', note: 'R&D món trà hoa quả mới cho quán' }
    ],
    10: [
      { title: 'Lốc 10 cuộn giấy in hóa đơn nhiệt K80 & găng tay', amount: 140000, cat: 'Vật tư & Tiện ích', note: 'Bổ sung giấy in hóa đơn POS tại quầy thu ngân' }
    ],
    11: [
      { title: 'Tạp dề đồng phục Kohi Coffee mới cho nhân viên', amount: 180000, cat: 'Đồng phục & Dụng cụ', note: 'Trang bị tạp dề mới sạch đẹp cho nhân sự' }
    ],
    12: [
      { title: 'Hoa tươi cắm quầy thu ngân cuối tuần & đường que gói', amount: 190000, cat: 'Trang trí & Không gian', note: 'Trang trí bàn đón khách ngày thứ Bảy' }
    ],
    13: [
      { title: 'Túi chữ T mang đi & nắp cầu ly nhựa mang về', amount: 120000, cat: 'Vật tư & Tiện ích', note: 'Bổ sung vật tư đóng gói đồ uống ngày Chủ Nhật' }
    ]
  };

  for (let d = 1; d <= 13; d++) {
    const expTime = makeVNTime(2026, 9, d, 9, 0);
    allExpenses.push({
      _id: new mongoose.Types.ObjectId(),
      title: 'Đá bi sạch tinh khiết pha chế trong ngày',
      amount: getRandomInt(45, 55) * 1000,
      date: expTime,
      category: 'Đá & Đồ uống phụ',
      note: 'Nhập đá viên hàng ngày từ nhà cung cấp đá tinh khiết',
      createdBy: 'PV-SÁNG',
      createdAt: expTime,
      updatedAt: expTime,
    });

    if (specificExpenses[d]) {
      for (const se of specificExpenses[d]) {
        const t = new Date(expTime.getTime() + getRandomInt(30, 240) * 60000);
        allExpenses.push({
          _id: new mongoose.Types.ObjectId(),
          title: se.title,
          amount: se.amount,
          date: t,
          category: se.cat,
          note: se.note,
          createdBy: 'Admin',
          createdAt: t,
          updatedAt: t,
        });
      }
    }
  }

  console.log(`Generated ${allExpenses.length} operating expense records.`);

  console.log('\n--- 7. Generating Full Staff Attendance (All 3 Shifts x 13 Days) ---');
  const allAttendances = [];

  const staffShifts = [
    { staff: pvSang, shift: 'morning', inH: 6, inM: 45, outH: 12, outM: 5, note: 'Đúng giờ, mở cửa bàn ghế ngăn nắp' },
    { staff: pcSang, shift: 'morning', inH: 6, inM: 40, outH: 12, outM: 10, note: 'Kiểm tra máy pha, chuẩn bị quầy bar' },
    { staff: pvChieu, shift: 'afternoon', inH: 11, inM: 55, outH: 17, outM: 35, note: 'Đúng giờ, nhận bàn giao ca chu đáo' },
    { staff: pcChieu, shift: 'afternoon', inH: 11, inM: 50, outH: 17, outM: 40, note: 'Bổ sung nguyên liệu, pha chế kịp thời' },
    { staff: pvToi, shift: 'evening', inH: 17, inM: 25, outH: 22, outM: 35, note: 'Đúng giờ, vệ sinh bàn ghế sạch sẽ' },
    { staff: pcToi, shift: 'evening', inH: 17, inM: 20, outH: 22, outM: 45, note: 'Vệ sinh và xả áp máy cà phê cuối ngày' },
  ];

  for (let d = 1; d <= 13; d++) {
    const dateOnly = makeVNTime(2026, 9, d, 0, 0);

    for (const ss of staffShifts) {
      const checkInTime = makeVNTime(2026, 9, d, ss.inH, ss.inM + getRandomInt(-5, 5));
      const checkOutTime = makeVNTime(2026, 9, d, ss.outH, ss.outM + getRandomInt(-5, 5));
      const diffHours = parseFloat(((checkOutTime.getTime() - checkInTime.getTime()) / (1000 * 60 * 60)).toFixed(2));

      allAttendances.push({
        _id: new mongoose.Types.ObjectId(),
        userId: ss.staff._id,
        date: dateOnly,
        checkIn: checkInTime,
        checkOut: checkOutTime,
        shift: ss.shift,
        totalHours: diffHours,
        note: ss.note,
        isManualEdit: false,
        isPaid: false,
        paidAt: null,
        payrollId: null,
        createdAt: checkInTime,
        updatedAt: checkOutTime,
      });
    }
  }

  console.log(`Generated ${allAttendances.length} attendance records.`);

  console.log('\n--- 8. Generating August Payroll Payout Record (Paid in August) ---');
  const allPayrolls = [];
  const payrollPayDate = makeVNTime(2026, 8, 31, 10, 0);

  staffUsers.forEach(u => {
    const baseHours = getRandomInt(155, 175);
    const hourlyRate = 25000;
    const baseSalary = baseHours * hourlyRate;
    const allowance = 300000;
    const bonus = getRandomInt(100, 300) * 1000;
    const deductions = 0;
    const netSalary = baseSalary + allowance + bonus - deductions;

    allPayrolls.push({
      _id: new mongoose.Types.ObjectId(),
      userId: u._id,
      month: '2026-08',
      totalHours: baseHours,
      hourlyRate,
      baseSalary,
      allowance,
      bonus,
      deductions,
      netSalary,
      status: 'paid',
      isPaid: true,
      paidAt: payrollPayDate,
      paymentMethod: 'bank_transfer',
      note: 'Thanh toán tiền lương tháng 08/2026 qua chuyển khoản',
      createdAt: payrollPayDate,
      updatedAt: payrollPayDate,
    });
  });

  console.log(`Generated ${allPayrolls.length} payroll payout records for August 2026.`);

  console.log('\n--- 9. Inserting All Collections to Database ---');
  if (allOrders.length > 0) await db.collection('orders').insertMany(allOrders);
  if (allPayments.length > 0) await db.collection('payments').insertMany(allPayments);
  if (allReviews.length > 0) await db.collection('reviews').insertMany(allReviews);
  if (allIngredientUsages.length > 0) await db.collection('ingredientusages').insertMany(allIngredientUsages);
  if (allExpenses.length > 0) await db.collection('expenses').insertMany(allExpenses);
  if (allAttendances.length > 0) await db.collection('attendances').insertMany(allAttendances);
  if (allPayrolls.length > 0) await db.collection('payrolls').insertMany(allPayrolls);

  console.log('\n--- 10. Updating Foods soldCount in Database ---');
  for (const f of foods) {
    const fId = f._id.toString();
    const actual = foodActualSold[fId] || 25;
    await db.collection('foods').updateOne({ _id: f._id }, { $set: { soldCount: actual } });
  }
  console.log(`Updated soldCount for all ${foods.length} foods.`);

  console.log('\n--- 11. Replenishing Warehouse Ingredient Inventory ---');
  const healthyInventory = {
    'Robusta': 32.5,
    'Arabica': 20.0,
    'Sữa Tươi': 45.0,
    'Sữa Đặc': 30.0,
    'Đường': 25.0,
    'Matcha': 6.5,
    'Kem Béo': 24.0,
    'Siro': 10.5,
  };

  for (const ing of ingredients) {
    for (const [key, qty] of Object.entries(healthyInventory)) {
      if (ing.name.includes(key)) {
        await db.collection('ingredients').updateOne(
          { _id: ing._id },
          { $set: { currentQuantity: qty, status: 'in_stock' } }
        );
      }
    }
  }
  console.log('Restocked warehouse inventory.');

  console.log('\n--- 12. Verification and Summary of 13 Days ---');
  const totalRev = allPayments.reduce((s, p) => s + p.totalAmount, 0);
  const totalIngCost = allIngredientUsages.reduce((s, i) => s + i.totalCost, 0);
  const totalExp = allExpenses.reduce((s, e) => s + e.amount, 0);
  const totalHoursWorked = allAttendances.reduce((s, a) => s + a.totalHours, 0);
  const estSalaryCost = Math.round(totalHoursWorked * 25000);
  const estNetProfit = totalRev - totalIngCost - totalExp - estSalaryCost;

  console.log(`• Tổng Doanh thu (01/09 - 13/09): ${totalRev.toLocaleString('vi-VN')} đ`);
  console.log(`• Doanh thu trung bình ngày: ${(totalRev / 13).toLocaleString('vi-VN')} đ/ngày`);
  console.log(`• Tổng Chi phí Lương ca làm (13 ngày): ${estSalaryCost.toLocaleString('vi-VN')} đ`);
  console.log(`• Tổng Chi phí Nguyên liệu tiêu hao: ${totalIngCost.toLocaleString('vi-VN')} đ`);
  console.log(`• Tổng Chi phí Phát sinh hoạt động: ${totalExp.toLocaleString('vi-VN')} đ`);
  console.log(`• Tổng Lợi nhuận Ròng 13 ngày: ${estNetProfit.toLocaleString('vi-VN')} đ (Tỷ suất lợi nhuận: ${((estNetProfit / totalRev) * 100).toFixed(1)}%)`);

  await mongoose.disconnect();
  console.log('\n🎉 ALL REVENUE & FINANCIAL DATA SEEDED SUCCESSFULLY!');
}

if (process.argv.includes('--today')) {
  require('./seed-today.js');
} else {
  runSeed().catch(err => {
    console.error('Seed Error:', err);
    process.exit(1);
  });
}

