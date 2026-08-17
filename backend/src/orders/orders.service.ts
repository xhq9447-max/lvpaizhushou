import { BadRequestException, ForbiddenException, Injectable, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EmployeeStatus, OrderStatus, Prisma, RoleCode, ServiceRecordStatus, ServiceStage, ValueAddedStatus } from '@prisma/client';
import { randomBytes } from 'crypto';
import { AuthUser } from '../common/types/auth-user';
import { OperationLogsService } from '../operation-logs/operation-logs.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto, CreateValueAddedDto, PublicCreateOrderDto, QueryOrdersDto, ReplaceServiceDto } from './dto/order.dto';

const orderInclude = {
  customer: true,
  store: true,
  merchant: { select: { name: true, logo: true, contactPhone: true } },
  serviceRecords: { orderBy: { createdAt: 'asc' as const }, include: { employee: true } },
  valueAddedServices: { orderBy: { createdAt: 'desc' as const }, include: { employee: true } },
};

@Injectable()
export class OrdersService {
  private wechatAccessToken?: { value: string; expiresAt: number };

  constructor(private readonly prisma: PrismaService, private readonly logs: OperationLogsService, private readonly config: ConfigService) {}

  async findAll(query: QueryOrdersDto, user: AuthUser) {
    const employee = await this.employeeForUser(user);
    const where: Prisma.OrderWhereInput = {
      merchantId: this.merchantId(user), status: query.status, storeId: query.storeId,
      OR: query.keyword ? [
        { orderNo: { contains: query.keyword } },
        { customer: { name: { contains: query.keyword } } },
        { customer: { phone: { contains: query.keyword } } },
      ] : undefined,
    };
    if (employee && (employee.role === RoleCode.MAKEUP || employee.role === RoleCode.PHOTOGRAPHER)) {
      const stage = employee.role === RoleCode.MAKEUP ? ServiceStage.MAKEUP : ServiceStage.PHOTOGRAPHY;
      where.AND = [{ OR: [
        { serviceRecords: { some: { employeeId: employee.id, stage } } },
        { status: stage === ServiceStage.MAKEUP ? OrderStatus.WAITING_MAKEUP : OrderStatus.WAITING_PHOTOGRAPHY },
      ] }];
    }
    const [items, total] = await Promise.all([
      this.prisma.order.findMany({ where, include: orderInclude, orderBy: { createdAt: 'desc' }, skip: (query.page - 1) * query.pageSize, take: query.pageSize }),
      this.prisma.order.count({ where }),
    ]);
    return { items, total, page: query.page, pageSize: query.pageSize };
  }

  async eligibleEmployees(stage: ServiceStage, user: AuthUser) {
    const role = this.stageRole(stage);
    return this.prisma.employee.findMany({
      where: { merchantId: this.merchantId(user), role, status: EmployeeStatus.ACTIVE, deletedAt: null },
      select: { id: true, name: true, phone: true, storeId: true, role: true }, orderBy: { name: 'asc' },
    });
  }

  async create(dto: CreateOrderDto, user: AuthUser) {
    const merchantId = this.merchantId(user);
    const order = await this.createForMerchant(merchantId, dto);
    await this.logs.record(user, 'CREATE', 'order', order.id, { orderNo: order.orderNo });
    return order;
  }

  async publicMerchant(merchantCode: string) {
    const merchant = await this.prisma.merchant.findUnique({ where: { merchantCode }, select: { id: true, name: true, status: true } });
    if (!merchant || merchant.status !== 'ACTIVE') throw new NotFoundException('商家不存在或暂不可用');
    const stores = await this.prisma.store.findMany({ where: { merchantId: merchant.id, status: 'ACTIVE', deletedAt: null }, select: { id: true, name: true, address: true } });
    return { name: merchant.name, merchantCode, stores };
  }

  async publicCreate(dto: PublicCreateOrderDto, openId: string) {
    const merchant = await this.prisma.merchant.findUnique({ where: { merchantCode: dto.merchantCode } });
    if (!merchant || merchant.status !== 'ACTIVE') throw new NotFoundException('商家不存在或暂不可用');
    const { merchantCode: _merchantCode, ...orderDto } = dto;
    void _merchantCode;
    return this.createForMerchant(merchant.id, orderDto, openId);
  }

  async confirmOrder(id: string, user: AuthUser) {
    const order = await this.orderForTenant(id, user);
    if (order.status !== OrderStatus.PENDING_CONFIRMATION) throw new BadRequestException('只有待门店确认的订单可以确认');
    const updated = await this.prisma.order.update({ where: { id }, data: { status: OrderStatus.WAITING_MAKEUP, confirmedAt: new Date() }, include: orderInclude });
    await this.logs.record(user, 'CONFIRM', 'order', id);
    return updated;
  }

