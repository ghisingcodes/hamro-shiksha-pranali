import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ _id: false })
export class Section {
  @Prop({ required: true })
  name: string;

  @Prop({ type: [[{ subject: String, teacher: String }]], default: [] })
  routine: { subject: string; teacher: string }[][];
}

@Schema({ timestamps: true })
export class ClassSection extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Class', required: true })
  classId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'AcademicSeason', required: true })
  seasonId: Types.ObjectId;

  @Prop({ type: [Section], default: [] })
  sections: Section[];

  @Prop({ type: Types.ObjectId, ref: 'School', required: true })
  schoolId: Types.ObjectId;
}

export const ClassSectionSchema = SchemaFactory.createForClass(ClassSection);