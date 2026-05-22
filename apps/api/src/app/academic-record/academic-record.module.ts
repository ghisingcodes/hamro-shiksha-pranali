import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AcademicRecordController } from './academic-record.controller';
import { AcademicRecordService } from './academic-record.service';
import { AcademicRecord, AcademicRecordSchema } from './academic-record.schema';
import { AcademicSeason, AcademicSeasonSchema } from '../academic-season/academic-season.schema';
import { Class, ClassSchema } from '../class/class.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: AcademicRecord.name, schema: AcademicRecordSchema },
      { name: AcademicSeason.name, schema: AcademicSeasonSchema },
      { name: Class.name, schema: ClassSchema },
    ]),
  ],
  controllers: [AcademicRecordController],
  providers: [AcademicRecordService],
  exports: [AcademicRecordService],
})
export class AcademicRecordModule {}