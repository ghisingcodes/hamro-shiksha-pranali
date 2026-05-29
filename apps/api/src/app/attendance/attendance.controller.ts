import { Controller, Get, Post, Body, Param, Put, Delete, Query, Headers } from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { CreateAttendanceDto, BulkAttendanceDto, AttendanceFilterDto } from './attendance.dto';

@Controller('attendance')
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Post()
  create(@Body() dto: CreateAttendanceDto) {
    return this.attendanceService.create(dto);
  }

  @Post('bulk')
  createBulk(@Body() dto: BulkAttendanceDto, @Headers('x-school-id') schoolId: string) {
    return this.attendanceService.createBulk({ ...dto, schoolId });
  }

  @Get()
  findAll(@Query() filter: AttendanceFilterDto, @Headers('x-school-id') schoolId: string) {
    return this.attendanceService.findAll({ ...filter, schoolId });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.attendanceService.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: CreateAttendanceDto) {
    return this.attendanceService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.attendanceService.remove(id);
  }
}