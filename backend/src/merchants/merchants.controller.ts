import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { RoleCode } from '@prisma/client';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { PlatformEndpoint } from '../common/decorators/platform.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { AuthUser } from '../common/types/auth-user';
import { CreateMerchantDto } from './dto/create-merchant.dto';
import { QueryMerchantsDto } from './dto/query-merchants.dto';
import { UpdateMerchantDto } from './dto/update-merchant.dto';
import { MerchantsService } from './merchants.service';

@PlatformEndpoint() @Roles(RoleCode.SUPER_ADMIN) @Controller('merchants')
export class MerchantsController {
  constructor(private readonly service: MerchantsService) {}
  @Get() findAll(@Query() query: QueryMerchantsDto) { return this.service.findAll(query); }
  @Post() create(@Body() dto: CreateMerchantDto, @CurrentUser() user: AuthUser) { return this.service.create(dto, user); }
  @Get(':id') findOne(@Param('id') id: string) { return this.service.findOne(id); }
  @Patch(':id') update(@Param('id') id: string, @Body() dto: UpdateMerchantDto, @CurrentUser() user: AuthUser) { return this.service.update(id, dto, user); }
}
