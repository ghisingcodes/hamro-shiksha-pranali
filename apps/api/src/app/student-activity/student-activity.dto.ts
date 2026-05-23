import { 
  IsString, 
  IsMongoId, 
  IsNumber, 
  IsDate, 
  IsOptional, 
  IsArray, 
  IsObject,
  Min,
  Max 
} from 'class-validator';
import { Type } from 'class-transformer';

export class RatingsDto {
  @IsNumber()
  @Min(-1)
  @Max(5)
  @IsOptional()
  homework?: number;

  @IsNumber()
  @Min(-1)
  @Max(5)
  @IsOptional()
  classwork?: number;

  @IsNumber()
  @Min(-1)
  @Max(5)
  @IsOptional()
  practicalworks?: number;

  @IsNumber()
  @Min(-1)
  @Max(5)
  @IsOptional()
  discipline?: number;

  @IsNumber()
  @Min(-1)
  @Max(5)
  @IsOptional()
  reading?: number;

  @IsNumber()
  @Min(-1)
  @Max(5)
  @IsOptional()
  writing?: number;
}

export class CreateStudentActivityDto {
  @IsMongoId()
  studentId: string;

  @IsMongoId()
  seasonId: string;

  @IsMongoId()
  classId: string;

  @IsString()
  section: string;

  @IsNumber()
  @Min(1)
  @Max(7)
  period: number;

  @IsDate()
  @Type(() => Date)
  date: Date;

  // Homework
  @IsString()
  @IsOptional()
  homeworkStatus?: string;

  @IsString()
  @IsOptional()
  homeworkIssue?: string;

  // Classwork
  @IsString()
  @IsOptional()
  classworkStatus?: string;

  @IsString()
  @IsOptional()
  classworkIssue?: string;


  // Practical
  @IsString()
  @IsOptional()
  practicalStatus?: string;

  @IsString()
  @IsOptional()
  practicalIssue?: string;

  // Discipline
  @IsString()
  @IsOptional()
  disciplineStatus?: string;

  @IsString()
  @IsOptional()
  disciplineIssue?: string;

  // Reading
  @IsString()
  @IsOptional()
  readingStatus?: string;

  @IsString()
  @IsOptional()
  readingDifficulty?: string;

  // Writing
  @IsString()
  @IsOptional()
  writingStatus?: string;

  @IsString()
  @IsOptional()
  writingPhoto?: string;

  // Health
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

  @IsString()
  section: string;

  @IsNumber()
  @Min(1)
  @Max(7)
  period: number;

  @IsDate()
  @Type(() => Date)
  date: Date;

  @IsArray()
  activities: Array<{
    studentId: string;
    homeworkStatus?: string;
    homeworkIssue?: string;
    classworkStatus?: string;
    classworkIssue?: string;
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