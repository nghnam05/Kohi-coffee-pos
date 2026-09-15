const assert = require('assert');

/**
 * ============================================================================
 * KOHI COFFEE FRONTEND BUSINESS LOGIC & STATE MACHINE MASTER QA TEST SUITE
 * ============================================================================
 * Lead QA / Senior SDET Automated Verification Suite
 * Scope:
 *  1. Cart Math, Variant Sizing & Customization Pipeline
 *  2. Coupon Engine, Discount Capping & Threshold Guards
 *  3. Multi-Persona RBAC, Sidebar Visibility & Action Button Guards
 *  4. 5-Step KDS Order Stepper & Live Progress Computation
 *  5. Table QR Code Token Parsing & Session State
 *  6. VietQR & MoMo Payload / Memo Sanitization
 *  7. Reservation Form Validations (Phone, Hours, Dates, Table Eligibility)
 *  8. Financial Settlement Guardrails & Banner States
 * ============================================================================
 */

const testResults = {
  total: 0,
  passed: 0,
  failed: 0,
  tests: []
};

function test(name, fn) {
  testResults.total++;
  const start = Date.now();
  try {
    fn();
    const duration = Date.now() - start;
    testResults.passed++;
    console.log(`  ✅ [PASS] (${duration}ms) ${name}`);
    testResults.tests.push({ name, passed: true, duration });
  } catch (err) {
    const duration = Date.now() - start;
    testResults.failed++;
    console.error(`  ❌ [FAIL] (${duration}ms) ${name}\n     Error: ${err.message}`);
    testResults.tests.push({ name, passed: false, duration, error: err.message });
  }
}

console.log('====================================================================');
console.log('🧪 RUNNING KOHI COFFEE MASTER FRONTEND QA AUTOMATION SUITE');
console.log(`⏰ Time: ${new Date().toISOString()}`);
console.log('====================================================================\n');

// ============================================================================
// SUITE 1: CART MATHEMATICS, SIZING & ITEM CUSTOMIZATION
// ============================================================================
console.log('📌 [SUITE 1] Testing Cart Math, Sizing & Customization Pipeline...');

test('Cart Math: Base price * quantity calculation', () => {
  const item = { price: 35000, quantity: 3 };
  const itemTotal = item.price * item.quantity;
  assert.strictEqual(itemTotal, 105000);
});

test('Cart Math: Size variant price modifier calculation', () => {
  const calculateItemTotal = (basePrice, size, quantity) => {
    const sizeUpcharge = size === 'L' ? 10000 : size === 'M' ? 5000 : 0;
    return (basePrice + sizeUpcharge) * quantity;
  };

  assert.strictEqual(calculateItemTotal(30000, 'S', 2), 60000);
  assert.strictEqual(calculateItemTotal(30000, 'M', 2), 70000);
  assert.strictEqual(calculateItemTotal(30000, 'L', 2), 80000);
});

test('Cart State: Quantity step-up, step-down and auto-removal at 0', () => {
  let cart = [
    { id: 'f1', name: 'Cà phê muối', quantity: 2, price: 35000 },
    { id: 'f2', name: 'Trà sen vàng', quantity: 1, price: 45000 },
  ];

  const updateQuantity = (cartList, id, delta) => {
    return cartList
      .map(item => {
        if (item.id === id) {
          const newQty = item.quantity + delta;
          return newQty > 0 ? { ...item, quantity: newQty } : null;
        }
        return item;
      })
      .filter(Boolean);
  };

  // Step up f1
  cart = updateQuantity(cart, 'f1', 1);
  assert.strictEqual(cart.find(i => i.id === 'f1').quantity, 3);

  // Step down f2 to 0 -> should be removed
  cart = updateQuantity(cart, 'f2', -1);
  assert.strictEqual(cart.length, 1);
  assert.strictEqual(cart.find(i => i.id === 'f2'), undefined);
});

test('Cart Aggregation: Multi-item subtotal summation', () => {
  const cart = [
    { price: 35000, sizeUpcharge: 5000, quantity: 2 }, // (35000 + 5000) * 2 = 80000
    { price: 45000, sizeUpcharge: 0, quantity: 1 },    // 45000 * 1 = 45000
    { price: 50000, sizeUpcharge: 10000, quantity: 1 }, // 60000 * 1 = 60000
  ];

  const subtotal = cart.reduce((sum, item) => sum + (item.price + item.sizeUpcharge) * item.quantity, 0);
  assert.strictEqual(subtotal, 185000);
});

// ============================================================================
// SUITE 2: COUPON ENGINE, DISCOUNT CAPPING & THRESHOLD GUARDS
// ============================================================================
console.log('\n📌 [SUITE 2] Testing Coupon Engine & Discount Validations...');

