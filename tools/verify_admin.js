// Dogrulama: login + admin/dashboard/stats 200 kontrolu
const BASE = 'https://buzz-backend-na24.onrender.com';
(async () => {
  const lr = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'berkyurekumut@gmail.com', password: 'woofer714' }),
  });
  const lj = await lr.json();
  const token = lj.token || lj.accessToken;
  console.log(`LOGIN HTTP ${lr.status} user=${lj.user && lj.user.username} role=${lj.user && (lj.user.role?.name || lj.user.roleid || '-')}`);
  if (!token) { console.error('Token yok:', JSON.stringify(lj).slice(0, 200)); process.exit(1); }

  const sr = await fetch(`${BASE}/admin/dashboard/stats`, { headers: { Authorization: `Bearer ${token}` } });
  const body = await sr.text();
  console.log(`ADMIN_STATS HTTP ${sr.status}`);
  console.log(body.slice(0, 400));
  process.exit(sr.status === 200 ? 0 : 2);
})().catch((e) => { console.error('HATA:', e.message); process.exit(3); });
