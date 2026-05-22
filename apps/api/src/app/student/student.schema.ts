import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ _id: false })
class Parent {
  @Prop()
  id?: string;

  @Prop({ required: true })
  relation: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  phone: string;

  @Prop()
  email?: string;

  @Prop()
  occupation?: string;

  @Prop()
  workplace?: string;

  @Prop({ type: Number })
  monthlyIncome?: number;

  @Prop({ type: Number })
  yearlyIncome?: number;

  @Prop()
  education?: string;

  @Prop()
  contactPreference?: string;

  @Prop({ default: false })
  isPrimary: boolean;
}

@Schema({ timestamps: true })
export class Student extends Document {
  @Prop({ required: true, unique: true })
  studentId: string;

  @Prop({ required: true })
  name: string;

  @Prop()
  dateOfBirth?: Date;

  @Prop()
  gender?: string;

  @Prop()
  liveWith?: string;

  @Prop({ type: [String], default: [] })
  longTermHealth?: string[];

  @Prop({ type: [String], default: [] })
  abnormalBehaviour?: string[];

  @Prop()
  mobileAccess?: string;

  @Prop()
  internetAccess?: string;

  @Prop({ type: [Parent], default: [] })
  parents?: Parent[];

  @Prop()
  permanentAddress?: string;

  @Prop()
  temporaryAddress?: string;

  @Prop({ default: false })
  sameAddress?: boolean;
}

export const StudentSchema = SchemaFactory.createForClass(Student);