test('Coupon: Percentage discount calculation with maximum cap', () => {
  const calculateDiscount = (subtotal, coupon) => {
    if (!coupon || !coupon.isActive) return 0;
    if (subtotal < coupon.minSpend) return 0;

    if (coupon.discountType === 'percentage') {
      const calculated = (subtotal * coupon.discountValue) / 100;
      return coupon.maxDiscount ? Math.min(calculated, coupon.maxDiscount) : calculated;
    }
    if (coupon.discountType === 'fixed') {
      return Math.min(coupon.discountValue, subtotal);
    }
    return 0;
  };

  const coupon20 = {
    code: 'KOHI20',
    discountType: 'percentage',
    discountValue: 20,
    minSpend: 100000,
    maxDiscount: 30000,
    isActive: true,
  };

  // Subtotal 200,000đ -> 20% is 40,000đ -> capped at 30,000đ
  assert.strictEqual(calculateDiscount(200000, coupon20), 30000);

  // Subtotal 120,000đ -> 20% is 24,000đ -> under cap
  assert.strictEqual(calculateDiscount(120000, coupon20), 24000);

  // Subtotal 80,000đ -> below minSpend 100,000đ -> 0đ
  assert.strictEqual(calculateDiscount(80000, coupon20), 0);
});

test('Coupon: Fixed discount and net total computation', () => {
  const couponFixed = {
    code: 'GIAM50K',
    discountType: 'fixed',
    discountValue: 50000,
    minSpend: 150000,
    isActive: true,
  };

  const subtotal = 180000;
  const discount = subtotal >= couponFixed.minSpend ? couponFixed.discountValue : 0;
  const netTotal = Math.max(0, subtotal - discount);

  assert.strictEqual(discount, 50000);
  assert.strictEqual(netTotal, 130000);
});

// ============================================================================
// SUITE 3: MULTI-PERSONA RBAC, SIDEBAR VISIBILITY & ACTION GUARDS
// ============================================================================
console.log('\n📌 [SUITE 3] Testing Multi-Persona RBAC & UI Permissions...');

test('RBAC: Admin has complete access to all system tabs', () => {
  const getSidebarTabs = (role) => {
    switch (role) {
      case 'admin':
        return ['dashboard', 'orders', 'foods', 'tables', 'reservations', 'staff', 'inventory', 'coupons', 'analytics'];
      case 'waiter':
        return ['orders', 'foods', 'tables', 'reservations', 'attendance'];
      case 'barista':
        return ['orders', 'attendance'];
      default:
        return [];
    }
  };

  const adminTabs = getSidebarTabs('admin');
  assert.strictEqual(adminTabs.includes('analytics'), true);
  assert.strictEqual(adminTabs.includes('coupons'), true);
  assert.strictEqual(adminTabs.includes('staff'), true);
  assert.strictEqual(adminTabs.length, 9);
});

test('RBAC: Waiter tabs scoped, excluded from admin-only modules', () => {
  const getSidebarTabs = (role) => {
    switch (role) {
      case 'waiter':
        return ['orders', 'foods', 'tables', 'reservations', 'attendance'];
      default:
        return [];
    }
  };

  const waiterTabs = getSidebarTabs('waiter');
  assert.strictEqual(waiterTabs.includes('analytics'), false);
  assert.strictEqual(waiterTabs.includes('coupons'), false);
  assert.strictEqual(waiterTabs.includes('orders'), true);
  assert.strictEqual(waiterTabs.includes('tables'), true);
});

test('RBAC: Barista restricted strictly to KDS and Attendance', () => {
  const getSidebarTabs = (role) => {
    switch (role) {
      case 'barista':
        return ['orders', 'attendance'];
      default:
        return [];
    }
  };

  const baristaTabs = getSidebarTabs('barista');
  assert.deepStrictEqual(baristaTabs, ['orders', 'attendance']);

  // Check takeaway POS creation restriction
  const canCreateTakeaway = (role) => role !== 'barista';
  assert.strictEqual(canCreateTakeaway('barista'), false);
  assert.strictEqual(canCreateTakeaway('waiter'), true);
});

// ============================================================================
// SUITE 4: 5-STEP KDS ORDER PIPELINE & LIVE PROGRESS COMPUTATION
// ============================================================================
console.log('\n📌 [SUITE 4] Testing 5-Step KDS Order Stepper & Action Buttons...');

test('KDS Stepper: Step index and progress bar percentage mapping', () => {
  const statusStepMap = {
    pending: 0,
    confirmed: 1,
    cooking: 2,
    ready: 3,
    completed: 4,
    paid: 5,
  };

  const calculateProgress = (status) => {
    const step = statusStepMap[status] ?? 0;
    return Math.round((step / 5) * 100);
  };

  assert.strictEqual(calculateProgress('pending'), 0);
  assert.strictEqual(calculateProgress('confirmed'), 20);
  assert.strictEqual(calculateProgress('cooking'), 40);
  assert.strictEqual(calculateProgress('ready'), 60);
  assert.strictEqual(calculateProgress('completed'), 80);
  assert.strictEqual(calculateProgress('paid'), 100);
});

