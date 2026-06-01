// apps/api/src/app/section/section.controller.ts
import { Controller, Get, Post, Body, Param, Delete, Put, Query, Req } from '@nestjs/common';
import { SectionService } from './section.service';
import { CreateSectionDto, AddSectionDto, UpdateSectionDto, AssignPeriodTeacherDto, EndPeriodTeacherDto } from './section.dto';

@Controller('sections')
export class SectionController {
  constructor(private readonly sectionService: SectionService) {}

  @Post()
  async create(@Body() dto: CreateSectionDto, @Req() req: any) {
    const schoolId = req.headers['x-school-id'];
    console.log('Creating section with data:', { ...dto, schoolId });
    
    if (!schoolId) {
      throw new BadRequestException('School ID is required');
    }
    
    return this.sectionService.create({ ...dto, schoolId });
  }

  @Get()
  async findAll(
    @Query('seasonId') seasonId?: string,
    @Query('classId') classId?: string,
    @Req() req?: any
  ) {
    const schoolId = req?.headers?.['x-school-id'];
    return this.sectionService.findAll(seasonId, classId, schoolId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.sectionService.findOne(id);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateSectionDto) {
    return this.sectionService.update(id, dto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Req() req: any) {
    const schoolId = req.headers['x-school-id'];
    return this.sectionService.remove(id, schoolId);
  }

  @Post(':id/sections')
  async addSection(@Param('id') id: string, @Body() dto: AddSectionDto, @Req() req: any) {
    const schoolId = req.headers['x-school-id'];
    return this.sectionService.addSection(id, dto.name, schoolId);
  }

  @Post(':id/assign-period-teacher')
  async assignPeriodTeacher(@Param('id') id: string, @Body() dto: AssignPeriodTeacherDto, @Req() req: any) {
    const schoolId = req.headers['x-school-id'];
    return this.sectionService.assignPeriodTeacher(id, dto, schoolId);
  }

  @Post(':id/end-period-teacher')
  async endPeriodTeacher(@Param('id') id: string, @Body() dto: EndPeriodTeacherDto, @Req() req: any) {
    const schoolId = req.headers['x-school-id'];
    return this.sectionService.endPeriodTeacher(id, dto, schoolId);
  }

  @Get('teacher/:teacherId/schedule')
  async getTeacherSchedule(@Param('teacherId') teacherId: string, @Req() req: any) {
    const schoolId = req.headers['x-school-id'];
    return this.sectionService.getTeacherSchedule(teacherId, schoolId);
  }
}