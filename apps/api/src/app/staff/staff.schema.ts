import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Staff extends Document {
  @Prop({ required: true, unique: true })
  staffId: string; // e.g., "STAFF-001"

  @Prop({ required: true })
  name: string;

  @Prop()
  phone?: string;

  @Prop()
  email?: string;

  @Prop()
  position?: string; // Accountant, Librarian, Receptionist, etc.

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
}

export const StaffSchema = SchemaFactory.createForClass(Staff);