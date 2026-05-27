import { Controller, Get, Post, Body, Param, Put, Delete, Query, Req, Headers } from '@nestjs/common';
import { StudentService } from './student.service';
import { CreateStudentDto, UpdateStudentDto } from './student.dto';

@Controller('students')
export class StudentController {
  constructor(private readonly studentService: StudentService) {}

  @Post()
  create(@Body() dto: CreateStudentDto, @Headers('x-school-id') schoolId: string) {
    return this.studentService.create(dto, schoolId);
  }

  @Get()
  findAll(@Headers('x-school-id') schoolId: string) {
    return this.studentService.findAll(schoolId);
  }

  @Get('search')
  searchStudents(@Query('q') q: string, @Headers('x-school-id') schoolId: string) {
    return this.studentService.searchStudents(q, schoolId);
  }

  @Get('parent-children')
  getParentChildren(@Query('phone') phone: string, @Headers('x-school-id') schoolId: string) {
    return this.studentService.getParentChildren(phone, schoolId);
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
}