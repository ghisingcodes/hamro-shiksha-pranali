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
    const existing = await this.classSectionModel.findOne({ classId: dto.classId, seasonId: dto.seasonId });
    if (existing) throw new BadRequestException('ClassSection already exists for this season');
    return new this.classSectionModel(dto).save();
  }

  async getSections(seasonId: string, classId: string) {
    const cs = await this.classSectionModel.findOne({
      seasonId: new Types.ObjectId(seasonId),
      classId: new Types.ObjectId(classId),
    });
    if (!cs) return [];
    return cs.sections.map(s => s.name);
  }

  async findAll(seasonId?: string, classId?: string) {
    const filter: any = {};
    if (seasonId) filter.seasonId = { $in: [seasonId, new Types.ObjectId(seasonId)] };
    if (classId) filter.classId = { $in: [classId, new Types.ObjectId(classId)] };
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

  async renameSection(classSectionId: string, oldName: string, newName: string) {
    const cs = await this.classSectionModel.findById(classSectionId);
    if (!cs) throw new NotFoundException('ClassSection not found');
    const section = cs.sections.find(s => s.name === oldName);
    if (!section) throw new NotFoundException('Section not found');
    if (cs.sections.some(s => s.name === newName)) {
      throw new BadRequestException('Section name already exists');
    }
    section.name = newName;
    await cs.save();
    return cs;
  }

  async remove(id: string) {
    const result = await this.classSectionModel.deleteOne({ _id: id });
    if (result.deletedCount === 0) throw new NotFoundException();
    return { success: true };
  }

  async addSection(classSectionId: string, sectionName: string) {
    const cs = await this.classSectionModel.findById(classSectionId);
    if (!cs) throw new NotFoundException();
    if (cs.sections.some(s => s.name === sectionName))
      throw new BadRequestException('Section already exists');

    const classDoc = await this.classModel.findById(cs.classId);
    const periodCount = classDoc.periodCount;
    const routine = Array.from({ length: 5 }, () =>
      Array.from({ length: periodCount }, () => ({ subject: '', teacher: '' }))
    );
    cs.sections.push({ name: sectionName, routine });
    await cs.save();
    return cs;
  }

  async updateRoutine(classSectionId: string, dto: UpdateRoutineDto) {
    const cs = await this.classSectionModel.findById(classSectionId);
    if (!cs) throw new NotFoundException();
    const section = cs.sections[dto.sectionIndex];
    if (!section) throw new NotFoundException('Section not found');
    if (!section.routine[dto.day]) section.routine[dto.day] = [];
    section.routine[dto.day][dto.period] = { subject: dto.subject, teacher: dto.teacher };
    await cs.save();
    return cs;
  }

  async getTeacherSchedule(teacherName: string) {
    const all = await this.classSectionModel.find().populate('classId seasonId');
    const schedule = [];
    for (const cs of all) {
      for (let sIdx = 0; sIdx < cs.sections.length; sIdx++) {
        const section = cs.sections[sIdx];
        const assignments = [];
        for (let day = 0; day < 5; day++) {
          const dayAssignments = [];
          for (let period = 0; period < (cs.classId as any).periodCount; period++) {
            const entry = section.routine[day]?.[period];
            if (entry && entry.teacher === teacherName) {
              dayAssignments.push({ period, subject: entry.subject });
            }
          }
          assignments.push(dayAssignments);
        }
        if (assignments.some(day => day.length > 0)) {
          schedule.push({
            season: (cs.seasonId as any).name,
            className: (cs.classId as any).displayName,
            section: section.name,
            assignments,
          });
        }
      }
    }
    return schedule;
  }


  async deleteSection(classSectionId: string, sectionName: string) {
    const cs = await this.classSectionModel.findById(classSectionId);
    if (!cs) throw new NotFoundException('ClassSection not found');
    const sectionIndex = cs.sections.findIndex(s => s.name === sectionName);
    if (sectionIndex === -1) throw new NotFoundException('Section not found');
    cs.sections.splice(sectionIndex, 1);
    await cs.save();
    return cs;
  }
}