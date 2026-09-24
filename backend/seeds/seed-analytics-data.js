/**
 * KOHI COFFEE POS - COMPREHENSIVE BUSINESS SEED DATA
 * ==================================================
 * File: backend/seeds/seed-analytics-data.js
 * 
 * Tạo dữ liệu mẫu hoàn chỉnh và thực tế cho hệ thống:
 * 1. Lượt bán các món (Food soldCount cập nhật từ dữ liệu đơn hàng thực tế)
 * 2. Chấm công nhân viên theo ngày (Staff daily attendance đủ 3 ca x 24 ngày)
 * 3. Đánh giá món (Food reviews & ratings chân thực bằng tiếng Việt)
 * 4. Doanh thu & Chi phí (Orders, Payments, Expenses, Ingredient Usages theo thời gian thực)
 * 
 * Khung thời gian: Từ 01/09/2026 đến 24/09/2026 (24 ngày đầy đủ)
 */

const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');

// 1. Phân tích file .env để lấy MONGODB_URI
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

// Danh sách khách hàng thân quen tại quán
const CUSTOMER_NAMES = [
  'Nam Hoài', 'Lan Anh', 'Minh Tuấn', 'Hoàng Long', 'Thu Hà',
  'Đức Anh', 'Mai Phương', 'Bảo Ngọc', 'Thành Đạt', 'Khánh Linh',
  'Hữu Phước', 'Quỳnh Nga', 'Thanh Tùng', 'Thảo Nguyên', 'Văn Hưng',
  'Hồng Nhung', 'Quang Huy', 'Diệu Linh', 'Tiến Dũng', 'Kim Ngân',
  'Ngọc Trâm', 'Bảo Hân', 'Tuấn Kiệt', 'Gia Huy', 'Thúy Hằng',
  'Hoàng Nam', 'Phương Linh', 'Việt Anh', 'Hương Giang', 'Minh Quân'
];

// Danh sách nhận xét đánh giá chân thực từ khách hàng
const REVIEW_COMMENTS = [
  'Cà phê kem muối béo ngậy vừa miệng, vị cà phê đậm đà rất ưng ý.',
  'Không gian quán yên tĩnh, mát mẻ, làm việc buổi sáng rất tập trung.',
  'Matcha dâu ngon đỉnh chóp, decor đồ uống đẹp mắt chụp hình siêu xinh.',
  'Bánh tart trứng nóng giòn thơm nức mũi, nhân viên phục vụ cực kỳ chu đáo.',
  'Sinh tố dâu cheesecake ngậy thơm không bị quá ngọt, sẽ ghé lại thường xuyên!',
  'Cà phê latte vẽ art đẹp, bọt sữa mịn màng, phục vụ nhanh nhẹn.',
  'Trà đào thơm thanh, miếng đào giòn ngọt, nhân viên thân thiện 10/10.',
  'Đá xay chocolate kem tươi béo bùi, không gian buổi tối chill cực kỳ.',
  'Bánh donut và macaron ngọt dịu, ăn kèm cà phê đen rất hợp vị.',
  'Đồ uống ra nhanh, bàn ghế sạch sẽ, nhân viên lễ phép và dễ thương.',
  'Cà phê caramel đậu phộng vị lạ mà cuốn, rất đáng thử!',
  'Trà chanh dây giải nhiệt mùa hè quá đã, decor quán hiện đại và ấm cúng.',
  'Tào phớ trân châu đường đen thanh mát, trân châu dẻo dai vừa miệng.',
  'Cà phê kem trứng muối béo thơm không tanh, rất đậm đà.',
  'Bánh rán nhân khoai môn phô mai kéo sợi thơm phức, ăn kèm cafe chuẩn bài.',
  'Cà phê đen đá đậm vị truyền thống, hạt rang mộc thơm nồng cuốn hút.',
  'Soda vải hoa hồng thanh mát, vị ngọt dịu nhẹ uống rất sảng khoái.',
  'Không gian tầng 2 có nhiều ổ cắm tiện làm việc, wifi nhanh ổn định.',
  'Bánh macaron giòn vỏ mềm nhân, vị chanh leo chua ngọt cân bằng xuất sắc.',
  'Nhân viên phục vụ rất nhiệt tình, tư vấn món phù hợp với sở thích của mình.',
  'Ly trà đào cam sả thơm phức, miếng cam vàng ươm tươi rói, trang trí tỉ mỉ.',
  'Cafe ngon, nhạc nhẹ nhàng dễ chịu, góc ngồi ngắm phố phường rất thơ mộng.'
];

