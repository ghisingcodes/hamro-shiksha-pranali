import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Class extends Document {
  @Prop({ required: true })
  name: string; // "Class 5"

  @Prop({ required: true })
  displayName: string; // "Class 5"

  @Prop({ required: true })
  grade: number; // 0=Nursery, 1=LKG, 2=UKG, 3=Class1, ... 12=Class10

  @Prop({ required: true })
  periodCount: number; // 5 for grade <=3, else 7

  @Prop({ type: Types.ObjectId, ref: 'School', required: true })
  schoolId: Types.ObjectId;

  @Prop({ default: true })
  isActive: boolean;
}

export const ClassSchema = SchemaFactory.createForClass(Class);