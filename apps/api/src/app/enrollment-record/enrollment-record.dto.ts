import { IsString, IsMongoId, IsOptional, IsNumber, IsDate, IsEnum, IsArray, ValidateNested, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';

class MonthlyFeeDto {
  @IsString()
  month: string;

  @IsNumber()
  amount: number;

  @IsBoolean()
  @IsOptional()
  isPaid?: boolean;

  @IsDate()
  @IsOptional()
  paidDate?: Date;

  @IsString()
  @IsOptional()
  paymentMethod?: string;

  @IsString()
  @IsOptional()
  transactionId?: string;
}

export class CreateEnrollmentRecordDto {
  @IsMongoId()
  studentId: string;

  @IsMongoId()
  seasonId: string;

  @IsMongoId()
  classId: string;

  @IsString()
  section: string;

  @IsString()
  @IsOptional()
  rollNumber?: string;

  @IsEnum(['active', 'promoted', 'failed', 'repeated', 'left', 'graduated'])
  @IsOptional()
  status?: string;

  @IsNumber()
  @IsOptional()
  admissionFee?: number;

  @IsNumber()
  @IsOptional()
  monthlyFeeAmount?: number;

  @IsNumber()
  @IsOptional()
  examFee?: number;

  @IsNumber()
  @IsOptional()
  otherFees?: number;

  @IsDate()
  @Type(() => Date)
  @IsOptional()
  admissionDate?: Date;

  @IsString()
  @IsOptional()
  remarks?: string;
}

export class UpdateEnrollmentRecordDto extends CreateEnrollmentRecordDto {}

export class PayMonthlyFeeDto {
  @IsString()
  month: string;

  @IsNumber()
  @IsOptional()
  amount?: number;

  @IsString()
  @IsOptional()
  paymentMethod?: string;

  @IsString()
  @IsOptional()
  transactionId?: string;
}

export class BulkMonthlyFeesDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MonthlyFeeDto)
  monthlyFees: MonthlyFeeDto[];
}