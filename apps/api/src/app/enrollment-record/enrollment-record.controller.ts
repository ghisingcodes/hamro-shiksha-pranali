import { Controller, Get, Post, Body, Param, Put, Delete, Query } from '@nestjs/common';
import { EnrollmentRecordService } from './enrollment-record.service';
import { CreateEnrollmentRecordDto, UpdateEnrollmentRecordDto } from './enrollment-record.dto';

@Controller('enrollment-records')
export class EnrollmentRecordController {
  constructor(private readonly enrollmentService: EnrollmentRecordService) {}

  @Post()
  create(@Body() dto: CreateEnrollmentRecordDto) {
    return this.enrollmentService.create(dto);
  }

  @Get()
  findAll(@Query('studentId') studentId?: string, @Query('seasonId') seasonId?: string) {
    return this.enrollmentService.findAll(studentId, seasonId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.enrollmentService.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateEnrollmentRecordDto) {
    return this.enrollmentService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.enrollmentService.remove(id);
  }

  @Put(':id/status')
  updateStatus(@Param('id') id: string, @Body('status') status: string) {
    return this.enrollmentService.updateStatus(id, status);
  }
}