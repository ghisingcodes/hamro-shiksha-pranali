// apps/api/src/app/section/section.dto.ts
import { IsString, IsOptional, IsMongoId, IsArray, ValidateNested, IsNumber, IsEnum } from 'class-validator';
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

export class AddSectionDto {
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
  assignedDate?: Date;

  @IsOptional()
  reason?: string;
}

export class EndPeriodTeacherDto {
  @IsNumber()
  period: number;

  @IsMongoId()
  teacherId: string;

  @IsOptional()
  endDate?: Date;

  @IsOptional()
  reason?: string;
}

export class AssignClassTeacherDto {
  @IsMongoId()
  teacherId: string;

  @IsMongoId()
  subjectId: string;

  @IsOptional()
  assignedDate?: Date;

  @IsOptional()
  reason?: string;
}