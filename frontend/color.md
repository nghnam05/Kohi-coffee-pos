# Bảng màu POS Web/App — Light & Dark mode

## 1. Màu thương hiệu (Brand / Primary)

| Vai trò | Light Mode | Dark Mode |
|---|---|---|
| Primary | `#2563EB` | `#3B82F6` |
| Primary Hover | `#1D4ED8` | `#60A5FA` |
| Primary Foreground | `#FFFFFF` | `#0B1120` |
| Secondary / Accent | `#7C3AED` | `#8B5CF6` |

## 2. Nền & bề mặt (Background / Surface)

| Vai trò | Light Mode | Dark Mode |
|---|---|---|
| Background chính | `#F8FAFC` | `#0B1120` |
| Surface (card, panel) | `#FFFFFF` | `#111827` |
| Surface phụ (sidebar) | `#F1F5F9` | `#1A2232` |
| Border / Divider | `#E2E8F0` | `#293246` |
| Border nhấn (input focus) | `#93C5FD` | `#3B82F6` |

## 3. Văn bản (Text)

| Vai trò | Light Mode | Dark Mode |
|---|---|---|
| Text chính | `#0F172A` | `#F1F5F9` |
| Text phụ | `#475569` | `#94A3B8` |
| Text disabled | `#94A3B8` | `#4B5563` |

## 4. Màu trạng thái (Semantic)

| Trạng thái | Light Mode | Dark Mode | Dùng cho |
|---|---|---|---|
| Success | `#16A34A` | `#22C55E` | Thanh toán thành công, còn hàng |
| Warning | `#D97706` | `#F59E0B` | Sắp hết hàng, chờ xử lý |
| Danger / Error | `#DC2626` | `#EF4444` | Hết hàng, hủy đơn, lỗi thanh toán |
| Info | `#0891B2` | `#22D3EE` | Thông báo, đang xử lý |
| Nền Success | `#DCFCE7` | `#052E16` | Badge / tag nền |
| Nền Warning | `#FEF3C7` | `#451A03` | Badge / tag nền |
| Nền Danger | `#FEE2E2` | `#450A0A` | Badge / tag nền |

## 5. Nguyên tắc sử dụng

- Nút thanh toán chính dùng Primary; nút "Xác nhận thanh toán" cuối cùng có thể dùng Success để tăng cảm giác hoàn tất.
- Danh mục / tag sản phẩm nên dùng các sắc độ pastel nhẹ của cùng một hue để tạo hệ thống phân loại (đồ uống = cyan, đồ ăn = amber, combo = violet).
- Dark mode không nên dùng đen tuyệt đối (`#000000`) — nền `#0B1120`–`#111827` (xanh đen ấm) dễ chịu hơn khi dùng lâu.
- Đảm bảo tỷ lệ tương phản text chính tối thiểu 4.5:1 (WCAG AA) — bảng trên đã đạt chuẩn này.
- Tuyệt đối không dùng emoji trên web, thay vào đó hãy dùng icon

## 6. CSS variables mẫu

```css
:root {
  --color-bg: #F8FAFC;
  --color-surface: #FFFFFF;
  --color-surface-2: #F1F5F9;
  --color-border: #E2E8F0;
  --color-border-focus: #93C5FD;

  --color-text-primary: #0F172A;
  --color-text-secondary: #475569;
  --color-text-disabled: #94A3B8;

  --color-primary: #2563EB;
  --color-primary-hover: #1D4ED8;
  --color-primary-fg: #FFFFFF;
  --color-accent: #7C3AED;

  --color-success: #16A34A;
  --color-success-bg: #DCFCE7;
  --color-warning: #D97706;
  --color-warning-bg: #FEF3C7;
  --color-danger: #DC2626;
  --color-danger-bg: #FEE2E2;
  --color-info: #0891B2;
}

[data-theme="dark"] {
  --color-bg: #0B1120;
  --color-surface: #111827;
  --color-surface-2: #1A2232;
  --color-border: #293246;
  --color-border-focus: #3B82F6;

  --color-text-primary: #F1F5F9;
  --color-text-secondary: #94A3B8;
  --color-text-disabled: #4B5563;

  --color-primary: #3B82F6;
  --color-primary-hover: #60A5FA;
  --color-primary-fg: #0B1120;
  --color-accent: #8B5CF6;

  --color-success: #22C55E;
  --color-success-bg: #052E16;
  --color-warning: #F59E0B;
  --color-warning-bg: #451A03;
  --color-danger: #EF4444;
  --color-danger-bg: #450A0A;
  --color-info: #22D3EE;
}
```