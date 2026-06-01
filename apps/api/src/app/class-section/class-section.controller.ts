import { Controller, Get, Post, Body, Param, Delete, Put, Query, Headers, ParseIntPipe } from '@nestjs/common';
import { ClassSectionService } from './class-section.service';
import { 
  CreateClassSectionDto, 
  AssignClassTeacherDto, 
  AssignPeriodTeacherDto,
  EndTeacherAssignmentDto,
  UpdateTeacherAssignmentDto,
  AddSectionDto,
  RenameSectionDto
} from './class-section.dto';

@Controller('class-sections')
export class ClassSectionController {
  constructor(private readonly classSectionService: ClassSectionService) {}

  @Post()
  create(@Body() dto: CreateClassSectionDto) {
    return this.classSectionService.create(dto);
  }

  @Get()
  findAll(@Query('seasonId') seasonId?: string, @Query('classId') classId?: string, @Headers('x-school-id') schoolId?: string) {
    return this.classSectionService.findAll(seasonId, classId, schoolId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.classSectionService.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: CreateClassSectionDto) {
    return this.classSectionService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Headers('x-school-id') schoolId: string) {
    return this.classSectionService.remove(id, schoolId);
  }

  @Post(':id/sections')
  addSection(@Param('id') id: string, @Body() dto: AddSectionDto) {
    return this.classSectionService.addSection(id, dto.name);
  }

  @Delete(':id/sections/:name')
  deleteSection(@Param('id') id: string, @Param('name') name: string, @Headers('x-school-id') schoolId: string) {
    return this.classSectionService.deleteSection(id, name, schoolId);
  }

  @Put(':id/sections/:oldName')
  renameSection(
    @Param('id') id: string,
    @Param('oldName') oldName: string,
    @Body() dto: RenameSectionDto,
  ) {
    return this.classSectionService.renameSection(id, oldName, dto.newName);
  }

  @Post(':id/sections/:sectionIndex/class-teacher')
  assignClassTeacher(
    @Param('id') id: string,
    @Param('sectionIndex', ParseIntPipe) sectionIndex: number,
    @Body() dto: AssignClassTeacherDto,
  ) {
    return this.classSectionService.assignClassTeacher(id, sectionIndex, dto);
  }

  @Post(':id/sections/:sectionIndex/period-teacher')
  assignPeriodTeacher(
    @Param('id') id: string,
    @Param('sectionIndex', ParseIntPipe) sectionIndex: number,
    @Body() dto: AssignPeriodTeacherDto,
  ) {
    return this.classSectionService.assignPeriodTeacher(id, sectionIndex, dto);
  }

  @Put(':id/sections/:sectionIndex/period-teacher')
  updateTeacherAssignment(
    @Param('id') id: string,
    @Param('sectionIndex', ParseIntPipe) sectionIndex: number,
    @Body() dto: UpdateTeacherAssignmentDto,
  ) {
    return this.classSectionService.updateTeacherAssignment(id, sectionIndex, dto);
  }

  @Post(':id/sections/:sectionIndex/end-assignment')
  endTeacherAssignment(
    @Param('id') id: string,
    @Param('sectionIndex', ParseIntPipe) sectionIndex: number,
    @Body() dto: EndTeacherAssignmentDto,
  ) {
    return this.classSectionService.endTeacherAssignment(id, sectionIndex, dto);
  }

  @Get(':id/sections/:sectionIndex/current-teachers')
  getCurrentTeachers(
    @Param('id') id: string,
    @Param('sectionIndex', ParseIntPipe) sectionIndex: number,
    @Query('date') date?: string,
  ) {
    return this.classSectionService.getCurrentTeachers(id, sectionIndex, date ? new Date(date) : new Date());
  }
}