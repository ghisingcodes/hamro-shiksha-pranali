import { IsString, IsEmail, IsOptional } from 'class-validator';

export class SchoolSignupDto {
  // School details
  @IsString()
  schoolName: string;

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

  // Super Admin details
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
  @IsEmail()
  email: string;

  @IsString()
  password: string;
}