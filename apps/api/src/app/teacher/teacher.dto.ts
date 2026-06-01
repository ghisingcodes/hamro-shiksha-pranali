import { IsString, IsOptional, IsNumber, IsArray, IsMongoId, IsBoolean, IsDate, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { TeacherStatus, EmploymentType } from './teacher.schema';

export class CreateTeacherDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  qualification?: string;

  @IsNumber()
  @IsOptional()
  experience?: number;

  @IsDate()
  @Type(() => Date)
  @IsOptional()
  joiningDate?: Date;

  @IsDate()
  @Type(() => Date)
  @IsOptional()
  contractStartDate?: Date;

  @IsDate()
  @Type(() => Date)
  @IsOptional()
  contractEndDate?: Date;

  @IsEnum(EmploymentType)
  @IsOptional()
  employmentType?: EmploymentType;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  subjects?: string[];
}

export class UpdateTeacherDto extends CreateTeacherDto {
  @IsEnum(TeacherStatus)
  @IsOptional()
  status?: TeacherStatus;

  @IsDate()
  @Type(() => Date)
  @IsOptional()
  resignationDate?: Date;

  @IsDate()
  @Type(() => Date)
  @IsOptional()
  lastWorkingDate?: Date;

  @IsString()
  @IsOptional()
  reasonForLeave?: string;
}

export class RenewContractDto {
  @IsMongoId()
  seasonId: string;

  @IsDate()
  @Type(() => Date)
  newEndDate: Date;
}

export class TeacherLeaveDto {
  @IsDate()
  @Type(() => Date)
  lastWorkingDate: Date;

  @IsString()
  reason: string;
}

export class CreateUserAccountDto {
  @IsString()
  email: string;

  @IsString()
  password: string;

  @IsString()
  @IsOptional()
  role?: string;
}

