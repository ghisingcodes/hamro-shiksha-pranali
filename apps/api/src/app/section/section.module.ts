// apps/api/src/app/section/section.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SectionController } from './section.controller';
import { SectionService } from './section.service';
import { Section, SectionSchema } from './section.schema';
import { Class, ClassSchema } from '../class/class.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Section.name, schema: SectionSchema },
      { name: Class.name, schema: ClassSchema },
    ]),
  ],
  controllers: [SectionController],
  providers: [SectionService],
  exports: [SectionService],
})
export class SectionModule {}