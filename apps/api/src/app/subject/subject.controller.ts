import { Controller, Get, Post, Body, Param, Delete, Put, Query, Headers } from '@nestjs/common';
import { SubjectService } from './subject.service';
import { CreateSubjectDto, UpdateSubjectDto } from './subject.dto';

@Controller('subjects')
export class SubjectController {
  constructor(private readonly subjectService: SubjectService) {}

  @Post()
  create(@Body() dto: CreateSubjectDto) {
    return this.subjectService.create(dto);
  }

  @Get()
  findAll(
    @Query('seasonId') seasonId?: string,
    @Query('classId') classId?: string,
    @Headers('x-school-id') schoolId?: string,
  ) {
    return this.subjectService.findAll(seasonId, classId, schoolId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.subjectService.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateSubjectDto) {
    return this.subjectService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.subjectService.remove(id);
  }
}