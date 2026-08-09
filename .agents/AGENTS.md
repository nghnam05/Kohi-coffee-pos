# 🚨 RULE: BẢO TOÀN LOGIC NGHỆP VỤ KHI CẬP NHẬT GIAO DIỆN (PURE UI REFACTORING ONLY)

Khi được yêu cầu thay đổi / làm đẹp / làm lại giao diện theo thiết kế (Stitch, Figma, Design System), Agent phải **BẮT BUỘC** tuân thủ nghiêm ngặt các nguyên tắc sau:

## 1. NGUYÊN TẮC BẤT BIẾN LOGIC (LOGIC IMMUTABILITY)
- **Không thay đổi hoặc xóa bỏ bất kỳ State nào** (`useState`, `useRef`, `useContext`, `useMemo`, `useCallback`).
- **Không thay đổi các hàm xử lý sự kiện** (`onClick`, `onChange`, `onSubmit`, `onKeyDown`...). Giữ nguyên 100% tên hàm, tham số truyền vào và logic bên trong.
- **Bảo toàn các lệnh gọi API** (`fetch`, `axios`, `async/await`, các endpoint URL và headers token).
- **Bảo toàn kết nối Realtime Socket.IO**: Giữ nguyên toàn bộ listener (`socket.on`), emitter (`socket.emit`), room joining và cleanup.
- **Giữ nguyên tất cả các ID phần tử** (`id="..."`) để phục vụ kiểm thử tự động và selector.

## 2. PHẠM VI CHỈ ĐƯỢC PHÉP CHỈNH SỬA (UI/STYLING ONLY)
- Chỉ thay đổi cấu trúc thẻ HTML/JSX (`div`, `span`, `header`, `aside`, `main`, `section`...).
- Chỉ thay đổi các class CSS / Tailwind CSS (`bg-slate-900`, `text-sky-400`, `font-black`, `rounded-3xl`, `shadow-lg`...).
- Cập nhật palette màu theo 3 màu chủ đạo: **Skyblue** (`#38BDF8`), **Black** (`#090D16`), **White** (`#FFFFFF`).
- Áp dụng font **Inter** với đúng 2 trọng số `font-weight: 400` và `font-weight: 800`.
- Tối ưu hóa layout **Desktop 3 cột** (Sidebar trái + Catalog giữa + Cart phải) và **Mobile Bottom Sheet**.

## 3. QUY TRÌNH KIỂM TRA BẮT BUỘC (VERIFICATION)
- Sau khi chỉnh sửa CSS/JSX, Agent **PHẢI** chạy lệnh kiểm tra TypeScript compilation (`tsc --noEmit`).
- Đảm bảo **0 lỗi compile**, không còn bất kỳ biến hay handler nào bị dư thừa hoặc bỏ sót.
