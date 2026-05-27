import { IsString, IsDate, IsBoolean, IsOptional, IsMongoId } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateAcademicSeasonDto {
  @IsString()
  name: string;

  @Type(() => Date)
  @IsDate()
  startDate: Date;

  @Type(() => Date)
  @IsDate()
  endDate: Date;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsMongoId()
  @IsOptional()
  schoolId?: string;
}

export class DuplicateSeasonDto {
  @IsBoolean()
  copyClasses: boolean;
}