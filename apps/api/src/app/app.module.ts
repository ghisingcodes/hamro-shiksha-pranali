// apps/api/src/app/app.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { AcademicSeasonModule } from './academic-season/academic-season.module';
import { ClassModule } from './class/class.module';
import { SectionModule } from './section/section.module';
import { SubjectModule } from './subject/subject.module';
import { StudentModule } from './student/student.module';
import { AcademicRecordModule } from './academic-record/academic-record.module';
import { EnrollmentRecordModule } from './enrollment-record/enrollment-record.module';
import { TeacherModule } from './teacher/teacher.module';
import { AttendanceModule } from './attendance/attendance.module';
import { StudentActivityModule } from './student-activity/student-activity.module';
import { UserModule } from './user/user.module';
import { StaffModule } from './staff/staff.module';
import { SchoolModule } from './school/school.module';
import { TeacherRoutineModule } from './teacher-routine/teacher-routine.module';
import { TeacherReportModule } from './teacher-report/teacher-report.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('MONGODB_URI') || 'mongodb://localhost:27017/hamro-shiksha',
      }),
      inject: [ConfigService],
    }),
    AuthModule,
    AcademicSeasonModule,
    ClassModule,
    SectionModule,
    SubjectModule,
    StudentModule,
    AcademicRecordModule,
    EnrollmentRecordModule,
    TeacherModule,
    TeacherRoutineModule,
    TeacherReportModule,
    AttendanceModule,
    StudentActivityModule,
    UserModule,
    StaffModule,
    SchoolModule,
  ],
})
export class AppModule {}