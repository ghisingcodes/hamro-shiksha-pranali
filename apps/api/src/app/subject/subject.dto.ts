import { IsString, IsOptional, IsMongoId, IsBoolean } from 'class-validator';

export class CreateSubjectDto {
  @IsMongoId()
  schoolId: string;

  @IsMongoId()
  classId: string;

  @IsMongoId()
  seasonId: string;

  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  code?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class UpdateSubjectDto extends CreateSubjectDto {}