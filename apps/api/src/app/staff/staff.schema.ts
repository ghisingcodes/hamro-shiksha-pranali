// apps/api/src/app/staff/staff.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Staff extends Document {
  @Prop({ required: true, unique: true })
  staffId: string;

  @Prop({ required: true })
  name: string;

  @Prop()
  phone?: string;

  @Prop()
  email?: string;

  @Prop()
  position?: string;

  @Prop()
  department?: string;

  @Prop()
  joiningDate?: Date;

  @Prop()
  salary?: number;

  @Prop({ default: '' })
  address?: string;

  @Prop({ default: '' })
  emergencyContact?: string;

  @Prop({ type: Types.ObjectId, ref: 'School' })
  schoolId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  userId?: Types.ObjectId;
}

export const StaffSchema = SchemaFactory.createForClass(Staff);