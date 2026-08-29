const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// Parse .env to get MONGODB_URI
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

const AttendanceSchema = new mongoose.Schema({}, { strict: false });
const PayrollSchema = new mongoose.Schema({}, { strict: false });
const OrderSchema = new mongoose.Schema({}, { strict: false });
const PaymentSchema = new mongoose.Schema({}, { strict: false });
const StaffCallSchema = new mongoose.Schema({}, { strict: false });
const ReservationSchema = new mongoose.Schema({}, { strict: false });
const ShiftSwapSchema = new mongoose.Schema({}, { strict: false });
const ReviewSchema = new mongoose.Schema({}, { strict: false });

const Attendance = mongoose.model('Attendance', AttendanceSchema);
const Payroll = mongoose.model('Payroll', PayrollSchema);
const Order = mongoose.model('Order', OrderSchema);
const Payment = mongoose.model('Payment', PaymentSchema);
const StaffCall = mongoose.model('StaffCall', StaffCallSchema);
const Reservation = mongoose.model('Reservation', ReservationSchema);
const ShiftSwap = mongoose.model('ShiftSwap', ShiftSwapSchema);
const Review = mongoose.model('Review', ReviewSchema);

async function cleanStatsAndSalaries() {
  try {
    console.log('[DB] Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('[DB] Connected successfully.');

    console.log('[Clean] Deleting statistical, salary, attendance, and test transactional data...');

    const resAttendance = await Attendance.deleteMany({});
    console.log(` - Attendance (Bản ghi chấm công): Đã xóa ${resAttendance.deletedCount} bản ghi.`);

    const resPayroll = await Payroll.deleteMany({});
    console.log(` - Payroll (Bảng lương): Đã xóa ${resPayroll.deletedCount} bản ghi.`);

    const resOrder = await Order.deleteMany({});
    console.log(` - Order (Đơn hàng): Đã xóa ${resOrder.deletedCount} bản ghi.`);

    const resPayment = await Payment.deleteMany({});
    console.log(` - Payment (Thanh toán): Đã xóa ${resPayment.deletedCount} bản ghi.`);

    const resStaffCall = await StaffCall.deleteMany({});
    console.log(` - StaffCall (Yêu cầu gọi món/phục vụ): Đã xóa ${resStaffCall.deletedCount} bản ghi.`);

    const resReservation = await Reservation.deleteMany({});
    console.log(` - Reservation (Bàn đặt): Đã xóa ${resReservation.deletedCount} bản ghi.`);

    const resShiftSwap = await ShiftSwap.deleteMany({});
    console.log(` - ShiftSwap (Yêu cầu đổi ca): Đã xóa ${resShiftSwap.deletedCount} bản ghi.`);

    const resReview = await Review.deleteMany({});
    console.log(` - Review (Đánh giá): Đã xóa ${resReview.deletedCount} bản ghi.`);

    console.log('\n[Clean] SUCCESS: Đã xóa sạch toàn bộ dữ liệu mẫu về thống kê, báo cáo, chấm công & bảng lương thành công!');
  } catch (error) {
    console.error('[Clean] ERROR:', error);
  } finally {
    await mongoose.disconnect();
    console.log('[DB] Disconnected.');
  }
}

cleanStatsAndSalaries();
