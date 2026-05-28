// apps/api/src/app/staff/staff.service.ts
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { Staff } from './staff.schema';
import { CreateStaffDto, UpdateStaffDto } from './staff.dto';
import { User, UserRole } from '../user/user.schema';

@Injectable()
export class StaffService {
  constructor(
    @InjectModel(Staff.name) private staffModel: Model<Staff>,
    @InjectModel(User.name) private userModel: Model<User>,
  ) {}

  async create(dto: CreateStaffDto, schoolId: string) {
    // Generate staff ID if not provided
    let staffId = dto.staffId;
    if (!staffId) {
      const year = new Date().getFullYear();
      const count = await this.staffModel.countDocuments({ schoolId: new Types.ObjectId(schoolId) });
      staffId = `STF-${year}-${String(count + 1).padStart(5, '0')}`;
    }
    
    const existing = await this.staffModel.findOne({ staffId });
    if (existing) throw new BadRequestException('Staff ID already exists');
    
    const staff = new this.staffModel({ 
      ...dto, 
      staffId,
      schoolId: new Types.ObjectId(schoolId)
    });
    await staff.save();
    
    // Auto-create user account for staff
    if (dto.email) {
      const existingUser = await this.userModel.findOne({ email: dto.email });
      if (!existingUser) {
        const defaultPassword = `STF${staffId.slice(-6)}`;
        const hashedPassword = await bcrypt.hash(defaultPassword, 10);
        
        // Determine role based on position
        let role = UserRole.STAFF;
        if (dto.position === 'Accountant' || dto.position === 'Administrative Officer') {
          role = UserRole.ADMIN;
        }
        
        const user = new this.userModel({
          email: dto.email,
          password: hashedPassword,
          name: dto.name,
          phone: dto.phone,
          role: role,
          staffId: staff._id,
          schoolId: new Types.ObjectId(schoolId),
          isActive: true,
        });
        await user.save();
        
        staff.userId = user._id;
        await staff.save();
        
        return { staff, user, defaultPassword };
      } else if (!staff.userId) {
        staff.userId = existingUser._id;
        await staff.save();
      }
    }
    
    return { staff };
  }

  async findAll(schoolId?: string) {
    const filter: any = {};
    if (schoolId) filter.schoolId = new Types.ObjectId(schoolId);
    return this.staffModel.find(filter).populate('userId').exec();
  }

  async findOne(id: string) {
    const staff = await this.staffModel.findById(id).populate('userId');
    if (!staff) throw new NotFoundException('Staff not found');
    return staff;
  }

  async update(id: string, dto: UpdateStaffDto) {
    const updated = await this.staffModel.findByIdAndUpdate(id, dto, { new: true });
    if (!updated) throw new NotFoundException();
    return updated;
  }

  async remove(id: string) {
    const result = await this.staffModel.deleteOne({ _id: id });
    if (result.deletedCount === 0) throw new NotFoundException();
    return { success: true };
  }
}