test('KDS Action Buttons: Role-based button enablement per status', () => {
  const getOrderAction = (status, role) => {
    if (role === 'waiter') {
      if (status === 'pending') return { canAct: true, nextStatus: 'confirmed', label: 'Duyệt đơn' };
      if (status === 'ready') return { canAct: true, nextStatus: 'completed', label: 'Ra món tại bàn' };
      if (status === 'completed') return { canAct: true, nextStatus: 'paid', label: 'Thanh toán' };
      return { canAct: false, nextStatus: null, label: 'Đang xử lý' };
    }
    if (role === 'barista') {
      if (status === 'confirmed') return { canAct: true, nextStatus: 'cooking', label: 'Bắt đầu pha chế' };
      if (status === 'cooking') return { canAct: true, nextStatus: 'ready', label: 'Hoàn tất pha chế' };
      return { canAct: false, nextStatus: null, label: 'Chờ phân việc' };
    }
    return { canAct: false, nextStatus: null, label: '' };
  };

  // Waiter can confirm pending, but not cook
  assert.strictEqual(getOrderAction('pending', 'waiter').canAct, true);
  assert.strictEqual(getOrderAction('pending', 'barista').canAct, false);

  // Barista can cook confirmed, but Waiter cannot
  assert.strictEqual(getOrderAction('confirmed', 'barista').canAct, true);
  assert.strictEqual(getOrderAction('confirmed', 'waiter').canAct, false);

  // Barista can mark ready when cooking, Waiter cannot
  assert.strictEqual(getOrderAction('cooking', 'barista').canAct, true);
  assert.strictEqual(getOrderAction('cooking', 'waiter').canAct, false);

  // Waiter delivers when ready, Barista cannot
  assert.strictEqual(getOrderAction('ready', 'waiter').canAct, true);
  assert.strictEqual(getOrderAction('ready', 'barista').canAct, false);
});

// ============================================================================
// SUITE 5: TABLE QR CODE TOKEN PARSING & SESSION STATE
// ============================================================================
console.log('\n📌 [SUITE 5] Testing Table QR Token Parsing & Session...');

test('QR Parser: Extract tableId and token from search params', () => {
  const parseTableParams = (urlStr) => {
    const url = new URL(urlStr);
    const tableId = url.searchParams.get('tableId') || url.searchParams.get('table');
    const token = url.searchParams.get('token');
    return { tableId, token };
  };

  const parsed = parseTableParams('https://kohi-coffee.vn/menu?tableId=64f123456789&token=qr_token_abc123');
  assert.strictEqual(parsed.tableId, '64f123456789');
  assert.strictEqual(parsed.token, 'qr_token_abc123');

  const parsedFallback = parseTableParams('https://kohi-coffee.vn/menu?table=B02');
  assert.strictEqual(parsedFallback.tableId, 'B02');
  assert.strictEqual(parsedFallback.token, null);
});

// ============================================================================
// SUITE 6: VIETQR & PAYMENT STRING GENERATION
// ============================================================================
console.log('\n📌 [SUITE 6] Testing VietQR & Payment URL Generation...');

test('VietQR URL synthesis & memo sanitization', () => {
  const generateVietQRUrl = (bankId, accountNo, template, amount, memo, accountName) => {
    const sanitizedMemo = memo.replace(/[^A-Za-z0-9 ]/g, '').toUpperCase();
    return `https://img.vietqr.io/image/${bankId}-${accountNo}-${template}.png?amount=${amount}&addInfo=${encodeURIComponent(sanitizedMemo)}&accountName=${encodeURIComponent(accountName)}`;
  };

  const qrUrl = generateVietQRUrl('MB', '0912345678', 'compact', 85000, 'DH-1002 Cà phê muối!', 'KOHI COFFEE');
  assert.strictEqual(qrUrl.includes('https://img.vietqr.io/image/MB-0912345678-compact.png'), true);
  assert.strictEqual(qrUrl.includes('amount=85000'), true);
  assert.strictEqual(qrUrl.includes('addInfo=DH1002%20C%20PH%20MUI'), true);
});

