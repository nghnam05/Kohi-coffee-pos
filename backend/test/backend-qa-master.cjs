const assert = require('assert');

/**
 * ============================================================================
 * KOHI COFFEE POS & ORDERING SYSTEM - COMPREHENSIVE BACKEND QA TEST SUITE
 * ============================================================================
 * Senior SDET / Lead QA Automation Test Suite
 * Target Server: http://localhost:3001/api/v1
 * 
 * Coverage Modules (12 Modules):
 *  1. Authentication & RBAC (Admin, Waiter, Barista, 401/403 Security Guards)
 *  2. Tables Management & QR Token Session Verification
 *  3. Menu Catalog & Category Filtering
 *  4. Coupons Engine & Threshold Validations
 *  5. Complete Order Lifecycle & KDS Pipeline (pending -> confirmed -> cooking -> ready -> completed -> paid)
 *  6. Payments Recording & Table Auto-release
 *  7. Table Reservation Lifecycle (pending -> confirmed -> checkInCode -> arrived)
 *  8. Staff Call Realtime Dispatch & Acknowledgment
 *  9. Inventory & Stock Tracking
 * 10. Staff Attendance & Working Hours Guardrails
 * 11. Customer Feedback & Review Rating Engine
 * 12. Financial Analytics & Settlement Guardrails
 * ============================================================================
 */

const BASE_URL = 'http://localhost:3001/api/v1';

const testResults = {
  total: 0,
  passed: 0,
  failed: 0,
  tests: []
};

function recordTest(name, passed, durationMs, details = '') {
  testResults.total++;
  if (passed) {
    testResults.passed++;
    console.log(`  ✅ [PASS] (${durationMs}ms) ${name}`);
  } else {
    testResults.failed++;
    console.error(`  ❌ [FAIL] (${durationMs}ms) ${name}: ${details}`);
  }
  testResults.tests.push({ name, passed, durationMs, details });
}

async function apiRequest(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const start = Date.now();
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };
  
  try {
    const res = await fetch(url, {
      ...options,
      headers
    });
    const duration = Date.now() - start;
    let data = null;
    const text = await res.text();
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
    return { status: res.status, ok: res.ok, data, duration };
  } catch (err) {
    const duration = Date.now() - start;
    return { status: 0, ok: false, data: null, error: err.message, duration };
  }
}

