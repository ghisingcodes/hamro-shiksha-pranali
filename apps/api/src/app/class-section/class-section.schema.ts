import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type WeekDays = 'M' | 'T' | 'W' | 'Th' | 'F';

@Schema({ _id: false })
export class TeacherAssignment {
  @Prop({ type: Types.ObjectId, ref: 'Teacher', required: true })
  teacherId: Types.ObjectId;

  @Prop({ type: [String], enum: ['M', 'T', 'W', 'Th', 'F'], required: true })
  days: WeekDays[];

  @Prop({ type: Date, required: true })
  assignedDate: Date;

  @Prop({ type: Date, default: null })
  endDate: Date | null;
}

@Schema({ _id: false })
export class PeriodTeacher {
  @Prop({ type: Number, required: true })
  period: number;

  @Prop({ type: String, required: true })
  subject: string;

  @Prop({ type: [TeacherAssignment], default: [] })
  assignments: TeacherAssignment[];
}

@Schema({ _id: false })
export class ClassTeacherHistory {
  @Prop({ type: Types.ObjectId, ref: 'Teacher', required: true })
  teacherId: Types.ObjectId;

  @Prop({ type: Date, required: true })
  assignedDate: Date;

  @Prop({ type: Date, default: null })
  endDate: Date | null;
}

@Schema({ _id: false })
export class Section {
  @Prop({ type: String, required: true })
  name: string;

  @Prop({ type: Types.ObjectId, ref: 'Teacher' })
  currentClassTeacherId?: Types.ObjectId;

  @Prop({ type: [ClassTeacherHistory], default: [] })
  classTeacherHistory: ClassTeacherHistory[];

  @Prop({ type: [PeriodTeacher], default: [] })
  periodTeachers: PeriodTeacher[];
}

@Schema({ timestamps: true })
export class ClassSection extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Class', required: true })
  classId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'AcademicSeason', required: true })
  seasonId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'School', required: true })
  schoolId: Types.ObjectId;

  @Prop({ type: [Section], default: [] })
  sections: Section[];
}

export const ClassSectionSchema = SchemaFactory.createForClass(ClassSection);