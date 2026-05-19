import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ClassSectionController } from './class-section.controller';
import { ClassSectionService } from './class-section.service';
import { ClassSection, ClassSectionSchema } from './class-section.schema';
import { Class, ClassSchema } from '../class/class.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ClassSection.name, schema: ClassSectionSchema },
      { name: Class.name, schema: ClassSchema },
    ]),
  ],
  controllers: [ClassSectionController],
  providers: [ClassSectionService],
  exports: [ClassSectionService],
})
export class ClassSectionModule {}