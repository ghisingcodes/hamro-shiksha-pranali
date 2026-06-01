import { Controller, Get, Post, Body, Param, Put, Delete, Query, UseGuards, Req } from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto, UpdateUserDto, LoginDto, ChangePasswordDto } from './user.dto';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  create(@Body() dto: CreateUserDto) {
    return this.userService.create(dto);
  }

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.userService.login(dto);
  }

  @Post('change-password')
  changePassword(@Body() dto: ChangePasswordDto, @Req() req: any) {
    const userId = req.user?.id;
    return this.userService.changePassword(userId, dto);
  }

  @Post(':id/reset-password')
  async resetPassword(@Param('id') id: string, @Body('password') password: string) {
    return this.userService.resetPassword(id, password);
  }

  @Get()
  findAll(@Query('role') role?: string, @Query('schoolId') schoolId?: string) {
    return this.userService.findAll(role, schoolId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.userService.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.userService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.userService.remove(id);
  }

  @Put(':id/toggle-status')
  toggleStatus(@Param('id') id: string) {
    return this.userService.toggleStatus(id);
  }

  @Put(':id/password')
  updatePassword(
    @Param('id') id: string, 
    @Body('password') password: string,
    @Body('passwordChanged') passwordChanged: boolean = true
  ) {
    return this.userService.updatePassword(id, password, passwordChanged);
  }
}