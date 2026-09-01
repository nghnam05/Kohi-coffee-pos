# ☕ KOHI COFFEE POS & SMART QR ORDERING SYSTEM

Hệ thống quản lý bán hàng (POS), gọi món qua mã QR tại bàn (Smart QR Ordering), màn hình pha chế KDS (Kitchen Display System) và quản trị tài chính - nhân sự cho chuỗi Kohi Coffee.

---

## ⚡ Tính Năng Nổi Bật

- **Gọi món QR tại bàn & Giỏ hàng nhóm**: Khách hàng quét QR gọi món, đồng bộ giỏ hàng nhóm thời gian thực qua WebSocket.
- **Màn hình Pha chế KDS**: Theo dõi & cập nhật tiến độ đơn hàng thời gian thực cho Barista.
- **Quản lý POS & Đổi bàn**: Chuyển bàn, gộp đơn, gửi yêu cầu phục vụ và thanh toán linh hoạt.
- **Kiểm toán Tài chính (Payment Audit)**: Tự động lưu vết hóa đơn vĩnh viễn (`HD-XXXXXX`), tra cứu và in hóa đơn.
- **Quản trị Toàn diện**: Quản lý thực đơn, bàn ăn, chấm công - tính lương nhân viên, mã giảm giá và báo cáo doanh thu.

---

## 🛠️ Công Nghệ Sử Dụng

- **Backend**: NestJS (TypeScript), MongoDB & Mongoose ODM, Socket.IO
- **Frontend**: Next.js 14 (App Router), TailwindCSS, Framer Motion
- **Testing**: Jest & Supertest (155 Unit Test Cases pass 100%)

---

## 🚀 Hướng Dẫn Khởi Chạy

### 1. Yêu Cầu Môi Trường
- **Node.js**: `>= 18.x`
- **npm**: `>= 9.x`
- **MongoDB**: Local Community Server (`mongodb://127.0.0.1:27017/kohi-coffee`) hoặc MongoDB Atlas.

---

### 2. Cấu Hình Biến Môi Trường

**Backend (`backend/.env`)**:
```env
PORT=3001
MONGODB_URI=mongodb://127.0.0.1:27017/kohi-coffee
JWT_SECRET=kohi_coffee_super_secret_jwt_key_2026
```

**Frontend (`frontend/.env.local`)**:
```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001
```

---

### 3. Cài Đặt & Chạy Ứng Dụng

#### Nạp dữ liệu mẫu (Database Seed):
```bash
cd backend
npm run seed
```

#### Khởi chạy Backend (Port 3001):
```bash
cd backend
npm install
npm run start:dev
```

#### Khởi chạy Frontend (Port 3000):
```bash
cd frontend
npm install
npm run dev
```

#### Chạy Kiểm Thử (Unit Tests):
```bash
cd backend
npx jest --passWithNoTests
```

---

## 🔑 Tài Khoản Mẫu & Đường Dẫn Truy Cập

### 1. Tài Khoản Đăng Nhập (`/login`)
- 👑 **Admin**: `admin@kohicoffee.com` / `admin123` (Full quyền quản trị, nhân sự, báo cáo)
- ☕ **Staff / Barista**: `staff@kohicoffee.com` / `staff123` (Màn hình KDS & POS)

### 2. Đường Dẫn Nổi Bật
- **Trang chủ & Đặt bàn**: `http://localhost:3000`
- **Trang Đăng Nhập**: `http://localhost:3000/login`
- **Dashboard POS / KDS**: `http://localhost:3000/dashboard`
- **QR Gọi Món (Bàn 1)**: `http://localhost:3000/table/65a0c01be5fe6910cab58701`
- **API Base**: `http://localhost:3001/api/v1`

---

## 📁 Cấu Trúc Thư Mục Dự Án

