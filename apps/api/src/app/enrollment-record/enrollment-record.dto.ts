import { IsString, IsMongoId, IsOptional, IsNumber, IsDate, IsEnum, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateEnrollmentRecordDto {
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

  @IsNumber()
  @Min(0)
  @IsOptional()
  admissionFee?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  tuitionFee?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  examFee?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  otherFees?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  paidAmount?: number;

  @IsDate()
  @Type(() => Date)
  @IsOptional()
  admissionDate?: Date;

  @IsString()
  @IsOptional()
  remarks?: string;
}

export class UpdateEnrollmentRecordDto extends CreateEnrollmentRecordDto {}