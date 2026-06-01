// apps/api/src/app/teacher-report/teacher-report.controller.ts
import { Controller, Get, Query } from '@nestjs/common';
import { TeacherReportService } from './teacher-report.service';
import { DailyAttendanceReportDto, PeriodActivityReportDto } from './teacher-report.dto';

@Controller('teacher-reports')
export class TeacherReportController {
  constructor(private readonly teacherReportService: TeacherReportService) {}

  @Get('daily-attendance')
  async getDailyAttendanceReport(
    @Query('teacherId') teacherId: string,
    @Query('date') date: string,
    @Query('classId') classId?: string,
    @Query('section') section?: string,
  ): Promise<DailyAttendanceReportDto> {
    return this.teacherReportService.getDailyAttendanceReport(teacherId, new Date(date), classId, section);
  }

  @Get('period-activity')
  async getPeriodActivityReport(
    @Query('teacherId') teacherId: string,
    @Query('date') date: string,
    @Query('period') period: string,
    @Query('classId') classId?: string,
    @Query('section') section?: string,
  ): Promise<PeriodActivityReportDto> {
    return this.teacherReportService.getPeriodActivityReport(teacherId, new Date(date), parseInt(period), classId, section);
  }
}