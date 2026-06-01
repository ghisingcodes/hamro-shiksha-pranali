// apps/api/src/app/teacher-routine/teacher-routine.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TeacherRoutineController } from './teacher-routine.controller';
import { TeacherRoutineService } from './teacher-routine.service';
import { Section, SectionSchema } from '../section/section.schema';
import { Class, ClassSchema } from '../class/class.schema';
import { Subject, SubjectSchema } from '../subject/subject.schema';
import { Teacher, TeacherSchema } from '../teacher/teacher.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Section.name, schema: SectionSchema },
      { name: Class.name, schema: ClassSchema },
      { name: Subject.name, schema: SubjectSchema },
      { name: Teacher.name, schema: TeacherSchema },
    ]),
  ],
  controllers: [TeacherRoutineController],
  providers: [TeacherRoutineService],
  exports: [TeacherRoutineService],
})
export class TeacherRoutineModule {}