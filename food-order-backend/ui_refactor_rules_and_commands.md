# 🛡️ Hướng Dẫn Ra Lệnh & Quy Tắc Refactor Giao Diện (Bảo Toàn 100% Logic)

Tài liệu này hướng dẫn cách ra lệnh cho AI Agent để **chỉ thay đổi/làm đẹp giao diện (CSS, Tailwind, HTML layout)** mà **giữ nguyên 100% logic nghiệp vụ, State, API và Socket.IO**.

---

## 📋 1. Mẫu Câu Ra Lệnh Chuẩn (Prompt Commands)

Khi bạn muốn AI làm lại giao diện cho trang nào, hãy sử dụng **công thức ra lệnh 3 bước** dưới đây:

### 💬 Mẫu Câu 1: Refactor Trang Gọi Món (`app/table/[tableId]/page.tsx`)
```text
Hãy cập nhật lại giao diện (UI Refactoring Only) cho file `app/table/[tableId]/page.tsx` theo thiết kế Stitch Design trong artifact `codebase_grounded_stitch_prompts.md`.

YÊU CẦU BẮT BUỘC:
1. PURE UI ONLY: Chỉ thay đổi thẻ HTML/JSX và class Tailwind CSS (Sử dụng 3 màu Skyblue #38BDF8, Black #090D16, White #FFFFFF, font Inter weight 400/800).
2. PRESERVE ALL LOGIC: Giữ nguyên 100% tất cả useState, useEffect, socket.on, socket.emit, các hàm handleAddToCart, handleCheckIn, handleCheckOut, handleStaffCall, handleApplyCoupon, handleSendOrder và các API fetch.
3. KHÔNG ĐƯỢC XÓA HOẶC ĐỔI TÊN bất kỳ hàm xử lý sự kiện hay state nào.
4. Kiểm tra `tsc --noEmit` sau khi xong để đảm bảo 0 lỗi.
```

---

### 💬 Mẫu Câu 2: Refactor Trang Dashboard (`app/dashboard/page.tsx`)
```text
Hãy làm mới giao diện (UI Refactoring Only) cho file `app/dashboard/page.tsx` theo thiết kế Stitch Design trong artifact `codebase_grounded_stitch_prompts.md`.

YÊU CẦU BẮT BUỘC:
1. PURE UI ONLY: Chỉ sửa class Tailwind CSS và cấu trúc layout (Skyblue #38BDF8, Black #090D16, White #FFFFFF, font Inter weight 400/800).
2. PRESERVE LOGIC: Giữ nguyên 100% dữ liệu bento cards, bảng chấm công (giữ đúng định dạng giây/phút/h), cấu hình đơn giá lương 1 tiếng nhân viên, bảng lương tháng, socket gọi nhân viên và toàn bộ hàm xử lý (handleSaveSalaryConfig, handleGeneratePayroll, handleMarkPaidSalary...).
3. Kiểm tra `tsc --noEmit` sau khi sửa để đảm bảo không phát sinh lỗi compile.
```

---

### 💬 Mẫu Câu 3: Refactor Trang Đơn Hàng & Đánh Giá (`app/table/[tableId]/order-status/[orderId]/page.tsx`)
```text
Hãy áp dụng giao diện mới (UI Refactoring Only) cho file `app/table/[tableId]/order-status/[orderId]/page.tsx` dựa theo Stitch Prompt.

YÊU CẦU BẮT BUỘC:
1. PURE UI ONLY: Chỉ thay đổi styling và CSS layout.
2. PRESERVE LOGIC: Giữ nguyên logic đợt gọi món (Group Ordering rounds), realtime order status polling/socket, form gửi đánh giá sao và API handleSubmitReview.
3. Chạy `tsc --noEmit` để xác nhận 0 lỗi.
```

---

## 📜 2. Quy Tắc Tuân Thủ (Rule đã tự động được lưu vào dự án `.agents/AGENTS.md`)

File quy tắc `.agents/AGENTS.md` đã được tạo tự động trong thư mục gốc dự án của bạn với nội dung sau:

```markdown
# 🚨 RULE: BẢO TOÀN LOGIC NGHỆP VỤ KHI CẬP NHẬT GIAO DIỆN (PURE UI REFACTORING ONLY)

1. LOGIC IMMUTABILITY (BẤT BIẾN LOGIC):
   - Không thay đổi hoặc xóa bỏ bất kỳ State nào (useState, useRef, useContext...).
   - Không thay đổi hàm xử lý sự kiện (onClick, onChange, onSubmit...). Giữ nguyên 100% tên hàm, tham số và logic bên trong.
   - Bảo toàn toàn bộ API fetch calls, Socket.IO listeners (socket.on) và emitters (socket.emit).
   - Giữ nguyên các ID phần tử (id="...").

2. STYLING SCOPE (CHỈ ĐƯỢC PHÉP CHỈNH SỬA):
   - Thay đổi cấu trúc thẻ JSX/HTML (div, header, aside, section...).
   - Thay đổi class Tailwind CSS (Skyblue #38BDF8, Black #090D16, White #FFFFFF).
   - Áp dụng font Inter (weight 400 và 800).

3. VERIFICATION (KIỂM TRA BẮT BUỘC):
   - Chạy `tsc --noEmit` xác nhận 0 lỗi sau mỗi lần refactor.
```
