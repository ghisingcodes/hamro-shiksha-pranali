import { IsString, IsMongoId, IsArray, ValidateNested, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

class RoutineEntryDto {
  @IsString()
  subject: string;
  @IsString()
  teacher: string;
}

class SectionDto {
  @IsString()
  name: string;
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RoutineEntryDto)
  routine: RoutineEntryDto[][];
}

export class CreateClassSectionDto {
  @IsMongoId()
  classId: string;
  @IsMongoId()
  seasonId: string;
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SectionDto)
  sections: SectionDto[];
}

export class AddSectionDto {
  @IsString()
  name: string;
}

export class UpdateRoutineDto {
  @IsNumber()
  sectionIndex: number;
  @IsNumber()
  day: number;
  @IsNumber()
  period: number;
  @IsString()
  subject: string;
  @IsString()
  teacher: string;
}