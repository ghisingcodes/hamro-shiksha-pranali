import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Subject } from './subject.schema';
import { CreateSubjectDto, UpdateSubjectDto } from './subject.dto';

@Injectable()
export class SubjectService {
  constructor(@InjectModel(Subject.name) private subjectModel: Model<Subject>) {}

  async create(dto: CreateSubjectDto) {
    // Check if subject already exists for this class and season
    const existing = await this.subjectModel.findOne({
      classId: new Types.ObjectId(dto.classId),
      seasonId: new Types.ObjectId(dto.seasonId),
      schoolId: new Types.ObjectId(dto.schoolId),
      name: dto.name,
    });
    
    if (existing) {
      throw new BadRequestException(`Subject ${dto.name} already exists for this class and season`);
    }
    
    const subject = new this.subjectModel({
      ...dto,
      classId: new Types.ObjectId(dto.classId),
      seasonId: new Types.ObjectId(dto.seasonId),
      schoolId: new Types.ObjectId(dto.schoolId),
    });
    
    return subject.save();
  }

  async findAll(seasonId?: string, classId?: string, schoolId?: string) {
    try {
      const filter: any = {};
      
      if (seasonId) {
        filter.seasonId = new Types.ObjectId(seasonId);
      }
      
      if (classId) {
        filter.classId = new Types.ObjectId(classId);
      }
      
      if (schoolId) {
        filter.schoolId = new Types.ObjectId(schoolId);
      }
      
      console.log('Subject filter:', JSON.stringify(filter));
      
      const subjects = await this.subjectModel.find(filter)
        .populate('classId', 'displayName periodCount')
        .populate('seasonId', 'name')
        .sort({ name: 1 })
        .lean()
        .exec();
      
      console.log(`Found ${subjects.length} subjects`);
      return subjects;
    } catch (error) {
      console.error('Error in findAll subjects:', error);
      throw error;
    }
  }

  async findOne(id: string) {
    const subject = await this.subjectModel.findById(id)
      .populate('classId', 'displayName periodCount')
      .populate('seasonId', 'name')
      .lean()
      .exec();
    
    if (!subject) throw new NotFoundException('Subject not found');
    return subject;
  }

  async update(id: string, dto: UpdateSubjectDto) {
    const updateData: any = { ...dto };
    
    if (dto.classId) updateData.classId = new Types.ObjectId(dto.classId);
    if (dto.seasonId) updateData.seasonId = new Types.ObjectId(dto.seasonId);
    if (dto.schoolId) updateData.schoolId = new Types.ObjectId(dto.schoolId);
    
    const updated = await this.subjectModel.findByIdAndUpdate(id, updateData, { new: true });
    if (!updated) throw new NotFoundException('Subject not found');
    return updated;
  }

  async remove(id: string) {
    const result = await this.subjectModel.deleteOne({ _id: id });
    if (result.deletedCount === 0) throw new NotFoundException('Subject not found');
    return { success: true };
  }
}