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

// 3. Coffee Shop Seed Data (Chika Coffee Menu)
const foods = [
  // ==========================================
  // 1. DANH MỤC: CÀ PHÊ (Coffee) - 15 món
  // ==========================================
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
  {
    name: 'Cà Phê Đen Đá Phin Nguyên Chất',
    price: 25000,
    image: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=800&auto=format&fit=crop&q=80',
    category: 'Cà phê',
    isAvailable: true,
  },
  {
    name: 'Espresso Ý Double Shot',
    price: 32000,
    image: 'https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?w=800&auto=format&fit=crop&q=80',
    category: 'Cà phê',
    isAvailable: true,
  },
  {
    name: 'Cappuccino Ý Bọt Mịn Art',
    price: 45000,
    image: 'https://images.unsplash.com/photo-1534778101976-62847782c213?w=800&auto=format&fit=crop&q=80',
    category: 'Cà phê',
    isAvailable: true,
  },
  {
    name: 'Latte Vanille Kem Béo',
    price: 49000,
    image: 'https://images.unsplash.com/photo-1570968915860-54d5c301fa9f?w=800&auto=format&fit=crop&q=80',
    category: 'Cà phê',
    isAvailable: true,
  },
  {
    name: 'Caramel Macchiato Nóng/Đá',
    price: 52000,
    image: 'https://images.unsplash.com/photo-1485808191679-5f86510681a2?w=800&auto=format&fit=crop&q=80',
    category: 'Cà phê',
    isAvailable: true,
  },
  {
    name: 'Americano Đá Thanh Mát',
    price: 35000,
    image: 'https://images.unsplash.com/photo-1551030173-122aabc4489c?w=800&auto=format&fit=crop&q=80',
    category: 'Cà phê',
    isAvailable: true,
  },
  {
    name: 'Cold Brew Cam Sả Tươi',
    price: 48000,
    image: 'https://images.unsplash.com/photo-1517256064527-09c73fc73e38?w=800&auto=format&fit=crop&q=80',
    category: 'Cà phê',
    isAvailable: true,
  },
  {
    name: 'Cold Brew Sữa Dừa Bến Tre',
    price: 49000,
    image: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=800&auto=format&fit=crop&q=80',
    category: 'Cà phê',
    isAvailable: true,
  },
  {
    name: 'Cà Phê Dừa Đá Xay Chika',
    price: 49000,
    image: 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=800&auto=format&fit=crop&q=80',
    category: 'Cà phê',
    isAvailable: true,
  },
  {
    name: 'Cà Phê Trứng Hà Nội Béo Bùi',
    price: 45000,
    image: 'https://images.unsplash.com/photo-1541167760496-1628856ab772?w=800&auto=format&fit=crop&q=80',
    category: 'Cà phê',
    isAvailable: true,
  },
  {
    name: 'Flat White Chuẩn Úc',
    price: 48000,
    image: 'https://images.unsplash.com/photo-1577968897966-3d4325b36b61?w=800&auto=format&fit=crop&q=80',
    category: 'Cà phê',
    isAvailable: true,
  },
  {
    name: 'Mocha Sô-cô-la Đắng Ngọt',
    price: 52000,
    image: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=800&auto=format&fit=crop&q=80',
    category: 'Cà phê',
    isAvailable: true,
  },
  {
    name: 'Affogato Kem Vanille Espresso',
    price: 49000,
    image: 'https://images.unsplash.com/photo-1592663527359-cf6642f54cff?w=800&auto=format&fit=crop&q=80',
    category: 'Cà phê',
    isAvailable: true,
  },

  // ==========================================
  // 2. DANH MỤC: TRÀ & TRÁI CÂY (Tea) - 15 món
  // ==========================================
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
  {
    name: 'Trà Mãng Cầu Đắk Lắk Sợi Tươi',
    price: 45000,
    image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=800&auto=format&fit=crop&q=80',
    category: 'Trà & Trái cây',
    isAvailable: true,
  },
  {
    name: 'Trà Oolong Sen Vàng Hạt Sen',
    price: 49000,
    image: 'https://images.unsplash.com/photo-1597481499750-3e6b22637e12?w=800&auto=format&fit=crop&q=80',
    category: 'Trà & Trái cây',
    isAvailable: true,
  },
  {
    name: 'Matcha Latte Nhật Bản Uji',
    price: 52000,
    image: 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?w=800&auto=format&fit=crop&q=80',
    category: 'Trà & Trái cây',
    isAvailable: true,
  },
  {
    name: 'Trà Dâu Tằm Macchiato Dà Lạt',
    price: 45000,
    image: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=800&auto=format&fit=crop&q=80',
    category: 'Trà & Trái cây',
    isAvailable: true,
  },
  {
    name: 'Trà Hoa Cúc Mật Ong Hữu Cơ',
    price: 39000,
    image: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=800&auto=format&fit=crop&q=80',
    category: 'Trà & Trái cây',
    isAvailable: true,
  },
  {
    name: 'Trà Xanh Băng Tuyết Kem Béo',
    price: 45000,
    image: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=800&auto=format&fit=crop&q=80',
    category: 'Trà & Trái cây',
    isAvailable: true,
  },
  {
    name: 'Trà Tắc Mật Ong Hạt Chia',
    price: 35000,
    image: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=800&auto=format&fit=crop&q=80',
    category: 'Trà & Trái cây',
    isAvailable: true,
  },
  {
    name: 'Trà Ổi Hồng Hạt Lựu Nhiệt Đới',
    price: 42000,
    image: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=800&auto=format&fit=crop&q=80',
    category: 'Trà & Trái cây',
    isAvailable: true,
  },
  {
    name: 'Trà Dưa Lưới Kem Muối Biển',
    price: 48000,
    image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=800&auto=format&fit=crop&q=80',
    category: 'Trà & Trái cây',
    isAvailable: true,
  },
  {
    name: 'Trà Chanh Giã Tay Quảng Đông',
    price: 39000,
    image: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=800&auto=format&fit=crop&q=80',
    category: 'Trà & Trái cây',
    isAvailable: true,
  },
  {
    name: 'Trà Earl Grey Kem Muối Anh Quốc',
    price: 49000,
    image: 'https://images.unsplash.com/photo-1597481499750-3e6b22637e12?w=800&auto=format&fit=crop&q=80',
    category: 'Trà & Trái cây',
    isAvailable: true,
  },
  {
    name: 'Trà Hoa Đậu Biếc Lemonade',
    price: 39000,
    image: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=800&auto=format&fit=crop&q=80',
    category: 'Trà & Trái cây',
    isAvailable: true,
  },
  {
    name: 'Hojicha Latte Trà Rang Nhật',
    price: 52000,
    image: 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?w=800&auto=format&fit=crop&q=80',
    category: 'Trà & Trái cây',
    isAvailable: true,
  },

  // ==========================================
  // 3. DANH MỤC: BÁNH NGỌT & PASTRY - 15 món
  // ==========================================
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
  {
    name: 'New York Cheesecake Việt Quất',
    price: 52000,
    image: 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?w=800&auto=format&fit=crop&q=80',
    category: 'Bánh ngọt & Pastry',
    isAvailable: true,
  },
  {
    name: 'Croffle Sốt Caramel Muối',
    price: 45000,
    image: 'https://images.unsplash.com/photo-1562376552-0d160a2f238d?w=800&auto=format&fit=crop&q=80',
    category: 'Bánh ngọt & Pastry',
    isAvailable: true,
  },
  {
    name: 'Bánh Mì Tỏi Bơ Phô Mai Hàn Quốc',
    price: 42000,
    image: 'https://images.unsplash.com/photo-1586444248902-2f64eddc13df?w=800&auto=format&fit=crop&q=80',
    category: 'Bánh ngọt & Pastry',
    isAvailable: true,
  },
  {
    name: 'Egg Tart Hong Kong Nóng Hổi',
    price: 28000,
    image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&auto=format&fit=crop&q=80',
    category: 'Bánh ngọt & Pastry',
    isAvailable: true,
  },
  {
    name: 'Red Velvet Cake Kem Cheese',
    price: 49000,
    image: 'https://images.unsplash.com/photo-1586985289688-ca3cf47d3e6e?w=800&auto=format&fit=crop&q=80',
    category: 'Bánh ngọt & Pastry',
    isAvailable: true,
  },
  {
    name: 'Choco Lava Cake Tan Chảy',
    price: 45000,
    image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=800&auto=format&fit=crop&q=80',
    category: 'Bánh ngọt & Pastry',
    isAvailable: true,
  },
  {
    name: 'Macaron Pháp Thập Cẩm (Set 4 cái)',
    price: 59000,
    image: 'https://images.unsplash.com/photo-1569864358642-9d1684040f43?w=800&auto=format&fit=crop&q=80',
    category: 'Bánh ngọt & Pastry',
    isAvailable: true,
  },
  {
    name: 'Bánh Su Kem Choux Vanille (Set 3 cái)',
    price: 32000,
    image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&auto=format&fit=crop&q=80',
    category: 'Bánh ngọt & Pastry',
    isAvailable: true,
  },
  {
    name: 'Donut Glazed Sô-cô-la Hạnh Nhân',
    price: 29000,
    image: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=800&auto=format&fit=crop&q=80',
    category: 'Bánh ngọt & Pastry',
    isAvailable: true,
  },
  {
    name: 'Matcha Opera Cake Layer',
    price: 49000,
    image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=800&auto=format&fit=crop&q=80',
    category: 'Bánh ngọt & Pastry',
    isAvailable: true,
  },
  {
    name: 'Strawberry Shortcake Nhật Bản',
    price: 52000,
    image: 'https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?w=800&auto=format&fit=crop&q=80',
    category: 'Bánh ngọt & Pastry',
    isAvailable: true,
  },
  {
    name: 'Mousse Mango Chanh Dây',
    price: 45000,
    image: 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?w=800&auto=format&fit=crop&q=80',
    category: 'Bánh ngọt & Pastry',
    isAvailable: true,
  },
  {
    name: 'Bánh Bông Lan Trứng Muối Chà Bông',
    price: 39000,
    image: 'https://images.unsplash.com/photo-1586985289688-ca3cf47d3e6e?w=800&auto=format&fit=crop&q=80',
    category: 'Bánh ngọt & Pastry',
    isAvailable: true,
  },

  // ==========================================
  // 4. DANH MỤC: ĐÁ XAY & ĂN VẶT - 15 món
  // ==========================================
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
  },
  {
    name: 'Chocolate Coconut Ice Blended',
    price: 52000,
    image: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=800&auto=format&fit=crop&q=80',
    category: 'Đá xay & Ăn vặt',
    isAvailable: true,
  },
  {
    name: 'Sinh Tố Bơ Dừa Sáp Đắk Lắk',
    price: 49000,
    image: 'https://images.unsplash.com/photo-1525385133512-2f3bdd039054?w=800&auto=format&fit=crop&q=80',
    category: 'Đá xay & Ăn vặt',
    isAvailable: true,
  },
  {
    name: 'Sinh Tố Xoài Chanh Dây Nhiệt Đới',
    price: 45000,
    image: 'https://images.unsplash.com/photo-1623065422902-30a2d299bcc4?w=800&auto=format&fit=crop&q=80',
    category: 'Đá xay & Ăn vặt',
    isAvailable: true,
  },
  {
    name: 'Hạt Hạnh Nhân Rang Bơ Tỏi (Hũ 150g)',
    price: 45000,
    image: 'https://images.unsplash.com/photo-1508061253366-f7da158b6d96?w=800&auto=format&fit=crop&q=80',
    category: 'Đá xay & Ăn vặt',
    isAvailable: true,
  },
  {
    name: 'Granola Yến Mạch Trái Cây Sấy',
    price: 45000,
    image: 'https://images.unsplash.com/photo-1517673400267-0251440c45dc?w=800&auto=format&fit=crop&q=80',
    category: 'Đá xay & Ăn vặt',
    isAvailable: true,
  },
  {
    name: 'Hạt Macca Úc Nướng Nút Nẻ',
    price: 49000,
    image: 'https://images.unsplash.com/photo-1541832676-9b763b0239ab?w=800&auto=format&fit=crop&q=80',
    category: 'Đá xay & Ăn vặt',
    isAvailable: true,
  },
  {
    name: 'Khô Bò Sợi Lá Chanh Đắk Lắk',
    price: 49000,
    image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=800&auto=format&fit=crop&q=80',
    category: 'Đá xay & Ăn vặt',
    isAvailable: true,
  },
  {
    name: 'Khoai Tây Múi Cau Lắc Phô Mai',
    price: 35000,
    image: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=800&auto=format&fit=crop&q=80',
    category: 'Đá xay & Ăn vặt',
    isAvailable: true,
  },
  {
    name: 'Bánh Biscotti Hạt Dinh Dưỡng Nguyên Cám',
    price: 39000,
    image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&auto=format&fit=crop&q=80',
    category: 'Đá xay & Ăn vặt',
    isAvailable: true,
  },
  {
    name: 'Cơm Cháy Chà Bông Sốt Mắm Tỏi',
    price: 35000,
    image: 'https://images.unsplash.com/photo-1541832676-9b763b0239ab?w=800&auto=format&fit=crop&q=80',
    category: 'Đá xay & Ăn vặt',
    isAvailable: true,
  },
  {
    name: 'Pudding Trà Xanh Trân Châu Đen',
    price: 29000,
    image: 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?w=800&auto=format&fit=crop&q=80',
    category: 'Đá xay & Ăn vặt',
    isAvailable: true,
  },
  {
    name: 'Gelato Dừa Nướng Bến Tre',
    price: 35000,
    image: 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=800&auto=format&fit=crop&q=80',
    category: 'Đá xay & Ăn vặt',
    isAvailable: true,
  },
  {
    name: 'Kem Affogato Sô-cô-la Bỉ',
    price: 49000,
    image: 'https://images.unsplash.com/photo-1592663527359-cf6642f54cff?w=800&auto=format&fit=crop&q=80',
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
