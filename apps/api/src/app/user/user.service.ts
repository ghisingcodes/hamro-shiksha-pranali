import { Injectable, NotFoundException, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { User, UserRole } from './user.schema';
import { CreateUserDto, UpdateUserDto, LoginDto, ChangePasswordDto } from './user.dto';

@Injectable()
export class UserService {
  private readonly JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

  constructor(@InjectModel(User.name) private userModel: Model<User>) {}

  async create(dto: CreateUserDto) {
    const existing = await this.userModel.findOne({ email: dto.email });
    if (existing) throw new BadRequestException('Email already exists');

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const user = new this.userModel({
      ...dto,
      password: hashedPassword,
      passwordChanged: dto.passwordChanged ?? false,
    });
    return user.save();
  }

  async login(dto: LoginDto) {
    const user = await this.userModel.findOne({ email: dto.email });
    if (!user) throw new UnauthorizedException('Invalid credentials');
    if (!user.isActive) throw new UnauthorizedException('Account is disabled');

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);
    if (!isPasswordValid) throw new UnauthorizedException('Invalid credentials');

    user.lastLogin = new Date();
    await user.save();

    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role, passwordChanged: user.passwordChanged },
      this.JWT_SECRET,
      { expiresIn: '7d' }
    );

    return {
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        permissions: user.permissions,
        passwordChanged: user.passwordChanged,
      },
    };
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.userModel.findById(userId);
    if (!user) throw new NotFoundException('User not found');

    const isPasswordValid = await bcrypt.compare(dto.oldPassword, user.password);
    if (!isPasswordValid) throw new UnauthorizedException('Current password is incorrect');

    const hashedPassword = await bcrypt.hash(dto.newPassword, 10);
    user.password = hashedPassword;
    user.passwordChanged = true;  // ← MARK AS CHANGED
    await user.save();

    return { success: true, message: 'Password changed successfully' };
  }

  async resetPassword(userId: string, newPassword: string) {
    const user = await this.userModel.findById(userId);
    if (!user) throw new NotFoundException('User not found');

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    user.passwordChanged = true;
    await user.save();

    return { success: true, message: 'Password reset successfully' };
  }

  async findAll(role?: string, schoolId?: string) {
    const filter: any = {};
    if (role) filter.role = role;
    if (schoolId) filter.schoolId = schoolId;
    return this.userModel.find(filter).populate('teacherId staffId schoolId').exec();
  }

  async findOne(id: string) {
    const user = await this.userModel.findById(id).populate('teacherId staffId');
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async update(id: string, dto: UpdateUserDto) {
    const updateData: any = { ...dto };
    
    if (dto.password) {
      updateData.password = await bcrypt.hash(dto.password, 10);
      updateData.passwordChanged = true;
    }
    
    // Remove undefined values
    Object.keys(updateData).forEach(key => updateData[key] === undefined && delete updateData[key]);
    
    const updated = await this.userModel.findByIdAndUpdate(id, updateData, { new: true });
    if (!updated) throw new NotFoundException();
    return updated;
  }

  async remove(id: string) {
    const result = await this.userModel.deleteOne({ _id: id });
    if (result.deletedCount === 0) throw new NotFoundException();
    return { success: true };
  }

  async toggleStatus(id: string) {
    const user = await this.userModel.findById(id);
    if (!user) throw new NotFoundException();
    user.isActive = !user.isActive;
    await user.save();
    return user;
  }


  async updatePassword(id: string, password: string, passwordChanged: boolean = true) {
    const hashedPassword = await bcrypt.hash(password, 10);
    const updated = await this.userModel.findByIdAndUpdate(
      id, 
      { password: hashedPassword, passwordChanged },
      { new: true }
    );
    if (!updated) throw new NotFoundException();
    return updated;
  }
}