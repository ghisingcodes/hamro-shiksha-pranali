import { Controller, Get, Post, Body, Param, Delete, Put } from '@nestjs/common';
import { TeacherService } from './teacher.service';
import { CreateTeacherDto, UpdateTeacherDto } from './teacher.dto';

@Controller('teachers')
export class TeacherController {
  constructor(private readonly teacherService: TeacherService) {}

  @Post()
  create(@Body() dto: CreateTeacherDto) { return this.teacherService.create(dto); }
  @Get()
  findAll() { return this.teacherService.findAll(); }
  @Get(':id')
  findOne(@Param('id') id: string) { return this.teacherService.findOne(id); }
  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateTeacherDto) { return this.teacherService.update(id, dto); }
  @Delete(':id')
  remove(@Param('id') id: string) { return this.teacherService.remove(id); }
}