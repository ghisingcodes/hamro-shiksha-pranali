import { Controller, Get, Post, Body, Param, Put, Delete, Query, Headers } from '@nestjs/common';
import { EnrollmentRecordService } from './enrollment-record.service';
import { CreateEnrollmentRecordDto, UpdateEnrollmentRecordDto, PayMonthlyFeeDto, BulkMonthlyFeesDto } from './enrollment-record.dto';

@Controller('enrollment-records')
export class EnrollmentRecordController {
  constructor(private readonly enrollmentService: EnrollmentRecordService) {}

  @Post()
  create(@Body() dto: CreateEnrollmentRecordDto, @Headers('x-school-id') schoolId: string) {
    return this.enrollmentService.create(dto, schoolId);
  }

  @Get()
  findAll(
    @Query('studentId') studentId?: string, 
    @Query('seasonId') seasonId?: string,
    @Headers('x-school-id') schoolId: string
  ) {
    return this.enrollmentService.findAll(studentId, seasonId, schoolId);
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

  @Post(':id/pay-monthly')
  payMonthlyFee(@Param('id') id: string, @Body() dto: PayMonthlyFeeDto) {
    return this.enrollmentService.payMonthlyFee(id, dto);
  }

  @Post(':id/bulk-monthly-fees')
  setBulkMonthlyFees(@Param('id') id: string, @Body() dto: BulkMonthlyFeesDto) {
    return this.enrollmentService.setBulkMonthlyFees(id, dto);
  }
}