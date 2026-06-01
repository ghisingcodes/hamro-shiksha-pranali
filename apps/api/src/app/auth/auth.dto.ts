import { IsString, IsEmail, IsOptional, IsEnum, IsMongoId, IsDate } from 'class-validator';
import { Type } from 'class-transformer';

export class SchoolSignupDto {
  @IsString()
  schoolName: string;

  @IsString()
  slug: string;

  @IsString()
  @IsOptional()
  schoolAddress?: string;

  @IsString()
  @IsOptional()
  schoolPhone?: string;

  @IsEmail()
  @IsOptional()
  schoolEmail?: string;

  @IsString()
  @IsOptional()
  panNumber?: string;

  @IsString()
  adminName: string;

  @IsEmail()
  adminEmail: string;

  @IsString()
  adminPassword: string;

  @IsString()
  @IsOptional()
  adminPhone?: string;
}

export class LoginDto {
  @IsString()
  userType: 'student' | 'parent' | 'teacher';

  @IsString()
  @IsOptional()
  identifier?: string;

  @IsString()
  @IsOptional()
  password?: string;

  @IsString()
  @IsOptional()
  rollNumber?: string;

  @IsString()
  @IsOptional()
  className?: string;

  @IsString()
  @IsOptional()
  section?: string;

  @IsDate()
  @Type(() => Date)
  @IsOptional()
  dateOfBirth?: Date;
}

export class SuperAdminLoginDto {
  @IsString()
  identifier: string;

  @IsString()
  password: string;
}

export class ChangePasswordDto {
  @IsString()
  oldPassword: string;

  @IsString()
  newPassword: string;
}