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

export class UpdateUserDto extends CreateUserDto {
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}