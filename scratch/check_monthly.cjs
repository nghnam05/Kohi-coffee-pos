async function checkMonthly() {
  const loginRes = await fetch('http://localhost:3001/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@kohi.vn', password: '123456' })
  });
  const loginData = await loginRes.json();
  const token = loginData.access_token;

  const res = await fetch('http://localhost:3001/api/v1/analytics/summary?month=2026-09', {
    headers: { Authorization: `Bearer ${token}` }
  });
  const data = await res.json();
  console.log('Daily breakdown:');
  data.dailyBreakdown?.forEach(r => {
    console.log(`${r.date} (${r.dayOfWeek}): orders=${r.ordersCount}, gross=${r.grossRevenue}, salary=${r.salaryCost}, ing=${r.ingredientCost}, exp=${r.expenseCost}, profit=${r.netProfit}`);
  });
}

checkMonthly().catch(console.error);
