import { IsString, IsMongoId, IsOptional } from 'class-validator';

export class CreateStudentDto {
  @IsString()
  name: string;
  @IsString()
  rollNumber: string;
  @IsMongoId()
  seasonId: string;
  @IsMongoId()
  classId: string;
  @IsString()
  section: string;
  @IsString()
  @IsOptional()
  parentPhone?: string;
  @IsString()
  @IsOptional()
  address?: string;
}

export class UpdateStudentDto extends CreateStudentDto {}