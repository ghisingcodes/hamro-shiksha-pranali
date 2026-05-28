import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class StudentActivity extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Student', required: true })
  studentId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'AcademicSeason', required: true })
  seasonId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Class', required: true })
  classId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'School', required: true })
  schoolId: Types.ObjectId;  // ← ADD THIS

  @Prop({ required: true })
  section: string;

  @Prop({ required: true })
  period: number;

  @Prop({ required: true })
  date: Date;

  // Homework
  @Prop({ default: null })
  homeworkStatus?: string;

  @Prop({ default: '' })
  homeworkIssue?: string;

  @Prop({ default: '' })
  homeworkPhoto?: string;

  // Classwork
  @Prop({ default: null })
  classworkStatus?: string;

  @Prop({ default: '' })
  classworkIssue?: string;

  @Prop({ default: '' })
  classworkPhoto?: string;

  // Practical
  @Prop({ default: null })
  practicalStatus?: string;

  @Prop({ default: '' })
  practicalIssue?: string;

  // Discipline
  @Prop({ default: null })
  disciplineStatus?: string;

  @Prop({ default: '' })
  disciplineIssue?: string;

  // Reading
  @Prop({ default: null })
  readingStatus?: string;

  @Prop({ default: '' })
  readingDifficulty?: string;

  // Writing
  @Prop({ default: null })
  writingStatus?: string;

  @Prop({ default: '' })
  writingPhoto?: string;

  // Health
  @Prop({ type: [String], default: [] })
  healthProblems?: string[];

  @Prop({ default: '' })
  healthOther?: string;

  @Prop({ default: '' })
  remarks?: string;

  @Prop({ type: Types.ObjectId, ref: 'Teacher' })
  markedBy?: Types.ObjectId;
}

export const StudentActivitySchema = SchemaFactory.createForClass(StudentActivity);