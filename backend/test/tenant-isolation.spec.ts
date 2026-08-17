import { RoleCode } from '@prisma/client';
import { TenantPrismaService } from '../src/prisma/tenant-prisma.service';
import { PrismaService } from '../src/prisma/prisma.service';

describe('多租户查询边界', () => {
  const storeFindFirst = jest.fn();
  const storeUpdateMany = jest.fn();
  const employeeFindFirst = jest.fn();
  const employeeUpdateMany = jest.fn();
  const prisma = {
    store: { findFirst: storeFindFirst, updateMany: storeUpdateMany },
    employee: { findFirst: employeeFindFirst, updateMany: employeeUpdateMany },
  } as unknown as PrismaService;
  const request = { user: { userId: 'user-a', merchantId: 'merchant-a', username: 'owner-a', role: RoleCode.OWNER } };
  const tenant = new TenantPrismaService(prisma, request as never);

  beforeEach(() => jest.clearAllMocks());

  it('查询门店时强制追加当前 merchantId', async () => {
    storeFindFirst.mockResolvedValue(null);
    await tenant.stores.findById('store-b');
    expect(storeFindFirst).toHaveBeenCalledWith({ where: { id: 'store-b', merchantId: 'merchant-a', deletedAt: null } });
  });

  it('修改和删除 B 商家门店时仍限制为 A 商家', async () => {
    storeUpdateMany.mockResolvedValue({ count: 0 });
    await tenant.stores.update('store-b', { name: '越权修改' });
    await tenant.stores.softDelete('store-b');
    expect(storeUpdateMany.mock.calls[0][0].where).toMatchObject({ id: 'store-b', merchantId: 'merchant-a' });
    expect(storeUpdateMany.mock.calls[1][0].where).toMatchObject({ id: 'store-b', merchantId: 'merchant-a' });
  });

  it('查询、修改和删除 B 商家员工时强制限制为 A 商家', async () => {
    employeeFindFirst.mockResolvedValue(null);
    employeeUpdateMany.mockResolvedValue({ count: 0 });
    await tenant.employees.findById('employee-b');
    await tenant.employees.update('employee-b', { name: '越权修改' });
    await tenant.employees.softDelete('employee-b');
    expect(employeeFindFirst.mock.calls[0][0].where).toMatchObject({ id: 'employee-b', merchantId: 'merchant-a' });
    expect(employeeUpdateMany.mock.calls[0][0].where).toMatchObject({ id: 'employee-b', merchantId: 'merchant-a' });
    expect(employeeUpdateMany.mock.calls[1][0].where).toMatchObject({ id: 'employee-b', merchantId: 'merchant-a' });
  });
});
