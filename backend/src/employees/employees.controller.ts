import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Query } from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { AuthUser } from '../common/types/auth-user';
import { CreateEmployeeDto, UpdateEmployeeDto } from './dto/employee.dto';
import { QueryEmployeesDto } from './dto/query-employees.dto';
import { EmployeesService } from './employees.service';

@Controller('employees')
export class EmployeesController {
  constructor(private readonly service: EmployeesService) {}
  @RequirePermissions('employee:view') @Get() findAll(@Query() query: QueryEmployeesDto) { return this.service.findAll(query); }
  @RequirePermissions('employee:create') @Post() create(@Body() dto: CreateEmployeeDto, @CurrentUser() user: AuthUser) { return this.service.create(dto, user); }
  @RequirePermissions('employee:view') @Get(':id') findOne(@Param('id') id: string) { return this.service.findOne(id); }
  @RequirePermissions('employee:update') @Patch(':id') update(@Param('id') id: string, @Body() dto: UpdateEmployeeDto, @CurrentUser() user: AuthUser) { return this.service.update(id, dto, user); }
  @RequirePermissions('employee:delete') @Delete(':id') @HttpCode(204) remove(@Param('id') id: string, @CurrentUser() user: AuthUser) { return this.service.remove(id, user); }
}
