import { IsString, IsMongoId, IsDate, IsEnum, IsOptional, IsArray } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateAttendanceDto {
  @IsMongoId()
  schoolId: string;

  @IsMongoId()
  studentId: string;

  @IsMongoId()
  seasonId: string;

  @IsMongoId()
  classId: string;

  @IsString()
  section: string;

  @IsDate()
  @Type(() => Date)
  date: Date;

  @IsEnum(['present', 'absent', 'late', 'half-day', 'holiday'])
  @IsOptional()
  status?: string;

  @IsString()
  @IsOptional()
  absentReason?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  hygieneIssues?: string[];

  @IsString()
  @IsOptional()
  remarks?: string;

  @IsMongoId()
  @IsOptional()
  markedBy?: string;
}

export class BulkAttendanceItemDto {
  @IsMongoId()
  studentId: string;

  @IsEnum(['present', 'absent', 'late', 'half-day', 'holiday'])
  status: string;

  @IsString()
  @IsOptional()
  absentReason?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  hygieneIssues?: string[];

  @IsString()
  @IsOptional()
  remarks?: string;
}

export class BulkAttendanceDto {
  @IsMongoId()
  seasonId: string;

  @IsMongoId()
  classId: string;

  @IsString()
  section: string;

  @IsDate()
  @Type(() => Date)
  date: Date;

  @IsArray()
  attendance: BulkAttendanceItemDto[];
}

export class AttendanceFilterDto {
  @IsMongoId()
  @IsOptional()
  schoolId?: string;

  @IsMongoId()
  @IsOptional()
  seasonId?: string;

  @IsMongoId()
  @IsOptional()
  classId?: string;

  @IsString()
  @IsOptional()
  section?: string;

  @IsString()
  @IsOptional()
  startDate?: string;

  @IsString()
  @IsOptional()
  endDate?: string;

  @IsMongoId()
  @IsOptional()
  studentId?: string;
}