async function runMasterBackendQA() {
  console.log('====================================================================');
  console.log('🧪 RUNNING KOHI COFFEE MASTER BACKEND QA AUTOMATION SUITE');
  console.log(`🎯 Base URL: ${BASE_URL}`);
  console.log(`⏰ Time: ${new Date().toISOString()}`);
  console.log('====================================================================\n');

  let adminToken = null;
  let waiterToken = null;
  let baristaToken = null;
  let sampleTable = null;
  let resvTable = null;
  let sampleFood = null;
  let createdOrderId = null;
  let createdReservationId = null;
  let createdReviewId = null;
  let createdStaffCallId = null;

  // --------------------------------------------------------------------------
  // MODULE 1: AUTHENTICATION & ROLE-BASED ACCESS CONTROL (RBAC)
  // --------------------------------------------------------------------------
  console.log('📌 [MODULE 1] Testing Authentication & RBAC...');
  {
    // Test 1.1: Admin login success
    const resAdmin = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'admin@kohi.vn', password: 'password123' })
    });
    let token = resAdmin.data?.access_token || resAdmin.data?.token;
    if (!token) {
      const fb = await apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: 'admin@kohi.vn', password: '123456' })
      });
      token = fb.data?.access_token || fb.data?.token;
    }
    const okAdmin = Boolean(token);
    if (okAdmin) adminToken = token;
    recordTest('TC-AUTH-01: Admin Login (admin@kohi.vn, role: admin)', okAdmin, resAdmin.duration);

    // Test 1.2: Waiter login
    const resWaiter = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'pvcasang@kohi.vn', password: '123456' })
    });
    const okWaiter = Boolean(resWaiter.data?.access_token);
    if (okWaiter) waiterToken = resWaiter.data.access_token;
    recordTest('TC-AUTH-02: Waiter Login (pvcasang@kohi.vn, role: waiter)', okWaiter, resWaiter.duration);

    // Test 1.3: Barista login
    const resBarista = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'pccasang@kohi.vn', password: '123456' })
    });
    const okBarista = Boolean(resBarista.data?.access_token);
    if (okBarista) baristaToken = resBarista.data.access_token;
    recordTest('TC-AUTH-03: Barista Login (pccasang@kohi.vn, role: barista)', okBarista, resBarista.duration);

    // Test 1.4: Invalid credentials rejection
    const resInvalid = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'admin@kohi.vn', password: 'wrong_password_xyz' })
    });
    const okInvalid = resInvalid.status === 400 || resInvalid.status === 401;
    recordTest('TC-AUTH-04: Negative: Reject Invalid Credentials with 401/400', okInvalid, resInvalid.duration, `Status: ${resInvalid.status}`);

    // Test 1.5: Role Guard - Waiter cannot access Admin-only Analytics
    if (waiterToken) {
      const resForbidden = await apiRequest('/analytics/summary', {
        method: 'GET',
        headers: { Authorization: `Bearer ${waiterToken}` }
      });
      const okForbidden = resForbidden.status === 403;
      recordTest('TC-AUTH-05: RBAC Guard: Waiter token blocked from /analytics/summary (403 Forbidden)', okForbidden, resForbidden.duration, `Status: ${resForbidden.status}`);
    }
  }

  // --------------------------------------------------------------------------
  // MODULE 2: TABLES MANAGEMENT & REALTIME QR TOKENS
  // --------------------------------------------------------------------------
  console.log('\n📌 [MODULE 2] Testing Tables & QR Session Tokens...');
  {
    const resTables = await apiRequest('/tables', { method: 'GET' });
    const okTables = resTables.status === 200 && Array.isArray(resTables.data) && resTables.data.length > 0;
    recordTest('TC-TBL-01: Fetch All Tables (GET /tables)', okTables, resTables.duration, `Found ${resTables.data?.length || 0} tables`);
    if (okTables) {
      const emptyTables = resTables.data.filter(t => t.status === 'empty');
      sampleTable = emptyTables[0] || resTables.data[0];
      resvTable = emptyTables[1] || resTables.data[1] || sampleTable;
    }

    if (sampleTable) {
      const resQR = await apiRequest(`/tables/${sampleTable._id}/regenerate-qr`, { method: 'PATCH' });
      const okQR = resQR.status === 200 && resQR.data?.qrToken;
      recordTest(`TC-TBL-02: Regenerate QR Token for Table "${sampleTable.tableName || sampleTable.tableNumber || sampleTable._id}"`, okQR, resQR.duration);

      const resJoin = await apiRequest(`/tables/${sampleTable._id}/join-session`, {
        method: 'POST',
        body: JSON.stringify({ deviceId: 'qa_runner_device_01' })
      });
      const okJoin = resJoin.status === 200 || resJoin.status === 201;
      recordTest('TC-TBL-03: Join Table Session (POST /tables/:id/join-session)', okJoin, resJoin.duration);
    }
  }

  // --------------------------------------------------------------------------
  // MODULE 3: FOODS & CATEGORIES CATALOG
  // --------------------------------------------------------------------------
  console.log('\n📌 [MODULE 3] Testing Foods & Categories Catalog...');
  {
    const resCats = await apiRequest('/categories', { method: 'GET' });
    const okCats = resCats.status === 200 && Array.isArray(resCats.data) && resCats.data.length > 0;
    recordTest('TC-CAT-01: Fetch Categories Catalog (GET /categories)', okCats, resCats.duration, `Found ${resCats.data?.length || 0} categories`);

    const resFoods = await apiRequest('/foods', { method: 'GET' });
    const okFoods = resFoods.status === 200 && Array.isArray(resFoods.data) && resFoods.data.length > 0;
    recordTest('TC-FOOD-01: Fetch Foods Catalog (GET /foods)', okFoods, resFoods.duration, `Found ${resFoods.data?.length || 0} foods`);
    if (okFoods) {
      sampleFood = resFoods.data.find(f => f.isAvailable !== false) || resFoods.data[0];
    }
  }

  // --------------------------------------------------------------------------
  // MODULE 4: COUPONS & PROMOTION ENGINE
  // --------------------------------------------------------------------------
  console.log('\n📌 [MODULE 4] Testing Coupons & Promotional Discounts...');
  {
    const resVal = await apiRequest('/coupons/validate/KOHI10?amount=350000', { method: 'GET' });
    const okVal = resVal.status === 200 && resVal.data?.valid === true && resVal.data?.discountAmount > 0;
    recordTest('TC-CPN-01: Validate Eligible Coupon KOHI10 (valid=true, discount=10%)', okVal, resVal.duration, `Discount: ${resVal.data?.discountAmount}đ`);

    const resValLow = await apiRequest('/coupons/validate/KOHI10?amount=100000', { method: 'GET' });
    const okValLow = resValLow.status === 200 && resValLow.data?.valid === false;
    recordTest('TC-CPN-02: Min Spend Check: Reject KOHI10 when order < 300,000đ (valid=false)', okValLow, resValLow.duration);

    const resValInvalid = await apiRequest('/coupons/validate/NON_EXISTENT_CODE_999?amount=350000', { method: 'GET' });
    const okValInvalid = resValInvalid.status === 200 && resValInvalid.data?.valid === false;
    recordTest('TC-CPN-03: Negative: Reject Non-existent Coupon Code (valid=false)', okValInvalid, resValInvalid.duration);
  }

  // --------------------------------------------------------------------------
  // MODULE 5: ORDERS & KITCHEN DISPLAY SYSTEM (KDS) LIFECYCLE
  // --------------------------------------------------------------------------
  console.log('\n📌 [MODULE 5] Testing Orders Lifecycle & KDS Pipeline...');
  {
    if (sampleTable && sampleFood) {
      const orderPayload = {
        tableId: sampleTable._id,
        isTakeaway: false,
        customerName: 'QA Test Customer',
        customerPhone: '0912345678',
        items: [
          {
            foodId: sampleFood._id,
            quantity: 2,
            note: 'Ít đường, nhiều đá (QA Test)'
          }
        ]
      };

      const resCreateOrder = await apiRequest('/orders', {
        method: 'POST',
        body: JSON.stringify(orderPayload)
      });
      const okCreate = (resCreateOrder.status === 200 || resCreateOrder.status === 201) && resCreateOrder.data?._id;
      recordTest('TC-ORD-01: Create Dine-In Order with Server-side Price Calc (pending)', okCreate, resCreateOrder.duration, okCreate ? `Order ID: ${resCreateOrder.data._id}` : JSON.stringify(resCreateOrder.data));

      if (okCreate) {
        createdOrderId = resCreateOrder.data._id;

        // Waiter Confirms Order (pending -> confirmed)
        const resConfirm = await apiRequest(`/orders/${createdOrderId}/status`, {
          method: 'PATCH',
          headers: { Authorization: `Bearer ${waiterToken || adminToken}` },
          body: JSON.stringify({ status: 'confirmed' })
        });
        const okConfirm = resConfirm.status === 200 && resConfirm.data?.status === 'confirmed';
        recordTest('TC-ORD-02: KDS Step 1: Waiter Confirms Order (pending -> confirmed)', okConfirm, resConfirm.duration);

        // Barista Starts Brewing (confirmed -> cooking)
        const resCooking = await apiRequest(`/orders/${createdOrderId}/status`, {
          method: 'PATCH',
          headers: { Authorization: `Bearer ${baristaToken || adminToken}` },
          body: JSON.stringify({ status: 'cooking' })
        });
        const okCooking = resCooking.status === 200 && resCooking.data?.status === 'cooking';
        recordTest('TC-ORD-03: KDS Step 2: Barista Starts Brewing (confirmed -> cooking)', okCooking, resCooking.duration);

        // Barista Finishes Brewing (cooking -> ready)
        const resReady = await apiRequest(`/orders/${createdOrderId}/status`, {
          method: 'PATCH',
          headers: { Authorization: `Bearer ${baristaToken || adminToken}` },
          body: JSON.stringify({ status: 'ready' })
        });
        const okReady = resReady.status === 200 && resReady.data?.status === 'ready';
        recordTest('TC-ORD-04: KDS Step 3: Barista Finishes Brewing (cooking -> ready)', okReady, resReady.duration);

        // Waiter Serves to Table (ready -> completed)
        const resCompleted = await apiRequest(`/orders/${createdOrderId}/status`, {
          method: 'PATCH',
          headers: { Authorization: `Bearer ${waiterToken || adminToken}` },
          body: JSON.stringify({ status: 'completed' })
        });
        const okCompleted = resCompleted.status === 200 && resCompleted.data?.status === 'completed';
        recordTest('TC-ORD-05: KDS Step 4: Waiter Serves to Table (ready -> completed)', okCompleted, resCompleted.duration);

        // Pay Order (completed -> paid)
        const resPaid = await apiRequest(`/orders/${createdOrderId}/pay`, {
          method: 'PATCH'
        });
        const okPaid = resPaid.status === 200 && resPaid.data?.status === 'paid';
        recordTest('TC-ORD-06: KDS Step 5: Cashier/System Payment (completed -> paid)', okPaid, resPaid.duration);
      }
    }
  }

  // --------------------------------------------------------------------------
  // MODULE 6: PAYMENTS VERIFICATION & BILL AUDIT
  // --------------------------------------------------------------------------
  console.log('\n📌 [MODULE 6] Testing Payments Audit & Queries...');
  {
    const resPayments = await apiRequest('/payments', { method: 'GET' });
    const okPayments = resPayments.status === 200 && Array.isArray(resPayments.data);
    recordTest('TC-PAY-01: Query Payment Records (GET /payments)', okPayments, resPayments.duration, `Found ${resPayments.data?.length || 0} payments`);
  }

  // --------------------------------------------------------------------------
  // MODULE 7: RESERVATIONS LIFECYCLE & OCCUPANCY CONSTRAINTS
  // --------------------------------------------------------------------------
  console.log('\n📌 [MODULE 7] Testing Table Reservations...');
  {
    if (resvTable) {
      await apiRequest(`/tables/${resvTable._id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'empty' })
      });

      const tomorrow = new Date(Date.now() + 86400000);
      tomorrow.setHours(19, 0, 0, 0);
      const resvTime = tomorrow.toISOString();

      const resvPayload = {
        tableId: resvTable._id,
        customerName: 'QA Nguyễn Văn A',
        customerPhone: '0988776655',
        guestCount: 4,
        reservationTime: resvTime,
        note: 'Bàn cạnh cửa kính thoáng mát (QA Test)'
      };

      const resCreateResv = await apiRequest('/reservations', {
        method: 'POST',
        body: JSON.stringify(resvPayload)
      });
      const okCreateResv = (resCreateResv.status === 200 || resCreateResv.status === 201) && resCreateResv.data?._id;
      recordTest('TC-RSV-01: Create Table Reservation on Empty Table (POST /reservations -> pending)', okCreateResv, resCreateResv.duration, okCreateResv ? `ID: ${resCreateResv.data._id}` : JSON.stringify(resCreateResv.data));

      if (okCreateResv) {
        createdReservationId = resCreateResv.data._id;

        // Double booking prevention check on same table & time
        const resDouble = await apiRequest('/reservations', {
          method: 'POST',
          body: JSON.stringify(resvPayload)
        });
        const okDouble = resDouble.status === 400 || resDouble.status === 409 || !resDouble.ok;
        recordTest('TC-RSV-02: Negative: Prevent Double-Booking on Same Table & Time Slot', okDouble, resDouble.duration, `Status: ${resDouble.status}`);

        // Lookup reservation by customer phone
        const resLookup = await apiRequest(`/reservations/lookup?phone=${resvPayload.customerPhone}`, { method: 'GET' });
        const okLookup = resLookup.status === 200 && Array.isArray(resLookup.data) && resLookup.data.some(r => r._id === createdReservationId);
        recordTest('TC-RSV-03: Customer Lookup Reservations by Phone (GET /reservations/lookup)', okLookup, resLookup.duration);

        // Staff approves reservation -> generates checkInCode
        const resStaffConfirm = await apiRequest(`/reservations/${createdReservationId}/status`, {
          method: 'PATCH',
          headers: { Authorization: `Bearer ${waiterToken || adminToken}` },
          body: JSON.stringify({ status: 'confirmed' })
        });
        const checkInCode = resStaffConfirm.data?.checkInCode || resCreateResv.data?.checkInCode;

        // Customer check-in arrival with checkInCode
        const resArrive = await apiRequest(`/reservations/${createdReservationId}/customer-arrive`, {
          method: 'PATCH',
          body: JSON.stringify({ checkInCode })
        });
        const okArrive = resArrive.status === 200 && (resArrive.data?.success === true || resArrive.data?.status === 'arrived');
        recordTest('TC-RSV-04: Staff Confirms & Customer Check-In Arrival (PATCH customer-arrive with checkInCode)', okArrive, resArrive.duration, `Code: ${checkInCode}`);
      }
    }
  }

  // --------------------------------------------------------------------------
  // MODULE 8: STAFF CALLS (KHÁCH GỌI PHỤC VỤ)
  // --------------------------------------------------------------------------
  console.log('\n📌 [MODULE 8] Testing Staff Calls Flow...');
  {
    if (sampleTable) {
      const resCall = await apiRequest('/staff-calls', {
        method: 'POST',
        body: JSON.stringify({
          tableId: sampleTable._id,
          message: 'Khách cần gọi thêm đá và nước lọc'
        })
      });
      const okCall = (resCall.status === 200 || resCall.status === 201) && resCall.data?._id;
      recordTest('TC-CALL-01: Customer Calls Staff (POST /staff-calls)', okCall, resCall.duration);

      if (okCall) {
        createdStaffCallId = resCall.data._id;

        // Waiter retrieves pending calls
        if (waiterToken) {
          const resPendingCalls = await apiRequest('/staff-calls', {
            method: 'GET',
            headers: { Authorization: `Bearer ${waiterToken}` }
          });
          const okPending = resPendingCalls.status === 200 && Array.isArray(resPendingCalls.data);
          recordTest('TC-CALL-02: Waiter Receives Staff Call Notification in Queue', okPending, resPendingCalls.duration);
        }

        // Admin gets empty list by design rule
        if (adminToken) {
          const resAdminCalls = await apiRequest('/staff-calls', {
            method: 'GET',
            headers: { Authorization: `Bearer ${adminToken}` }
          });
          const okAdminCalls = resAdminCalls.status === 200 && Array.isArray(resAdminCalls.data) && resAdminCalls.data.length === 0;
          recordTest('TC-CALL-03: Admin Filter Rule: Admin queue filters out staff-calls (returns [])', okAdminCalls, resAdminCalls.duration);
        }

        // Staff acknowledges call
        const resAck = await apiRequest(`/staff-calls/${createdStaffCallId}/acknowledge`, {
          method: 'PATCH',
          headers: { Authorization: `Bearer ${waiterToken || adminToken}` }
        });
        const okAck = resAck.status === 200;
        recordTest('TC-CALL-04: Staff Acknowledges Call (PATCH /staff-calls/:id/acknowledge)', okAck, resAck.duration);
      }
    }
  }

  // --------------------------------------------------------------------------
  // MODULE 9: INVENTORY & STOCK MANAGEMENT
  // --------------------------------------------------------------------------
  console.log('\n📌 [MODULE 9] Testing Inventory & Stock Ingredients...');
  {
    const resIngr = await apiRequest('/ingredients', { method: 'GET' });
    const okIngr = resIngr.status === 200 && Array.isArray(resIngr.data);
    recordTest('TC-INV-01: Fetch Stock Ingredients (GET /ingredients)', okIngr, resIngr.duration, `Count: ${resIngr.data?.length || 0}`);
  }

  // --------------------------------------------------------------------------
  // MODULE 10: STAFF ATTENDANCE & SHIFTS
  // --------------------------------------------------------------------------
  console.log('\n📌 [MODULE 10] Testing Staff Attendance & Shifts...');
  {
    if (waiterToken) {
      // 10.1: Check-in outside assigned shift window constraint
      const resCheckIn = await apiRequest('/attendance/check-in', {
        method: 'POST',
        headers: { Authorization: `Bearer ${waiterToken}` },
        body: JSON.stringify({ shift: 'morning' })
      });
      const okCheckInGuard = resCheckIn.status === 400 && resCheckIn.data?.message?.includes('khung giờ ca làm việc');
      recordTest('TC-ATT-01: Shift Enforcement: Block check-in outside assigned shift hours (400 Bad Request)', okCheckInGuard, resCheckIn.duration, `Message: ${resCheckIn.data?.message}`);

      // 10.2: Check-out guard: Reject check-out when no active check-in session exists
      const resCheckOut = await apiRequest('/attendance/check-out', {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${waiterToken}` }
      });
      const okCheckOutGuard = (resCheckOut.status === 404 || resCheckOut.status === 400) && resCheckOut.data?.message?.includes('chưa bắt đầu ca làm việc');
      recordTest('TC-ATT-02: Session Guard: Reject check-out when no active shift is running (404 Not Found)', okCheckOutGuard, resCheckOut.duration, `Message: ${resCheckOut.data?.message}`);

      // 10.3: Staff views personal attendance history
      const resMyAtt = await apiRequest('/attendance/my', {
        method: 'GET',
        headers: { Authorization: `Bearer ${waiterToken}` }
      });
      const okMyAtt = resMyAtt.status === 200 && Array.isArray(resMyAtt.data);
      recordTest('TC-ATT-03: Staff Query Own Attendance (GET /attendance/my)', okMyAtt, resMyAtt.duration);
    }
  }

  // --------------------------------------------------------------------------
  // MODULE 11: CUSTOMER REVIEWS & FEEDBACK
  // --------------------------------------------------------------------------
  console.log('\n📌 [MODULE 11] Testing Customer Reviews & Rating Engine...');
  {
    if (sampleFood && createdOrderId) {
      const resReview = await apiRequest('/reviews', {
        method: 'POST',
        body: JSON.stringify({
          orderId: createdOrderId,
          tableId: sampleTable?._id,
          overallStar: 5,
          overallComment: 'Cà phê rất thơm ngon, không gian ấm cúng, phục vụ nhiệt tình!',
          ratings: [
            {
              foodId: sampleFood._id,
              star: 5,
              comment: 'Đồ uống rất đậm vị'
            }
          ]
        })
      });
      const okReview = (resReview.status === 200 || resReview.status === 201) && resReview.data?._id;
      recordTest('TC-REV-01: Submit Customer Review & Multi-Item Rating (POST /reviews)', okReview, resReview.duration);

      if (okReview) {
        createdReviewId = resReview.data._id;

        const resRatingSummary = await apiRequest(`/reviews/food/${sampleFood._id}/summary`, { method: 'GET' });
        const okRatingSummary = resRatingSummary.status === 200 && typeof resRatingSummary.data?.avgStar !== 'undefined';
        recordTest('TC-REV-02: Food Rating Summary Aggregation (GET /reviews/food/:id/summary)', okRatingSummary, resRatingSummary.duration, `Avg: ${resRatingSummary.data?.avgStar}, Count: ${resRatingSummary.data?.totalReviews}`);
      }
    }
  }

  // --------------------------------------------------------------------------
  // MODULE 12: FINANCIAL ANALYTICS & SETTLEMENT HEALTH
  // --------------------------------------------------------------------------
  console.log('\n📌 [MODULE 12] Testing Financial Analytics & Settlement Guardrails...');
  {
    if (adminToken) {
      const resSummary = await apiRequest('/analytics/summary', {
        method: 'GET',
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      const okSummary = resSummary.status === 200 && resSummary.data?.settlementStatus;
      recordTest('TC-ANL-01: Admin Analytics Summary & Settlement Status (GET /analytics/summary)', okSummary, resSummary.duration, 
        okSummary ? `Settlement: ${resSummary.data.settlementStatus.status}, OpenShifts: ${resSummary.data.settlementStatus.checklist?.openShiftsCount}` : '');

      const resRev = await apiRequest('/analytics/revenue', {
        method: 'GET',
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      const okRev = resRev.status === 200 && Array.isArray(resRev.data);
      recordTest('TC-ANL-02: Admin Revenue Trend Series (GET /analytics/revenue)', okRev, resRev.duration, `Data points: ${resRev.data?.length || 0}`);
    }
  }

  // --------------------------------------------------------------------------
  // CLEANUP TEST ARTIFACTS
  // --------------------------------------------------------------------------
  console.log('\n🧹 Cleaning up test generated records...');
  {
    if (createdOrderId && adminToken) {
      await apiRequest(`/orders/${createdOrderId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${adminToken}` }
      });
    }
    if (createdReservationId && adminToken) {
      await apiRequest(`/reservations/${createdReservationId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${adminToken}` }
      });
    }
    if (createdReviewId && adminToken) {
      await apiRequest(`/reviews/${createdReviewId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${adminToken}` }
      });
    }
    if (sampleTable) {
      await apiRequest(`/tables/${sampleTable._id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'empty' })
      });
    }
    if (resvTable) {
      await apiRequest(`/tables/${resvTable._id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'empty' })
      });
    }
  }

  // --------------------------------------------------------------------------
  // SUMMARY REPORT
  // --------------------------------------------------------------------------
  console.log('\n====================================================================');
  console.log('📊 BACKEND QA TEST EXECUTION SUMMARY REPORT');
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
}

runMasterBackendQA();
