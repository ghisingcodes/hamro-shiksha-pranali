import { Controller, Get, Post, Body, Param, Put, Delete, Query } from '@nestjs/common';
import { AcademicRecordService } from './academic-record.service';
import { CreateAcademicRecordDto, UpdateAcademicRecordDto, PromoteStudentDto } from './academic-record.dto';

@Controller('academic-records')
export class AcademicRecordController {
  constructor(private readonly recordService: AcademicRecordService) {}

  @Post()
  create(@Body() dto: CreateAcademicRecordDto) {
    return this.recordService.create(dto);
  }

  @Get()
  findAll(@Query('studentId') studentId?: string, @Query('seasonId') seasonId?: string) {
    return this.recordService.findAll(studentId, seasonId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.recordService.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateAcademicRecordDto) {
    return this.recordService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.recordService.remove(id);
  }

  @Put(':id/status')
  updateStatus(@Param('id') id: string, @Body('status') status: string) {
    return this.recordService.updateStatus(id, status);
  }

  @Post('promote')
  promoteStudent(@Body() dto: PromoteStudentDto) {
    return this.recordService.promoteStudent(dto);
  }
}