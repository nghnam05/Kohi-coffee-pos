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

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('Error: MONGODB_URI is not defined in .env file!');
  process.exit(1);
}

// 2. Define Mongoose Schemas (matching the NestJS models)
const FoodSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  image: { type: String, required: true },
  category: { type: String, required: true },
  isAvailable: { type: Boolean, default: true },
}, { timestamps: true });

const TableSchema = new mongoose.Schema({
  tableName: { type: String, unique: true, required: true },
  qrCodeUrl: { type: String },
  status: { type: String, enum: ['empty', 'serving'], default: 'empty' },
}, { timestamps: true });

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'staff'], default: 'staff' },
}, { timestamps: true });

const Food = mongoose.model('Food', FoodSchema);
const Table = mongoose.model('Table', TableSchema);
const User = mongoose.model('User', UserSchema);

// 3. Coffee Shop Seed Data (Chika Coffee Menu - 2 món mỗi mục)
const foods = [
  // 1. DANH MỤC: CÀ PHÊ (2 món)
  {
    name: 'Cà Phê Muối Huế Đặc Sản',
    price: 35000,
    image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=800&auto=format&fit=crop&q=80',
    category: 'Cà phê',
    isAvailable: true,
  },
  {
    name: 'Cà Phê Sữa Đá Phin Đậm Đặc',
    price: 29000,
    image: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=800&auto=format&fit=crop&q=80',
    category: 'Cà phê',
    isAvailable: true,
  },

  // 2. DANH MỤC: TRÀ & TRÁI CÂY (2 món)
  {
    name: 'Trà Đào Cam Sả Tươi Mát',
    price: 45000,
    image: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=800&auto=format&fit=crop&q=80',
    category: 'Trà & Trái cây',
    isAvailable: true,
  },
  {
    name: 'Trà Vải Lài Kem Cheese',
    price: 49000,
    image: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=800&auto=format&fit=crop&q=80',
    category: 'Trà & Trái cây',
    isAvailable: true,
  },

  // 3. DANH MỤC: BÁNH NGỌT & PASTRY (2 món)
  {
    name: 'Croissant Bơ Pháp Giòn Rụm',
    price: 38000,
    image: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=800&auto=format&fit=crop&q=80',
    category: 'Bánh ngọt & Pastry',
    isAvailable: true,
  },
  {
    name: 'Tiramisu Truyền Thống Ý',
    price: 48000,
    image: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=800&auto=format&fit=crop&q=80',
    category: 'Bánh ngọt & Pastry',
    isAvailable: true,
  },

  // 4. DANH MỤC: ĐÁ XAY & ĂN VẶT (2 món)
  {
    name: 'Cookie & Cream Ice Blended',
    price: 52000,
    image: 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=800&auto=format&fit=crop&q=80',
    category: 'Đá xay & Ăn vặt',
    isAvailable: true,
  },
  {
    name: 'Matcha Ice Blended Đậu Đỏ',
    price: 55000,
    image: 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?w=800&auto=format&fit=crop&q=80',
    category: 'Đá xay & Ăn vặt',
    isAvailable: true,
  }
];

const tables = [
  { _id: new mongoose.Types.ObjectId('65a0c01be5fe6910cab58701'), tableName: 'Bàn số 1', status: 'empty', qrCodeUrl: 'http://localhost:3000/table/65a0c01be5fe6910cab58701' },
  { _id: new mongoose.Types.ObjectId('65a0c01be5fe6910cab58702'), tableName: 'Bàn số 2', status: 'empty', qrCodeUrl: 'http://localhost:3000/table/65a0c01be5fe6910cab58702' },
  { _id: new mongoose.Types.ObjectId('65a0c01be5fe6910cab58703'), tableName: 'Bàn số 3', status: 'empty', qrCodeUrl: 'http://localhost:3000/table/65a0c01be5fe6910cab58703' },
  { _id: new mongoose.Types.ObjectId('65a0c01be5fe6910cab58704'), tableName: 'Bàn số 4', status: 'empty', qrCodeUrl: 'http://localhost:3000/table/65a0c01be5fe6910cab58704' },
  { _id: new mongoose.Types.ObjectId('65a0c01be5fe6910cab58705'), tableName: 'Bàn số 5', status: 'empty', qrCodeUrl: 'http://localhost:3000/table/65a0c01be5fe6910cab58705' },
];

const OrderSchema = new mongoose.Schema({
  tableId: { type: mongoose.Schema.Types.ObjectId, ref: 'Table' },
  customerName: { type: String, default: 'Khách hàng' },
  items: [{
    foodId: { type: mongoose.Schema.Types.ObjectId, ref: 'Food' },
    quantity: { type: Number, default: 1 },
    note: { type: String }
  }],
  status: { type: String, default: 'paid' },
  totalAmount: { type: Number, required: true },
  paymentMethod: { type: String, default: 'cash' },
  paidAt: { type: Date, default: Date.now }
}, { timestamps: true });

