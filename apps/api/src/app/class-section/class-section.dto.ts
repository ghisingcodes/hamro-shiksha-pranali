import { IsString, IsMongoId, IsArray, ValidateNested, IsNumber, IsOptional, IsDate, IsEnum, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class AddSectionDto {
  @IsString()
  name: string;
}

export class RenameSectionDto {
  @IsString()
  newName: string;
}

export class UpdateTeacherAssignmentDto {
  @IsNumber()
  period: number;

  @IsMongoId()
  teacherId: string;

  @IsString()
  @IsOptional()
  subject?: string;

  @IsArray()
  @IsEnum(['M', 'T', 'W', 'Th', 'F'], { each: true })
  @IsOptional()
  days?: string[];
}

export class TeacherAssignmentDto {
  @IsMongoId()
  teacherId: string;

  @IsArray()
  @IsEnum(['M', 'T', 'W', 'Th', 'F'], { each: true })
  days: string[];

  @IsDate()
  @Type(() => Date)
  @IsOptional()
  assignedDate?: Date;
}

export class PeriodTeacherDto {
  @IsNumber()
  @Min(1)
  @Max(7)
  period: number;

  @IsString()
  subject: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TeacherAssignmentDto)
  assignments: TeacherAssignmentDto[];
}

export class SectionDto {
  @IsString()
  name: string;

  @IsMongoId()
  @IsOptional()
  currentClassTeacherId?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PeriodTeacherDto)
  periodTeachers: PeriodTeacherDto[];
}

export class CreateClassSectionDto {
  @IsMongoId()
  classId: string;

  @IsMongoId()
  seasonId: string;

  @IsMongoId()
  schoolId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SectionDto)
  sections: SectionDto[];
}

export class AssignClassTeacherDto {
  @IsMongoId()
  teacherId: string;

  @IsDate()
  @Type(() => Date)
  @IsOptional()
  assignedDate?: Date;
}

export class AssignPeriodTeacherDto {
  @IsNumber()
  period: number;

  @IsString()
  subject: string;

  @IsMongoId()
  teacherId: string;

  @IsArray()
  @IsEnum(['M', 'T', 'W', 'Th', 'F'], { each: true })
  days: string[];

  @IsDate()
  @Type(() => Date)
  @IsOptional()
  assignedDate?: Date;
}

export class EndTeacherAssignmentDto {
  @IsNumber()
  period: number;

  @IsMongoId()
  teacherId: string;

  @IsDate()
  @Type(() => Date)
  endDate: Date;
}