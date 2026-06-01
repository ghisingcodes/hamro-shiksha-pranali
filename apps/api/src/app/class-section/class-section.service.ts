import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ClassSection } from './class-section.schema';
import { 
  CreateClassSectionDto, 
  AssignClassTeacherDto, 
  AssignPeriodTeacherDto,
  EndTeacherAssignmentDto,
  UpdateTeacherAssignmentDto
} from './class-section.dto';

@Injectable()
export class ClassSectionService {
  constructor(@InjectModel(ClassSection.name) private classSectionModel: Model<ClassSection>) {}

  async create(dto: CreateClassSectionDto) {
    if (!dto.classId) throw new BadRequestException('classId is required');
    if (!dto.seasonId) throw new BadRequestException('seasonId is required');
    if (!dto.schoolId) throw new BadRequestException('schoolId is required');
    
    const existing = await this.classSectionModel.findOne({
      classId: new Types.ObjectId(dto.classId),
      seasonId: new Types.ObjectId(dto.seasonId),
      schoolId: new Types.ObjectId(dto.schoolId),
    });
    
    if (existing) {
      existing.sections = dto.sections;
      await existing.save();
      return existing;
    }
    
    const classSection = new this.classSectionModel(dto);
    return classSection.save();
  }

  async addSection(id: string, sectionName: string) {
    const cs = await this.classSectionModel.findById(id);
    if (!cs) throw new NotFoundException('ClassSection not found');
    
    if (cs.sections.some(s => s.name === sectionName)) {
      throw new BadRequestException(`Section "${sectionName}" already exists`);
    }
    
    cs.sections.push({
      name: sectionName,
      periodTeachers: [],
      classTeacherHistory: [],
    });
    await cs.save();
    return cs;
  }

  async deleteSection(id: string, sectionName: string, schoolId: string) {
    const cs = await this.classSectionModel.findOne({ _id: id, schoolId: new Types.ObjectId(schoolId) });
    if (!cs) throw new NotFoundException('ClassSection not found');
    
    const sectionIndex = cs.sections.findIndex(s => s.name === sectionName);
    if (sectionIndex === -1) throw new NotFoundException('Section not found');
    
    cs.sections.splice(sectionIndex, 1);
    await cs.save();
    return cs;
  }

  async renameSection(id: string, oldName: string, newName: string) {
    const cs = await this.classSectionModel.findById(id);
    if (!cs) throw new NotFoundException('ClassSection not found');
    
    const section = cs.sections.find(s => s.name === oldName);
    if (!section) throw new NotFoundException('Section not found');
    
    if (cs.sections.some(s => s.name === newName)) {
      throw new BadRequestException(`Section "${newName}" already exists`);
    }
    
    section.name = newName;
    await cs.save();
    return cs;
  }

  async findAll(seasonId?: string, classId?: string, schoolId?: string) {
    const filter: any = {};
    if (seasonId) filter.seasonId = new Types.ObjectId(seasonId);
    if (classId) filter.classId = new Types.ObjectId(classId);
    if (schoolId) filter.schoolId = new Types.ObjectId(schoolId);
    return this.classSectionModel.find(filter)
      .populate('classId seasonId')
      .populate('sections.periodTeachers.assignments.teacherId')
      .populate('sections.classTeacherHistory.teacherId')
      .exec();
  }

  async findOne(id: string) {
    const cs = await this.classSectionModel.findById(id)
      .populate('classId seasonId')
      .populate('sections.periodTeachers.assignments.teacherId')
      .populate('sections.classTeacherHistory.teacherId')
      .exec();
    if (!cs) throw new NotFoundException('ClassSection not found');
    return cs;
  }

  async update(id: string, dto: CreateClassSectionDto) {
    const updated = await this.classSectionModel.findByIdAndUpdate(id, dto, { new: true });
    if (!updated) throw new NotFoundException();
    return updated;
  }

  async remove(id: string, schoolId: string) {
    const result = await this.classSectionModel.deleteOne({ 
      _id: id, 
      schoolId: new Types.ObjectId(schoolId) 
    });
    if (result.deletedCount === 0) throw new NotFoundException();
    return { success: true };
  }

