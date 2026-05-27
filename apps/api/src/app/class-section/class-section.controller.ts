// apps/api/src/app/class-section/class-section.controller.ts
import { Controller, Get, Post, Body, Param, Delete, Put, Query, Req } from '@nestjs/common';
import { ClassSectionService } from './class-section.service';
import { CreateClassSectionDto, AddSectionDto, UpdateRoutineDto } from './class-section.dto';

@Controller('class-sections')
export class ClassSectionController {
  constructor(private readonly classSectionService: ClassSectionService) {}

  @Post()
  async create(@Body() dto: CreateClassSectionDto, @Req() req: any) {
    const schoolId = req.headers['x-school-id'] || req.user?.schoolId;
    console.log('Creating class section with data:', { ...dto, schoolId });
    return this.classSectionService.create({ ...dto, schoolId });
  }

  @Get()
  async findAll(@Query('seasonId') seasonId?: string, @Query('classId') classId?: string, @Req() req: any) {
    const schoolId = req.headers['x-school-id'] || req.user?.schoolId;
    return this.classSectionService.findAll(seasonId, classId, schoolId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.classSectionService.findOne(id);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: CreateClassSectionDto) {
    return this.classSectionService.update(id, dto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Req() req: any) {
    const schoolId = req.headers['x-school-id'] || req.user?.schoolId;
    return this.classSectionService.remove(id, schoolId);
  }

  @Post(':id/sections')
  async addSection(@Param('id') id: string, @Body() dto: AddSectionDto, @Req() req: any) {
    const schoolId = req.headers['x-school-id'] || req.user?.schoolId;
    return this.classSectionService.addSection(id, dto.name, schoolId);
  }

  @Delete(':id/sections/:name')
  async deleteSection(@Param('id') id: string, @Param('name') name: string, @Req() req: any) {
    const schoolId = req.headers['x-school-id'] || req.user?.schoolId;
    return this.classSectionService.deleteSection(id, name, schoolId);
  }

  @Put(':id/sections/:oldName')
  async renameSection(@Param('id') id: string, @Param('oldName') oldName: string, @Body('name') newName: string, @Req() req: any) {
    const schoolId = req.headers['x-school-id'] || req.user?.schoolId;
    return this.classSectionService.renameSection(id, oldName, newName, schoolId);
  }

  @Put(':id/routine')
  async updateRoutine(@Param('id') id: string, @Body() dto: UpdateRoutineDto, @Req() req: any) {
    const schoolId = req.headers['x-school-id'] || req.user?.schoolId;
    return this.classSectionService.updateRoutine(id, dto, schoolId);
  }
}