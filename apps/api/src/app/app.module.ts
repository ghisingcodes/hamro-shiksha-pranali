import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { AcademicSeasonModule } from './academic-season/academic-season.module';
import { ClassModule } from './class/class.module';
import { ClassSectionModule } from './class-section/class-section.module';
import { StudentModule } from './student/student.module';
import { AcademicRecordModule } from './academic-record/academic-record.module';
import { EnrollmentRecordModule } from './enrollment-record/enrollment-record.module';
import { TeacherModule } from './teacher/teacher.module';
import { AttendanceModule } from './attendance/attendance.module';
import { StudentActivityModule } from './student-activity/student-activity.module';
import { UserModule } from './user/user.module';
import { StaffModule } from './staff/staff.module';
import { SchoolModule } from './school/school.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';

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
    ClassSectionModule,
    TeacherModule,
    StudentModule,
    AcademicRecordModule,
    EnrollmentRecordModule,
    AttendanceModule,
    StudentActivityModule,
    UserModule,
    StaffModule,
    SchoolModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}