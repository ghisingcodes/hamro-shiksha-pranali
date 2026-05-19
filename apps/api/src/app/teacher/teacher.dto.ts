import { IsString, IsEmail, IsOptional, IsArray } from 'class-validator';

export class CreateTeacherDto {
  @IsString()
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  subjects?: string[];
}

export class UpdateTeacherDto extends CreateTeacherDto {}
