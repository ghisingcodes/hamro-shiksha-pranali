import { Controller, Get, Post, Body, Param, Put, Delete, Query } from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { CreateAttendanceDto, BulkAttendanceDto } from './attendance.dto';

@Controller('attendance')
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Post()
  create(@Body() dto: CreateAttendanceDto) {
    return this.attendanceService.create(dto);
  }

  @Post('bulk')
  createBulk(@Body() dto: BulkAttendanceDto) {
    return this.attendanceService.createBulk(dto);
  }

  @Get()
  findAll(
    @Query('seasonId') seasonId?: string,
    @Query('classId') classId?: string,
    @Query('section') section?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('studentId') studentId?: string,
  ) {
    return this.attendanceService.findAll({ seasonId, classId, section, startDate, endDate, studentId });
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