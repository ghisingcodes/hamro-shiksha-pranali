import { IsString, IsDate, IsBoolean, IsOptional } from 'class-validator';
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
}

export class DuplicateSeasonDto {
  @IsBoolean()
  copyClasses: boolean;
}