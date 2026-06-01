import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Section } from './section.schema';
import { 
  CreateSectionDto, 
  UpdateSectionDto,
  AssignClassTeacherDto, 
  AssignPeriodTeacherDto,
  EndTeacherAssignmentDto,
  EndClassTeacherDto
} from './section.dto';

@Injectable()
export class SectionService {
  constructor(@InjectModel(Section.name) private sectionModel: Model<Section>) {}

  async create(dto: CreateSectionDto) {
    console.log('Creating section with DTO:', dto);
    
    const existing = await this.sectionModel.findOne({
      classId: new Types.ObjectId(dto.classId),
      seasonId: new Types.ObjectId(dto.seasonId),
      schoolId: new Types.ObjectId(dto.schoolId),
      name: dto.name,
    });
    
    if (existing) {
      throw new BadRequestException(`Section ${dto.name} already exists for this class and season`);
    }
    
    const section = new this.sectionModel({
      classId: new Types.ObjectId(dto.classId),
      seasonId: new Types.ObjectId(dto.seasonId),
      schoolId: new Types.ObjectId(dto.schoolId),
      name: dto.name,
      periodTeachers: new Map(),
      classTeacherHistory: [],
    });
    
    const saved = await section.save();
    console.log('Section created:', saved._id);
    return saved;
  }

  async findAll(seasonId?: string, classId?: string, schoolId?: string) {
    try {
      const filter: any = {};
      
      if (seasonId) {
        try {
          filter.seasonId = new Types.ObjectId(seasonId);
        } catch {
          filter.seasonId = seasonId;
        }
      }
      
      if (classId) {
        try {
          filter.classId = new Types.ObjectId(classId);
        } catch {
          filter.classId = classId;
        }
      }
      
      if (schoolId) {
        try {
          filter.schoolId = new Types.ObjectId(schoolId);
        } catch {
          filter.schoolId = schoolId;
        }
      }
      
      console.log('Section filter:', JSON.stringify(filter));
      
      const sections = await this.sectionModel.find(filter)
        .populate('classId', 'displayName periodCount')
        .populate('seasonId', 'name')
        .populate('currentClassTeacherId', 'name')
        .populate('currentClassTeacherSubjectId', 'name')
        .lean()
        .exec();
      
      console.log(`Found ${sections.length} sections`);
      
      // Convert periodTeachers Map to plain object for frontend
      return sections.map(section => {
        let periodTeachersObj = {};
        
        if (section.periodTeachers) {
          if (section.periodTeachers instanceof Map) {
            periodTeachersObj = Object.fromEntries(section.periodTeachers);
          } else if (typeof section.periodTeachers === 'object' && section.periodTeachers !== null) {
            periodTeachersObj = section.periodTeachers;
          }
        }
        
        return {
          ...section,
          periodTeachers: periodTeachersObj,
        };
      });
    } catch (error) {
      console.error('Error in findAll sections:', error);
      throw error;
    }
  }

  async findOne(id: string) {
    const section = await this.sectionModel.findById(id)
      .populate('classId', 'displayName periodCount')
      .populate('seasonId', 'name')
      .populate('currentClassTeacherId', 'name')
      .populate('currentClassTeacherSubjectId', 'name')
      .populate('classTeacherHistory.teacherId', 'name')
      .populate('classTeacherHistory.subjectId', 'name')
      .lean()
      .exec();
    
    if (!section) throw new NotFoundException('Section not found');
    
    let periodTeachersObj = {};
    if (section.periodTeachers) {
      if (section.periodTeachers instanceof Map) {
        periodTeachersObj = Object.fromEntries(section.periodTeachers);
      } else if (typeof section.periodTeachers === 'object') {
        periodTeachersObj = section.periodTeachers;
      }
    }
    
    return {
      ...section,
      periodTeachers: periodTeachersObj,
    };
  }

  async update(id: string, dto: UpdateSectionDto) {
    const updated = await this.sectionModel.findByIdAndUpdate(id, dto, { new: true });
    if (!updated) throw new NotFoundException();
    return updated;
  }

  async remove(id: string, schoolId: string) {
    const result = await this.sectionModel.deleteOne({ 
      _id: id, 
      schoolId: new Types.ObjectId(schoolId)
    });
    if (result.deletedCount === 0) throw new NotFoundException();
    return { success: true };
  }

  async assignClassTeacher(sectionId: string, dto: AssignClassTeacherDto) {
    const section = await this.sectionModel.findById(sectionId);
    if (!section) throw new NotFoundException('Section not found');

    const assignedDate = dto.assignedDate || new Date();

    if (section.currentClassTeacherId) {
      const currentHistory = section.classTeacherHistory.find(h => !h.endDate);
      if (currentHistory) {
        currentHistory.endDate = assignedDate;
        currentHistory.reason = dto.reason || 'Replaced by new teacher';
      }
    }

    section.classTeacherHistory.push({
      teacherId: new Types.ObjectId(dto.teacherId),
      subjectId: new Types.ObjectId(dto.subjectId),
      assignedDate,
      endDate: null,
      reason: '',
    });

    section.currentClassTeacherId = new Types.ObjectId(dto.teacherId);
    section.currentClassTeacherSubjectId = new Types.ObjectId(dto.subjectId);

    await section.save();
    return this.findOne(sectionId);
  }

  async endClassTeacher(sectionId: string, dto: EndClassTeacherDto) {
    const section = await this.sectionModel.findById(sectionId);
    if (!section) throw new NotFoundException('Section not found');

    const endDate = dto.endDate || new Date();

    if (section.currentClassTeacherId) {
      const currentHistory = section.classTeacherHistory.find(h => !h.endDate);
      if (currentHistory) {
        currentHistory.endDate = endDate;
        currentHistory.reason = dto.reason || 'Teacher left';
      }
    }

    section.currentClassTeacherId = undefined;
    section.currentClassTeacherSubjectId = undefined;

    await section.save();
    return this.findOne(sectionId);
  }

  async assignPeriodTeacher(sectionId: string, dto: AssignPeriodTeacherDto) {
    const section = await this.sectionModel.findById(sectionId);
    if (!section) throw new NotFoundException('Section not found');

    const assignedDate = dto.assignedDate || new Date();
    const period = dto.period;

    let periodAssignments = section.periodTeachers?.get(period) || [];

    const currentActive = periodAssignments.find(a => !a.endDate);
    if (currentActive) {
      currentActive.endDate = assignedDate;
      currentActive.reason = dto.reason || 'Replaced by new teacher';
    }

    periodAssignments.push({
      teacherId: new Types.ObjectId(dto.teacherId),
      subjectId: new Types.ObjectId(dto.subjectId),
      days: dto.days,
      assignedDate,
      endDate: null,
      reason: '',
    });

    section.periodTeachers.set(period, periodAssignments);

    await section.save();
    return this.findOne(sectionId);
  }

  async endPeriodTeacher(sectionId: string, dto: EndTeacherAssignmentDto) {
    const section = await this.sectionModel.findById(sectionId);
    if (!section) throw new NotFoundException('Section not found');

    const endDate = dto.endDate || new Date();
    const period = dto.period;

    const periodAssignments = section.periodTeachers?.get(period) || [];
    
    const assignment = periodAssignments.find(a => 
      a.teacherId.toString() === dto.teacherId && !a.endDate
    );
    
    if (assignment) {
      assignment.endDate = endDate;
      assignment.reason = dto.reason || 'Assignment ended';
      section.periodTeachers.set(period, periodAssignments);
      await section.save();
    }

    return this.findOne(sectionId);
  }
}