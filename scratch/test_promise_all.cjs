async function testEndpoints() {
  const loginRes = await fetch('http://localhost:3001/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@kohi.vn', password: '123456' })
  });
  const loginData = await loginRes.json();
  const token = loginData.access_token;

  const [sumRes, topRes, revRes] = await Promise.all([
    fetch('http://localhost:3001/api/v1/analytics/summary?date=2026-09-08', { headers: { Authorization: `Bearer ${token}` } }),
    fetch('http://localhost:3001/api/v1/analytics/top-foods', { headers: { Authorization: `Bearer ${token}` } }),
    fetch('http://localhost:3001/api/v1/analytics/revenue', { headers: { Authorization: `Bearer ${token}` } }),
  ]);

  console.log('sumRes status:', sumRes.status);
  console.log('topRes status:', topRes.status);
  console.log('revRes status:', revRes.status);
  if (!revRes.ok) {
    console.log('revRes text:', await revRes.text());
  }
}

testEndpoints().catch(console.error);
