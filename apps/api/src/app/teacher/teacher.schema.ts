import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export enum TeacherStatus {
  ACTIVE = 'active',
  ON_LEAVE = 'on_leave',
  RESIGNED = 'resigned',
  TERMINATED = 'terminated',
  CONTRACT_ENDED = 'contract_ended',
}

export enum EmploymentType {
  PERMANENT = 'permanent',
  CONTRACT = 'contract',
  PART_TIME = 'part_time',
  VISITING = 'visiting',
}

@Schema({ timestamps: true })
export class Teacher extends Document {
  @Prop({ required: true, unique: true })
  teacherId: string;

  @Prop({ required: true })
  name: string;

  @Prop()
  phone?: string;

  @Prop()
  email?: string;

  @Prop()
  address?: string;

  @Prop()
  qualification?: string;

  @Prop()
  experience?: number;

  @Prop()
  joiningDate?: Date;

  @Prop()
  contractStartDate?: Date;

  @Prop()
  contractEndDate?: Date;

  @Prop()
  resignationDate?: Date;

  @Prop()
  lastWorkingDate?: Date;

  @Prop()
  reasonForLeave?: string;

  @Prop({ type: String, enum: EmploymentType, default: EmploymentType.CONTRACT })
  employmentType: EmploymentType;

  @Prop({ type: String, enum: TeacherStatus, default: TeacherStatus.ACTIVE })
  status: TeacherStatus;

  @Prop({ type: [String], default: [] })
  subjects: string[];

  @Prop({ default: '' })
  profilePicture?: string;

  @Prop({ type: Types.ObjectId, ref: 'School', required: true })
  schoolId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  userId?: Types.ObjectId;

  @Prop({ type: [{ seasonId: { type: Types.ObjectId, ref: 'AcademicSeason' }, renewalDate: Date, endDate: Date }], default: [] })
  contractHistory: Array<{
    seasonId: Types.ObjectId;
    renewalDate: Date;
    endDate: Date;
  }>;

  @Prop({ default: true })
  isActive: boolean;
}

export const TeacherSchema = SchemaFactory.createForClass(Teacher);