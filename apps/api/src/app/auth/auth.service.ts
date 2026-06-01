import { Injectable, BadRequestException, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { School } from '../school/school.schema';
import { User, UserRole } from '../user/user.schema';
import { Student } from '../student/student.schema';
import { Teacher } from '../teacher/teacher.schema';
import { AcademicRecord } from '../academic-record/academic-record.schema';
import { SchoolSignupDto, LoginDto, SuperAdminLoginDto } from './auth.dto';

@Injectable()
export class AuthService {
  private readonly JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

  constructor(
    @InjectModel(School.name) private schoolModel: Model<School>,
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Student.name) private studentModel: Model<Student>,
    @InjectModel(Teacher.name) private teacherModel: Model<Teacher>,
    @InjectModel(AcademicRecord.name) private academicRecordModel: Model<AcademicRecord>,
  ) {}

  async schoolSignup(dto: SchoolSignupDto) {
    // Check if school already exists
    const existingSchool = await this.schoolModel.findOne({ 
      $or: [{ name: dto.schoolName }, { slug: dto.slug }] 
    });
    if (existingSchool) {
      throw new BadRequestException('School with this name or slug already exists');
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
      slug: dto.slug,
      address: dto.schoolAddress,
      phone: dto.schoolPhone,
      email: dto.schoolEmail,
      panNumber: dto.panNumber,
      isActive: true,
    });
    await school.save();

    // Create School Admin User
    const hashedPassword = await bcrypt.hash(dto.adminPassword, 10);
    const adminUser = new this.userModel({
      email: dto.adminEmail,
      password: hashedPassword,
      name: dto.adminName,
      phone: dto.adminPhone,
      role: UserRole.SCHOOL_ADMIN,
      schoolId: school._id,
      isActive: true,
    });
    await adminUser.save();

    // Generate token
    const token = jwt.sign(
      { 
        id: adminUser._id, 
        email: adminUser.email, 
        role: adminUser.role, 
        userType: 'school_admin',
        schoolId: school._id.toString(),
        schoolSlug: school.slug,
        name: adminUser.name,
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
        userType: 'school_admin',
        schoolId: school._id.toString(),
        schoolName: school.name,
        schoolSlug: school.slug,
      },
    };
  }

  async loginWithSchool(slug: string, dto: LoginDto) {
    const school = await this.schoolModel.findOne({ slug, isActive: true });
    if (!school) {
      throw new NotFoundException('School not found');
    }

    const { userType } = dto;

    if (userType === 'student') {
      return this.loginStudent(dto, school);
    } else if (userType === 'parent') {
      return this.loginParent(dto, school);
    } else if (userType === 'teacher') {
      return this.loginTeacher(dto, school);
    }

    throw new UnauthorizedException('Invalid login type');
  }

  async superAdminLogin(slug: string, dto: SuperAdminLoginDto) {
    // First verify school exists
    const school = await this.schoolModel.findOne({ slug, isActive: true });
    if (!school) {
      throw new NotFoundException('School not found');
    }

    // Find school admin user
    const user = await this.userModel.findOne({
      $or: [{ email: dto.identifier }, { phone: dto.identifier }],
      role: { $in: [UserRole.SCHOOL_ADMIN, UserRole.SUPER_ADMIN] },
      schoolId: school._id,
    }).populate('schoolId');

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is disabled');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    user.lastLogin = new Date();
    await user.save();

    let userType = 'school_admin';
    if (user.role === UserRole.SUPER_ADMIN) userType = 'super_admin';

    const token = jwt.sign(
      { 
        id: user._id,
        userId: user._id,
        name: user.name,
        role: user.role,
        userType,
        schoolId: school._id.toString(),
        schoolSlug: school.slug,
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
        userType,
        schoolId: school._id.toString(),
        schoolName: school.name,
        schoolSlug: school.slug,
      },
    };
  }

  private async loginStudent(dto: LoginDto, school: any) {
    const { rollNumber, className, section, dateOfBirth } = dto;

    if (!rollNumber || !className || !section || !dateOfBirth) {
      throw new BadRequestException('Missing required fields for student login');
    }

    const academicRecord = await this.academicRecordModel
      .findOne({ rollNumber, section, schoolId: school._id })
      .populate('studentId classId seasonId')
      .exec();

    if (!academicRecord) {
      throw new UnauthorizedException('Student not found');
    }

    const student = academicRecord.studentId as any;
    const studentDOB = student.dateOfBirth ? new Date(student.dateOfBirth).toDateString() : null;
    const inputDOB = new Date(dateOfBirth).toDateString();

    if (!studentDOB || studentDOB !== inputDOB) {
      throw new UnauthorizedException('Invalid date of birth');
    }

    const token = jwt.sign(
      { 
        id: student._id,
        studentId: student._id,
        name: student.name,
        role: 'student',
        userType: 'student',
        schoolId: school._id.toString(),
        schoolSlug: school.slug,
        className,
        section,
        rollNumber,
      },
      this.JWT_SECRET,
      { expiresIn: '7d' }
    );

    return {
      token,
      user: {
        id: student._id,
        name: student.name,
        userType: 'student',
        role: 'student',
        schoolId: school._id.toString(),
        schoolName: school.name,
        schoolSlug: school.slug,
        className,
        section,
        rollNumber,
      },
    };
  }

  private async loginParent(dto: LoginDto, school: any) {
    const { identifier, rollNumber, className, section } = dto;

    if (!identifier || !rollNumber || !className || !section) {
      throw new BadRequestException('Missing required fields for parent login');
    }

    const academicRecord = await this.academicRecordModel
      .findOne({ rollNumber, section, schoolId: school._id })
      .populate('studentId classId seasonId')
      .exec();

    if (!academicRecord) {
      throw new UnauthorizedException('Student not found');
    }

    const student = academicRecord.studentId as any;

    const isParentMatch = student.parents?.some(
      (parent: any) => parent.phone === identifier || parent.email === identifier
    );

    if (!isParentMatch) {
      throw new UnauthorizedException('Invalid parent credentials');
    }

    const token = jwt.sign(
      { 
        id: student._id,
        studentId: student._id,
        name: student.name,
        role: 'parent',
        userType: 'parent',
        schoolId: school._id.toString(),
        schoolSlug: school.slug,
      },
      this.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Find all children of this parent
    const allChildren = await this.academicRecordModel
      .find({ schoolId: school._id })
      .populate('studentId classId')
      .exec();
    
    const children = allChildren.filter(record => {
      const s = record.studentId as any;
      return s.parents?.some((p: any) => p.phone === identifier || p.email === identifier);
    }).map(record => ({
      id: (record.studentId as any)._id,
      name: (record.studentId as any).name,
      className: (record.classId as any)?.displayName,
      section: record.section,
      rollNumber: record.rollNumber,
    }));

    return {
      token,
      user: {
        id: student._id,
        name: student.name,
        userType: 'parent',
        role: 'parent',
        schoolId: school._id.toString(),
        schoolName: school.name,
        schoolSlug: school.slug,
        children,
      },
    };
  }

  private async loginTeacher(dto: LoginDto, school: any) {
    const { identifier, password } = dto;

    if (!identifier || !password) {
      throw new BadRequestException('Missing email/phone or password');
    }

    const user = await this.userModel.findOne({
      $or: [{ email: identifier }, { phone: identifier }],
      schoolId: school._id,
      role: { $in: ['teacher', 'admin'] },
    }).populate('schoolId');

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is disabled');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    let teacher = null;
    if (user.teacherId) {
      teacher = await this.teacherModel.findById(user.teacherId);
    }

    user.lastLogin = new Date();
    await user.save();

    const token = jwt.sign(
      { 
        id: user._id,
        userId: user._id,
        name: user.name,
        role: user.role,
        userType: 'teacher',
        schoolId: school._id.toString(),
        schoolSlug: school.slug,
        teacherId: teacher?._id,
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
        userType: 'teacher',
        schoolId: school._id.toString(),
        schoolName: school.name,
        schoolSlug: school.slug,
        teacherId: teacher?._id,
      },
    };
  }
}