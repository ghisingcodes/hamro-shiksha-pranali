import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ _id: false })
export class MonthlyFee {
  @Prop({ required: true })
  month: string; // "January 2025", "February 2025"

  @Prop({ required: true })
  amount: number;

  @Prop({ default: false })
  isPaid: boolean;

  @Prop()
  paidDate?: Date;

  @Prop()
  paymentMethod?: string; // 'cash', 'bank', 'online'

  @Prop()
  transactionId?: string;
}

@Schema({ timestamps: true })
export class EnrollmentRecord extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Student', required: true })
  studentId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'AcademicSeason', required: true })
  seasonId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Class', required: true })
  classId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'School', required: true })
  schoolId: Types.ObjectId;

  @Prop({ required: true })
  section: string;

  @Prop({ default: '' })
  rollNumber: string;

  @Prop({ 
    type: String, 
    enum: ['active', 'promoted', 'failed', 'repeated', 'left', 'graduated'],
    default: 'active' 
  })
  status: string;

  @Prop({ type: Types.ObjectId, ref: 'EnrollmentRecord', default: null })
  previousEnrollmentId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'EnrollmentRecord', default: null })
  nextEnrollmentId?: Types.ObjectId;

  // Fee details
  @Prop({ default: 0 })
  admissionFee: number;

  @Prop({ default: 0 })
  monthlyFeeAmount: number;

  @Prop({ type: [MonthlyFee], default: [] })
  monthlyFees: MonthlyFee[];

  @Prop({ default: 0 })
  examFee: number;

  @Prop({ default: 0 })
  otherFees: number;

  @Prop({ default: 0 })
  totalFees: number;

  @Prop({ default: 0 })
  totalPaid: number;

  @Prop({ default: 0 })
  totalDue: number;

  @Prop({ default: null })
  admissionDate: Date;

  @Prop({ default: null })
  remarks?: string;
}

export const EnrollmentRecordSchema = SchemaFactory.createForClass(EnrollmentRecord);