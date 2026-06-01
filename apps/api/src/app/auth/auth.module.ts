// apps/api/src/app/auth/auth.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { School, SchoolSchema } from '../school/school.schema';
import { User, UserSchema } from '../user/user.schema';
import { Student, StudentSchema } from '../student/student.schema';
import { Teacher, TeacherSchema } from '../teacher/teacher.schema';
import { AcademicRecord, AcademicRecordSchema } from '../academic-record/academic-record.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: School.name, schema: SchoolSchema },
      { name: User.name, schema: UserSchema },
      { name: Student.name, schema: StudentSchema },
      { name: Teacher.name, schema: TeacherSchema },
      { name: AcademicRecord.name, schema: AcademicRecordSchema },
    ]),
  ],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}