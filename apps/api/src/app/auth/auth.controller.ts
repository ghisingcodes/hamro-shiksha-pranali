import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SchoolSignupDto, LoginDto } from './auth.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('school-signup')
  schoolSignup(@Body() dto: SchoolSignupDto) {
    return this.authService.schoolSignup(dto);
  }

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }
}