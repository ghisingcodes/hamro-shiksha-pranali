import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClassModule } from './class/class.module';
import { AcademicSeasonModule } from './academic-season/academic-season.module';
import { ClassSectionModule } from './class-section/class-section.module';
import { StudentModule } from './student/student.module';
import { AcademicRecordModule } from './academic-record/academic-record.module';
import { TeacherModule } from './teacher/teacher.module';
import { EnrollmentRecordModule } from './enrollment-record/enrollment-record.module';
import { AttendanceModule } from './attendace/attendance.module';


@Module({
  imports: [
    ConfigModule.forRoot(),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('MONGODB_URI') || 'mongodb://localhost:27017/hamro-shiksha',
      }),
      inject: [ConfigService],
    }),
    ClassModule,
    AcademicSeasonModule,
    ClassSectionModule,
    StudentModule,
    EnrollmentRecordModule,
    AcademicRecordModule,
    TeacherModule,
    AttendanceModule,
  ],
})
export class AppModule {}