  async claim(id: string, stage: ServiceStage, user: AuthUser) {
    const order = await this.orderForTenant(id, user);
    const employee = await this.requireStageEmployee(user, stage);
    const expected = stage === ServiceStage.MAKEUP ? OrderStatus.WAITING_MAKEUP : OrderStatus.WAITING_PHOTOGRAPHY;
    if (order.status !== expected) throw new BadRequestException(stage === ServiceStage.MAKEUP ? '当前订单尚未进入化妆认领阶段' : '化妆完成后才能认领摄影服务');
    if (await this.prisma.serviceRecord.findFirst({ where: { orderId: id, stage, isCurrent: true } })) throw new BadRequestException('该阶段已被其他员工认领');
    const record = await this.prisma.serviceRecord.create({ data: { merchantId: order.merchantId, orderId: id, employeeId: employee.id, stage } });
    await this.logs.record(user, 'CLAIM', 'order_service', record.id, { orderId: id, stage });
    return this.orderForTenant(id, user);
  }

  async start(id: string, stage: ServiceStage, user: AuthUser) {
    const order = await this.orderForTenant(id, user);
    const record = await this.currentRecord(id, stage);
    await this.ensureCanOperate(record.employeeId, user);
    if (record.status !== ServiceRecordStatus.CLAIMED) throw new BadRequestException('服务已经开始或结束');
    const expected = stage === ServiceStage.MAKEUP ? OrderStatus.WAITING_MAKEUP : OrderStatus.WAITING_PHOTOGRAPHY;
    if (order.status !== expected) throw new BadRequestException('订单当前状态不能开始该服务');
    await this.prisma.$transaction([
      this.prisma.serviceRecord.update({ where: { id: record.id }, data: { status: ServiceRecordStatus.IN_PROGRESS, startedAt: new Date() } }),
      this.prisma.order.update({ where: { id }, data: { status: stage === ServiceStage.MAKEUP ? OrderStatus.MAKEUP_IN_PROGRESS : OrderStatus.PHOTOGRAPHY_IN_PROGRESS } }),
    ]);
    await this.logs.record(user, 'START', 'order_service', record.id, { orderId: id, stage });
    return this.orderForTenant(id, user);
  }

  async complete(id: string, stage: ServiceStage, user: AuthUser) {
    const order = await this.orderForTenant(id, user);
    const record = await this.currentRecord(id, stage);
    await this.ensureCanOperate(record.employeeId, user);
    if (record.status !== ServiceRecordStatus.IN_PROGRESS) throw new BadRequestException('请先开始服务');
    const expected = stage === ServiceStage.MAKEUP ? OrderStatus.MAKEUP_IN_PROGRESS : OrderStatus.PHOTOGRAPHY_IN_PROGRESS;
    if (order.status !== expected) throw new BadRequestException('订单当前状态不能完成该服务');
    const next = stage === ServiceStage.MAKEUP ? OrderStatus.WAITING_PHOTOGRAPHY : OrderStatus.WAITING_SELECTION;
    await this.prisma.$transaction([
      this.prisma.serviceRecord.update({ where: { id: record.id }, data: { status: ServiceRecordStatus.COMPLETED, completedAt: new Date() } }),
      this.prisma.order.update({ where: { id }, data: { status: next } }),
    ]);
    await this.logs.record(user, 'COMPLETE', 'order_service', record.id, { orderId: id, stage });
    return this.orderForTenant(id, user);
  }

  async replace(id: string, dto: ReplaceServiceDto, user: AuthUser) {
    const order = await this.orderForTenant(id, user);
    const current = await this.currentRecord(id, dto.stage);
    await this.ensureCanOperate(current.employeeId, user);
    if (current.status === ServiceRecordStatus.COMPLETED) throw new BadRequestException('已完成的服务不能换人');
    const replacement = await this.prisma.employee.findFirst({ where: { id: dto.newEmployeeId, merchantId: order.merchantId, role: this.stageRole(dto.stage), status: EmployeeStatus.ACTIVE, deletedAt: null } });
    if (!replacement) throw new BadRequestException('接替员工不存在、已停用或岗位不匹配');
    if (replacement.id === current.employeeId) throw new BadRequestException('接替员工不能与当前员工相同');
    const now = new Date();
    await this.prisma.$transaction([
      this.prisma.serviceRecord.update({ where: { id: current.id }, data: { status: ServiceRecordStatus.REPLACED, isCurrent: false, replacedAt: now, replacementReason: dto.reason } }),
      this.prisma.serviceRecord.create({ data: {
        merchantId: order.merchantId, orderId: id, employeeId: replacement.id, stage: dto.stage,
        status: current.status === ServiceRecordStatus.IN_PROGRESS ? ServiceRecordStatus.IN_PROGRESS : ServiceRecordStatus.CLAIMED,
        startedAt: current.status === ServiceRecordStatus.IN_PROGRESS ? now : null, previousRecordId: current.id,
      } }),
    ]);
    await this.logs.record(user, 'REPLACE', 'order_service', current.id, { orderId: id, stage: dto.stage, newEmployeeId: replacement.id, reason: dto.reason });
    return this.orderForTenant(id, user);
  }

