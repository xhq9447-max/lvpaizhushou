import { EmployeeStatus, Plan, PrismaClient, RoleCode, StoreStatus } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

const permissions = [
  ['store:view', '查看门店'], ['store:create', '新增门店'], ['store:update', '修改门店'], ['store:delete', '删除门店'],
  ['employee:view', '查看员工'], ['employee:create', '新增员工'], ['employee:update', '修改员工'], ['employee:delete', '删除员工'],
  ['order:view', '查看订单'], ['order:create', '新增订单'], ['order:update', '修改订单'],
  ['customer:view', '查看客户'], ['customer:create', '新增客户'], ['finance:view', '查看财务'],
  ['file:view', '查看文件'], ['file:upload', '上传文件'],
] as const;

const roleNames: Record<RoleCode, string> = {
  SUPER_ADMIN: '平台超级管理员', OWNER: '商家老板', MANAGER: '店长', RECEPTION: '前台', SALES: '销售',
  MAKEUP: '化妆师', PHOTOGRAPHER: '摄影师', RETOUCHER: '修图师',
};

async function main(): Promise<void> {
  const adminPassword = process.env.SEED_ADMIN_PASSWORD;
  const ownerPassword = process.env.SEED_OWNER_PASSWORD;
  const staffPassword = process.env.SEED_STAFF_PASSWORD ?? ownerPassword;
  if (!adminPassword || !ownerPassword || !staffPassword) throw new Error('请设置 SEED_ADMIN_PASSWORD、SEED_OWNER_PASSWORD 和 SEED_STAFF_PASSWORD');

  for (const [code, name] of permissions) await prisma.permission.upsert({ where: { code }, update: { name }, create: { code, name } });
  for (const code of Object.values(RoleCode)) {
    let role = await prisma.role.findFirst({ where: { merchantId: null, code } });
    role ??= await prisma.role.create({ data: { code, name: roleNames[code], description: '系统预置角色' } });
    const allowed = code === RoleCode.MANAGER
      ? permissions.filter(([permission]) => !permission.startsWith('finance:'))
      : code === RoleCode.RECEPTION
        ? permissions.filter(([permission]) => ['store:view', 'employee:view', 'order:view', 'order:create', 'order:update', 'customer:view', 'customer:create', 'file:view', 'file:upload'].includes(permission))
        : code === RoleCode.MAKEUP || code === RoleCode.PHOTOGRAPHER
          ? permissions.filter(([permission]) => ['store:view', 'employee:view', 'order:view', 'order:update', 'file:view', 'file:upload'].includes(permission))
          : code === RoleCode.RETOUCHER
            ? permissions.filter(([permission]) => ['store:view', 'employee:view', 'order:view', 'file:view', 'file:upload'].includes(permission))
            : permissions.filter(([permission]) => ['store:view', 'employee:view'].includes(permission));
    for (const [permissionCode] of allowed) {
      const permission = await prisma.permission.findUniqueOrThrow({ where: { code: permissionCode } });
      await prisma.rolePermission.upsert({ where: { roleId_permissionId: { roleId: role.id, permissionId: permission.id } }, update: {}, create: { roleId: role.id, permissionId: permission.id } });
    }
  }

  await prisma.user.upsert({
    where: { username: 'admin' },
    update: { passwordHash: await argon2.hash(adminPassword), role: RoleCode.SUPER_ADMIN },
    create: { username: 'admin', passwordHash: await argon2.hash(adminPassword), role: RoleCode.SUPER_ADMIN },
  });

  const merchant = await prisma.merchant.upsert({
    where: { merchantCode: 'CYXY' },
    update: { name: '草原印象旅拍' },
    create: { name: '草原印象旅拍', merchantCode: 'CYXY', contactName: '测试负责人', contactPhone: '13800000000', plan: Plan.PROFESSIONAL, expireAt: new Date('2027-12-31') },
  });
  const store = (await prisma.store.findFirst({ where: { merchantId: merchant.id, name: '大召店' } })) ?? await prisma.store.create({ data: { merchantId: merchant.id, name: '大召店', address: '呼和浩特市玉泉区大召附近', contactPhone: '13800000000', status: StoreStatus.ACTIVE } });
  const owner = await prisma.user.upsert({
    where: { username: 'owner' },
    update: { merchantId: merchant.id, passwordHash: await argon2.hash(ownerPassword), role: RoleCode.OWNER },
    create: { merchantId: merchant.id, username: 'owner', phone: '13800000001', passwordHash: await argon2.hash(ownerPassword), role: RoleCode.OWNER },
  });
  const ownerEmployee = await prisma.employee.findUnique({ where: { userId: owner.id } });
  if (!ownerEmployee) await prisma.employee.create({ data: { merchantId: merchant.id, storeId: store.id, userId: owner.id, name: '测试老板', phone: '13800000001', role: RoleCode.OWNER, status: EmployeeStatus.ACTIVE } });

  const seedEmployees = [
    { name: '摄影师小林', phone: '13800000002', role: RoleCode.PHOTOGRAPHER },
    { name: '化妆师小美', phone: '13800000003', role: RoleCode.MAKEUP },
    { name: '化妆师小雅', phone: '13800000005', role: RoleCode.MAKEUP },
    { name: '修图师小周', phone: '13800000004', role: RoleCode.RETOUCHER },
  ];
  for (const employee of seedEmployees) {
    const record = await prisma.employee.upsert({
      where: { merchantId_phone: { merchantId: merchant.id, phone: employee.phone } },
      update: { name: employee.name, role: employee.role, storeId: store.id },
      create: { ...employee, merchantId: merchant.id, storeId: store.id, joinDate: new Date(), status: EmployeeStatus.ACTIVE },
    });
    if (employee.phone === '13800000003' || employee.role === RoleCode.PHOTOGRAPHER) {
      const username = employee.role === RoleCode.MAKEUP ? 'makeup' : 'photographer';
      const account = await prisma.user.upsert({
        where: { username },
        update: { merchantId: merchant.id, phone: employee.phone, passwordHash: await argon2.hash(staffPassword), role: employee.role },
        create: { merchantId: merchant.id, username, phone: employee.phone, passwordHash: await argon2.hash(staffPassword), role: employee.role },
      });
      await prisma.employee.update({ where: { id: record.id }, data: { userId: account.id } });
    }
  }
}

void main().finally(() => prisma.$disconnect());