// Ghi chú chấm công theo ca
const SHIFT_NOTES = {
  morning: [
    'Đúng giờ, mở cửa và chuẩn bị bàn ghế ngăn nắp đón khách sớm',
    'Kiểm tra máy pha espresso, test shot chiết xuất đầu ngày chuẩn vị',
    'Chuẩn bị quầy bar, kiểm kê nguyên vật liệu đầu ca sáng',
    'Mở ca đúng giờ, vệ sinh khu vực pha chế sạch sẽ',
    'Đúng giờ, bàn giao ca chu đáo cho ca chiều'
  ],
  afternoon: [
    'Đúng giờ, nhận bàn giao ca trưa và kiểm tra nguyên liệu tồn',
    'Bổ sung đá bi, sữa tươi thanh trùng và chuẩn bị phục vụ giờ cao điểm chiều',
    'Pha chế nhanh nhẹn, giữ quầy bar luôn khô ráo và sạch đẹp',
    'Phục vụ khách nhiệt tình, dọn dẹp bàn kịp thời giờ cao điểm',
    'Kiểm kê đồ dùng, chuẩn bị bàn giao cho ca tối'
  ],
  evening: [
    'Đúng giờ, nhận ca tối và vệ sinh bàn ghế khu vực sảnh',
    'Phục vụ chu đáo giờ cao điểm tối, khách vào đông',
    'Vệ sinh máy pha cà phê, xả áp suất và bảo dưỡng máy cuối ngày',
    'Lau dọn quầy bar, tổng vệ sinh sàn nhà và đóng cửa cẩn thận',
    'Đúng giờ, kiểm kê dụng cụ quầy bar trước khi chốt ca ra về'
  ]
};

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

