// apps/api/src/app/class-section/class-section.service.ts
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ClassSection } from './class-section.schema';
import { CreateClassSectionDto, UpdateRoutineDto } from './class-section.dto';
import { Class } from '../class/class.schema';

@Injectable()
export class ClassSectionService {
  constructor(
    @InjectModel(ClassSection.name) private classSectionModel: Model<ClassSection>,
    @InjectModel(Class.name) private classModel: Model<Class>,
  ) {}

  async create(dto: CreateClassSectionDto) {
    // Validate required fields
    if (!dto.classId) throw new BadRequestException('classId is required');
    if (!dto.seasonId) throw new BadRequestException('seasonId is required');
    if (!dto.schoolId) throw new BadRequestException('schoolId is required');
    
    // Check if ClassSection already exists
    const existing = await this.classSectionModel.findOne({ 
      classId: new Types.ObjectId(dto.classId), 
      seasonId: new Types.ObjectId(dto.seasonId),
      schoolId: new Types.ObjectId(dto.schoolId)
    });
    if (existing) throw new BadRequestException('ClassSection already exists for this season');
    
    // Create new ClassSection
    const classSection = new this.classSectionModel({
      classId: new Types.ObjectId(dto.classId),
      seasonId: new Types.ObjectId(dto.seasonId),
      schoolId: new Types.ObjectId(dto.schoolId),
      sections: dto.sections || [],
    });
    return classSection.save();
  }

  async findAll(seasonId?: string, classId?: string, schoolId?: string) {
    const filter: any = {};
    if (seasonId) filter.seasonId = new Types.ObjectId(seasonId);
    if (classId) filter.classId = new Types.ObjectId(classId);
    if (schoolId) filter.schoolId = new Types.ObjectId(schoolId);
    return this.classSectionModel.find(filter).populate('classId seasonId').exec();
  }

  async findOne(id: string) {
    const cs = await this.classSectionModel.findById(id).populate('classId seasonId');
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

  async addSection(classSectionId: string, sectionName: string, schoolId: string) {
    const cs = await this.classSectionModel.findOne({ 
      _id: classSectionId, 
      schoolId: new Types.ObjectId(schoolId) 
    });
    if (!cs) throw new NotFoundException('ClassSection not found');
    
    if (cs.sections.some(s => s.name === sectionName))
      throw new BadRequestException(`Section "${sectionName}" already exists`);

    const classDoc = await this.classModel.findById(cs.classId);
    const periodCount = classDoc?.periodCount || 5;
    const routine = Array.from({ length: 5 }, () =>
      Array.from({ length: periodCount }, () => ({ subject: '', teacher: '' }))
    );
    cs.sections.push({ name: sectionName, routine });
    await cs.save();
    return cs;
  }

  async deleteSection(classSectionId: string, sectionName: string, schoolId: string) {
    const cs = await this.classSectionModel.findOne({ 
      _id: classSectionId, 
      schoolId: new Types.ObjectId(schoolId) 
    });
    if (!cs) throw new NotFoundException('ClassSection not found');
    
    const sectionIndex = cs.sections.findIndex(s => s.name === sectionName);
    if (sectionIndex === -1) throw new NotFoundException('Section not found');
    cs.sections.splice(sectionIndex, 1);
    await cs.save();
    return cs;
  }

  async renameSection(classSectionId: string, oldName: string, newName: string, schoolId: string) {
    const cs = await this.classSectionModel.findOne({ 
      _id: classSectionId, 
      schoolId: new Types.ObjectId(schoolId) 
    });
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

  async updateRoutine(classSectionId: string, dto: UpdateRoutineDto, schoolId: string) {
    const cs = await this.classSectionModel.findOne({ 
      _id: classSectionId, 
      schoolId: new Types.ObjectId(schoolId) 
    });
    if (!cs) throw new NotFoundException('ClassSection not found');
    
    const section = cs.sections[dto.sectionIndex];
    if (!section) throw new NotFoundException('Section not found');
    if (!section.routine[dto.day]) section.routine[dto.day] = [];
    section.routine[dto.day][dto.period] = { subject: dto.subject, teacher: dto.teacher };
    await cs.save();
    return cs;
  }
}