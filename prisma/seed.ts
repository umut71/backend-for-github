import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Tüm İzinler
const permissions = [
  // USER Management
  { name: 'user.view', category: 'user', description: 'View users' },
  { name: 'user.edit', category: 'user', description: 'Edit user details' },
  { name: 'user.ban', category: 'user', description: 'Ban/unban users' },
  { name: 'user.delete', category: 'user', description: 'Delete users' },
  { name: 'user.manage', category: 'user', description: 'Full user management' },
  
  // VIDEO Management
  { name: 'video.view', category: 'video', description: 'View all videos' },
  { name: 'video.delete', category: 'video', description: 'Delete videos' },
  { name: 'video.moderate', category: 'video', description: 'Moderate videos' },
  { name: 'video.manage', category: 'video', description: 'Full video management' },
  
  // COMMENT Management
  { name: 'comment.view', category: 'content', description: 'View comments' },
  { name: 'comment.delete', category: 'content', description: 'Delete comments' },
  { name: 'comment.moderate', category: 'content', description: 'Moderate comments' },
  
  // FINANCE
  { name: 'finance.view', category: 'finance', description: 'View financial data' },
  { name: 'finance.approve', category: 'finance', description: 'Approve withdrawals' },
  { name: 'finance.reject', category: 'finance', description: 'Reject withdrawals' },
  { name: 'finance.reports', category: 'finance', description: 'Access financial reports' },
  { name: 'finance.manage', category: 'finance', description: 'Full finance management' },
  
  // ADMIN Management
  { name: 'admin.create', category: 'admin', description: 'Create new admins' },
  { name: 'admin.edit', category: 'admin', description: 'Edit admin details' },
  { name: 'admin.delete', category: 'admin', description: 'Delete admins' },
  { name: 'admin.roles', category: 'admin', description: 'Manage roles and permissions' },
  { name: 'admin.manage', category: 'admin', description: 'Full admin management' },
  
  // SYSTEM
  { name: 'system.settings', category: 'system', description: 'Access system settings' },
  { name: 'system.logs', category: 'system', description: 'View system logs' },
  { name: 'system.backup', category: 'system', description: 'Manage backups' },
  { name: 'system.manage', category: 'system', description: 'Full system management' },
  
  // ANALYTICS
  { name: 'analytics.view', category: 'analytics', description: 'View analytics' },
  { name: 'analytics.reports', category: 'analytics', description: 'Access detailed reports' },
  { name: 'analytics.export', category: 'analytics', description: 'Export analytics data' },
  
  // SUPPORT
  { name: 'support.view', category: 'support', description: 'View support tickets' },
  { name: 'support.respond', category: 'support', description: 'Respond to tickets' },
  { name: 'support.manage', category: 'support', description: 'Manage support system' },
];

// Roller ve İzin Mapping
const roles = [
  {
    name: 'super_admin',
    displayname: 'Super Admin',
    description: 'Full system access - Owner',
    permissions: permissions.map(p => p.name), // TÜM İZİNLER
  },
  {
    name: 'admin',
    displayname: 'Administrator',
    description: 'General admin access',
    permissions: [
      'user.view', 'user.edit', 'user.ban', 'user.manage',
      'video.view', 'video.delete', 'video.moderate', 'video.manage',
      'comment.view', 'comment.delete', 'comment.moderate',
      'finance.view',
      'analytics.view', 'analytics.reports',
    ],
  },
  {
    name: 'content_moderator',
    displayname: 'Content Moderator',
    description: 'Video and content moderation',
    permissions: [
      'video.view', 'video.delete', 'video.moderate',
      'comment.view', 'comment.delete', 'comment.moderate',
      'user.view',
    ],
  },
  {
    name: 'finance_manager',
    displayname: 'Finance Manager',
    description: 'Financial operations and reporting',
    permissions: [
      'finance.view', 'finance.approve', 'finance.reject', 'finance.reports', 'finance.manage',
      'analytics.view', 'analytics.reports', 'analytics.export',
      'user.view',
    ],
  },
  {
    name: 'ban_manager',
    displayname: 'Ban Manager',
    description: 'User moderation and banning',
    permissions: [
      'user.view', 'user.ban', 'user.manage',
      'video.view',
      'comment.view',
    ],
  },
  {
    name: 'analytics_manager',
    displayname: 'Analytics Manager',
    description: 'Analytics and reporting (read-only)',
    permissions: [
      'analytics.view', 'analytics.reports', 'analytics.export',
      'user.view',
      'video.view',
      'finance.view',
    ],
  },
  {
    name: 'support_agent',
    displayname: 'Support Agent',
    description: 'Customer support and basic operations',
    permissions: [
      'support.view', 'support.respond', 'support.manage',
      'user.view',
      'video.view',
      'comment.view',
    ],
  },
];

async function main() {
  console.log('🌱 Starting seed...');

  // İzinleri oluştur
  console.log('📝 Creating permissions...');
  for (const perm of permissions) {
    await prisma.permission.upsert({
      where: { name: perm.name },
      update: {},
      create: perm,
    });
  }
  console.log(`✅ Created ${permissions.length} permissions`);

  // Rolleri ve izinleri oluştur
  console.log('👥 Creating roles...');
  for (const roleData of roles) {
    const role = await prisma.role.upsert({
      where: { name: roleData.name },
      update: {
        displayname: roleData.displayname,
        description: roleData.description,
      },
      create: {
        name: roleData.name,
        displayname: roleData.displayname,
        description: roleData.description,
      },
    });

    // İzinleri role'e ekle
    for (const permName of roleData.permissions) {
      const permission = await prisma.permission.findUnique({
        where: { name: permName },
      });

      if (permission) {
        await prisma.rolepermission.upsert({
          where: {
            roleid_permissionid: {
              roleid: role.id,
              permissionid: permission.id,
            },
          },
          update: {},
          create: {
            roleid: role.id,
            permissionid: permission.id,
          },
        });
      }
    }
    console.log(`✅ Created role: ${roleData.displayname} with ${roleData.permissions.length} permissions`);
  }

  // Super Admin rolünü al
  const superAdminRole = await prisma.role.findUnique({
    where: { name: 'super_admin' },
  });

  // Test hesabını Super Admin yap
  const testUser = await prisma.user.findUnique({
    where: { email: 'john@doe.com' },
  });

  if (testUser && superAdminRole) {
    await prisma.user.update({
      where: { id: testUser.id },
      data: { roleid: superAdminRole.id },
    });
    console.log('👑 Test user (john@doe.com) set as Super Admin');
  }

  console.log('🎉 Seed completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
