import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Query } from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { AuthUser } from '../common/types/auth-user';
import { QueryStoresDto } from './dto/query-stores.dto';
import { CreateStoreDto, UpdateStoreDto } from './dto/store.dto';
import { StoresService } from './stores.service';

@Controller('stores')
export class StoresController {
  constructor(private readonly service: StoresService) {}
  @RequirePermissions('store:view') @Get() findAll(@Query() query: QueryStoresDto) { return this.service.findAll(query); }
  @RequirePermissions('store:create') @Post() create(@Body() dto: CreateStoreDto, @CurrentUser() user: AuthUser) { return this.service.create(dto, user); }
  @RequirePermissions('store:view') @Get(':id') findOne(@Param('id') id: string) { return this.service.findOne(id); }
  @RequirePermissions('store:update') @Patch(':id') update(@Param('id') id: string, @Body() dto: UpdateStoreDto, @CurrentUser() user: AuthUser) { return this.service.update(id, dto, user); }
  @RequirePermissions('store:delete') @Delete(':id') @HttpCode(204) remove(@Param('id') id: string, @CurrentUser() user: AuthUser) { return this.service.remove(id, user); }
}
