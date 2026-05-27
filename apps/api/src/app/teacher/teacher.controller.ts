// apps/api/src/app/teacher/teacher.controller.ts
import { Controller, Get, Post, Body, Param, Put, Delete, Query, Req, Headers } from '@nestjs/common';
import { TeacherService } from './teacher.service';
import { CreateTeacherDto, UpdateTeacherDto, CreateUserAccountDto, RenewContractDto, TeacherLeaveDto } from './teacher.dto';

@Controller('teachers')
export class TeacherController {
  constructor(private readonly teacherService: TeacherService) {}

  @Post()
  create(@Body() dto: CreateTeacherDto, @Headers('x-school-id') schoolId: string) {
    console.log('Creating teacher with schoolId:', schoolId);
    if (!schoolId) {
      throw new Error('School ID is required');
    }
    return this.teacherService.create(dto, schoolId);
  }

  @Get()
  findAll(@Query('schoolId') schoolId?: string, @Query('seasonId') seasonId?: string, @Headers('x-school-id') headerSchoolId?: string) {
    const finalSchoolId = schoolId || headerSchoolId;
    console.log('Finding teachers for schoolId:', finalSchoolId);
    return this.teacherService.findAll(finalSchoolId, seasonId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.teacherService.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateTeacherDto, @Headers('x-school-id') schoolId: string) {
    return this.teacherService.update(id, dto, schoolId);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.teacherService.remove(id);
  }

  @Post(':id/create-user')
  createUserAccount(@Param('id') id: string, @Body() dto: CreateUserAccountDto, @Headers('x-school-id') schoolId: string) {
    return this.teacherService.createUserAccount(id, dto, schoolId);
  }

  @Post(':id/renew-contract')
  renewContract(@Param('id') id: string, @Body() dto: RenewContractDto) {
    return this.teacherService.renewContract(id, dto);
  }

  @Post(':id/leave')
  processLeave(@Param('id') id: string, @Body() dto: TeacherLeaveDto) {
    return this.teacherService.processLeave(id, dto);
  }
}