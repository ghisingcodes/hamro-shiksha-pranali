import { Controller, Get, Post, Body, Param, Delete, Put, Query } from '@nestjs/common';
import { ClassSectionService } from './class-section.service';
import { CreateClassSectionDto, AddSectionDto, UpdateRoutineDto } from './class-section.dto';

@Controller('class-sections')
export class ClassSectionController {
  constructor(private readonly classSectionService: ClassSectionService) {}

  @Post()
  create(@Body() dto: CreateClassSectionDto) { return this.classSectionService.create(dto); }

  @Get()
  findAll(@Query('seasonId') seasonId?: string, @Query('classId') classId?: string) {
    console.log('Received seasonId:', seasonId, 'classId:', classId);
    return this.classSectionService.findAll(seasonId, classId);
  }

  @Get('sections')
  async getSections(@Query('seasonId') seasonId: string, @Query('classId') classId: string) {
    return this.classSectionService.getSections(seasonId, classId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) { return this.classSectionService.findOne(id); }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: CreateClassSectionDto) { return this.classSectionService.update(id, dto); }

  @Delete(':id')
  remove(@Param('id') id: string) { return this.classSectionService.remove(id); }

  @Post(':id/sections')
  addSection(@Param('id') id: string, @Body() dto: AddSectionDto) { return this.classSectionService.addSection(id, dto.name); }

  @Put(':id/routine')
  updateRoutine(@Param('id') id: string, @Body() dto: UpdateRoutineDto) { return this.classSectionService.updateRoutine(id, dto); }

  @Put(':id/sections/:oldName')
  async renameSection(
    @Param('id') id: string,
    @Param('oldName') oldName: string,
    @Body('name') newName: string,
  ) {
    return this.classSectionService.renameSection(id, oldName, newName);
  }

  @Get('teacher/:teacherName/schedule')
  getTeacherSchedule(@Param('teacherName') teacherName: string) { return this.classSectionService.getTeacherSchedule(teacherName); }

  @Delete(':id/sections/:name')
  async deleteSection(@Param('id') id: string, @Param('name') name: string) {
    return this.classSectionService.deleteSection(id, name);
  }
}