import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export enum UserRole {
  SUPER_ADMIN = 'super_admin',
  SCHOOL_ADMIN = 'school_admin',
  ADMIN = 'admin',
  TEACHER = 'teacher',
  STAFF = 'staff',
  PARENT = 'parent',
}

@Schema({ timestamps: true })
export class User extends Document {
  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ required: true })
  name: string;

  @Prop()
  phone?: string;

  @Prop({ type: String, enum: UserRole, default: UserRole.TEACHER })
  role: UserRole;

  @Prop({ type: Types.ObjectId, ref: 'School', required: function() {
    return this.role !== UserRole.SUPER_ADMIN;
  } })
  schoolId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Teacher' })
  teacherId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Staff' })
  staffId?: Types.ObjectId;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: null })
  lastLogin?: Date;

  @Prop({ type: [String], default: [] })
  permissions: string[];

  @Prop({ default: false })
  isEmailVerified: boolean;

  @Prop({ default: false })
  passwordChanged: boolean;  // ← ADD THIS FIELD

  @Prop()
  profilePicture?: string;
}

export const UserSchema = SchemaFactory.createForClass(User);