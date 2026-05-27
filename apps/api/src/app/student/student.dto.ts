import { IsString, IsOptional, IsNumber, IsArray, ValidateNested, IsBoolean, IsDateString, IsMongoId } from 'class-validator';
import { Type } from 'class-transformer';

class ParentDto {
  @IsString()
  @IsOptional()
  id?: string;

  @IsString()
  relation: string;

  @IsString()
  name: string;

  @IsString()
  phone: string;

  @IsString()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  occupation?: string;

  @IsString()
  @IsOptional()
  workplace?: string;

  @IsNumber()
  @IsOptional()
  monthlyIncome?: number;

  @IsNumber()
  @IsOptional()
  yearlyIncome?: number;

  @IsString()
  @IsOptional()
  education?: string;

  @IsString()
  @IsOptional()
  contactPreference?: string;

  @IsBoolean()
  @IsOptional()
  isPrimary?: boolean;
}

export class CreateStudentDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  studentId?: string;

  @IsDateString()
  @IsOptional()
  dateOfBirth?: string;

  @IsString()
  @IsOptional()
  gender?: string;

  @IsString()
  @IsOptional()
  liveWith?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  longTermHealth?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  abnormalBehaviour?: string[];

  @IsString()
  @IsOptional()
  mobileAccess?: string;

  @IsString()
  @IsOptional()
  internetAccess?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ParentDto)
  @IsOptional()
  parents?: ParentDto[];

  @IsString()
  @IsOptional()
  permanentAddress?: string;

  @IsString()
  @IsOptional()
  temporaryAddress?: string;

  @IsBoolean()
  @IsOptional()
  sameAddress?: boolean;
}

export class UpdateStudentDto extends CreateStudentDto {}

export class SearchStudentDto {
  @IsString()
  q: string;
}