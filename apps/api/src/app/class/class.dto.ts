import { IsString, IsNumber, Min, Max } from 'class-validator';

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

export class UpdateClassDto extends CreateClassDto {}