import { IsString, IsOptional, IsArray, IsEnum, IsNumber, IsMongoId, IsDate } from 'class-validator';
import { Type } from 'class-transformer';
import { WeekDays } from './section.schema';

export class CreateSectionDto {
  @IsMongoId()
  classId: string;

  @IsMongoId()
  seasonId: string;

  @IsMongoId()
  schoolId: string;

  @IsString()
  name: string;
}

export class UpdateSectionDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsOptional()
  isActive?: boolean;
}

export class AssignClassTeacherDto {
  @IsMongoId()
  teacherId: string;

  @IsMongoId()
  subjectId: string;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  assignedDate?: Date;

  @IsOptional()
  @IsString()
  reason?: string;
}

export class EndClassTeacherDto {
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  endDate?: Date;

  @IsOptional()
  @IsString()
  reason?: string;
}

export class AssignPeriodTeacherDto {
  @IsNumber()
  period: number;

  @IsMongoId()
  teacherId: string;

  @IsMongoId()
  subjectId: string;

  @IsArray()
  @IsEnum(['M', 'T', 'W', 'Th', 'F'], { each: true })
  days: WeekDays[];

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  assignedDate?: Date;

  @IsOptional()
  @IsString()
  reason?: string;
}

export class EndTeacherAssignmentDto {
  @IsNumber()
  period: number;

  @IsMongoId()
  teacherId: string;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  endDate?: Date;

  @IsOptional()
  @IsString()
  reason?: string;
}