import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type WeekDays = 'M' | 'T' | 'W' | 'Th' | 'F';

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

  @Prop({ type: [{
    teacherId: { type: Types.ObjectId, ref: 'Teacher', required: true },
    subjectId: { type: Types.ObjectId, ref: 'Subject', required: true },
    assignedDate: { type: Date, default: Date.now },
    endDate: { type: Date, default: null },
    reason: { type: String, default: '' },
  }], default: [] })
  classTeacherHistory: Array<{
    teacherId: Types.ObjectId;
    subjectId: Types.ObjectId;
    assignedDate: Date;
    endDate: Date | null;
    reason: string;
  }>;

  @Prop({ type: Map, of: [{
    teacherId: { type: Types.ObjectId, ref: 'Teacher', required: true },
    subjectId: { type: Types.ObjectId, ref: 'Subject', required: true },
    days: { type: [String], enum: ['M', 'T', 'W', 'Th', 'F'], required: true },
    assignedDate: { type: Date, default: Date.now },
    endDate: { type: Date, default: null },
    reason: { type: String, default: '' },
  }], default: new Map() })
  periodTeachers: Map<number, {
    teacherId: Types.ObjectId;
    subjectId: Types.ObjectId;
    days: WeekDays[];
    assignedDate: Date;
    endDate: Date | null;
    reason: string;
  }[]>;

  @Prop({ default: true })
  isActive: boolean;
}

export const SectionSchema = SchemaFactory.createForClass(Section);