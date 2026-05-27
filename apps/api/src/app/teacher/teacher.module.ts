import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TeacherController } from './teacher.controller';
import { TeacherService } from './teacher.service';
import { Teacher, TeacherSchema } from './teacher.schema';
import { User, UserSchema } from '../user/user.schema';
import { ClassSection, ClassSectionSchema } from '../class-section/class-section.schema';
import { AcademicSeason, AcademicSeasonSchema } from '../academic-season/academic-season.schema';
import { Class, ClassSchema } from '../class/class.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Teacher.name, schema: TeacherSchema },
      { name: User.name, schema: UserSchema },
      { name: ClassSection.name, schema: ClassSectionSchema },
      { name: AcademicSeason.name, schema: AcademicSeasonSchema },
      { name: Class.name, schema: ClassSchema },
    ]),
  ],
  controllers: [TeacherController],
  providers: [TeacherService],
  exports: [TeacherService],
})
export class TeacherModule {}