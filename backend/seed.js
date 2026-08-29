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

// 2. Define Mongoose Schemas
const TableSchema = new mongoose.Schema({
  tableName: { type: String, unique: true, required: true },
  qrCodeUrl: { type: String },
  status: { type: String, enum: ['empty', 'serving'], default: 'empty' },
}, { timestamps: true });

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'waiter', 'barista', 'staff'], default: 'waiter' },
  assignedShift: { type: String, enum: ['morning', 'afternoon', 'evening'], default: 'morning' },
}, { timestamps: true });

const FoodSchema = new mongoose.Schema({}, { strict: false });
const StaffCallSchema = new mongoose.Schema({}, { strict: false });
const OrderSchema = new mongoose.Schema({}, { strict: false });
const PaymentSchema = new mongoose.Schema({}, { strict: false });
const ReservationSchema = new mongoose.Schema({}, { strict: false });
const AttendanceSchema = new mongoose.Schema({}, { strict: false });
const PayrollSchema = new mongoose.Schema({}, { strict: false });
const ShiftSwapSchema = new mongoose.Schema({}, { strict: false });
const ReviewSchema = new mongoose.Schema({}, { strict: false });

const Table = mongoose.model('Table', TableSchema);
const User = mongoose.model('User', UserSchema);
const Food = mongoose.model('Food', FoodSchema);
const StaffCall = mongoose.model('StaffCall', StaffCallSchema);
const Order = mongoose.model('Order', OrderSchema);
const Payment = mongoose.model('Payment', PaymentSchema);
const Reservation = mongoose.model('Reservation', ReservationSchema);
const Attendance = mongoose.model('Attendance', AttendanceSchema);
const Payroll = mongoose.model('Payroll', PayrollSchema);
const ShiftSwap = mongoose.model('ShiftSwap', ShiftSwapSchema);
const Review = mongoose.model('Review', ReviewSchema);

// 3. Initial Table Data
const tables = [
  { _id: new mongoose.Types.ObjectId('65a0c01be5fe6910cab58701'), tableName: 'Bàn số 1', status: 'empty', qrCodeUrl: 'http://localhost:3000/table/65a0c01be5fe6910cab58701' },
  { _id: new mongoose.Types.ObjectId('65a0c01be5fe6910cab58702'), tableName: 'Bàn số 2', status: 'empty', qrCodeUrl: 'http://localhost:3000/table/65a0c01be5fe6910cab58702' },
  { _id: new mongoose.Types.ObjectId('65a0c01be5fe6910cab58703'), tableName: 'Bàn số 3', status: 'empty', qrCodeUrl: 'http://localhost:3000/table/65a0c01be5fe6910cab58703' },
  { _id: new mongoose.Types.ObjectId('65a0c01be5fe6910cab58704'), tableName: 'Bàn số 4', status: 'empty', qrCodeUrl: 'http://localhost:3000/table/65a0c01be5fe6910cab58704' },
  { _id: new mongoose.Types.ObjectId('65a0c01be5fe6910cab58705'), tableName: 'Bàn số 5', status: 'empty', qrCodeUrl: 'http://localhost:3000/table/65a0c01be5fe6910cab58705' },
];

// 4. Connect and Seed
async function run() {
  try {
    console.log('[DB] Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('[DB] Connected successfully.');

    // Clear old data across all collections
    console.log('[Seed] Clearing old data (foods, orders, payments, calls, reservations, attendances, payrolls, shiftswaps, reviews)...');
    await Food.deleteMany({});
    await Table.deleteMany({});
    await User.deleteMany({});
    await Order.deleteMany({});
    await Payment.deleteMany({});
    await StaffCall.deleteMany({});
    await Reservation.deleteMany({});
    await Attendance.deleteMany({});
    await Payroll.deleteMany({});
    await ShiftSwap.deleteMany({});
    await Review.deleteMany({});
    console.log('[Seed] Old sample data cleared.');

    // Insert tables
    console.log('[Seed] Inserting tables...');
    const insertedTables = await Table.insertMany(tables);
    console.log(`[Seed] Inserted ${insertedTables.length} tables.`);

    // Insert staff/user accounts (Admin, Waiter, Barista)
    console.log('[Seed] Inserting user accounts (Admin, Waiter, Barista)...');
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
        name: 'Nhân viên Phục vụ',
        email: 'phucvu@kohi.vn',
        password: staffPassword,
        role: 'waiter',
        assignedShift: 'morning',
      },
      {
        name: 'Nhân viên Pha chế',
        email: 'phache@kohi.vn',
        password: staffPassword,
        role: 'barista',
        assignedShift: 'afternoon',
      },
    ];
    const insertedUsers = await User.insertMany(users);
    console.log(`[Seed] Inserted ${insertedUsers.length} user accounts.`);

    console.log('\n[Seed] TABLE LIST:');
    insertedTables.forEach((tab) => {
      console.log(`  - ${tab.tableName} | ID: ${tab._id} | URL: http://localhost:3000/table/${tab._id}`);
    });

    console.log('\n[Seed] LOGIN ACCOUNTS:');
    console.log('  Admin:   admin@kohicoffee.com / admin123  (Role: admin)');
    console.log('  Phục vụ: phucvu@kohi.vn / staff123        (Role: waiter)');
    console.log('  Pha chế: phache@kohi.vn / staff123        (Role: barista)');

    console.log('\n[Seed] Seed completed successfully with Tables and Full Staff Roles.');
  } catch (error) {
    console.error('[Seed] ERROR:', error);
  } finally {
    await mongoose.disconnect();
    console.log('[DB] Disconnected.');
  }
}

run();
