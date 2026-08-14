# KOHI COFFEE & PASTRY — Design System chuẩn

> Tài liệu này trích xuất và hệ thống hóa từ file token gốc (`design-tokens.css`) thành bảng tra cứu áp dụng trực tiếp cho toàn bộ dashboard.

---

## 1. MÀU SẮC (Color System)

### 🌞 Light Mode

| Nhóm | Token | Mã màu | Dùng cho |
|---|---|---|---|
| **Background** | `--bg-primary` | `#FFFFFF` | Nền trang |
| | `--bg-card` | `#FFFFFF` | Nền card |
| | `--bg-card-inner` | `#F8FAFC` | Nền phụ trong card (vd: box số liệu con) |
| **Border** | `--border-color` | `#E2E8F0` | Viền card mặc định |
| | `--border-strong` | `#CBD5E1` | Viền nhấn / divider đậm |
| | `--border-focus` | `#93C5FD` | Viền khi input/element focus |
| **Text** | `--text-primary` | `#000000` | Tiêu đề, số liệu chính |
| | `--text-secondary` | `#1F2937` | Body text |
| | `--text-tertiary` | `#6B7280` | Text phụ, caption, placeholder |
| **Brand** | `--brand-primary` | `#2563EB` | Nút chính, link, icon active |
| | `--brand-primary-hover` | `#1D4ED8` | Hover state |
| | `--brand-primary-muted` | `rgba(37,99,235,.12)` | Nền nhạt cho badge/active menu |
| **Giá tiền** | `--price-color` | `#2563EB` | Mọi số liệu tiền tệ (đồng bộ với brand) |
| **Accent** | `--accent` | `#7C3AED` | Điểm nhấn phụ (rating, tag đặc biệt) — dùng **có kiểm soát**, không lạm dụng |
| **Semantic** | `--color-success` | `#16A34A` | Lợi nhuận dương, thành công, đã điểm danh |
| | `--color-success-bg` | `#DCFCE7` | Nền badge success |
| | `--color-warning` | `#D97706` | Cảnh báo nhẹ, chưa hoàn tất (KHÔNG dùng đỏ) |
| | `--color-warning-bg` | `#FEF3C7` | Nền badge warning |
| | `--color-danger` | `#DC2626` | Lỗi thật sự, huỷ đơn, vắng không phép |
| | `--color-danger-bg` | `#FEE2E2` | Nền badge danger |
| | `--color-info` | `#0891B2` | Thông tin trung tính, tooltip |

### 🌙 Dark Mode

| Nhóm | Token | Mã màu |
|---|---|---|
| **Background** | `--bg-primary` | `#0B1120` |
| | `--bg-card` | `#111827` |
| | `--bg-card-inner` | `#1A2232` |
| **Border** | `--border-color` | `#293246` |
| | `--border-strong` | `#374151` |
| | `--border-focus` | `#3B82F6` |
| **Text** | `--text-primary` | `#F1F5F9` |
| | `--text-secondary` | `#94A3B8` |
| | `--text-tertiary` | `#4B5563` |
| **Brand** | `--brand-primary` | `#3B82F6` |
| | `--brand-primary-hover` | `#60A5FA` |
| **Giá tiền** | `--price-color` | `#60A5FA` |
| **Accent** | `--accent` | `#8B5CF6` |
| **Semantic** | `--color-success` | `#22C55E` / bg `#052E16` |
| | `--color-warning` | `#F59E0B` / bg `#451A03` |
| | `--color-danger` | `#EF4444` / bg `#450A0A` |
| | `--color-info` | `#22D3EE` |

### ⚠️ Quy tắc dùng màu (bắt buộc)