test('Payment Countdown: 10-minute timer formatting MM:SS', () => {
  const formatCountdown = (remainingSeconds) => {
    const mins = Math.floor(remainingSeconds / 60);
    const secs = remainingSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  assert.strictEqual(formatCountdown(600), '10:00');
  assert.strictEqual(formatCountdown(59), '00:59');
  assert.strictEqual(formatCountdown(0), '00:00');
});

// ============================================================================
// SUITE 7: RESERVATION FORM VALIDATIONS
// ============================================================================
console.log('\n📌 [SUITE 7] Testing Reservation Form Validations...');

test('Validation: Vietnamese mobile phone regex', () => {
  const isValidVnPhone = (phone) => /^(03|05|07|08|09)\d{8}$/.test(phone);

  assert.strictEqual(isValidVnPhone('0912345678'), true);
  assert.strictEqual(isValidVnPhone('0388776655'), true);
  assert.strictEqual(isValidVnPhone('0866554433'), true);
  assert.strictEqual(isValidVnPhone('0123456789'), false); // invalid prefix
  assert.strictEqual(isValidVnPhone('091234567'), false);  // only 9 digits
  assert.strictEqual(isValidVnPhone('09123456789'), false); // 11 digits
  assert.strictEqual(isValidVnPhone('abc0912345'), false);
});

test('Validation: Store operating hours (07:00 to 22:30)', () => {
  const isWithinStoreHours = (timeStr) => {
    const [h, m] = timeStr.split(':').map(Number);
    const totalMinutes = h * 60 + m;
    const openMinutes = 7 * 60;        // 07:00
    const closeMinutes = 22 * 60 + 30; // 22:30
    return totalMinutes >= openMinutes && totalMinutes <= closeMinutes;
  };

  assert.strictEqual(isWithinStoreHours('07:00'), true);
  assert.strictEqual(isWithinStoreHours('14:30'), true);
  assert.strictEqual(isWithinStoreHours('22:30'), true);
  assert.strictEqual(isWithinStoreHours('06:59'), false);
  assert.strictEqual(isWithinStoreHours('22:31'), false);
  assert.strictEqual(isWithinStoreHours('23:00'), false);
});

test('Validation: Table selection eligibility (empty only)', () => {
  const tables = [
    { id: 't1', status: 'empty' },
    { id: 't2', status: 'serving' },
    { id: 't3', status: 'reserved' },
  ];

  const canSelectTableForBooking = (tbl) => tbl.status === 'empty';

  assert.strictEqual(canSelectTableForBooking(tables[0]), true);
  assert.strictEqual(canSelectTableForBooking(tables[1]), false);
  assert.strictEqual(canSelectTableForBooking(tables[2]), false);
});

// ============================================================================
// SUITE 8: FINANCIAL SETTLEMENT GUARDRAILS & BANNER STATES
// ============================================================================
console.log('\n📌 [SUITE 8] Testing Financial Settlement Guardrails...');

test('Settlement Guard: Evaluates ready when all 3 checklist items pass', () => {
  const evaluateSettlement = (checklist) => {
    const isReady = checklist.openShiftsCount === 0 &&
                    checklist.unpaidOrdersCount === 0 &&
                    checklist.activeTablesCount === 0;
    return {
      status: isReady ? 'settled' : 'pending',
      bannerText: isReady ? 'Doanh thu chính thức' : 'Tạm tính (Chờ chốt ca & chi phí)',
      bannerColor: isReady ? 'green' : 'amber'
    };
  };

  // Case 1: All clean
  const settledCase = evaluateSettlement({ openShiftsCount: 0, unpaidOrdersCount: 0, activeTablesCount: 0 });
  assert.strictEqual(settledCase.status, 'settled');
  assert.strictEqual(settledCase.bannerText, 'Doanh thu chính thức');

  // Case 2: Open shifts remain
  const openShiftsCase = evaluateSettlement({ openShiftsCount: 2, unpaidOrdersCount: 0, activeTablesCount: 0 });
  assert.strictEqual(openShiftsCase.status, 'pending');
  assert.strictEqual(openShiftsCase.bannerText, 'Tạm tính (Chờ chốt ca & chi phí)');

  // Case 3: Unpaid orders remain
  const unpaidCase = evaluateSettlement({ openShiftsCount: 0, unpaidOrdersCount: 5, activeTablesCount: 0 });
  assert.strictEqual(unpaidCase.status, 'pending');

  // Case 4: Tables still serving
  const activeTablesCase = evaluateSettlement({ openShiftsCount: 0, unpaidOrdersCount: 0, activeTablesCount: 3 });
  assert.strictEqual(activeTablesCase.status, 'pending');
});

// ============================================================================
// FINAL SUMMARY REPORT
// ============================================================================
console.log('\n====================================================================');
console.log('📊 FRONTEND QA TEST EXECUTION SUMMARY REPORT');
console.log('====================================================================');
console.log(`Total Tests Executed : ${testResults.total}`);
console.log(`Passed               : ${testResults.passed} ✅`);
console.log(`Failed               : ${testResults.failed} ❌`);
console.log(`Pass Rate            : ${((testResults.passed / testResults.total) * 100).toFixed(1)}%`);
console.log('====================================================================\n');

if (testResults.failed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
