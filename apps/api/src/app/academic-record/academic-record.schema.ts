// apps/api/src/app/academic-record/academic-record.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class AcademicRecord extends Document {
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

  @Prop({ type: Types.ObjectId, ref: 'AcademicRecord', default: null })
  previousAcademicRecordId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'AcademicRecord', default: null })
  nextAcademicRecordId?: Types.ObjectId;
}

export const AcademicRecordSchema = SchemaFactory.createForClass(AcademicRecord);