import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Class extends Document {
  @Prop({ required: true, unique: true })
  name: string;

  @Prop({ required: true })
  displayName: string;

  @Prop({ required: true })
  grade: number;

  @Prop({ required: true })
  periodCount: number;
}

export const ClassSchema = SchemaFactory.createForClass(Class);