async function runSeedAnalyticsData() {
  console.log('========================================================================');
  console.log('☕ KOHI COFFEE POS - SEED TOÀN BỘ DỮ LIỆU KINH DOANH & PHÂN TÍCH DOANH THU');
  console.log('========================================================================\n');

  console.log('[DB] Đang kết nối tới MongoDB Atlas...');
  await mongoose.connect(MONGODB_URI);
  const db = mongoose.connection.db;
  console.log('[DB] Kết nối thành công.\n');

  // --------------------------------------------------------------------------
  // BƯỚC 1: DỌN DẸP DỮ LIỆU GIAO DỊCH CŨ (Đảm bảo số liệu sạch và chính xác)
  // --------------------------------------------------------------------------
  console.log('--- 1. Dọn dẹp dữ liệu giao dịch cũ (Orders, Payments, Attendances, Reviews, Expenses, Usages) ---');
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
    console.log(`  ✓ Đã xóa [${col}]: ${res.deletedCount} bản ghi cũ.`);
  }

  // Reset trạng thái các bàn
  await db.collection('tables').updateMany({}, {
    $set: {
      status: 'empty',
      currentSessionStartedAt: null,
      occupants: [],
      activeOrdersCount: 0,
      qrToken: null,
    }
  });
  console.log('  ✓ Đã reset tất cả các bàn về trạng thái "empty".\n');

  // --------------------------------------------------------------------------
  // BƯỚC 2: KIỂM TRA & ĐẢM BẢO THỰC THỂ CƠ BẢN (Users, Foods, Tables, Ingredients)
  // --------------------------------------------------------------------------
  console.log('--- 2. Kiểm tra và đồng bộ thực thể cơ bản ---');
  let foods = await db.collection('foods').find({}).toArray();
  let tables = await db.collection('tables').find({}).toArray();
  let users = await db.collection('users').find({}).toArray();
  let ingredients = await db.collection('ingredients').find({}).toArray();

  // Đảm bảo tối thiểu 12 bàn
  if (tables.length < 12) {
    console.log('  - Tạo thêm bàn cho đủ 12 bàn...');
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

  // Đảm bảo đủ 7 tài khoản nhân sự và quản trị viên
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

  console.log(`  ✓ Cơ sở: ${foods.length} món ăn, ${tables.length} bàn, ${users.length} tài khoản, ${ingredients.length} nguyên liệu.\n`);

  // --------------------------------------------------------------------------
  // BƯỚC 3: THIẾT LẬP MỤC TIÊU LƯỢT BÁN (soldCount) CHO TỪNG MÓN ĂN
  // --------------------------------------------------------------------------
  console.log('--- 3. Thiết lập mục tiêu lượt bán từng món (soldCount target) ---');
  // Phân loại món Best-seller, Popular và Regular
  const foodTargets = {};
  foods.forEach(f => {
    const name = f.name.toLowerCase();
    if (name.includes('muối') || name.includes('đen') || name.includes('latte') || name.includes('matcha dâu') || name.includes('tart')) {
      // Món siêu hot (Top 1): 180 - 260 ly/bánh
      foodTargets[f._id.toString()] = getRandomInt(180, 260);
    } else if (name.includes('cheesecake') || name.includes('đào') || name.includes('donut') || name.includes('socola') || name.includes('soda')) {
      // Món bán chạy phổ biến: 120 - 175 ly/bánh
      foodTargets[f._id.toString()] = getRandomInt(120, 175);
    } else if (name.includes('tào phớ') || name.includes('macaron') || name.includes('caramel') || name.includes('chanh dây')) {
      // Món được ưa chuộng: 85 - 120 món
      foodTargets[f._id.toString()] = getRandomInt(85, 120);
    } else {
      // Các món còn lại: 55 - 80 món
      foodTargets[f._id.toString()] = getRandomInt(55, 80);
    }
  });

  const totalFoodItemsToSell = Object.values(foodTargets).reduce((a, b) => a + b, 0);
  console.log(`  ✓ Tổng số lượng món cần phân bổ: ${totalFoodItemsToSell} món qua 24 ngày kinh doanh (01/09 -> 24/09).\n`);

  // Phân bổ trọng số theo ngày trong tuần: Thứ Bảy và Chủ Nhật đông khách hơn 40-70%
  // 01/09/2026 là Thứ Ba
  // Ngày 5, 6, 12, 13, 19, 20 là Thứ Bảy và Chủ Nhật
  const dayWeights = [];
  for (let d = 1; d <= 24; d++) {
    // d=1 (Tue: 1.0), d=2 (Wed: 1.0), d=3 (Thu: 1.05), d=4 (Fri: 1.25), d=5 (Sat: 1.7), d=6 (Sun: 1.65), d=7 (Mon: 0.95)...
    const dayOfWeek = (d + 1) % 7; // 0=Sun, 1=Mon, ..., 6=Sat
    if (dayOfWeek === 6) dayWeights.push(1.70); // Sat
    else if (dayOfWeek === 0) dayWeights.push(1.65); // Sun
    else if (dayOfWeek === 5) dayWeights.push(1.25); // Fri
    else if (dayOfWeek === 1) dayWeights.push(0.95); // Mon
    else dayWeights.push(1.05); // Tue, Wed, Thu
  }
  const sumWeights = dayWeights.reduce((a, b) => a + b, 0);

  // Tạo kho món cho từng ngày (24 ngày)
  const daysPool = Array.from({ length: 24 }, () => []);

  foods.forEach(f => {
    const fId = f._id.toString();
    const count = foodTargets[fId];
    for (let i = 0; i < count; i++) {
      let r = Math.random() * sumWeights;
      let selectedDay = 0;
      for (let d = 0; d < 24; d++) {
        r -= dayWeights[d];
        if (r <= 0) {
          selectedDay = d;
          break;
        }
      }
      daysPool[selectedDay].push(f);
    }
  });

  // --------------------------------------------------------------------------
  // BƯỚC 4: TẠO ĐƠN HÀNG, THANH TOÁN (DOANH THU) & ĐÁNH GIÁ MÓN (REVIEWS)
  // --------------------------------------------------------------------------
  console.log('--- 4. Khởi tạo Đơn Hàng (Orders), Hóa Đơn (Payments) & Đánh Giá (Reviews) ---');
  const allOrders = [];
  const allPayments = [];
  const allReviews = [];
  const foodActualSold = {};
  const foodReviewStats = {};

  foods.forEach(f => {
    foodActualSold[f._id.toString()] = 0;
    foodReviewStats[f._id.toString()] = { totalStars: 0, count: 0 };
  });

  let invoiceSeq = 1000;

  for (let d = 0; d < 24; d++) {
    const dayNumber = d + 1; // 1 -> 24
    const dayItems = daysPool[d];
    dayItems.sort(() => Math.random() - 0.5);

    let itemIdx = 0;
    const dayOrderList = [];

    // Nhóm các món thành các đơn hàng (1 - 3 món mỗi đơn)
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
            note: Math.random() < 0.35 ? getRandomItem(['Ít đá', '70% đường', 'Nhiều sữa', 'Nóng', 'Không đường', 'Ít ngọt']) : '',
          });
        }
        foodActualSold[idStr] += 1;
      }
      dayOrderList.push(Array.from(itemMap.values()));
    }

    // Tạo Order & Payment docs cho từng đơn trong ngày
    dayOrderList.forEach((orderItems, oIdx) => {
      invoiceSeq++;
      const assignedTable = getRandomItem(tables);
      const customerName = getRandomItem(CUSTOMER_NAMES);
      const randPay = Math.random();
      const paymentMethod = randPay < 0.55 ? 'bank_transfer' : (randPay < 0.9 ? 'cash' : 'momo');

      // Phân bổ giờ trong ngày: Ca sáng (7-11h), Ca chiều (12-16h), Ca tối (17-21h)
      const ratio = oIdx / Math.max(dayOrderList.length - 1, 1);
      let hour, minute;
      let staffName = 'PV-SÁNG';

      if (ratio < 0.35) {
        hour = getRandomInt(7, 11);
        minute = getRandomInt(10, 55);
        staffName = 'PV-SÁNG';
      } else if (ratio < 0.65) {
        hour = getRandomInt(12, 16);
        minute = getRandomInt(5, 55);
        staffName = 'PV-CHIỀU';
      } else {
        hour = getRandomInt(17, 21);
        minute = getRandomInt(5, 45);
        staffName = 'PV-TỐI';
      }

      // Giới hạn giờ cho ngày hôm nay (24/09/2026) nếu đơn diễn ra trong quá khứ buổi sáng
      if (dayNumber === 24 && hour >= 18) {
        hour = getRandomInt(7, 11);
        staffName = 'PV-SÁNG';
      }

      const orderTime = makeVNTime(2026, 9, dayNumber, hour, minute);
      const paidTime = new Date(orderTime.getTime() + getRandomInt(6, 20) * 60000);

      const subtotal = orderItems.reduce((sum, itm) => sum + itm.price * itm.quantity, 0);
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
        staffName,
        paidAt: paidTime,
        isDeleted: false,
        createdAt: paidTime,
        updatedAt: paidTime,
      };
      allPayments.push(paymentDoc);

      // Khoảng 28% đơn hàng được khách hàng đánh giá
      if (Math.random() < 0.28) {
        const reviewTime = new Date(paidTime.getTime() + getRandomInt(10, 45) * 60000);
        // 88% đánh giá 5 sao, 10% đánh giá 4 sao, 2% đánh giá 3 sao kèm góp ý
        const randStar = Math.random();
        let overallStar = 5;
        let reviewComment = getRandomItem(REVIEW_COMMENTS);

        if (randStar < 0.88) {
          overallStar = 5;
        } else if (randStar < 0.98) {
          overallStar = 4;
          reviewComment = 'Đồ uống ngon, chất lượng ổn định. Nhân viên phục vụ nhanh nhẹn và lịch sự.';
        } else {
          overallStar = 3;
          reviewComment = 'Hơi nhiều đá một chút làm hơi loãng vị cafe, mong quán lưu ý định lượng đá.';
        }

        const ratings = orderItems.map(i => {
          const itemStar = overallStar;
          const fIdStr = i.foodId.toString();
          foodReviewStats[fIdStr].totalStars += itemStar;
          foodReviewStats[fIdStr].count += 1;

          return {
            foodId: i.foodId,
            star: itemStar,
            comment: itemStar === 5 
              ? getRandomItem(['Rất ngon!', 'Đậm đà chuẩn vị Kohi', 'Tuyệt vời', 'Thơm ngon vừa miệng', 'Hình thức đẹp'])
              : (itemStar === 4 ? 'Khá ngon, vừa miệng' : 'Cần giảm bớt đá'),
          };
        });

        const reviewDoc = {
          _id: new mongoose.Types.ObjectId(),
          orderId: orderDoc._id,
          tableId: assignedTable._id,
          ratings,
          overallStar,
          overallComment: reviewComment,
          createdAt: reviewTime,
          updatedAt: reviewTime,
        };
        allReviews.push(reviewDoc);
      }
    });
  }

  // Thêm 2-3 đơn hàng đang phục vụ trực tiếp tại bàn trong ngày hôm nay để bàn có trạng thái sinh động
  const todayServingTables = [
    { tableIdx: 1, customer: 'Bảo Ngọc', foodsIdx: [0, 2], status: 'cooking' },
    { tableIdx: 4, customer: 'Minh Tuấn', foodsIdx: [1, 3], status: 'ready' },
  ];

  for (const st of todayServingTables) {
    const tbl = tables[st.tableIdx] || tables[0];
    const orderTime = new Date(Date.now() - getRandomInt(5, 20) * 60000);
    const chosenFoods = st.foodsIdx.map(idx => foods[idx] || foods[0]);

    const orderItems = chosenFoods.map(f => ({
      foodId: f._id,
      quantity: 1,
      note: 'Dùng tại quán',
      orderedBy: st.customer,
      isPaid: false,
    }));

    const subtotal = chosenFoods.reduce((s, f) => s + f.price, 0);
    const activeOrderId = new mongoose.Types.ObjectId();

    allOrders.push({
      _id: activeOrderId,
      tableId: tbl._id,
      tableName: tbl.tableName,
      isTakeaway: false,
      items: orderItems,
      totalAmount: subtotal,
      status: st.status,
      paymentStatus: 'unpaid',
      paymentMethod: 'cash',
      customerName: st.customer,
      customerPhone: '09' + getRandomInt(10000000, 99999999),
      isDeleted: false,
      createdAt: orderTime,
      updatedAt: orderTime,
    });

    await db.collection('tables').updateOne(
      { _id: tbl._id },
      {
        $set: {
          status: 'serving',
          currentSessionStartedAt: orderTime,
          occupants: [{ customerName: st.customer, joinedAt: orderTime }],
          activeOrdersCount: 1,
        }
      }
    );
  }

  console.log(`  ✓ Đã sinh ${allOrders.length} đơn hàng (${allPayments.length} đã thanh toán hoàn tất).`);
  console.log(`  ✓ Đã sinh ${allReviews.length} lượt đánh giá món ăn từ khách hàng.`);

  // --------------------------------------------------------------------------
  // BƯỚC 5: TẠO CHẤM CÔNG NHÂN VIÊN THEO NGÀY (ATTENDANCES - ĐỦ 3 CA X 24 NGÀY)
  // --------------------------------------------------------------------------
  console.log('\n--- 5. Khởi tạo Chấm Công Nhân Viên theo ngày (Staff Attendance: 24 ngày x 3 ca) ---');
  const allAttendances = [];

  const staffShiftConfigs = [
    // Ca Sáng: PV-SÁNG & PC-SÁNG
    { staff: pvSang, shift: 'morning', inH: 6, inM: 45, outH: 12, outM: 5 },
    { staff: pcSang, shift: 'morning', inH: 6, inM: 40, outH: 12, outM: 10 },
    // Ca Chiều: PV-CHIỀU & PC-CHIỀU
    { staff: pvChieu, shift: 'afternoon', inH: 11, inM: 55, outH: 17, outM: 35 },
    { staff: pcChieu, shift: 'afternoon', inH: 11, inM: 50, outH: 17, outM: 40 },
    // Ca Tối: PV-TỐI & PC-TỐI
    { staff: pvToi, shift: 'evening', inH: 17, inM: 25, outH: 22, outM: 35 },
    { staff: pcToi, shift: 'evening', inH: 17, inM: 20, outH: 22, outM: 45 },
  ];

  for (let d = 1; d <= 24; d++) {
    const dateOnly = makeVNTime(2026, 9, d, 0, 0);

    for (const sc of staffShiftConfigs) {
      const shiftNotesPool = SHIFT_NOTES[sc.shift] || SHIFT_NOTES.morning;
      const note = getRandomItem(shiftNotesPool);

      const inMinuteRand = Math.max(0, Math.min(59, sc.inM + getRandomInt(-4, 4)));
      const outMinuteRand = Math.max(0, Math.min(59, sc.outM + getRandomInt(-4, 4)));

      const checkInTime = makeVNTime(2026, 9, d, sc.inH, inMinuteRand);
      const checkOutTime = makeVNTime(2026, 9, d, sc.outH, outMinuteRand);
      const diffHours = parseFloat(((checkOutTime.getTime() - checkInTime.getTime()) / (1000 * 60 * 60)).toFixed(2));

      allAttendances.push({
        _id: new mongoose.Types.ObjectId(),
        userId: sc.staff._id,
        date: dateOnly,
        checkIn: checkInTime,
        checkOut: checkOutTime,
        shift: sc.shift,
        totalHours: diffHours,
        note,
        isManualEdit: false,
        isPaid: false,
        paidAt: null,
        payrollId: null,
        createdAt: checkInTime,
        updatedAt: checkOutTime,
      });
    }
  }

  console.log(`  ✓ Đã sinh ${allAttendances.length} bản ghi chấm công (đầy đủ 24 ngày x 6 ca/ngày, không trùng lặp index).`);

  // --------------------------------------------------------------------------
  // BƯỚC 6: TẠO CHI PHÍ VẬN HÀNH & NGUYÊN LIỆU TIÊU HAO (CHO ANALYTICS DASHBOARD)
  // --------------------------------------------------------------------------
  console.log('\n--- 6. Khởi tạo Chi phí vận hành (Expenses) & Tiêu hao nguyên liệu (Usages) ---');
  const allExpenses = [];
  const allIngredientUsages = [];

  const recurringDailyExpenses = [
    { title: 'Đá bi sạch tinh khiết pha chế trong ngày', min: 45000, max: 55000, cat: 'Đá & Đồ uống phụ', note: 'Nhập đá viên hàng ngày từ đơn vị đá tinh khiết' },
  ];

  const milestoneExpenses = {
    1: [
      { title: 'Nhập ly giấy Kraft, ống hút gạo & túi mang về', amount: 450000, cat: 'Vật tư & Tiện ích', note: 'Bổ sung vật tư đóng gói đồ uống mang đi đầu tháng' }
    ],
    3: [
      { title: 'Cước Internet cáp quang VNPT & Bản quyền nhạc nền', amount: 380000, cat: 'Vật tư & Tiện ích', note: 'Thanh toán cước viễn thông và dịch vụ nhạc nền quán' }
    ],
    5: [
      { title: 'Hoa tươi trang trí quầy order & bàn đón khách', amount: 150000, cat: 'Trang trí & Không gian', note: 'Hoa tươi cắm bàn cuối tuần' }
    ],
    8: [
      { title: 'Hóa đơn tiền điện (điều hòa, tủ mát) & tiền nước sạch', amount: 1450000, cat: 'Vật tư & Tiện ích', note: 'Chi trả tiền điện nước sinh hoạt kinh doanh' }
    ],
    12: [
      { title: 'Bảo trì, căn chỉnh lưỡi cối xay cà phê Eureka', amount: 250000, cat: 'Bảo trì & Sửa chữa', note: 'Căn chỉnh độ mịn bột cà phê định kỳ' }
    ],
    16: [
      { title: 'Mua thêm 12 ly thủy tinh cao & muỗng quấy inox', amount: 220000, cat: 'Dụng cụ & Thiết bị', note: 'Bổ sung ly tách phục vụ tại quán' }
    ],
    20: [
      { title: 'Hoa tươi cắm bàn đón khách cuối tuần', amount: 160000, cat: 'Trang trí & Không gian', note: 'Hoa trang trí sảnh ngày thứ Bảy' }
    ],
  };

  // Nguyên liệu chính
  const ingRobusta = ingredients.find(i => i.name.includes('Robusta')) || ingredients[0];
  const ingArabica = ingredients.find(i => i.name.includes('Arabica')) || ingredients[1] || ingredients[0];
  const ingSuaTuoi = ingredients.find(i => i.name.includes('Sữa Tươi')) || ingredients[2];
  const ingSuaDac = ingredients.find(i => i.name.includes('Sữa Đặc')) || ingredients[3];
  const ingDuong = ingredients.find(i => i.name.includes('Đường')) || ingredients[4];
  const ingMatcha = ingredients.find(i => i.name.includes('Matcha')) || ingredients[5];
  const ingKemBeo = ingredients.find(i => i.name.includes('Kem Béo')) || ingredients[6];
  const ingSiro = ingredients.find(i => i.name.includes('Siro')) || ingredients[7];

  for (let d = 1; d <= 24; d++) {
    const isWeekend = (d % 7 === 5 || d % 7 === 6);
    const multiplier = isWeekend ? 1.4 : 1.0;
    const expTime = makeVNTime(2026, 9, d, 9, 0);

    // Chi phí hàng ngày (đá bi)
    allExpenses.push({
      _id: new mongoose.Types.ObjectId(),
      title: recurringDailyExpenses[0].title,
      amount: getRandomInt(recurringDailyExpenses[0].min, recurringDailyExpenses[0].max),
      date: expTime,
      category: recurringDailyExpenses[0].cat,
      note: recurringDailyExpenses[0].note,
      createdBy: 'PV-SÁNG',
      createdAt: expTime,
      updatedAt: expTime,
    });

    // Chi phí phát sinh định kỳ
    if (milestoneExpenses[d]) {
      for (const me of milestoneExpenses[d]) {
        const t = new Date(expTime.getTime() + getRandomInt(30, 240) * 60000);
        allExpenses.push({
          _id: new mongoose.Types.ObjectId(),
          title: me.title,
          amount: me.amount,
          date: t,
          category: me.cat,
          note: me.note,
          createdBy: 'Admin',
          createdAt: t,
          updatedAt: t,
        });
      }
    }

    // Tiêu hao nguyên liệu theo ngày
    const usageTime = makeVNTime(2026, 9, d, 21, 30);
    const dayUsages = [
      { ing: ingRobusta, qty: parseFloat(((1.2 + Math.random() * 0.4) * multiplier).toFixed(2)), note: 'Tiêu hao hạt cà phê Robusta pha máy & phin' },
      { ing: ingArabica, qty: parseFloat(((0.7 + Math.random() * 0.3) * multiplier).toFixed(2)), note: 'Tiêu hao hạt cà phê Arabica cho Latte & Espresso' },
      { ing: ingSuaTuoi, qty: parseFloat(((4.2 + Math.random() * 1.0) * multiplier).toFixed(1)), note: 'Tiêu hao sữa tươi thanh trùng Dalat Milk' },
      { ing: ingSuaDac, qty: parseFloat(((2.5 + Math.random() * 0.6) * multiplier).toFixed(1)), note: 'Tiêu hao sữa đặc pha cà phê' },
      { ing: ingDuong, qty: parseFloat(((1.5 + Math.random() * 0.5) * multiplier).toFixed(1)), note: 'Tiêu hao đường nước nấu sẵn' },
      { ing: ingMatcha, qty: parseFloat(((0.15 + Math.random() * 0.05) * multiplier).toFixed(2)), note: 'Tiêu hao bột matcha Uji cho các món Matcha' },
      { ing: ingKemBeo, qty: parseFloat(((1.3 + Math.random() * 0.5) * multiplier).toFixed(1)), note: 'Tiêu hao kem béo đánh kem muối & kem cheese' },
      { ing: ingSiro, qty: parseFloat(((0.25 + Math.random() * 0.08) * multiplier).toFixed(2)), note: 'Tiêu hao siro đào, vải, dâu' },
    ];

    for (const u of dayUsages) {
      if (!u.ing) continue;
      const unitPrice = u.ing.unitPrice || 60000;
      const totalCost = Math.round(u.qty * unitPrice);
      allIngredientUsages.push({
        _id: new mongoose.Types.ObjectId(),
        ingredientId: u.ing._id,
        ingredientName: u.ing.name,
        unit: u.ing.unit || 'kg',
        quantity: u.qty,
        quantityUsed: u.qty,
        unitPrice,
        costPerUnit: unitPrice,
        totalCost,
        date: usageTime,
        recordedBy: 'PC-TỐI',
        updatedBy: 'PC-TỐI',
        note: u.note,
        createdAt: usageTime,
        updatedAt: usageTime,
      });
    }
  }

  console.log(`  ✓ Đã sinh ${allExpenses.length} khoản chi phí vận hành.`);
  console.log(`  ✓ Đã sinh ${allIngredientUsages.length} bản ghi tiêu hao nguyên liệu.`);

  // --------------------------------------------------------------------------
  // BƯỚC 7: LƯU TẤT CẢ DỮ LIỆU VÀO MONGODB
  // --------------------------------------------------------------------------
  console.log('\n--- 7. Lưu tất cả dữ liệu vào CSDL MongoDB ---');
  if (allOrders.length > 0) {
    await db.collection('orders').insertMany(allOrders);
    console.log(`  ✓ Đã lưu ${allOrders.length} orders.`);
  }
  if (allPayments.length > 0) {
    await db.collection('payments').insertMany(allPayments);
    console.log(`  ✓ Đã lưu ${allPayments.length} payments.`);
  }
  if (allReviews.length > 0) {
    await db.collection('reviews').insertMany(allReviews);
    console.log(`  ✓ Đã lưu ${allReviews.length} reviews.`);
  }
  if (allAttendances.length > 0) {
    await db.collection('attendances').insertMany(allAttendances);
    console.log(`  ✓ Đã lưu ${allAttendances.length} attendances.`);
  }
  if (allExpenses.length > 0) {
    await db.collection('expenses').insertMany(allExpenses);
    console.log(`  ✓ Đã lưu ${allExpenses.length} expenses.`);
  }
  if (allIngredientUsages.length > 0) {
    await db.collection('ingredientusages').insertMany(allIngredientUsages);
    console.log(`  ✓ Đã lưu ${allIngredientUsages.length} ingredientusages.`);
  }

  // --------------------------------------------------------------------------
  // BƯỚC 8: CẬP NHẬT LƯỢT BÁN (soldCount) VÀ ĐÁNH GIÁ (rating, totalReviews) CHO MÓN ĂN
  // --------------------------------------------------------------------------
  console.log('\n--- 8. Cập nhật lượt bán (soldCount) & đánh giá (rating, totalReviews) cho bảng Foods ---');
  for (const f of foods) {
    const fId = f._id.toString();
    const actualSold = foodActualSold[fId] || 25;
    const rev = foodReviewStats[fId];
    let avgRating = 5.0;
    let totalReviews = 0;

    if (rev && rev.count > 0) {
      avgRating = parseFloat((rev.totalStars / rev.count).toFixed(1));
      totalReviews = rev.count;
    } else {
      avgRating = 4.9;
      totalReviews = getRandomInt(3, 8);
    }

    await db.collection('foods').updateOne(
      { _id: f._id },
      {
        $set: {
          soldCount: actualSold,
          rating: avgRating,
          totalReviews: totalReviews,
        }
      }
    );
  }
  console.log(`  ✓ Đã cập nhật thành công soldCount, rating và totalReviews cho tất cả ${foods.length} món ăn.`);

  // Đảm bảo tồn kho nguyên liệu sẵn sàng
  for (const ing of ingredients) {
    await db.collection('ingredients').updateOne(
      { _id: ing._id },
      { $set: { status: 'in_stock', currentQuantity: 25.0 } }
    );
  }
  console.log('  ✓ Đã phục hồi lượng tồn kho nguyên liệu an toàn.');

  // --------------------------------------------------------------------------
  // BƯỚC 9: BÁO CÁO TỔNG KẾT SỐ LIỆU ĐÃ SEED
  // --------------------------------------------------------------------------
  const totalRev = allPayments.reduce((s, p) => s + (p.totalAmount || 0), 0);
  const totalHoursWorked = allAttendances.reduce((s, a) => s + (a.totalHours || 0), 0);
  const totalSalaryCost = Math.round(totalHoursWorked * 25000);
  const totalIngCost = allIngredientUsages.reduce((s, i) => s + (i.totalCost || 0), 0);
  const totalExpCost = allExpenses.reduce((s, e) => s + (e.amount || 0), 0);
  const totalNetProfit = totalRev - totalSalaryCost - totalIngCost - totalExpCost;

  console.log('\n========================================================================');
  console.log('🎉 TỔNG KẾT SEED DỮ LIỆU KINH DOANH KOHI COFFEE (01/09 - 24/09/2026):');
  console.log('========================================================================');
  console.log(`• Tổng số đơn hàng (Orders): ${allOrders.length} đơn`);
  console.log(`• Tổng số hóa đơn (Payments): ${allPayments.length} hóa đơn`);
  console.log(`• Tổng Doanh thu thu về: ${totalRev.toLocaleString('vi-VN')} đ`);
  console.log(`• Doanh thu bình quân mỗi ngày: ${(totalRev / 24).toLocaleString('vi-VN')} đ/ngày`);
  console.log(`• Tổng lượt công chấm nhân viên (Attendances): ${allAttendances.length} lượt (${totalHoursWorked.toFixed(1)} giờ làm)`);
  console.log(`• Chi phí trả lương nhân sự ước tính: ${totalSalaryCost.toLocaleString('vi-VN')} đ`);
  console.log(`• Chi phí nguyên vật liệu tiêu hao: ${totalIngCost.toLocaleString('vi-VN')} đ`);
  console.log(`• Chi phí vận hành phát sinh: ${totalExpCost.toLocaleString('vi-VN')} đ`);
  console.log(`• Lợi nhuận ròng ước tính (Net Profit): ${totalNetProfit.toLocaleString('vi-VN')} đ (Biên LN: ${((totalNetProfit / totalRev) * 100).toFixed(1)}%)`);
  console.log(`• Tổng số đánh giá món ăn (Reviews): ${allReviews.length} lượt đánh giá`);
  console.log('========================================================================\n');

  await mongoose.disconnect();
  console.log('[DB] Đã ngắt kết nối an toàn. Hoàn tất seed dữ liệu!');
}

runSeedAnalyticsData().catch(err => {
  console.error('[LỖI SEED]:', err);
  process.exit(1);
});
