# ☕ Kohi Coffee - Hướng Dẫn Cài Đặt & Vận Hành

---

## 🛠️ 1. Yêu Cầu Môi Trường
- **Node.js**: `>= 18.x` (Khuyến nghị Node 20 LTS)
- **npm**: `>= 9.x`
- **MongoDB**: MongoDB Atlas (Cloud) hoặc MongoDB Community Server Local

---

## ⚙️ 2. Cấu Hình Biến Môi Trường

### Backend (`backend/.env`)
Tạo file `.env` trong thư mục `backend/`:
```env
PORT=3001
MONGODB_URI=mongodb+srv://namnh4581_db_user:50SAWO4UGkULnCaM@cluster1.5eudgkz.mongodb.net/kohi-coffee
JWT_SECRET=chika_restaurant_jwt_secret_key_2026_super_secure
JWT_EXPIRES_IN=7d
GEMINI_API_KEY=AIzaSyB0BAsxK4LYb7bCyAl6NM_D69RPn_wLGxw
```

### Frontend (`frontend/.env.local`)
Tạo file `.env.local` trong thư mục `frontend/`:
```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001

NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=dp1uvjzpc
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=kohi-coffee

NEXT_PUBLIC_BANK_ID=MB
NEXT_PUBLIC_BANK_NAME=MB Bank (NHTMCP Quân Đội)
NEXT_PUBLIC_BANK_ACCOUNT_NO=0336218760
NEXT_PUBLIC_BANK_ACCOUNT_NAME=NGUYEN HOAI NAM
NEXT_PUBLIC_BANK_CUSTOM_QR_IMAGE=/images/qr.jpg
```

---

## 🚀 3. Cài Đặt & Khởi Chạy

### Bước 1: Cài đặt Dependencies
```bash
# Cài đặt Backend
cd backend
npm install

# Cài đặt Frontend
cd ../frontend
npm install
```

### Bước 2: Nạp Dữ Liệu Mẫu (Seed Data)
```bash
cd backend
npm run seed
```
*(Tùy chọn nạp dữ liệu biểu đồ phân tích doanh thu: `npm run seed:analytics`)*

### Bước 3: Chạy Ứng Dụng (Mở 2 terminal song song)

**Terminal 1 - Backend (Port 3001):**
```bash
cd backend
npm run start:dev
```
> Server API: `http://localhost:3001/api/v1`

**Terminal 2 - Frontend (Port 3000):**
```bash
cd frontend
npm run dev
```
> Web App: `http://localhost:3000`

---

## 🔑 4. Thông Tin Tài Khoản Đăng Nhập

> 🔐 **Mật khẩu chung cho tất cả tài khoản:** **`123456`**

| Vai Trò | Tên Hiển Thị | Email Đăng Nhập | Ca Phân Công | Quyền Hạn |
| :--- | :--- | :--- | :--- | :--- |
| 👑 **Admin** | Quản trị viên | `admin@kohi.vn` | Ca Sáng | Toàn quyền hệ thống, tài chính, nhân sự, menu, kho, chấm công |
| 🛎️ **Phục vụ** | PV-SÁNG | `pvsang@kohi.vn` | Ca Sáng (06h - 12h) | Quản lý bàn, tạo đơn mang về, kiểm soát bàn ăn, chấm công |
| 🛎️ **Phục vụ** | PV-CHIỀU | `pvchieu@kohi.vn` | Ca Chiều (12h - 18h) | Quản lý bàn, tạo đơn mang về, kiểm soát bàn ăn, chấm công |
| 🛎️ **Phục vụ** | PV-TỐI | `pvtoi@kohi.vn` | Ca Tối (18h - 23h) | Quản lý bàn, tạo đơn mang về, kiểm soát bàn ăn, chấm công |
| ☕ **Pha chế** | PC-SÁNG | `pcsang@kohi.vn` | Ca Sáng (06h - 12h) | Màn hình KDS pha chế, đổi trạng thái món, quản lý kho |
| ☕ **Pha chế** | PC-CHIỀU | `pcchieu@kohi.vn` | Ca Chiều (12h - 18h) | Màn hình KDS pha chế, đổi trạng thái món, quản lý kho |
| ☕ **Pha chế** | PC-TỐI | `pctoi@kohi.vn` | Ca Tối (18h - 23h) | Màn hình KDS pha chế, đổi trạng thái món, quản lý kho |

---

## 🌐 5. Các Đường Dẫn Truy Cập Chính

| Mục | Đường Dẫn | Ghi Chú |
| :--- | :--- | :--- |
| 🏠 **Trang chủ & Đặt bàn** | `http://localhost:3000` | Trang giới thiệu & đặt bàn trước cho khách |
| 🔐 **Đăng nhập hệ thống** | `http://localhost:3000/login` | Cổng đăng nhập cho Admin, Phục vụ, Pha chế |
| 📊 **Dashboard POS & KDS** | `http://localhost:3000/dashboard` | Quản lý bán hàng, KDS, bàn ăn, thực đơn, nhân sự, doanh thu |
| 📱 **Gọi món QR Bàn số 1** | `http://localhost:3000/table/6a966ddbbf14b296ecb73ffd` | Giao diện gọi món QR trực tiếp tại Bàn 1 |
| 📱 **Gọi món QR Bàn số 2** | `http://localhost:3000/table/6a96c155831b75e296633676` | Giao diện gọi món QR trực tiếp tại Bàn 2 |
