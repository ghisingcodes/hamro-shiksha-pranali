import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class AcademicSeason extends Document {
  @Prop({ required: true, unique: true })
  name: string;

  @Prop({ required: true })
  startDate: Date;

  @Prop({ required: true })
  endDate: Date;

  @Prop({ default: false })
  isActive: boolean;
}

export const AcademicSeasonSchema = SchemaFactory.createForClass(AcademicSeason);