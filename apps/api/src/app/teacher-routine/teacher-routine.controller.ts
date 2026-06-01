// apps/api/src/app/teacher-routine/teacher-routine.controller.ts
import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { TeacherRoutineService } from './teacher-routine.service';
import { Types } from 'mongoose';

@Controller('teacher-routine')
export class TeacherRoutineController {
  constructor(private readonly teacherRoutineService: TeacherRoutineService) {}

  /**
   * Get class routine for a specific class-section
   * Used by class teachers to see all periods
   */
  @Get('class/:classId/section/:sectionName')
  async getClassRoutine(
    @Param('classId') classId: string,
    @Param('sectionName') sectionName: string,
    @Query('seasonId') seasonId?: string,
  ) {
    return this.teacherRoutineService.getClassRoutine(classId, sectionName, seasonId);
  }

  /**
   * Get teacher's personal routine across all classes
   */
  @Get('teacher/:teacherId')
  async getTeacherPersonalRoutine(
    @Param('teacherId') teacherId: string,
    @Query('seasonId') seasonId?: string,
  ) {
    return this.teacherRoutineService.getTeacherPersonalRoutine(teacherId, seasonId);
  }

  /**
   * Get teacher's complete routine (both class teacher and personal)
   */
  @Get('teacher/:teacherId/complete')
  async getTeacherCompleteRoutine(
    @Param('teacherId') teacherId: string,
    @Query('seasonId') seasonId?: string,
  ) {
    return this.teacherRoutineService.getTeacherCompleteRoutine(teacherId, seasonId);
  }

  /**
   * Get teacher's schedule for a specific day
   */
  @Get('teacher/:teacherId/day/:day')
  async getTeacherDaySchedule(
    @Param('teacherId') teacherId: string,
    @Param('day') day: string,
    @Query('seasonId') seasonId?: string,
  ) {
    return this.teacherRoutineService.getTeacherDaySchedule(teacherId, day, seasonId);
  }
}