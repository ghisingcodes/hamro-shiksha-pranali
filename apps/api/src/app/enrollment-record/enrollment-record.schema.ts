import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class EnrollmentRecord extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Student', required: true })
  studentId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'AcademicSeason', required: true })
  seasonId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Class', required: true })
  classId: Types.ObjectId;

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
  tuitionFee: number;

  @Prop({ default: 0 })
  examFee: number;

  @Prop({ default: 0 })
  otherFees: number;

  @Prop({ default: 0 })
  totalFees: number;

  @Prop({ default: 0 })
  paidAmount: number;

  @Prop({ default: 0 })
  dueAmount: number;

  @Prop({ default: null })
  admissionDate: Date;

  @Prop({ default: null })
  remarks?: string;
}

export const EnrollmentRecordSchema = SchemaFactory.createForClass(EnrollmentRecord);