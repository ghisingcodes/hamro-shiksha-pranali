import { Controller, Get, Post, Body, Param, Put, Delete, Query } from '@nestjs/common';
import { StudentService } from './student.service';
import { CreateStudentDto, UpdateStudentDto } from './student.dto';

@Controller('students')
export class StudentController {
  constructor(private readonly studentService: StudentService) {}
  @Get('search')
  async searchStudents(@Query('q') q: string) {
    return this.studentService.searchStudents(q);
  }

  @Post()
  create(@Body() dto: CreateStudentDto) {
    return this.studentService.create(dto);
  }

  @Get()
  findAll() {
    return this.studentService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.studentService.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateStudentDto) {
    return this.studentService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.studentService.remove(id);
  }

  @Get('parent-children')
  getParentChildren(@Query('phone') phone: string) {
    return this.studentService.getParentChildren(phone);
  }
}