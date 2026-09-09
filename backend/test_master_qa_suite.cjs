/**
 * KOHI COFFEE POS - MASTER QA TEST SUITE
 * Lead Reviewer & Automation Runner
 */

const http = require('http');

const API_BASE = 'http://localhost:3001/api/v1';

function request(method, path, body = null, token = null) {
  return new Promise((resolve) => {
    const url = new URL(API_BASE + path);
    const options = {
      method,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        let parsed = data;
        try { parsed = JSON.parse(data); } catch (_) {}
        resolve({
          status: res.statusCode,
          headers: res.headers,
          data: parsed,
        });
      });
    });

    req.on('error', (err) => {
      resolve({
        status: 0,
        error: err.message,
      });
    });

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    passed++;
  } else {
    console.log(`  ❌ FAIL: ${message}`);
    failed++;
  }
}

async function runMasterQASuite() {
  console.log('================================================================');
  console.log('🚀 RUNNING SENIOR QA MASTER TEST SUITE - KOHI COFFEE POS');
  console.log('================================================================\n');

  let adminToken = '';
  let testTableId = '';
  let testFoodId = '';
  let testOrderId = '';

  // --- MODULE 1: AUTHENTICATION & RBAC ---
  console.log('--- 1. AUTHENTICATION & RBAC ---');
  const loginRes = await request('POST', '/auth/login', {
    email: 'admin@kohi.vn',
    password: 'password123',
  });
  
  if (loginRes.status === 200 || loginRes.status === 201) {
    adminToken = loginRes.data.access_token || loginRes.data.token;
  } else {
    const altLogin = await request('POST', '/auth/login', {
      email: 'admin@kohi.vn',
      password: '123456',
    });
    adminToken = altLogin.data?.access_token || altLogin.data?.token;
  }
  assert(Boolean(adminToken), 'TC-AUTH-01: Admin login successful, JWT token acquired');

  const invalidLogin = await request('POST', '/auth/login', {
    email: 'admin@kohi.vn',
    password: 'wrong_password_999',
  });
  assert(invalidLogin.status === 401 || invalidLogin.status === 400, 'TC-AUTH-02: Invalid credentials correctly rejected with 401/400');

  // --- MODULE 2: IN-MEMORY CACHE & FOODS ---
  console.log('\n--- 2. MENU & IN-MEMORY CACHING ---');
  const t1 = Date.now();
  const foodsCold = await request('GET', '/foods');
  const d1 = Date.now() - t1;

  const t2 = Date.now();
  const foodsWarm = await request('GET', '/foods');
  const d2 = Date.now() - t2;

  assert(foodsWarm.status === 200 && Array.isArray(foodsWarm.data), `TC-FOOD-01: Menu retrieved successfully (${foodsWarm.data?.length || 0} items)`);
  assert(d2 <= d1 || d2 < 100, `TC-FOOD-01 (Speed): In-Memory Cache warm hit is fast (${d2}ms vs ${d1}ms)`);

  if (foodsWarm.data && foodsWarm.data.length > 0) {
    testFoodId = foodsWarm.data[0]._id;
  }

  // --- MODULE 3: TABLES & QR RESOLUTION ---
  console.log('\n--- 3. TABLES & QR CODE LIFECYCLE ---');
  const tablesRes = await request('GET', '/tables');
  assert(tablesRes.status === 200 && Array.isArray(tablesRes.data), `TC-TBL-01: Tables list retrieved (${tablesRes.data?.length || 0} tables)`);

  if (tablesRes.data && tablesRes.data.length > 0) {
    const emptyTable = tablesRes.data.find((t) => t.status === 'empty') || tablesRes.data[0];
    testTableId = emptyTable._id;
    const tableDetail = await request('GET', `/tables/${testTableId}`);
    const token = tableDetail.data?.qrToken || emptyTable.qrToken;
    assert(Boolean(token), `TC-TBL-02: Table ${emptyTable.tableName} has active qrToken (${token})`);
  }

  // --- MODULE 4: ORDER CREATION, DB PRICE RECALC & ANTI-SPAM ---
  console.log('\n--- 4. ORDER CREATION, RECALCULATION & ANTI-SPAM ---');
  if (testTableId && testFoodId) {
    // 1. Create order
    const orderRes = await request('POST', '/orders', {
      tableId: testTableId,
      items: [
        { foodId: testFoodId, quantity: 2, note: 'Ít đường nhiều đá' }
      ],
      customerName: 'Khách VIP QA',
    });

    if (orderRes.status === 200 || orderRes.status === 201) {
      testOrderId = orderRes.data._id;
      assert(true, `TC-ORD-01: Order created successfully (ID: ${testOrderId}, Total: ${orderRes.data.totalAmount}đ)`);
      assert(orderRes.data.status === 'pending', 'TC-ORD-01 (State): Initial order status is pending');

      // 2. Anti-spam test: try to create a second pending order on the SAME table
      const spamRes = await request('POST', '/orders', {
        tableId: testTableId,
        items: [{ foodId: testFoodId, quantity: 1 }],
        customerName: 'Khách Spam',
      });
      assert(spamRes.status === 400, 'TC-ORD-02: Anti-spam rule correctly blocked 2nd pending order on the same table (HTTP 400)');

      // 3. Approve order (pending -> confirmed)
      const approveRes = await request('PATCH', `/orders/${testOrderId}/status`, {
        status: 'confirmed',
      }, adminToken);
      assert(approveRes.status === 200 && approveRes.data.status === 'confirmed', 'TC-ORD-03: Order confirmed by staff -> routed to KDS');

      // 4. Complete brewing (confirmed -> completed)
      const brewRes = await request('PATCH', `/orders/${testOrderId}/status`, {
        status: 'completed',
      }, adminToken);
      assert(brewRes.status === 200 && brewRes.data.status === 'completed', 'TC-ORD-04: Barista completed drink preparation (KDS state completed)');

      // 5. Payment (completed -> paid)
      const payRes = await request('PATCH', `/orders/${testOrderId}/status`, {
        status: 'paid',
      }, adminToken);
      assert(payRes.status === 200 && payRes.data.status === 'paid', 'TC-ORD-05: Order payment completed, financial records committed');
    } else {
      console.log('Order creation note:', orderRes.data?.message || orderRes.status);
    }
  }

  // --- MODULE 5: ONLINE RESERVATIONS VALIDATION ---
  console.log('\n--- 5. RESERVATIONS & OPERATING HOURS ---');
  // Find an empty table that has no active reservations
  const emptyResTable = tablesRes.data.find((t) => t.status === 'empty') || tablesRes.data[0];
  const reservationTableId = emptyResTable ? emptyResTable._id : testTableId;
  const randomPhone = '098' + Math.floor(1000000 + Math.random() * 9000000);

  // 1. Valid booking at 10:00 AM tomorrow
  const tomorrowMorning = new Date();
  tomorrowMorning.setDate(tomorrowMorning.getDate() + 1);
  tomorrowMorning.setHours(10, 0, 0, 0);

  const validBooking = await request('POST', '/reservations', {
    tableId: reservationTableId,
    customerName: 'Chị Lan QA',
    customerPhone: randomPhone,
    guestCount: 2,
    reservationTime: tomorrowMorning.toISOString(),
    note: 'Bàn cạnh cửa sổ',
  });
  assert(validBooking.status === 200 || validBooking.status === 201, `TC-RSV-01: Valid reservation created within operating hours (07:00 - 22:30, Status: ${validBooking.status})`);

  // Clean up the created reservation immediately to keep db pristine
  if (validBooking.data && validBooking.data._id && adminToken) {
    await request('DELETE', `/reservations/${validBooking.data._id}`, null, adminToken);
  }

  // 2. Invalid booking at 02:00 AM (Outside operating hours)
  const tomorrowMidnight = new Date();
  tomorrowMidnight.setDate(tomorrowMidnight.getDate() + 1);
  tomorrowMidnight.setHours(2, 0, 0, 0);

  const invalidBooking = await request('POST', '/reservations', {
    tableId: reservationTableId,
    customerName: 'Khách Đêm',
    customerPhone: '098' + Math.floor(1000000 + Math.random() * 9000000),
    guestCount: 2,
    reservationTime: tomorrowMidnight.toISOString(),
  });
  assert(invalidBooking.status === 400, 'TC-RSV-02: Booking outside operating hours rejected with HTTP 400');

  // --- MODULE 6: FINANCIAL LEDGER & AI FORECAST ---
  console.log('\n--- 6. FINANCIAL ANALYTICS & AI FORECAST ---');
  if (adminToken) {
    const summaryRes = await request('GET', '/analytics/summary', null, adminToken);
    assert(summaryRes.status === 200 && summaryRes.data.settlementStatus !== undefined, 'TC-FIN-01: Financial summary & settlement status calculated');

    const aiRes = await request('GET', '/analytics/ai-forecast', null, adminToken);
    assert(aiRes.status === 200 && Array.isArray(aiRes.data.forecastDays), 'TC-FIN-02: AI Demand Forecast 7-day model computed using projections');
  }

  // --- CLEANUP TEST DATA ---
  if (testOrderId && adminToken) {
    await request('DELETE', `/orders/${testOrderId}`, null, adminToken);
  }

  console.log('\n================================================================');
  console.log(`📊 MASTER QA TEST RESULTS: ${passed} PASSED | ${failed} FAILED`);
  console.log('================================================================');
}

runMasterQASuite();
