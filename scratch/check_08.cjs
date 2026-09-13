async function checkSingleDate() {
  const loginRes = await fetch('http://localhost:3001/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@kohi.vn', password: '123456' })
  });
  const loginData = await loginRes.json();
  const token = loginData.access_token;

  const res = await fetch('http://localhost:3001/api/v1/analytics/summary?date=2026-09-08', {
    headers: { Authorization: `Bearer ${token}` }
  });
  const data = await res.json();
  console.log('Result for 2026-09-08:');
  console.log({
    periodGross: data.periodGross,
    todayGross: data.todayGross,
    periodSalary: data.periodSalary,
    todaySalary: data.todaySalary,
    periodIngredientCost: data.periodIngredientCost,
    periodExpenseCost: data.periodExpenseCost,
    periodNetProfit: data.periodNetProfit,
    dayOrdersCount: data.dayOrders?.length,
    dayAttendancesCount: data.dayAttendances?.length,
    settlementStatus: data.settlementStatus
  });
}

checkSingleDate().catch(console.error);
