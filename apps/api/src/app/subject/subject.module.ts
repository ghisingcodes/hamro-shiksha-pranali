// apps/api/src/app/subject/subject.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SubjectController } from './subject.controller';
import { SubjectService } from './subject.service';
import { Subject, SubjectSchema } from './subject.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: Subject.name, schema: SubjectSchema }])],
  controllers: [SubjectController],
  providers: [SubjectService],
  exports: [SubjectService],
})
export class SubjectModule {}