1. **Không tự chế màu ngoài token.** Mọi màu trên UI phải trỏ về 1 biến CSS trong bảng trên — không hardcode hex trong component.
2. **Đỏ (`danger`) chỉ dùng cho lỗi/cảnh báo thật sự** (vắng không phép, huỷ đơn, thanh toán lỗi). Trạng thái trung tính như "chưa điểm danh buổi sáng" → dùng `warning` (cam/vàng), không dùng đỏ.
3. **Tối đa 1 accent màu tím** trên mỗi màn hình, dùng nhất quán cho đúng 1 loại dữ liệu (vd: luôn là rating/đánh giá), không dùng ngẫu hứng.
4. **Số tiền luôn dùng `--price-color`**, không đổi màu tuỳ ngữ cảnh (trừ success/danger khi thể hiện lãi/lỗ).
5. Contrast text/background tối thiểu đạt **WCAG AA (4.5:1)** cho text thường, 3:1 cho text lớn ≥18px.

---

## 2. FONT CHỮ (Typography)

```css
--font-heading: 'Manrope', system-ui, sans-serif;   /* Tiêu đề */
--font-body:    'Be Vietnam Pro', system-ui, sans-serif; /* Nội dung, số liệu */
```

- **Manrope** — dùng cho `h1–h6`, tên trang, tiêu đề section. Manrope có hình khối geometric, hiện đại, tạo điểm nhấn tốt cho heading mà vẫn sạch sẽ.
- **Be Vietnap Pro** — dùng cho toàn bộ body text, số liệu, label, button. Hỗ trợ tiếng Việt đầy đủ dấu, có tabular figures phù hợp hiển thị số tiền theo cột.
- **Tuyệt đối không trộn thêm font thứ 3** (không dùng font hệ thống mặc định xen kẽ) — mọi text trong app chỉ thuộc 1 trong 2 family trên.

### Thang cỡ chữ (Type Scale) khuyến nghị áp cho token này

| Cấp | Font | Size | Weight | Line-height |
|---|---|---|---|---|
| Page title (h1) | Manrope | 28px | 700 | 1.3 |
| Section title (h2) | Manrope | 20px | 700 | 1.35 |
| Card title (h3) | Manrope | 15px | 600 | 1.4 |
| KPI number | Be Vietnam Pro | 30px | 700 (tabular-nums) | 1.2 |
| Body / paragraph | Be Vietnam Pro | 14px | 400 | 1.5 |
| Body phụ (subtext) | Be Vietnam Pro | 13px | 400 | 1.5 |
| Label / caption | Be Vietnam Pro | 12px | 500 | 1.4 |
| Badge / tag | Be Vietnam Pro | 11px | 600 | 1.2 |

---

## 3. FONT-WEIGHT — quy tắc áp dụng

| Weight | Giá trị | Dùng cho |
|---|---|---|
| Regular | 400 | Body text, paragraph, subtext |
| Medium | 500 | Label, caption, menu item không active |
| Semibold | 600 | Card title, button, menu item active, badge |
| Bold | 700 | Page title, section title, KPI number |

**Quy tắc:** không dùng weight 300 (light) ở bất kỳ đâu — với font tiếng Việt có dấu, weight nhẹ dễ vỡ nét trên màn hình nhỏ/độ phân giải thấp. Chênh lệch giữa 2 cấp thông tin liền kề nên **thay đổi ít nhất 1 bậc weight**, không chỉ dựa vào màu.

---

## 4. BO VIỀN (Border Radius)

```css
--radius-sm:   10px;   /* input nhỏ, badge, tag */
--radius-md:   12px;   /* button, dropdown */
--radius-lg:   16px;   /* card, modal */
--radius-full: 999px;  /* avatar, pill badge, toggle */
```

**Quy tắc:** radius tăng dần theo kích thước component (element càng lớn, bo góc càng lớn theo tỷ lệ). Không dùng giá trị lẻ ngoài 4 mốc trên.

---

## 5. SHADOW & ĐỘ SÂU

