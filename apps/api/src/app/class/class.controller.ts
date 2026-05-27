import { Controller, Get, Post, Body, Param, Put, Delete, Req } from '@nestjs/common';
import { ClassService } from './class.service';
import { CreateClassDto, UpdateClassDto } from './class.dto';

@Controller('classes')
export class ClassController {
  constructor(private readonly classService: ClassService) {}

  @Post()
  create(@Body() dto: CreateClassDto, @Req() req: any) {
    const schoolId = req.headers['x-school-id'];
    return this.classService.create(dto, schoolId);
  }

  @Get()
  findAll(@Req() req: any) {
    const schoolId = req.headers['x-school-id'];
    return this.classService.findAll(schoolId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.classService.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateClassDto) {
    return this.classService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.classService.remove(id);
  }
}