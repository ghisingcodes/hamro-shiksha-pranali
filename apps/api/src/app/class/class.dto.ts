import { IsString, IsNumber, IsOptional, IsBoolean, IsMongoId, Min, Max } from 'class-validator';

export class CreateClassDto {
  @IsString()
  name: string;

  @IsString()
  displayName: string;

  @IsNumber()
  @Min(0)
  @Max(12)
  grade: number;

  @IsNumber()
  periodCount: number;
}

export class UpdateClassDto extends CreateClassDto {
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}