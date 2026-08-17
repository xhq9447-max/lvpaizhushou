import { Body, Controller, Get, Headers, Param, Patch, Post, Query } from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { Public } from '../common/decorators/public.decorator';
import { AuthUser } from '../common/types/auth-user';
import { clientOpenId } from '../common/utils/client-identity';
import { CreateOrderDto, CreateValueAddedDto, DisputeValueAddedDto, PublicCreateOrderDto, QueryOrdersDto, QueryStageDto, ReplaceServiceDto, StageDto, WechatContactDto } from './dto/order.dto';
import { OrdersService } from './orders.service';

@Controller('orders')
export class OrdersController {
  constructor(private readonly service: OrdersService) {}
  @RequirePermissions('order:view') @Get() findAll(@Query() query: QueryOrdersDto, @CurrentUser() user: AuthUser) { return this.service.findAll(query, user); }
  @RequirePermissions('order:view') @Get('eligible-employees') eligible(@Query() query: QueryStageDto, @CurrentUser() user: AuthUser) { return this.service.eligibleEmployees(query.stage, user); }
  @RequirePermissions('order:create') @Post() create(@Body() dto: CreateOrderDto, @CurrentUser() user: AuthUser) { return this.service.create(dto, user); }
  @RequirePermissions('order:update') @Patch(':id/confirm') confirm(@Param('id') id: string, @CurrentUser() user: AuthUser) { return this.service.confirmOrder(id, user); }
  @RequirePermissions('order:update') @Post(':id/claim') claim(@Param('id') id: string, @Body() dto: StageDto, @CurrentUser() user: AuthUser) { return this.service.claim(id, dto.stage, user); }
  @RequirePermissions('order:update') @Post(':id/start') start(@Param('id') id: string, @Body() dto: StageDto, @CurrentUser() user: AuthUser) { return this.service.start(id, dto.stage, user); }
  @RequirePermissions('order:update') @Post(':id/complete') complete(@Param('id') id: string, @Body() dto: StageDto, @CurrentUser() user: AuthUser) { return this.service.complete(id, dto.stage, user); }
  @RequirePermissions('order:update') @Post(':id/replace') replace(@Param('id') id: string, @Body() dto: ReplaceServiceDto, @CurrentUser() user: AuthUser) { return this.service.replace(id, dto, user); }
  @RequirePermissions('order:update') @Post(':id/value-added') addValueAdded(@Param('id') id: string, @Body() dto: CreateValueAddedDto, @CurrentUser() user: AuthUser) { return this.service.addValueAdded(id, dto, user); }
}

@Public()
@Controller('client')
export class ClientOrdersController {
  constructor(private readonly service: OrdersService) {}
  @Get('merchants/:merchantCode') merchant(@Param('merchantCode') merchantCode: string) { return this.service.publicMerchant(merchantCode); }
  @Get('me') me(@Headers() headers: Record<string, string | string[] | undefined>) { return this.service.clientProfile(clientOpenId(headers)); }
  @Post('contact') contact(@Body() dto: WechatContactDto) { return this.service.wechatContact(dto.phoneCode, dto.nickname); }
  @Get('orders') orders(@Headers() headers: Record<string, string | string[] | undefined>) { return this.service.clientOrders(clientOpenId(headers)); }
  @Post('orders') create(@Body() dto: PublicCreateOrderDto, @Headers() headers: Record<string, string | string[] | undefined>) { return this.service.publicCreate(dto, clientOpenId(headers)); }
  @Get('orders/:token') order(@Param('token') token: string, @Headers() headers: Record<string, string | string[] | undefined>) { return this.service.clientOrder(token, clientOpenId(headers)); }
  @Post('orders/:token/value-added/:id/confirm') confirm(@Param('token') token: string, @Param('id') id: string, @Headers() headers: Record<string, string | string[] | undefined>) { return this.service.clientConfirm(token, id, clientOpenId(headers)); }
  @Post('orders/:token/value-added/:id/dispute') dispute(@Param('token') token: string, @Param('id') id: string, @Body() dto: DisputeValueAddedDto, @Headers() headers: Record<string, string | string[] | undefined>) { return this.service.clientDispute(token, id, dto.reason, clientOpenId(headers)); }
  @Post('orders/:token/selection-confirm') confirmSelection(@Param('token') token: string, @Headers() headers: Record<string, string | string[] | undefined>) { return this.service.clientConfirmSelection(token, clientOpenId(headers)); }
}
