import { IsString, IsMongoId, IsNumber, IsDate, IsOptional, IsArray } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateStudentActivityDto {
  @IsMongoId()
  studentId: string;

  @IsMongoId()
  seasonId: string;

  @IsMongoId()
  classId: string;

  @IsMongoId()
  schoolId: string;  // ← ADD THIS

  @IsString()
  section: string;

  @IsNumber()
  period: number;

  @IsDate()
  @Type(() => Date)
  date: Date;

  @IsString()
  @IsOptional()
  homeworkStatus?: string;

  @IsString()
  @IsOptional()
  homeworkIssue?: string;

  @IsString()
  @IsOptional()
  homeworkPhoto?: string;

  @IsString()
  @IsOptional()
  classworkStatus?: string;

  @IsString()
  @IsOptional()
  classworkIssue?: string;

  @IsString()
  @IsOptional()
  classworkPhoto?: string;

  @IsString()
  @IsOptional()
  practicalStatus?: string;

  @IsString()
  @IsOptional()
  practicalIssue?: string;

  @IsString()
  @IsOptional()
  disciplineStatus?: string;

  @IsString()
  @IsOptional()
  disciplineIssue?: string;

  @IsString()
  @IsOptional()
  readingStatus?: string;

  @IsString()
  @IsOptional()
  readingDifficulty?: string;

  @IsString()
  @IsOptional()
  writingStatus?: string;

  @IsString()
  @IsOptional()
  writingPhoto?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  healthProblems?: string[];

  @IsString()
  @IsOptional()
  healthOther?: string;

  @IsString()
  @IsOptional()
  remarks?: string;

  @IsMongoId()
  @IsOptional()
  markedBy?: string;
}

export class BulkStudentActivityDto {
  @IsMongoId()
  seasonId: string;

  @IsMongoId()
  classId: string;

  @IsMongoId()
  schoolId: string;  // ← ADD THIS

  @IsString()
  section: string;

  @IsNumber()
  period: number;

  @IsDate()
  @Type(() => Date)
  date: Date;

  @IsArray()
  activities: Array<{
    studentId: string;
    homeworkStatus?: string;
    homeworkIssue?: string;
    homeworkPhoto?: string;
    classworkStatus?: string;
    classworkIssue?: string;
    classworkPhoto?: string;
    practicalStatus?: string;
    practicalIssue?: string;
    disciplineStatus?: string;
    disciplineIssue?: string;
    readingStatus?: string;
    readingDifficulty?: string;
    writingStatus?: string;
    writingPhoto?: string;
    healthProblems?: string[];
    healthOther?: string;
    remarks?: string;
  }>;
}

export class StudentActivityFilterDto {
  @IsMongoId()
  @IsOptional()
  seasonId?: string;

  @IsMongoId()
  @IsOptional()
  classId?: string;

  @IsMongoId()
  @IsOptional()
  schoolId?: string;  // ← ADD THIS

  @IsString()
  @IsOptional()
  section?: string;

  @IsNumber()
  @IsOptional()
  period?: number;

  @IsDate()
  @IsOptional()
  @Type(() => Date)
  date?: Date;

  @IsMongoId()
  @IsOptional()
  studentId?: string;

  @IsString()
  @IsOptional()
  startDate?: string;

  @IsString()
  @IsOptional()
  endDate?: string;
}