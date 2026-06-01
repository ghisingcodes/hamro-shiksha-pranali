// apps/api/src/app/teacher-report/teacher-report.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TeacherReportController } from './teacher-report.controller';
import { TeacherReportService } from './teacher-report.service';
import { Attendance, AttendanceSchema } from '../attendance/attendance.schema';
import { StudentActivity, StudentActivitySchema } from '../student-activity/student-activity.schema';
import { Student, StudentSchema } from '../student/student.schema';
import { Section, SectionSchema } from '../section/section.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Attendance.name, schema: AttendanceSchema },
      { name: StudentActivity.name, schema: StudentActivitySchema },
      { name: Student.name, schema: StudentSchema },
      { name: Section.name, schema: SectionSchema },
    ]),
  ],
  controllers: [TeacherReportController],
  providers: [TeacherReportService],
  exports: [TeacherReportService],
})
export class TeacherReportModule {}