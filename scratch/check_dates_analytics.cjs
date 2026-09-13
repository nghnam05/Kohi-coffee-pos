async function testDates() {
  const loginRes = await fetch('http://localhost:3001/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@kohi.vn', password: '123456' })
  });
  const loginData = await loginRes.json();
  const token = loginData.access_token || loginData.token;
  console.log('Login token received:', !!token);

  const dates = [
    '2026-09-01',
    '2026-09-02',
    '2026-09-03',
    '2026-09-04',
    '2026-09-05',
    '2026-09-06',
    '2026-09-07',
    '2026-09-08',
    '2026-09-09',
    '2026-09-10',
    '2026-09-11',
    '2026-09-12',
    '2026-09-13',
  ];

  for (const d of dates) {
    const res = await fetch(`http://localhost:3001/api/v1/analytics/summary?date=${d}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    console.log(`Date: ${d} -> Gross: ${data.periodGross} (todayGross: ${data.todayGross}), Salary: ${data.periodSalary}, Exp: ${data.periodExpenseCost}, Ing: ${data.periodIngredientCost}, Profit: ${data.periodNetProfit}, Orders: ${data.dayOrders?.length}, Att: ${data.dayAttendances?.length}`);
  }
}

testDates().catch(console.error);
