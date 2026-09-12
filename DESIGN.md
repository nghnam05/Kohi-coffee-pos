# KOHI COFFEE - DESIGN SYSTEM (EMERALD & ROAST)
> **Source**: Stitch MCP Project `[Mini Map Table Editor]` (`projects/10961152889326845664`)  
> **Aesthetic Philosophy**: Modern Minimalist Hospitality SaaS — Blending the precision of a high-end booking platform with the organic, welcoming atmosphere of a boutique coffee house.

---

## 1. Brand Identity & Visual Language

- **Brand Personality**: Professional, clean, and reliable. Eliminates cluttered restaurant interfaces in favor of expansive whitespace, geometric typography, and a "function-first" visual hierarchy.
- **Visual Mood**: Calm, balanced, and efficient.
- **Target Audience**: Tech-savvy patrons ordering via mobile QR or reserving tables online, and store baristas/cashiers operating the POS system.

---

## 2. Color Palette & Design Tokens

### 2.1 Core Palette

| Role | Token Name | Hex Value | Application |
| :--- | :--- | :--- | :--- |
| **Primary Brand** | `primary` / `primary-container` | `#003527` / `#064e3b` | Primary actions, high-level headers, active navigation |
| **Primary Highlight** | `primary-fixed` | `#b0f0d6` | High-contrast badges, light active tints |
| **Secondary Accent** | `secondary` | `#006c49` | Complementary buttons, active states, secondary badges |
| **Secondary Container** | `secondary-container` | `#6cf8bb` | Accent highlights, secondary selection |
| **Tertiary Accent** | `tertiary` / `tertiary-container` | `#442800` / `#623c00` | Warm roasted tones, premium badges, alert accents |
| **Tertiary Container** | `on-tertiary-container` | `#f69f0d` | Warm amber warning highlights |

### 2.2 Neutral & Surface Hierarchy (Paper-like Clean Background)

| Token Name | Hex Value | Application |
| :--- | :--- | :--- |
| `surface` / `background` | `#f8f9fa` | Clean, flat "paper-like" canvas |
| `surface-container-lowest` | `#ffffff` | Elevated cards, dialogs, form input containers |
| `surface-container-low` | `#f3f4f5` | Subtle section backgrounds, inactive card fills |
| `surface-container` | `#edeeef` | Card borders, secondary container dividers |
| `surface-container-high` | `#e7e8e9` | Table row hover states, segmented control tracks |
| `surface-container-highest`| `#e1e3e4` | Chip borders, input outlines |
| `outline` / `outline-variant` | `#707974` / `#bfc9c3` | Structural borders, subtle dividers |

### 2.3 Typography & Content Colors

| Token Name | Hex Value | Application |
| :--- | :--- | :--- |
| `on-surface` / `on-background` | `#191c1d` (Deep Slate) | High-emphasis body copy, card titles, prices |
| `on-surface-variant` | `#404944` (Muted Slate) | Secondary descriptions, timestamps, subtext |
| `inverse-surface` | `#2e3132` | Tooltips, dark snackbars, dark contrast elements |
| `on-primary` | `#ffffff` | Text/icons on primary emerald buttons |

### 2.4 Status Indicators (Table & Order Lifecycles)

| Status | Color Name | Hex Code | Purpose / Representation |
| :--- | :--- | :--- | :--- |
| **Available (Bàn trống)** | Vibrant Emerald | `#10b981` | Ready for seating, empty table pulse dot |
| **Reserved / Pending (Đã hẹn)** | Warm Amber | `#f59e0b` | Upcoming booking, pending approval |
| **Occupied / Serving (Có khách)** | Slate Gray | `#94a3b8` | Currently seated, table in active service |
| **Critical Error / Cancelled** | Rose / Crimson | `#ba1a1a` | Order cancellation, validation failure |

---

## 3. Typography System

**Primary Font Family**: `Manrope`, sans-serif (Geometric, high legibility in digital hospitality interfaces).

| Level | Size | Weight | Line Height | Letter Spacing | Usage Guideline |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Headline XL** | `40px` | ExtraBold (800) | `48px` | `-0.02em` | Main marketing headers, modal hero titles |
| **Headline LG** | `32px` | Bold (700) | `40px` | `-0.01em` | Primary page headers, major section titles |
| **Headline LG (Mobile)** | `28px` | Bold (700) | `36px` | `0` | Mobile viewport page headers |
| **Headline MD** | `24px` | SemiBold (600) | `32px` | `0` | Table numbers inside cards, card group headers |
| **Body LG** | `18px` | Regular (400) | `28px` | `0` | Introductory lead paragraphs, featured text |
| **Body MD** | `16px` | Regular (400) | `24px` | `0` | Standard body text, form input value |
| **Body SM** | `14px` | Regular (400) | `20px` | `0` | Card subtext, descriptions, modal instructions |
| **Label MD** | `14px` | SemiBold (600) | `16px` | `+0.02em` | Input field labels, button text, table filters |
| **Label SM** | `12px` | Medium (500) | `14px` | `0` | Status badges, metadata, guest count pill |

