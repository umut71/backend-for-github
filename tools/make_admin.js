/**
 * Tek seferlik: prod DB'de super_admin rolünü (izinleriyle) garanti eder ve
 * hedef kullanıcıya atar. RENDER_API_KEY env'den okunur, hicbir sir dosyaya yazilmaz.
 * Kullanim: set RENDER_API_KEY=... && node tools/make_admin.js berkyurekumut@gmail.com
 */
const { PrismaClient } = require('../node_modules/.prisma/pg-client');

const KEY = process.env.RENDER_API_KEY;
const TARGET_EMAIL = process.argv[2] || 'berkyurekumut@gmail.com';
if (!KEY) { console.error('RENDER_API_KEY env eksik'); process.exit(1); }

const BASE = 'https://api.render.com/v1';
async function rapi(path) {
  const res = await fetch(BASE + path, { headers: { Authorization: `Bearer ${KEY}` } });
  const text = await res.text();
  let json; try { json = JSON.parse(text); } catch { json = text; }
  if (!res.ok) throw new Error(`Render API ${path} -> HTTP ${res.status}: ${JSON.stringify(json).slice(0, 200)}`);
  return json;
}

function maskUrl(u) {
  try { const x = new URL(u); return `${x.protocol}//${x.username}:***@${x.host}${x.pathname}`; }
  catch { return '(gizli)'; }
}

// seed.ts ile ayni izin listesi
const permissions = [
  { name: 'user.view', category: 'user', description: 'View users' },
  { name: 'user.edit', category: 'user', description: 'Edit user details' },
  { name: 'user.ban', category: 'user', description: 'Ban/unban users' },
  { name: 'user.delete', category: 'user', description: 'Delete users' },
  { name: 'user.manage', category: 'user', description: 'Full user management' },
  { name: 'video.view', category: 'video', description: 'View all videos' },
  { name: 'video.delete', category: 'video', description: 'Delete videos' },
  { name: 'video.moderate', category: 'video', description: 'Moderate videos' },
  { name: 'video.manage', category: 'video', description: 'Full video management' },
  { name: 'comment.view', category: 'content', description: 'View comments' },
  { name: 'comment.delete', category: 'content', description: 'Delete comments' },
  { name: 'comment.moderate', category: 'content', description: 'Moderate comments' },
  { name: 'finance.view', category: 'finance', description: 'View financial data' },
  { name: 'finance.approve', category: 'finance', description: 'Approve withdrawals' },
  { name: 'finance.reject', category: 'finance', description: 'Reject withdrawals' },
  { name: 'finance.reports', category: 'finance', description: 'Access financial reports' },
  { name: 'finance.manage', category: 'finance', description: 'Full finance management' },
  { name: 'admin.create', category: 'admin', description: 'Create new admins' },
  { name: 'admin.edit', category: 'admin', description: 'Edit admin details' },
  { name: 'admin.delete', category: 'admin', description: 'Delete admins' },
  { name: 'admin.roles', category: 'admin', description: 'Manage roles and permissions' },
  { name: 'admin.manage', category: 'admin', description: 'Full admin management' },
  { name: 'system.settings', category: 'system', description: 'Access system settings' },
  { name: 'system.logs', category: 'system', description: 'View system logs' },
  { name: 'system.backup', category: 'system', description: 'Manage backups' },
  { name: 'system.manage', category: 'system', description: 'Full system management' },
  { name: 'analytics.view', category: 'analytics', description: 'View analytics' },
  { name: 'analytics.reports', category: 'analytics', description: 'Access detailed reports' },
  { name: 'analytics.export', category: 'analytics', description: 'Export analytics data' },
  { name: 'support.view', category: 'support', description: 'View support tickets' },
  { name: 'support.respond', category: 'support', description: 'Respond to tickets' },
  { name: 'support.manage', category: 'support', description: 'Manage support system' },
];

async function getProdDbUrl() {
  // 1) Postgres servislerinden external connection string dene
  try {
    const pgs = await rapi('/postgres?limit=20');
    for (const item of pgs) {
      const p = item.postgres || item;
      try {
        const info = await rapi(`/postgres/${p.id}/connection-info`);
        const url = info.externalConnectionString || info.externalConnectionUrl;
        if (url) { console.log(`Postgres bulundu: ${p.name || p.id} -> ${maskUrl(url)}`); return url; }
      } catch (e) { console.log(`connection-info alinamadi (${p.id}): ${e.message}`); }
    }
  } catch (e) { console.log('Postgres listesi alinamadi:', e.message); }

  // 2) Web servisin env-vars'indan DATABASE_URL (external ise) dene
  const services = await rapi('/services?limit=20');
  for (const item of services) {
    const s = item.service || item;
    if (s.type !== 'web_service') continue;
    try {
      const envs = await rapi(`/services/${s.id}/env-vars?limit=100`);
      for (const ev of envs) {
        const e = ev.envVar || ev;
        if (e.key === 'DATABASE_URL' && /^postgres/.test(e.value || '')) {
          const host = new URL(e.value).hostname;
          if (host.includes('.')) { console.log(`Servis env'den DATABASE_URL: ${s.name} -> ${maskUrl(e.value)}`); return e.value; }
          console.log(`Servis ${s.name} DATABASE_URL internal (host=${host}), disaridan erisilemez.`);
        }
      }
    } catch (e2) { console.log(`env-vars alinamadi (${s.id}): ${e2.message}`); }
  }
  throw new Error('Prod DATABASE_URL bulunamadi');
}

(async () => {
  let dbUrl = await getProdDbUrl();
  if (!dbUrl.includes('sslmode=')) dbUrl += (dbUrl.includes('?') ? '&' : '?') + 'sslmode=require';

  const prisma = new PrismaClient({ datasources: { db: { url: dbUrl } } });
  try {
    // Izinleri garanti et
    for (const perm of permissions) {
      await prisma.permission.upsert({ where: { name: perm.name }, update: {}, create: perm });
    }
    console.log(`Izinler hazir (${permissions.length})`);

    // super_admin rolunu garanti et
    const role = await prisma.role.upsert({
      where: { name: 'super_admin' },
      update: {},
      create: { name: 'super_admin', displayname: 'Super Admin', description: 'Full system access - Owner' },
    });
    for (const perm of permissions) {
      const p = await prisma.permission.findUnique({ where: { name: perm.name } });
      await prisma.rolepermission.upsert({
        where: { roleid_permissionid: { roleid: role.id, permissionid: p.id } },
        update: {},
        create: { roleid: role.id, permissionid: p.id },
      });
    }
    console.log(`super_admin rolu hazir (id=${role.id})`);

    // Kullaniciya ata
    const user = await prisma.user.update({
      where: { email: TARGET_EMAIL },
      data: { roleid: role.id },
      select: { id: true, email: true, username: true, roleid: true },
    });
    console.log(`OK: ${user.email} (${user.username}, id=${user.id}) -> super_admin atandi`);
  } finally {
    await prisma.$disconnect();
  }
})().catch((e) => { console.error('HATA:', e.message); process.exit(2); });