  async addValueAdded(id: string, dto: CreateValueAddedDto, user: AuthUser) {
    const order = await this.orderForTenant(id, user);
    const record = await this.currentRecord(id, dto.stage);
    await this.ensureCanOperate(record.employeeId, user);
    if (record.status !== ServiceRecordStatus.CLAIMED && record.status !== ServiceRecordStatus.IN_PROGRESS) throw new BadRequestException('当前服务阶段不能添加增值服务');
    const total = new Prisma.Decimal(dto.unitAmount).mul(dto.quantity);
    const item = await this.prisma.valueAddedService.create({ data: {
      merchantId: order.merchantId, orderId: id, serviceRecordId: record.id, employeeId: record.employeeId, stage: dto.stage,
      name: dto.name, quantity: dto.quantity, unitAmount: dto.unitAmount, totalAmount: total, description: dto.description,
    }, include: { employee: true } });
    await this.logs.record(user, 'CREATE', 'value_added_service', item.id, { orderId: id, name: item.name, totalAmount: item.totalAmount.toString() });
    return item;
  }

  async clientProfile(openId: string) {
    const customers = await this.prisma.customer.findMany({
      where: { wechatOpenid: openId },
      select: { name: true, phone: true, updatedAt: true },
      orderBy: { updatedAt: 'desc' },
    });
    const orderCount = await this.prisma.order.count({ where: { customer: { wechatOpenid: openId } } });
    return { name: customers[0]?.name ?? '', phone: customers[0]?.phone ?? '', orderCount };
  }