```
kohi-coffee/
├── backend/                       # NestJS API & WebSocket Server
│   ├── src/                       # Mã nguồn Backend
│   │   ├── ai-chat/               # Trợ lý AI tư vấn món ăn
│   │   ├── analytics/             # Báo cáo doanh thu & Thống kê
│   │   ├── attendance/            # Chấm công nhân viên
│   │   ├── auth/                  # Xác thực JWT & Phân quyền RBAC
│   │   ├── categories/            # Quản lý Danh mục món
│   │   ├── coupons/               # Quản lý Mã giảm giá
│   │   ├── foods/                 # Quản lý Thực đơn món ăn & Topping
│   │   ├── group-sessions/        # Đồng bộ giỏ hàng nhóm thời gian thực
│   │   ├── ingredients/           # Quản lý Kho nguyên liệu
│   │   ├── momo/                  # Cổng thanh toán MoMo
│   │   ├── orders/                # Đơn hàng & WebSocket Gateway
│   │   ├── payments/              # Kiểm toán hóa đơn & Lịch sử thanh toán
│   │   ├── reservations/          # Đặt bàn trước
│   │   ├── reviews/               # Đánh giá & Phản hồi từ khách hàng
│   │   ├── salaries/              # Tính lương tự động
│   │   ├── shift-swaps/           # Quản lý Đổi ca làm việc
│   │   ├── staff-calls/           # Gọi nhân viên phục vụ tại bàn
│   │   ├── tables/                # Quản lý Bàn ăn & Mã QR
│   │   └── users/                 # Quản lý Tài khoản & Nhân sự
│   ├── test/                      # Bộ Unit tests
│   └── seed.js                    # Script nạp dữ liệu mẫu
│
└── frontend/                      # Next.js 14 App Router Frontend
    ├── app/                       # Trang & Định tuyến (Pages & Routes)
    │   ├── page.tsx               # Trang chủ Khách hàng (Đặt bàn / Tra cứu)
    │   ├── login/                 # Trang Đăng nhập Nhân viên & Admin
    │   ├── dashboard/             # Màn hình POS Workspace / KDS / Báo cáo quản trị
    │   ├── table/[tableId]/       # Giao diện gọi món QR tại bàn
    │   ├── checkout/              # Trang Xác nhận & Thanh toán
    │   ├── payment/               # Trang Kết quả thanh toán
    │   ├── contact/               # Trang Liên hệ
    │   ├── privacy/               # Chính sách bảo mật
    │   └── terms/                 # Điều khoản sử dụng
    ├── components/                # UI Components tái sử dụng
    │   ├── dashboard/             # Thành phần giao diện Quản trị (InventoryManagement,...)
    │   ├── table/                 # Thành phần giao diện Gọi món tại bàn:
    │   │   ├── AiChatWidget.tsx          # Widget Trợ lý AI tư vấn
    │   │   ├── BankPayModal.tsx          # Modal thanh toán Chuyển khoản
    │   │   ├── CartSidebar.tsx           # Thanh Giỏ hàng nhóm realtime
    │   │   ├── CustomerNotificationModal # Trung tâm thông báo realtime
    │   │   ├── FoodCard.tsx & DetailModal# Thẻ món ăn & Modal tùy chọn size/topping
    │   │   ├── FoodReviewModal.tsx       # Modal đánh giá món ăn
    │   │   ├── MomoPayModal.tsx          # Modal thanh toán qua MoMo
    │   │   ├── OrderHistoryModal.tsx     # Modal Lịch sử đơn hàng & Hóa đơn
    │   │   ├── SplitBillModal.tsx        # Modal Chia tiền hóa đơn (Split Bill)
    │   │   └── TransferTableModal.tsx   # Modal Đổi bàn ăn
    │   └── ui/                    # UI Primitives & Thiết kế dùng chung
    ├── context/                   # Context Provider (LanguageContext - Đa ngôn ngữ)
    ├── locales/                   # File dịch i18n (vi.json, en.json, zh.json)
    ├── lib/ & utils/              # Utility functions & API Formatters
    └── public/                    # Tài nguyên tĩnh (Logos, Hình ảnh món ăn)
```
