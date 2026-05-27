import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { Teacher, TeacherStatus } from './teacher.schema';
import { CreateTeacherDto, UpdateTeacherDto, CreateUserAccountDto, RenewContractDto, TeacherLeaveDto } from './teacher.dto';
import { User, UserRole } from '../user/user.schema';
import { ClassSection } from '../class-section/class-section.schema';
import { AcademicSeason } from '../academic-season/academic-season.schema';
import { Class } from '../class/class.schema';

@Injectable()
export class TeacherService {
  constructor(
    @InjectModel(Teacher.name) private teacherModel: Model<Teacher>,
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(ClassSection.name) private classSectionModel: Model<ClassSection>,
    @InjectModel(AcademicSeason.name) private seasonModel: Model<AcademicSeason>,
    @InjectModel(Class.name) private classModel: Model<Class>,
  ) {}

  // In teacher.service.ts, add console logs
  async create(dto: CreateTeacherDto, schoolId: string) {
    console.log('TeacherService.create called with:', { dto, schoolId });
    
    if (!schoolId) {
      throw new BadRequestException('School ID is required');
    }

    const year = new Date().getFullYear();
    
    // Get the highest teacherId for this school to generate the next number
    const lastTeacher = await this.teacherModel
      .findOne({ schoolId: new Types.ObjectId(schoolId) })
      .sort({ teacherId: -1 })
      .exec();
    
    let nextNumber = 1;
    if (lastTeacher && lastTeacher.teacherId) {
      const match = lastTeacher.teacherId.match(/\d+$/);
      if (match) {
        nextNumber = parseInt(match[0]) + 1;
      }
    }
    
    const teacherId = `TCH-${year}-${String(nextNumber).padStart(5, '0')}`;
    console.log('Generated teacherId:', teacherId);
    
    if (dto.email) {
      const existingTeacher = await this.teacherModel.findOne({ 
        email: dto.email, 
        schoolId: new Types.ObjectId(schoolId) 
      });
      if (existingTeacher) {
        throw new BadRequestException('Teacher with this email already exists');
      }
    }
    
    const teacher = new this.teacherModel({ 
      ...dto, 
      teacherId, 
      status: TeacherStatus.ACTIVE,
      schoolId: new Types.ObjectId(schoolId)
    });
    
    await teacher.save();
    console.log('Teacher saved:', teacher._id);
    
    // Auto-create user account
    if (dto.email) {
      const existingUser = await this.userModel.findOne({ email: dto.email });
      if (!existingUser) {
        const defaultPassword = `TCH${teacherId.slice(-6)}`;
        const hashedPassword = await bcrypt.hash(defaultPassword, 10);
        
        const user = new this.userModel({
          email: dto.email,
          password: hashedPassword,
          name: dto.name,
          phone: dto.phone,
          role: UserRole.TEACHER,
          teacherId: teacher._id,
          schoolId: new Types.ObjectId(schoolId),
          isActive: true,
        });
        await user.save();
        
        teacher.userId = user._id;
        await teacher.save();
        
        return { teacher, user, defaultPassword };
      } else if (!teacher.userId) {
        teacher.userId = existingUser._id;
        await teacher.save();
      }
    }
    
    return { teacher };
  }

  async findAll(schoolId?: string, seasonId?: string) {
    const filter: any = {};
    if (schoolId) {
      filter.schoolId = new Types.ObjectId(schoolId);
    }
    
    const teachers = await this.teacherModel.find(filter).populate('userId').exec();
    
    if (seasonId) {
      const classSections = await this.classSectionModel.find({ seasonId: new Types.ObjectId(seasonId) }).populate('classId').exec();
      const teacherAssignments = new Map();
      
      for (const cs of classSections) {
        const className = (cs.classId as any)?.displayName || 'Unknown';
        for (const section of cs.sections) {
          for (const day of section.routine) {
            for (const period of day) {
              if (period.teacher) {
                const existing = teacherAssignments.get(period.teacher) || { subjects: new Set(), classes: new Set() };
                existing.subjects.add(period.subject);
                existing.classes.add(className);
                teacherAssignments.set(period.teacher, existing);
              }
            }
          }
        }
      }
      
      return teachers.map(teacher => {
        const assignments = teacherAssignments.get(teacher.name);
        return {
          ...teacher.toObject(),
          assignments: assignments ? { 
            subjects: Array.from(assignments.subjects), 
            classes: Array.from(assignments.classes) 
          } : { subjects: [], classes: [] },
        };
      });
    }
    
    return teachers;
  }

  async findOne(id: string) {
    const teacher = await this.teacherModel.findById(id).populate('userId');
    if (!teacher) throw new NotFoundException('Teacher not found');
    return teacher;
  }

  async update(id: string, dto: UpdateTeacherDto, schoolId: string) {
    if (dto.email) {
      const existingTeacher = await this.teacherModel.findOne({ 
        email: dto.email, 
        _id: { $ne: id },
        schoolId: new Types.ObjectId(schoolId)
      });
      if (existingTeacher) {
        throw new BadRequestException('Another teacher with this email already exists');
      }
    }
    
    const updated = await this.teacherModel.findByIdAndUpdate(id, dto, { new: true });
    if (!updated) throw new NotFoundException();
    return updated;
  }

  async remove(id: string) {
    const result = await this.teacherModel.deleteOne({ _id: id });
    if (result.deletedCount === 0) throw new NotFoundException();
    return { success: true };
  }

  async createUserAccount(teacherId: string, dto: CreateUserAccountDto, schoolId: string) {
    const teacher = await this.teacherModel.findById(teacherId);
    if (!teacher) throw new NotFoundException('Teacher not found');
    if (teacher.userId) throw new BadRequestException('Teacher already has a user account');
    
    const existingUser = await this.userModel.findOne({ email: dto.email });
    if (existingUser) throw new BadRequestException('Email already exists');
    
    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const user = new this.userModel({
      email: dto.email,
      password: hashedPassword,
      name: teacher.name,
      phone: teacher.phone,
      role: dto.role || UserRole.TEACHER,
      teacherId: teacher._id,
      schoolId: new Types.ObjectId(schoolId),
      isActive: true,
    });
    await user.save();
    
    teacher.userId = user._id;
    if (!teacher.email) teacher.email = dto.email;
    await teacher.save();
    
    return { user, teacher };
  }

  async renewContract(teacherId: string, dto: RenewContractDto) {
    const teacher = await this.teacherModel.findById(teacherId);
    if (!teacher) throw new NotFoundException('Teacher not found');
    
    const season = await this.seasonModel.findById(dto.seasonId);
    if (!season) throw new NotFoundException('Season not found');
    
    teacher.contractEndDate = dto.newEndDate;
    teacher.status = TeacherStatus.ACTIVE;
    
    teacher.contractHistory.push({
      seasonId: new Types.ObjectId(dto.seasonId),
      renewalDate: new Date(),
      endDate: dto.newEndDate,
    });
    
    await teacher.save();
    return teacher;
  }

  async processLeave(teacherId: string, dto: TeacherLeaveDto) {
    const teacher = await this.teacherModel.findById(teacherId);
    if (!teacher) throw new NotFoundException('Teacher not found');
    
    teacher.status = TeacherStatus.RESIGNED;
    teacher.lastWorkingDate = dto.lastWorkingDate;
    teacher.reasonForLeave = dto.reason;
    teacher.resignationDate = new Date();
    
    await teacher.save();
    return teacher;
  }
}