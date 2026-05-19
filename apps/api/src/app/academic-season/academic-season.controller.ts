import { Controller, Get, Post, Body, Param, Delete, Put } from '@nestjs/common';
import { AcademicSeasonService } from './academic-season.service';
import { CreateAcademicSeasonDto, DuplicateSeasonDto } from './academic-season.dto';

@Controller('academic-seasons')
export class AcademicSeasonController {
  constructor(private readonly seasonService: AcademicSeasonService) {}

  @Post()
  create(@Body() dto: CreateAcademicSeasonDto) { return this.seasonService.create(dto); }

  @Get()
  findAll() { return this.seasonService.findAll(); }

  @Get(':id')
  findOne(@Param('id') id: string) { return this.seasonService.findOne(id); }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: CreateAcademicSeasonDto) { return this.seasonService.update(id, dto); }

  @Delete(':id')
  remove(@Param('id') id: string) { return this.seasonService.remove(id); }

  @Post('duplicate/:id')
  duplicate(@Param('id') id: string, @Body() dto: DuplicateSeasonDto) { return this.seasonService.duplicate(id, dto.copyClasses); }
}