  async assignClassTeacher(classSectionId: string, sectionIndex: number, dto: AssignClassTeacherDto) {
    const cs = await this.classSectionModel.findById(classSectionId);
    if (!cs) throw new NotFoundException('ClassSection not found');
    if (!cs.sections[sectionIndex]) throw new NotFoundException('Section not found');

    const section = cs.sections[sectionIndex];
    const assignedDate = dto.assignedDate || new Date();

    if (section.currentClassTeacherId) {
      const currentHistory = section.classTeacherHistory?.find(h => !h.endDate);
      if (currentHistory) {
        currentHistory.endDate = assignedDate;
      }
    }

    section.currentClassTeacherId = new Types.ObjectId(dto.teacherId);
    if (!section.classTeacherHistory) section.classTeacherHistory = [];
    section.classTeacherHistory.push({
      teacherId: new Types.ObjectId(dto.teacherId),
      assignedDate,
      endDate: null,
    });

    await cs.save();
    return cs;
  }

  async assignPeriodTeacher(classSectionId: string, sectionIndex: number, dto: AssignPeriodTeacherDto) {
    const cs = await this.classSectionModel.findById(classSectionId);
    if (!cs) throw new NotFoundException('ClassSection not found');
    if (!cs.sections[sectionIndex]) throw new NotFoundException('Section not found');

    const section = cs.sections[sectionIndex];
    const assignedDate = dto.assignedDate || new Date();

    let periodTeacher = section.periodTeachers?.find(p => p.period === dto.period);
    if (!periodTeacher) {
      periodTeacher = {
        period: dto.period,
        subject: dto.subject,
        assignments: [],
      };
      if (!section.periodTeachers) section.periodTeachers = [];
      section.periodTeachers.push(periodTeacher);
    } else {
      periodTeacher.subject = dto.subject;
    }

    const currentActive = periodTeacher.assignments.find(a => !a.endDate);
    if (currentActive) {
      currentActive.endDate = assignedDate;
    }

    periodTeacher.assignments.push({
      teacherId: new Types.ObjectId(dto.teacherId),
      days: dto.days as any,
      assignedDate,
      endDate: null,
    });

    await cs.save();
    return cs;
  }

  async endTeacherAssignment(classSectionId: string, sectionIndex: number, dto: EndTeacherAssignmentDto) {
    const cs = await this.classSectionModel.findById(classSectionId);
    if (!cs) throw new NotFoundException('ClassSection not found');
    if (!cs.sections[sectionIndex]) throw new NotFoundException('Section not found');

    const section = cs.sections[sectionIndex];
    const endDate = dto.endDate || new Date();

    const periodTeacher = section.periodTeachers?.find(p => p.period === dto.period);
    if (!periodTeacher) throw new NotFoundException('Period not found');

    const assignment = periodTeacher.assignments.find(a => a.teacherId.toString() === dto.teacherId && !a.endDate);
    if (assignment) {
      assignment.endDate = endDate;
    }

    await cs.save();
    return cs;
  }

  async getCurrentTeachers(classSectionId: string, sectionIndex: number, date: Date) {
    const cs = await this.classSectionModel.findById(classSectionId);
    if (!cs) throw new NotFoundException('ClassSection not found');
    if (!cs.sections[sectionIndex]) throw new NotFoundException('Section not found');

    const section = cs.sections[sectionIndex];
    const result: any = {
      className: (cs.classId as any)?.displayName,
      section: section.name,
      classTeacher: null,
      periodTeachers: [],
    };

    if (section.classTeacherHistory) {
      const activeClassTeacher = section.classTeacherHistory.find(h => 
        h.assignedDate <= date && (!h.endDate || h.endDate >= date)
      );
      if (activeClassTeacher) {
        result.classTeacher = activeClassTeacher.teacherId;
      }
    }

    if (section.periodTeachers) {
      for (const pt of section.periodTeachers) {
        const activeAssignment = pt.assignments.find(a => 
          a.assignedDate <= date && (!a.endDate || a.endDate >= date)
        );
        if (activeAssignment) {
          result.periodTeachers.push({
            period: pt.period,
            subject: pt.subject,
            teacher: activeAssignment.teacherId,
            days: activeAssignment.days,
          });
        }
      }
    }

    return result;
  }
}