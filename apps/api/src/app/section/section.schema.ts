// apps/api/src/app/section/section.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type WeekDays = 'M' | 'T' | 'W' | 'Th' | 'F';

@Schema({ _id: false })
export class ClassTeacherHistoryEntry {
  @Prop({ type: Types.ObjectId, ref: 'Teacher', required: true })
  teacherId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Subject', required: true })
  subjectId: Types.ObjectId;

  @Prop({ type: Date, default: Date.now })
  assignedDate: Date;

  @Prop({ type: Date, default: null })
  endDate: Date | null;

  @Prop({ type: String, default: '' })
  reason: string;
}

@Schema({ _id: false })
export class PeriodTeacherEntry {
  @Prop({ type: Types.ObjectId, ref: 'Teacher', required: true })
  teacherId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Subject', required: true })
  subjectId: Types.ObjectId;

  @Prop({ type: [String], enum: ['M', 'T', 'W', 'Th', 'F'], required: true })
  days: WeekDays[];

  @Prop({ type: Date, default: Date.now })
  assignedDate: Date;

  @Prop({ type: Date, default: null })
  endDate: Date | null;

  @Prop({ type: String, default: '' })
  reason: string;
}

@Schema({ timestamps: true })
export class Section extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Class', required: true })
  classId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'AcademicSeason', required: true })
  seasonId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'School', required: true })
  schoolId: Types.ObjectId;

  @Prop({ required: true })
  name: string;

  @Prop({ type: Types.ObjectId, ref: 'Teacher' })
  currentClassTeacherId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Subject' })
  currentClassTeacherSubjectId?: Types.ObjectId;

  @Prop({ type: [ClassTeacherHistoryEntry], default: [] })
  classTeacherHistory: ClassTeacherHistoryEntry[];

  @Prop({ type: Object, default: {} })
  periodTeachers: Record<number, PeriodTeacherEntry[]>;

  @Prop({ default: true })
  isActive: boolean;
}

export const SectionSchema = SchemaFactory.createForClass(Section);