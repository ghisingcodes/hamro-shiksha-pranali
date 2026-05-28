import { IsString, IsOptional, IsNumber, IsEmail, IsDate } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateStaffDto {
  @IsString()
  @IsOptional()
  staffId?: string;

  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  position?: string;

  @IsString()
  @IsOptional()
  department?: string;

  @IsDate()
  @Type(() => Date)
  @IsOptional()
  joiningDate?: Date;

  @IsNumber()
  @IsOptional()
  salary?: number;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  emergencyContact?: string;
}

export class UpdateStaffDto extends CreateStaffDto {}