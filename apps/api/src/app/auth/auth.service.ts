import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { School } from '../school/school.schema';
import { User, UserRole } from '../user/user.schema';
import { SchoolSignupDto, LoginDto } from './auth.dto';

@Injectable()
export class AuthService {
  private readonly JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

  constructor(
    @InjectModel(School.name) private schoolModel: Model<School>,
    @InjectModel(User.name) private userModel: Model<User>,
  ) {}

  async schoolSignup(dto: SchoolSignupDto) {
    // Check if school already exists
    const existingSchool = await this.schoolModel.findOne({ name: dto.schoolName });
    if (existingSchool) {
      throw new BadRequestException('School already registered');
    }

    // Check if admin email already exists
    const existingUser = await this.userModel.findOne({ email: dto.adminEmail });
    if (existingUser) {
      throw new BadRequestException('Admin email already exists');
    }

    // Generate school ID
    const year = new Date().getFullYear();
    const schoolCount = await this.schoolModel.countDocuments();
    const schoolId = `SCH-${year}-${String(schoolCount + 1).padStart(5, '0')}`;

    // Create School
    const school = new this.schoolModel({
      schoolId,
      name: dto.schoolName,
      address: dto.schoolAddress,
      phone: dto.schoolPhone,
      email: dto.schoolEmail,
      panNumber: dto.panNumber,
      isActive: true,
    });
    await school.save();

    // Create Super Admin User
    const hashedPassword = await bcrypt.hash(dto.adminPassword, 10);
    const adminUser = new this.userModel({
      email: dto.adminEmail,
      password: hashedPassword,
      name: dto.adminName,
      phone: dto.adminPhone,
      role: UserRole.SUPER_ADMIN,
      schoolId: school._id,
      isActive: true,
    });
    await adminUser.save();

    // Generate token with schoolId
    const token = jwt.sign(
      { 
        id: adminUser._id, 
        email: adminUser.email, 
        role: adminUser.role, 
        schoolId: school._id.toString() 
      },
      this.JWT_SECRET,
      { expiresIn: '7d' }
    );

    return {
      token,
      user: {
        id: adminUser._id,
        name: adminUser.name,
        email: adminUser.email,
        role: adminUser.role,
        schoolId: school._id.toString(),
        schoolName: school.name,
      },
    };
  }

  async login(dto: LoginDto) {
    const user = await this.userModel.findOne({ email: dto.email }).populate('schoolId');
    if (!user) throw new UnauthorizedException('Invalid credentials');
    if (!user.isActive) throw new UnauthorizedException('Account is disabled');

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);
    if (!isPasswordValid) throw new UnauthorizedException('Invalid credentials');

    user.lastLogin = new Date();
    await user.save();

    // Generate token with schoolId
    const token = jwt.sign(
      { 
        id: user._id, 
        email: user.email, 
        role: user.role, 
        schoolId: user.schoolId?._id?.toString() || user.schoolId?.toString() 
      },
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
        schoolId: user.schoolId?._id?.toString() || user.schoolId?.toString(),
        schoolName: user.schoolId?.name,
      },
    };
  }
}