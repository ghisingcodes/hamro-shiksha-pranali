import { Controller, Get, Post, Body, Param, Put, Delete, Query } from '@nestjs/common';
import { SchoolService } from './school.service';
import { CreateSchoolDto, UpdateSchoolDto } from './school.dto';

@Controller('schools')
export class SchoolController {
  constructor(private readonly schoolService: SchoolService) {}

  @Post()
  create(@Body() dto: CreateSchoolDto) {
    return this.schoolService.create(dto);
  }

  @Get()
  findAll() {
    return this.schoolService.findAll();
  }

  @Get('by-slug/:slug')
  findBySlug(@Param('slug') slug: string) {
    return this.schoolService.findBySlug(slug);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.schoolService.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateSchoolDto) {
    return this.schoolService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.schoolService.remove(id);
  }
}