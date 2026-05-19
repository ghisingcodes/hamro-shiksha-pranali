import { Controller, Get, Post, Body, Param, Delete, Put, Query } from '@nestjs/common';
import { StudentService } from './student.service';
import { CreateStudentDto, UpdateStudentDto } from './student.dto';

@Controller('students')
export class StudentController {
  constructor(private readonly studentService: StudentService) {}

  @Post()
  create(@Body() dto: CreateStudentDto) { return this.studentService.create(dto); }

  @Get()
  findAll(@Query('seasonId') seasonId?: string) { return this.studentService.findAll(seasonId); }

  @Get(':id')
  findOne(@Param('id') id: string) { return this.studentService.findOne(id); }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateStudentDto) { return this.studentService.update(id, dto); }

  @Delete(':id')
  remove(@Param('id') id: string) { return this.studentService.remove(id); }
}