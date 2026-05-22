import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Attendance extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Student', required: true })
  studentId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'AcademicSeason', required: true })
  seasonId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Class', required: true })
  classId: Types.ObjectId;

  @Prop({ required: true })
  section: string;

  @Prop({ required: true })
  date: Date;

  @Prop({ 
    type: String, 
    enum: ['present', 'absent', 'late', 'half-day', 'holiday'],
    default: 'absent'
  })
  status: string;

  @Prop()
  absentReason?: string;

  @Prop({ type: [String], default: [] })
  hygieneIssues?: string[];

  @Prop()
  remarks?: string;

  @Prop({ type: Types.ObjectId, ref: 'Teacher' })
  markedBy?: Types.ObjectId;
}

export const AttendanceSchema = SchemaFactory.createForClass(Attendance);