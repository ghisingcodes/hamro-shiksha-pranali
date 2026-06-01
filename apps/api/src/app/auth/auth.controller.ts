import { Controller, Post, Body, Param } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SchoolSignupDto, LoginDto, SuperAdminLoginDto } from './auth.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('school-signup')
  schoolSignup(@Body() dto: SchoolSignupDto) {
    return this.authService.schoolSignup(dto);
  }

  @Post(':slug/login')
  loginWithSchool(@Param('slug') slug: string, @Body() dto: LoginDto) {
    return this.authService.loginWithSchool(slug, dto);
  }

  @Post(':slug/super-admin/login')
  superAdminLogin(@Param('slug') slug: string, @Body() dto: SuperAdminLoginDto) {
    return this.authService.superAdminLogin(slug, dto);
  }
}