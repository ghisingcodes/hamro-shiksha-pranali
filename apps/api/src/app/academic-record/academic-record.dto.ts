import { IsString, IsMongoId, IsOptional, IsEnum } from 'class-validator';

export class CreateAcademicRecordDto {
  @IsMongoId()
  studentId: string;

  @IsMongoId()
  seasonId: string;

  @IsMongoId()
  classId: string;

  @IsString()
  section: string;

  @IsString()
  @IsOptional()
  rollNumber?: string;

  @IsEnum(['active', 'promoted', 'failed', 'repeated', 'left', 'graduated'])
  @IsOptional()
  status?: string;
}

export class UpdateAcademicRecordDto extends CreateAcademicRecordDto {}

export class PromoteStudentDto {
  @IsMongoId()
  fromRecordId: string;

  @IsMongoId()
  toSeasonId: string;

  @IsMongoId()
  @IsOptional()
  newClassId?: string;
}