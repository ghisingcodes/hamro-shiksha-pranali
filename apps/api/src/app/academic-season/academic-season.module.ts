import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AcademicSeasonController } from './academic-season.controller';
import { AcademicSeasonService } from './academic-season.service';
import { AcademicSeason, AcademicSeasonSchema } from './academic-season.schema';
import { ClassSection, ClassSectionSchema } from '../class-section/class-section.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: AcademicSeason.name, schema: AcademicSeasonSchema },
      { name: ClassSection.name, schema: ClassSectionSchema },
    ]),
  ],
  controllers: [AcademicSeasonController],
  providers: [AcademicSeasonService],
  exports: [AcademicSeasonService],
})
export class AcademicSeasonModule {}