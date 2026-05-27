import { Controller, Get, Post, Body, Param, Delete, Put, Req } from '@nestjs/common';
import { AcademicSeasonService } from './academic-season.service';
import { CreateAcademicSeasonDto, DuplicateSeasonDto } from './academic-season.dto';

@Controller('academic-seasons')
export class AcademicSeasonController {
  constructor(private readonly seasonService: AcademicSeasonService) {}

  @Post()
  create(@Body() dto: CreateAcademicSeasonDto, @Req() req: any) {
    // For now, use a default schoolId or get from header
    const schoolId = req.headers['x-school-id'] || '6a149456fd35931250abe0fc';
    return this.seasonService.create({ ...dto, schoolId });
  }

  @Get()
  findAll(@Req() req: any) {
    const schoolId = req.headers['x-school-id'] || '6a149456fd35931250abe0fc';
    return this.seasonService.findAll(schoolId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.seasonService.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: CreateAcademicSeasonDto) {
    return this.seasonService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.seasonService.remove(id);
  }

  @Post('duplicate/:id')
  duplicate(@Param('id') id: string, @Body() dto: DuplicateSeasonDto) {
    return this.seasonService.duplicate(id, dto.copyClasses);
  }
}