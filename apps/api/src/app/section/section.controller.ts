import { Controller, Get, Post, Body, Param, Put, Delete, Query, Req } from '@nestjs/common';
import { SectionService } from './section.service';
import { 
  CreateSectionDto, 
  UpdateSectionDto,
  AssignClassTeacherDto,
  AssignPeriodTeacherDto,
  EndTeacherAssignmentDto,
  EndClassTeacherDto
} from './section.dto';

@Controller('sections')
export class SectionController {
  constructor(private readonly sectionService: SectionService) {}

  @Post()
  async create(@Body() dto: CreateSectionDto, @Req() req: any) {
    const schoolId = req.headers['x-school-id'];
    console.log('Creating section with data:', { ...dto, schoolId });
    const result = await this.sectionService.create({ ...dto, schoolId });
    console.log('Section created:', result);
    return result;
  }

  @Get()
  async findAll(
    @Query('seasonId') seasonId?: string,
    @Query('classId') classId?: string,
    @Req() req?: any
  ) {
    const schoolId = req?.headers?.['x-school-id'];
    console.log('GET /sections - seasonId:', seasonId, 'classId:', classId, 'schoolId:', schoolId);
    const result = await this.sectionService.findAll(seasonId, classId, schoolId);
    console.log(`Returning ${result.length} sections`);
    return result;
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.sectionService.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateSectionDto) {
    return this.sectionService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: any) {
    const schoolId = req.headers['x-school-id'];
    return this.sectionService.remove(id, schoolId);
  }

  @Post(':id/assign-class-teacher')
  assignClassTeacher(@Param('id') id: string, @Body() dto: AssignClassTeacherDto) {
    return this.sectionService.assignClassTeacher(id, dto);
  }

  @Post(':id/end-class-teacher')
  endClassTeacher(@Param('id') id: string, @Body() dto: EndClassTeacherDto) {
    return this.sectionService.endClassTeacher(id, dto);
  }

  @Post(':id/assign-period-teacher')
  assignPeriodTeacher(@Param('id') id: string, @Body() dto: AssignPeriodTeacherDto) {
    return this.sectionService.assignPeriodTeacher(id, dto);
  }

  @Post(':id/end-period-teacher')
  endPeriodTeacher(@Param('id') id: string, @Body() dto: EndTeacherAssignmentDto) {
    return this.sectionService.endPeriodTeacher(id, dto);
  }
}