| Token | Light | Dark |
|---|---|---|
| `--shadow-card` | `0 1px 3px rgba(0,0,0,.05)` | `0 1px 3px rgba(0,0,0,.3)` |
| `--shadow-card-hover` | `0 6px 16px rgba(37,99,235,.12)` | `0 6px 20px rgba(59,130,246,.2)` |
| `--shadow-sidebar` | `1px 0 0 #E2E8F0` | `1px 0 0 #293246` |

Hover card: nâng nhẹ `translateY(-2px)` + đổi `border-color` sang `--brand-primary`, transition `250ms cubic-bezier(0.4,0,0.2,1)` — tạo cảm giác "nảy nhẹ", không giật.

---

## 6. ICON — quy tắc tuyệt đối

1. **Không dùng emoji** (🥧📈☕⭐) làm icon chức năng ở bất kỳ đâu trong UI — kể cả tiêu đề card hay badge. Emoji không đồng bộ được màu theo theme, không nhất quán độ dày nét, và trông thiếu chuyên nghiệp trên sản phẩm B2B/dashboard.
2. Thay emoji bằng **1 bộ icon SVG duy nhất** — khuyến nghị **Lucide Icons** (open-source, outline, stroke-width đều, tương thích tốt với Manrope/Be Vietnam Pro về độ dày nét).
3. Icon luôn kế thừa màu từ `currentColor` hoặc token semantic tương ứng (vd: icon trong card success dùng `--color-success`), không hardcode màu riêng.
4. Kích thước icon cố định theo ngữ cảnh:
   - 16px — inline trong text/label
   - 20px — card header, button
   - 24px — sidebar menu, top navigation
5. Stroke-width cố định **1.5–2px** cho toàn bộ hệ thống, không trộn icon filled và outline trong cùng 1 màn hình.

---

## 7. QUY TẮC TUYỆT ĐỐI (Design Rules — không thương lượng)

- ❌ Không emoji làm icon chức năng.
- ❌ Không hardcode màu ngoài token CSS variables.
- ❌ Không dùng đỏ (`danger`) cho trạng thái trung tính/bình thường.
- ❌ Không trộn font ngoài `Manrope` + `Be Vietnam Pro`.
- ❌ Không dùng font-weight 300 hoặc dưới 400.
- ❌ Không để trục Y biểu đồ tài chính bắt đầu khác 0 nếu không chú thích rõ.
- ✅ Mọi card dùng chung `.kohi-card` (radius 16px, border 1px `--border-color`, shadow chuẩn, hover nâng nhẹ).
- ✅ Mọi button chính dùng `.kohi-btn-primary`, phụ dùng `.kohi-btn-accent` — không tạo style button rời rạc.
- ✅ Transition đồng bộ 200–250ms `cubic-bezier(0.4,0,0.2,1)` cho mọi hiệu ứng đổi theme/hover.
- ✅ Badge số = 0 → ẩn, không hiển thị pill rỗng.

---

## 8. Áp dụng nhanh vào dashboard hiện tại (checklist sửa)

- [ ] Đổi toàn bộ emoji tiêu đề card (📈🥧📊⭐) → icon Lucide tương ứng (`trending-up`, `pie-chart`, `bar-chart-3`, `star`).
- [ ] Badge "Chưa ca" đỏ → đổi sang `--color-warning` / `--color-warning-bg`.
- [ ] Card title tăng weight lên 600 (Manrope), giữ size 15px.
- [ ] KPI number đổi màu theo `--price-color`, weight 700, bật `font-variant-numeric: tabular-nums`.
- [ ] Card đồng bộ `border-radius: 16px`, `border: 1px solid var(--border-color)`, `box-shadow: var(--shadow-card)`.
- [ ] Sidebar menu active: nền `--brand-primary-muted`, chữ `--brand-primary`, weight 600 (thay vì chỉ đổi màu nền).
- [ ] Trục Y line chart bắt đầu từ 0.
- [ ] Bỏ màu tím khỏi rating nếu không định nghĩa lại làm màu hệ thống cho "đánh giá" nói chung.
