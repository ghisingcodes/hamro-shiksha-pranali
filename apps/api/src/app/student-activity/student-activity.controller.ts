import { Controller, Get, Post, Body, Param, Put, Delete, Query, Headers } from '@nestjs/common';
import { StudentActivityService } from './student-activity.service';
import { CreateStudentActivityDto, BulkStudentActivityDto, StudentActivityFilterDto } from './student-activity.dto';

@Controller('student-activities')
export class StudentActivityController {
  constructor(private readonly activityService: StudentActivityService) {}

  @Post()
  create(@Body() dto: CreateStudentActivityDto) {
    return this.activityService.create(dto);
  }

  @Post('bulk')
  createBulk(@Body() dto: BulkStudentActivityDto, @Headers('x-school-id') schoolId: string) {
    return this.activityService.createBulk({ ...dto, schoolId });
  }

  @Get()
  findAll(@Query() filter: StudentActivityFilterDto, @Headers('x-school-id') schoolId: string) {
    return this.activityService.findAll({ ...filter, schoolId });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.activityService.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: CreateStudentActivityDto) {
    return this.activityService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.activityService.remove(id);
  }
}