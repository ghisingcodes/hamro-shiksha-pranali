import { IsString, IsEmail, IsOptional, IsEnum, IsMongoId, IsBoolean, IsArray } from 'class-validator';
import { UserRole } from './user.schema';

export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsString()
  password: string;

  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole;

  @IsMongoId()
  @IsOptional()
  teacherId?: string;

  @IsMongoId()
  @IsOptional()
  staffId?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  permissions?: string[];
}

export class UpdateUserDto {
  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  password?: string;

  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole;

  @IsMongoId()
  @IsOptional()
  teacherId?: string;

  @IsMongoId()
  @IsOptional()
  staffId?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  permissions?: string[];

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsBoolean()
  @IsOptional()
  passwordChanged?: boolean;
}