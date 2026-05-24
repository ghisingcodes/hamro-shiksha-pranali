import { IsString, IsOptional, IsNumber, IsEmail, IsUrl, IsBoolean } from 'class-validator';

export class CreateSchoolDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  panNumber?: string;

  @IsString()
  @IsOptional()
  registrationNumber?: string;

  @IsNumber()
  @IsOptional()
  establishedYear?: number;

  @IsString()
  @IsOptional()
  principalName?: string;

  @IsString()
  @IsOptional()
  vicePrincipalName?: string;

  @IsUrl()
  @IsOptional()
  website?: string;

  @IsString()
  @IsOptional()
  schoolLogo?: string;

  @IsString()
  @IsOptional()
  coverPhoto?: string;

  @IsString()
  @IsOptional()
  themeColor?: string;
}

export class UpdateSchoolDto extends CreateSchoolDto {
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}