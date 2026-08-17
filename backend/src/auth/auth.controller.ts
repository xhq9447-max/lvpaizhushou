import { Body, Controller, Get, HttpCode, Post } from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { SkipTenant } from '../common/decorators/platform.decorator';
import { Public } from '../common/decorators/public.decorator';
import { AuthUser } from '../common/types/auth-user';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}
  @Public() @Post('login') @HttpCode(200) login(@Body() dto: LoginDto) { return this.auth.login(dto); }
  @Public() @Post('refresh') @HttpCode(200) refresh(@Body() dto: RefreshDto) { return this.auth.refresh(dto.refreshToken); }
  @Public() @Post('logout') @HttpCode(204) logout(@Body() dto: RefreshDto) { return this.auth.logout(dto.refreshToken); }
  @SkipTenant() @Get('profile') profile(@CurrentUser() user: AuthUser) { return this.auth.profile(user); }
}