  async wechatContact(phoneCode: string, nickname?: string) {
    const accessToken = await this.getWechatAccessToken();
    const response = await fetch(`https://api.weixin.qq.com/wxa/business/getuserphonenumber?access_token=${encodeURIComponent(accessToken)}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ code: phoneCode }),
    });
    const result = await response.json() as { errcode?: number; errmsg?: string; phone_info?: { purePhoneNumber?: string } };
    const phone = result.phone_info?.purePhoneNumber;
    if (!response.ok || result.errcode || !phone || !/^1[3-9]\d{9}$/.test(phone)) {
      throw new BadRequestException('微信手机号授权失败，请重新授权');
    }
    return { name: nickname?.trim() || '微信用户', phone };
  }

  async clientOrders(openId: string) {
    return this.prisma.order.findMany({
      where: { customer: { wechatOpenid: openId } },
      include: { customer: true, store: true, merchant: { select: { name: true, logo: true } } },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  async clientOrder(token: string, openId: string) {
    const order = await this.prisma.order.findUnique({ where: { accessToken: token }, include: orderInclude });
    if (!order) throw new NotFoundException('订单不存在或无权访问');
    if (!order.customer.wechatOpenid) {
      const bound = await this.prisma.customer.findUnique({ where: { merchantId_wechatOpenid: { merchantId: order.merchantId, wechatOpenid: openId } } });
      if (bound && bound.id !== order.customerId) throw new NotFoundException('订单不存在或无权访问');
      order.customer = await this.prisma.customer.update({ where: { id: order.customerId }, data: { wechatOpenid: openId } });
    }
    if (order.customer.wechatOpenid !== openId) throw new NotFoundException('订单不存在或无权访问');
    return order;
  }

  async clientConfirm(token: string, itemId: string, openId: string) {
    const order = await this.clientOrder(token, openId);
    const result = await this.prisma.valueAddedService.updateMany({ where: { id: itemId, orderId: order.id, status: { in: [ValueAddedStatus.PENDING, ValueAddedStatus.DISPUTED] } }, data: { status: ValueAddedStatus.CONFIRMED, confirmedAt: new Date(), disputedAt: null, customerNote: null } });
    if (!result.count) throw new BadRequestException('该增值服务已处理或不存在');
    return this.clientOrder(token, openId);
  }

  async clientDispute(token: string, itemId: string, reason: string, openId: string) {
    const order = await this.clientOrder(token, openId);
    const result = await this.prisma.valueAddedService.updateMany({ where: { id: itemId, orderId: order.id, status: ValueAddedStatus.PENDING }, data: { status: ValueAddedStatus.DISPUTED, disputedAt: new Date(), customerNote: reason } });
    if (!result.count) throw new BadRequestException('该增值服务已处理或不存在');
    return this.clientOrder(token, openId);
  }

  async clientConfirmSelection(token: string, openId: string) {
    const order = await this.clientOrder(token, openId);
    if (order.status !== OrderStatus.WAITING_SELECTION) throw new BadRequestException('订单当前不在待选片阶段');
    return this.prisma.order.update({
      where: { id: order.id },
      data: { status: OrderStatus.WAITING_RETOUCH, selectionConfirmedAt: new Date() },
      include: orderInclude,
    });
  }

  private async createForMerchant(merchantId: string, dto: CreateOrderDto, openId?: string) {
    const store = await this.prisma.store.findFirst({ where: { id: dto.storeId, merchantId, status: 'ACTIVE', deletedAt: null } });
    if (!store) throw new BadRequestException('门店不存在或不可用');
    let customer = await this.prisma.customer.findUnique({ where: { merchantId_phone: { merchantId, phone: dto.customerPhone } } });
    if (customer?.wechatOpenid && openId && customer.wechatOpenid !== openId) throw new BadRequestException('该手机号已绑定其他微信');
    if (!customer && openId) {
      const bound = await this.prisma.customer.findUnique({ where: { merchantId_wechatOpenid: { merchantId, wechatOpenid: openId } } });
      if (bound) throw new BadRequestException('当前微信已绑定其他手机号');
    }
    customer = customer
      ? await this.prisma.customer.update({ where: { id: customer.id }, data: { name: dto.customerName, wechatOpenid: openId ?? customer.wechatOpenid } })
      : await this.prisma.customer.create({ data: { merchantId, name: dto.customerName, phone: dto.customerPhone, wechatOpenid: openId } });
    return this.prisma.order.create({ data: {
      merchantId, storeId: dto.storeId, customerId: customer.id, orderNo: this.orderNo(), accessToken: randomBytes(24).toString('hex'),
      packageName: dto.packageName, appointmentAt: dto.appointmentAt ? new Date(dto.appointmentAt) : undefined, notes: dto.notes,
    }, include: orderInclude });
  }

  private async orderForTenant(id: string, user: AuthUser) {
    const order = await this.prisma.order.findFirst({ where: { id, merchantId: this.merchantId(user) }, include: orderInclude });
    if (!order) throw new NotFoundException('订单不存在');
    return order;
  }

  private async currentRecord(orderId: string, stage: ServiceStage) {
    const record = await this.prisma.serviceRecord.findFirst({ where: { orderId, stage, isCurrent: true } });
    if (!record) throw new BadRequestException('该服务阶段尚未认领');
    return record;
  }

  private async requireStageEmployee(user: AuthUser, stage: ServiceStage) {
    const employee = await this.employeeForUser(user);
    if (!employee || employee.role !== this.stageRole(stage) || employee.status !== EmployeeStatus.ACTIVE) throw new ForbiddenException('只有对应岗位的在职员工可以认领');
    return employee;
  }

  private async employeeForUser(user: AuthUser) {
    return this.prisma.employee.findFirst({ where: { userId: user.userId, merchantId: user.merchantId ?? undefined, deletedAt: null } });
  }

  private async ensureCanOperate(employeeId: string, user: AuthUser) {
    if (user.role === RoleCode.OWNER || user.role === RoleCode.MANAGER) return;
    const employee = await this.employeeForUser(user);
    if (!employee || employee.id !== employeeId) throw new ForbiddenException('只能操作自己认领的服务');
  }

  private merchantId(user: AuthUser) {
    if (!user.merchantId) throw new ForbiddenException('缺少商户身份');
    return user.merchantId;
  }

  private stageRole(stage: ServiceStage) { return stage === ServiceStage.MAKEUP ? RoleCode.MAKEUP : RoleCode.PHOTOGRAPHER; }
  private async getWechatAccessToken() {
    if (this.wechatAccessToken && this.wechatAccessToken.expiresAt > Date.now()) return this.wechatAccessToken.value;
    const appId = this.config.get<string>('WECHAT_APP_ID');
    const appSecret = this.config.get<string>('WECHAT_APP_SECRET');
    if (!appId || !appSecret) throw new ServiceUnavailableException('微信联系人授权尚未配置完成');
    const response = await fetch(`https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${encodeURIComponent(appId)}&secret=${encodeURIComponent(appSecret)}`);
    const result = await response.json() as { access_token?: string; expires_in?: number; errcode?: number };
    if (!response.ok || result.errcode || !result.access_token) throw new ServiceUnavailableException('微信授权服务暂时不可用');
    this.wechatAccessToken = { value: result.access_token, expiresAt: Date.now() + Math.max(60, (result.expires_in || 7200) - 300) * 1000 };
    return result.access_token;
  }
  private orderNo() { const now = new Date(); return `TP${now.toISOString().slice(0, 10).replaceAll('-', '')}${randomBytes(4).toString('hex').toUpperCase()}`; }
}
