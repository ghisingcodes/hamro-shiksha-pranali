// apps/api/src/app/teacher-report/teacher-report.service.ts
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Attendance } from '../attendance/attendance.schema';
import { StudentActivity } from '../student-activity/student-activity.schema';
import { Student } from '../student/student.schema';
import { Section } from '../section/section.schema';
import { 
  DailyAttendanceReportDto, 
  PeriodActivityReportDto,
  AttendanceSummaryDto,
  AbsentStudentDto,
  HealthIssueDto,
  PeriodActivitySummaryDto,
  StudentWithIssuesDto
} from './teacher-report.dto';

@Injectable()
export class TeacherReportService {
  constructor(
    @InjectModel(Attendance.name) private attendanceModel: Model<Attendance>,
    @InjectModel(StudentActivity.name) private activityModel: Model<StudentActivity>,
    @InjectModel(Student.name) private studentModel: Model<Student>,
    @InjectModel(Section.name) private sectionModel: Model<Section>,
  ) {}

  async getDailyAttendanceReport(
    teacherId: string, 
    date: Date, 
    classId?: string, 
    section?: string
  ): Promise<DailyAttendanceReportDto> {
    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);

    const query: any = {
      date: { $gte: startDate, $lte: endDate },
    };
    if (classId) query.classId = new Types.ObjectId(classId);
    if (section) query.section = section;

    const attendance = await this.attendanceModel.find(query)
      .populate('studentId', 'name rollNumber')
      .lean()
      .exec();

    const summary: AttendanceSummaryDto = {
      total: attendance.length,
      present: attendance.filter(a => a.status === 'present').length,
      absent: attendance.filter(a => a.status === 'absent').length,
      late: attendance.filter(a => a.status === 'late').length,
      halfDay: attendance.filter(a => a.status === 'half-day').length,
      attendanceRate: attendance.length > 0 
        ? parseFloat(((attendance.filter(a => a.status === 'present').length / attendance.length) * 100).toFixed(1))
        : 0,
    };

    const absentStudents: AbsentStudentDto[] = attendance
      .filter(a => a.status === 'absent')
      .map(a => ({
        id: (a.studentId as any)?._id,
        name: (a.studentId as any)?.name,
        rollNumber: (a.studentId as any)?.rollNumber,
        reason: a.absentReason,
        remarks: a.remarks,
      }));

    const healthIssues: HealthIssueDto[] = attendance
      .filter(a => a.hygieneIssues?.length > 0 || a.remarks?.toLowerCase().includes('health'))
      .map(a => ({
        id: (a.studentId as any)?._id,
        name: (a.studentId as any)?.name,
        rollNumber: (a.studentId as any)?.rollNumber,
        issues: a.hygieneIssues || [],
        remarks: a.remarks,
      }));

    return { summary, absentStudents, healthIssues, attendance };
  }

  async getPeriodActivityReport(
    teacherId: string, 
    date: Date, 
    period: number, 
    classId?: string, 
    section?: string
  ): Promise<PeriodActivityReportDto> {
    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);

    const query: any = {
      date: { $gte: startDate, $lte: endDate },
      period,
    };
    if (classId) query.classId = new Types.ObjectId(classId);
    if (section) query.section = section;

    const activities = await this.activityModel.find(query)
      .populate('studentId', 'name rollNumber')
      .lean()
      .exec();

    const summary: PeriodActivitySummaryDto = {
      total: activities.length,
      homeworkComplete: activities.filter(a => a.homeworkStatus === 'complete').length,
      classworkComplete: activities.filter(a => a.classworkStatus === 'complete').length,
      disciplineGood: activities.filter(a => a.disciplineStatus === 'good').length,
      healthGood: activities.filter(a => !a.healthProblems?.length).length,
    };

    const studentsWithIssues: StudentWithIssuesDto[] = activities
      .filter(a => a.healthProblems?.length > 0 || a.disciplineIssue || a.homeworkIssue || a.classworkIssue)
      .map(a => ({
        id: (a.studentId as any)?._id,
        name: (a.studentId as any)?.name,
        rollNumber: (a.studentId as any)?.rollNumber,
        healthProblems: a.healthProblems,
        disciplineIssue: a.disciplineIssue,
        homeworkIssue: a.homeworkIssue,
        classworkIssue: a.classworkIssue,
        remarks: a.remarks,
      }));

    return { summary, activities, studentsWithIssues };
  }
}