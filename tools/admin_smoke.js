// Admin panel fonksiyonlarinin prod smoke testi (super_admin hesabiyla)
const BASE = 'https://buzz-backend-na24.onrender.com';
const EMAIL = 'berkyurekumut@gmail.com';
const PASS = 'woofer714';

async function login() {
  const r = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: EMAIL, password: PASS }),
  });
  const j = await r.json();
  return j.token || j.accessToken;
}

(async () => {
  const token = await login();
  if (!token) { console.error('LOGIN FAIL'); process.exit(1); }
  const H = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

  const tests = [
    ['GET', '/admin/dashboard/stats'],
    ['GET', '/admin/users?page=1&limit=5'],
    ['GET', '/admin/videos?page=1&limit=5'],
    ['GET', '/admin/livestreams'],
    ['GET', '/admin/roles'],
    ['GET', '/admin/permissions'],
    ['GET', '/admin/financial/reports'],
    ['GET', '/admin/analytics/system?period=month'],
    ['GET', '/admin/fraud/alerts?page=1&limit=5'],
    ['GET', '/admin/system/health'],
    ['GET', '/admin/system/stats'],
    ['GET', '/admin/system/errors?page=1&limit=5'],
    ['GET', '/reports/admin/all?page=1&limit=5'],
    ['GET', '/api/reports/admin/all?page=1&limit=5'], // panelin kullandigi (muhtemel 404)
    ['GET', '/reports/admin/stats'],
  ];

  let userId = null;
  const results = [];
  for (const [method, path] of tests) {
    try {
      const r = await fetch(BASE + path, { method, headers: H });
      const text = await r.text();
      results.push(`${r.status === 200 ? 'OK ' : 'ERR'} ${r.status} ${method} ${path} :: ${text.slice(0, 120).replace(/\n/g, ' ')}`);
      if (path.startsWith('/admin/users?') && r.status === 200) {
        try {
          const j = JSON.parse(text);
          const users = j.users || j.items || j;
          if (Array.isArray(users) && users[0]) userId = users[0].id;
        } catch {}
      }
    } catch (e) {
      results.push(`ERR --- ${method} ${path} :: ${e.message}`);
    }
  }

  // Kullanici detayi
  if (userId) {
    const r = await fetch(`${BASE}/admin/users/${userId}`, { headers: H });
    const t = await r.text();
    results.push(`${r.status === 200 ? 'OK ' : 'ERR'} ${r.status} GET /admin/users/:id :: ${t.slice(0, 120).replace(/\n/g, ' ')}`);
  }

  console.log(results.join('\n'));
})().catch((e) => { console.error('HATA:', e.message); process.exit(3); });
