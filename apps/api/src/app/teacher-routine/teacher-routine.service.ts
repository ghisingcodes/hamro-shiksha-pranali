// apps/api/src/app/teacher-routine/teacher-routine.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Section } from '../section/section.schema';
import { Class } from '../class/class.schema';
import { Subject } from '../subject/subject.schema';
import { Teacher } from '../teacher/teacher.schema';
import { 
  ClassRoutineResponseDto, 
  TeacherPersonalRoutineDto, 
  TeacherAssignmentDto,
  PeriodRoutineDto,
  TeacherCompleteRoutineDto,
  TeacherDayScheduleDto
} from './teacher-routine.dto';

@Injectable()
export class TeacherRoutineService {
  constructor(
    @InjectModel(Section.name) private sectionModel: Model<Section>,
    @InjectModel(Class.name) private classModel: Model<Class>,
    @InjectModel(Subject.name) private subjectModel: Model<Subject>,
    @InjectModel(Teacher.name) private teacherModel: Model<Teacher>,
  ) {}

  async getClassRoutine(classId: string, sectionName: string, seasonId?: string): Promise<ClassRoutineResponseDto> {
    const classDoc = await this.classModel.findById(classId);
    if (!classDoc) throw new NotFoundException('Class not found');

    const query: any = { classId: new Types.ObjectId(classId), name: sectionName };
    if (seasonId) query.seasonId = new Types.ObjectId(seasonId);

    const section = await this.sectionModel.findOne(query)
      .populate('classId', 'displayName periodCount')
      .lean()
      .exec();

    if (!section) throw new NotFoundException('Section not found');

    const periodCount = (section.classId as any).periodCount;
    const periods: PeriodRoutineDto[] = [];
    const periodTeachers = section.periodTeachers || {};

    for (let period = 1; period <= periodCount; period++) {
      const assignments = periodTeachers[period] || [];
      const activeAssignments = assignments.filter((a: any) => !a.endDate);
      
      const periodInfo: PeriodRoutineDto = {
        period,
        subject: '',
        subjectId: '',
        teacher: '',
        teacherId: '',
        days: [],
      };

      if (activeAssignments.length > 0) {
        const primaryAssignment = activeAssignments.find((a: any) => a.days.includes('M')) || activeAssignments[0];
        const subject = await this.subjectModel.findById(primaryAssignment.subjectId).lean().exec();
        const teacher = await this.teacherModel.findById(primaryAssignment.teacherId).lean().exec();
        
        periodInfo.subject = subject?.name || 'Not Assigned';
        periodInfo.subjectId = primaryAssignment.subjectId;
        periodInfo.teacher = teacher?.name || 'Not Assigned';
        periodInfo.teacherId = primaryAssignment.teacherId;
        periodInfo.days = primaryAssignment.days;
      }

      periods.push(periodInfo);
    }

    return {
      className: (section.classId as any).displayName,
      section: section.name,
      periodCount,
      periods,
    };
  }

  async getTeacherPersonalRoutine(teacherId: string, seasonId?: string): Promise<TeacherPersonalRoutineDto> {
    const teacher = await this.teacherModel.findById(teacherId);
    if (!teacher) throw new NotFoundException('Teacher not found');

    const query: any = {};
    if (seasonId) query.seasonId = new Types.ObjectId(seasonId);

    const allSections = await this.sectionModel.find(query)
      .populate('classId', 'displayName periodCount')
      .lean()
      .exec();

    const assignments: TeacherAssignmentDto[] = [];

    for (const section of allSections) {
      const periodTeachers = section.periodTeachers || {};
      
      for (const [periodStr, periodAssignments] of Object.entries(periodTeachers)) {
        const period = parseInt(periodStr);
        const activeAssignments = (periodAssignments as any[]).filter(
          (a: any) => !a.endDate && a.teacherId?.toString() === teacherId
        );
        
        for (const assignment of activeAssignments) {
          const subject = await this.subjectModel.findById(assignment.subjectId).lean().exec();
          
          assignments.push({
            period,
            className: (section.classId as any).displayName,
            classId: (section.classId as any)._id.toString(),
            section: section.name,
            subject: subject?.name || 'Unknown',
            subjectId: assignment.subjectId,
            days: assignment.days,
          });
        }
      }
    }

    assignments.sort((a, b) => a.period - b.period);

    return {
      teacherId: teacher._id.toString(),
      teacherName: teacher.name,
      assignments,
    };
  }

  async getTeacherCompleteRoutine(teacherId: string, seasonId?: string): Promise<TeacherCompleteRoutineDto> {
    const classTeacherSections = await this.sectionModel.find({
      currentClassTeacherId: new Types.ObjectId(teacherId),
      ...(seasonId && { seasonId: new Types.ObjectId(seasonId) }),
    }).populate('classId', 'displayName periodCount').lean().exec();

    const classTeacherRoutines: ClassRoutineResponseDto[] = [];
    for (const section of classTeacherSections) {
      try {
        const routine = await this.getClassRoutine(
          (section.classId as any)._id.toString(),
          section.name,
          seasonId
        );
        classTeacherRoutines.push(routine);
      } catch (error) {
        console.error(`Error getting routine for ${(section.classId as any).displayName} - ${section.name}:`, error);
      }
    }

    const personalRoutine = await this.getTeacherPersonalRoutine(teacherId, seasonId);

    return {
      classTeacherRoutines,
      personalRoutine,
    };
  }

  async getTeacherDaySchedule(teacherId: string, day: string, seasonId?: string): Promise<TeacherDayScheduleDto> {
    const personalRoutine = await this.getTeacherPersonalRoutine(teacherId, seasonId);
    
    const dayAssignments = personalRoutine.assignments.filter(assignment => 
      assignment.days.includes(day)
    );
    
    dayAssignments.sort((a, b) => a.period - b.period);
    
    return {
      teacherId,
      teacherName: personalRoutine.teacherName,
      day,
      assignments: dayAssignments,
    };
  }
}