const PaymentSchema = new mongoose.Schema({
  invoiceCode: { type: String, unique: true, required: true },
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
  tableId: { type: mongoose.Schema.Types.ObjectId, ref: 'Table' },
  tableName: { type: String },
  customerName: { type: String },
  items: [{
    foodId: { type: mongoose.Schema.Types.ObjectId, ref: 'Food' },
    foodName: { type: String },
    price: { type: Number },
    quantity: { type: Number },
    total: { type: Number },
    note: { type: String }
  }],
  subtotal: { type: Number },
  discountAmount: { type: Number, default: 0 },
  couponCode: { type: String },
  totalAmount: { type: Number },
  paymentMethod: { type: String },
  transactionCode: { type: String },
  paidAt: { type: Date, default: Date.now }
}, { timestamps: true });

const Order = mongoose.model('Order', OrderSchema);
const Payment = mongoose.model('Payment', PaymentSchema);

// 4. Connect and Seed
async function run() {
  try {
    console.log('🔄 Đang kết nối tới MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Đã kết nối MongoDB thành công.');

    // Clear existing data
    console.log('🧹 Đang làm sạch dữ liệu cũ...');
    await Food.deleteMany({});
    await Table.deleteMany({});
    await User.deleteMany({});
    await Order.deleteMany({});
    await Payment.deleteMany({});
    console.log('✅ Đã dọn dẹp xong.');

    // Insert new data
    console.log('🌱 Đang nạp dữ liệu menu Kohi Coffee (Cà phê, Trà, Bánh & Đá xay)...');
    const insertedFoods = await Food.insertMany(foods);
    console.log(`✅ Đã nạp thành công ${insertedFoods.length} thức uống & bánh.`);

    console.log('🌱 Đang nạp dữ liệu bàn...');
    const insertedTables = await Table.insertMany(tables);
    console.log(`✅ Đã nạp thành công ${insertedTables.length} bàn.`);

    console.log('🌱 Đang nạp dữ liệu người dùng (Admin & Staff)...');
    const adminPassword = await bcrypt.hash('admin123', 10);
    const staffPassword = await bcrypt.hash('staff123', 10);
    const users = [
      {
        name: 'Quản trị viên Kohi Coffee',
        email: 'admin@kohicoffee.com',
        password: adminPassword,
        role: 'admin',
      },
      {
        name: 'Nhân viên Barista',
        email: 'staff@kohicoffee.com',
        password: staffPassword,
        role: 'staff',
      },
    ];
    const insertedUsers = await User.insertMany(users);
    console.log(`✅ Đã nạp thành công ${insertedUsers.length} tài khoản.`);

    console.log('🌱 Đang nạp dữ liệu Đơn hàng mẫu và Hóa đơn thanh toán...');
    const sampleOrders = [];
    const samplePayments = [];

    for (let i = 0; i < 5; i++) {
      const food1 = insertedFoods[i % insertedFoods.length];
      const food2 = insertedFoods[(i + 2) % insertedFoods.length];
      const tbl = insertedTables[i % insertedTables.length];
      const subtotal = food1.price + food2.price * 2;
      const orderId = new mongoose.Types.ObjectId();
      const invoiceCode = `HD-${100001 + i}`;
      const now = new Date(Date.now() - (4 - i) * 86400000);

      sampleOrders.push({
        _id: orderId,
        tableId: tbl._id,
        customerName: `Khách hàng #${i + 1}`,
        items: [
          { foodId: food1._id, quantity: 1, note: 'Ít đường' },
          { foodId: food2._id, quantity: 2, note: 'Nhiều đá' },
        ],
        status: 'paid',
        totalAmount: subtotal,
        paymentMethod: i % 2 === 0 ? 'cash' : 'momo',
        paidAt: now,
        createdAt: now,
      });

      samplePayments.push({
        invoiceCode,
        orderId,
        tableId: tbl._id,
        tableName: tbl.tableName,
        customerName: `Khách hàng #${i + 1}`,
        items: [
          { foodId: food1._id, foodName: food1.name, price: food1.price, quantity: 1, total: food1.price, note: 'Ít đường' },
          { foodId: food2._id, foodName: food2.name, price: food2.price, quantity: 2, total: food2.price * 2, note: 'Nhiều đá' },
        ],
        subtotal,
        discountAmount: 0,
        totalAmount: subtotal,
        paymentMethod: i % 2 === 0 ? 'cash' : 'momo',
        transactionCode: i % 2 !== 0 ? `MM-${88000000 + i}` : null,
        paidAt: now,
        createdAt: now,
      });
    }

    await Order.insertMany(sampleOrders);
    await Payment.insertMany(samplePayments);
    console.log(`✅ Đã nạp thành công 5 đơn hàng mẫu & 5 hóa đơn thanh toán vào MongoDB.`);

    console.log('\n🌟 DANH SÁCH BÀN CÀ PHÊ KOHI COFFEE:');
    insertedTables.forEach((tab) => {
      console.log(`- ${tab.tableName} | ID: ${tab._id} | Link: http://localhost:3000/table/${tab._id}`);
    });

    console.log('\n👤 TÀI KHOẢN ĐĂNG NHẬP THỬ NGHIỆM KOHI COFFEE:');
    console.log('- Admin: admin@kohicoffee.com / admin123');
    console.log('- Staff: staff@kohicoffee.com / staff123');

    console.log('\n🎉 Quá trình seed dữ liệu Kohi Coffee hoàn tất thành công!');
  } catch (error) {
    console.error('❌ Lỗi trong quá trình seed dữ liệu:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Đã ngắt kết nối với MongoDB.');
  }
}

run();
