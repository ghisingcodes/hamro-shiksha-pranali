import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { EnrollmentRecordController } from './enrollment-record.controller';
import { EnrollmentRecordService } from './enrollment-record.service';
import { EnrollmentRecord, EnrollmentRecordSchema } from './enrollment-record.schema';
import { AcademicSeason, AcademicSeasonSchema } from '../academic-season/academic-season.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: EnrollmentRecord.name, schema: EnrollmentRecordSchema },
      { name: AcademicSeason.name, schema: AcademicSeasonSchema },
    ]),
  ],
  controllers: [EnrollmentRecordController],
  providers: [EnrollmentRecordService],
  exports: [EnrollmentRecordService],
})
export class EnrollmentRecordModule {}