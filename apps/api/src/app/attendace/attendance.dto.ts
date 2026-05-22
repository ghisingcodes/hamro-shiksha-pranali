import { IsString, IsMongoId, IsDate, IsEnum, IsOptional, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateAttendanceDto {
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
  @ValidateNested({ each: true })
  @Type(() => BulkAttendanceItemDto)
  attendance: BulkAttendanceItemDto[];
}