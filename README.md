# ☕ Kohi Coffee - POS & Smart QR Ordering

Hệ thống quản trị bán hàng (POS), gọi món trực tiếp qua mã QR tại bàn (Smart QR Ordering), màn hình điều phối pha chế KDS (Kitchen Display System) và quản lý tài chính - nhân sự cho quán cà phê.

---

## 🛠️ Yêu Cầu Môi Trường

- **Node.js**: `>= 18.x`
- **npm**: `>= 9.x`
- **MongoDB**: Local Community Server (`mongodb://127.0.0.1:27017/kohi-coffee`) hoặc MongoDB Atlas.

---

## ⚙️ Cài Đặt (Setup)

### 1. Cấu hình biến môi trường

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

### 2. Cài đặt dependencies

```bash
# Cài đặt Backend
cd backend
npm install

# Cài đặt Frontend
cd ../frontend
npm install
```

### 3. Nạp dữ liệu mẫu (Seed Data)

```bash
cd backend
npm run seed
```

---

## 🚀 Khởi Chạy (Run)

Mở 2 terminal để chạy song song Backend và Frontend:

### Terminal 1: Backend (Port 3001)
```bash
cd backend
npm run start:dev
```
> Server API hoạt động tại: `http://localhost:3001/api/v1`

### Terminal 2: Frontend (Port 3000)
```bash
cd frontend
npm run dev
```
> Ứng dụng web hoạt động tại: `http://localhost:3000`

---

## 🔑 Tài Khoản & Đường Dẫn Truy Cập

### 1. Tài khoản đăng nhập hệ thống (`/login`)
> *Mật khẩu mặc định cho tất cả tài khoản trong hệ thống:* **`123456`**

- 👑 **Quản trị viên (Admin)**: `admin@kohi.vn` *(Toàn quyền quản trị, nhân sự, tài chính, kho)*
- 🛎️ **Nhân viên Phục vụ (Staff / Waiter)**: `pvcasang@kohi.vn` *(hoặc `pvchieu@kohi.vn`, `pvtoi@kohi.vn`)*
- ☕ **Nhân viên Pha chế (Barista)**: `pccasang@kohi.vn` *(hoặc `pcchieu@kohi.vn`, `pctoi@kohi.vn`)*

### 2. Các liên kết chính
- **Trang chủ & Đặt bàn**: `http://localhost:3000`
- **Đăng nhập hệ thống**: `http://localhost:3000/login`
- **Dashboard POS & Màn hình KDS**: `http://localhost:3000/dashboard`
- **Gọi món QR mẫu (Bàn 1)**: `http://localhost:3000/table/65a0c01be5fe6910cab58701`