---

## 4. Spacing, Rhythm & Elevation

### 4.1 Spacing Scale (8px Linear Rhythm)

- **Base Unit**: `8px`
- `stack-sm`: `8px` (Gap between label and input, icon and label)
- `stack-md`: `16px` (Gap between form elements, card internal padding on mobile)
- `stack-lg`: `32px` (Section spacing, container separation)
- `gutter`: `24px` (Grid gap between table cards and columns)
- `margin-mobile`: `16px` (Viewport horizontal edge padding on mobile)
- `margin-desktop`: `48px` (Viewport horizontal edge padding on desktop)
- `container-max`: `1200px` (Maximum layout container width)

### 4.2 Corner Radii (Approachable Soft Curves)

```css
--radius-sm: 0.25rem;  /* 4px  - Small badges, inner pills */
--radius-md: 0.5rem;   /* 8px  - Compact buttons, chip selectors */
--radius-lg: 0.75rem;  /* 12px - Standard buttons, input fields, cards */
--radius-xl: 1.0rem;   /* 16px - Large modal cards, table containers */
--radius-2xl: 1.5rem;  /* 24px - Section containers, bottom sheet top */
--radius-full: 9999px; /* Full - Status pills, circular action triggers */
```

### 4.3 Elevation & Depth Hierarchy

Prioritizes **ambient diffused shadows over heavy black outlines**:
- **Level 0 (Canvas)**: Flat surface background `#f8f9fa`.
- **Level 1 (Cards & Inputs)**: Multi-layered soft ambient shadow:
  ```css
  box-shadow: 0px 4px 20px rgba(0, 0, 0, 0.04);
  ```
- **Level 2 (Dropdowns & Modals)**: Floating elevated shadow:
  ```css
  box-shadow: 0px 12px 32px rgba(0, 0, 0, 0.08);
  ```
- **Active Focus State**: 1px subtle stroke of Deep Emerald (`#064e3b`) or Skyblue focus ring (`ring-2 ring-emerald-500/40`), maintaining soft shadow elevation.

---

## 5. Layout & Grid Rules

1. **Fluid Grid System**:
   - **Desktop (>= 1024px)**: 12-column grid capped at `1200px` max-width.
   - **Layout Split**: 
     - Left / Center: Interactive Floor Plan & Table Grid (`8 cols` / `flex-1`).
     - Right: Booking Action Sidebar / Cart Summary (`4 cols` / `w-[360px]`).
   - **Mobile (< 1024px)**: Single column fluid layout with sticky bottom action sheet.
2. **Whitespace Density**:
   - High whitespace density. Major flow sections are spaced `48px` to `64px` apart to minimize cognitive overload during ordering/booking.
3. **Card Consistency**:
   - Table cards and form containers maintain standard `24px` internal padding (`p-6`).

---

## 6. Component Specifications

### 6.1 Buttons
- **Primary Action**: Deep Emerald (`#064e3b`) background, White text (`#ffffff`), `12px` rounded corners, min-height `44px` for touch targets.
- **Secondary Action**: Ghost / Outlined style with `1px` border (`#e2e8f0` / `#bfc9c3`), neutral text.
- **Table Status Buttons**: Adaptive color-coded states (Green `#10b981`, Amber `#f59e0b`, Gray `#94a3b8`).

### 6.2 Table Cards (Mini Map & Grid)
- Softly elevated surface card (`#ffffff`) with subtle `1px` border.
- **Status Dot**: Positioned in top-left corner (`w-2.5 h-2.5 rounded-full`) with live pulse animation for available tables.
- **Table Identity**: Centered `headline-md` (e.g. "Bàn số 1").
- **Capacity Badge**: Positioned at bottom or alongside table name (e.g. `👤 4 chỗ`).

### 6.3 Input Fields
- Background: Very light neutral (`#f8f9fa`) or White with subtle border (`#e2e8f0`).
- **Focus State**: `2px` focus ring in Primary Emerald (`#064e3b`).
- **Labels**: Positioned cleanly above input in `label-md` (`font-semibold text-slate-700`).

### 6.4 Steppers & Progress Indicators
- 3-Step Linear Booking Stepper (`1. Chọn bàn` -> `2. Thông tin` -> `3. Xác nhận`).
- Completed steps display checkmark badge with `#064e3b` background; pending steps display muted slate.

---
*Generated directly from Stitch MCP Project `[Mini Map Table Editor]` for Kohi Coffee.*
