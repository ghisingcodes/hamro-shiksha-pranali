import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class School extends Document {
  @Prop({ required: true, unique: true })
  schoolId: string; // Auto-generated: SCH-YYYY-00001

  @Prop({ required: true })
  name: string;

  @Prop()
  address?: string;

  @Prop()
  phone?: string;

  @Prop()
  email?: string;

  @Prop()
  panNumber?: string;

  @Prop()
  registrationNumber?: string;

  @Prop()
  establishedYear?: number;

  @Prop()
  principalName?: string;

  @Prop()
  vicePrincipalName?: string;

  @Prop()
  website?: string;

  @Prop()
  schoolLogo?: string;

  @Prop()
  coverPhoto?: string;

  @Prop()
  themeColor?: string;

  @Prop({ default: true })
  isActive: boolean;
}

export const SchoolSchema = SchemaFactory.createForClass(School);