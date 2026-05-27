// apps/api/src/app/academic-season/academic-season.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { AcademicSeason } from './academic-season.schema';
import { CreateAcademicSeasonDto } from './academic-season.dto';
import { ClassSection } from '../class-section/class-section.schema';

@Injectable()
export class AcademicSeasonService {
  constructor(
    @InjectModel(AcademicSeason.name) private seasonModel: Model<AcademicSeason>,
    @InjectModel(ClassSection.name) private classSectionModel: Model<ClassSection>,
  ) {}

  async create(dto: CreateAcademicSeasonDto) {
    console.log('Creating season with dto:', dto);
    if (!dto.schoolId) {
      throw new Error('schoolId is required');
    }
    const season = new this.seasonModel({
      ...dto,
      schoolId: new Types.ObjectId(dto.schoolId),
    });
    return season.save();
  }

  async findAll(schoolId: string) {
    console.log('Finding seasons for schoolId:', schoolId);
    if (!schoolId) {
      return [];
    }
    return this.seasonModel.find({ schoolId: new Types.ObjectId(schoolId) }).exec();
  }

  async findOne(id: string) {
    const season = await this.seasonModel.findById(id);
    if (!season) throw new NotFoundException('Season not found');
    return season;
  }

  async update(id: string, dto: CreateAcademicSeasonDto) {
    const updated = await this.seasonModel.findByIdAndUpdate(id, dto, { new: true });
    if (!updated) throw new NotFoundException('Season not found');
    return updated;
  }

  async remove(id: string) {
    const result = await this.seasonModel.deleteOne({ _id: id });
    if (result.deletedCount === 0) throw new NotFoundException('Season not found');
    await this.classSectionModel.deleteMany({ seasonId: new Types.ObjectId(id) });
    return { success: true };
  }

  async duplicate(seasonId: string, copyClasses: boolean) {
    const original = await this.findOne(seasonId);
    const newSeason = new this.seasonModel({
      name: `${original.name} (Copy)`,
      startDate: new Date(),
      endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
      isActive: false,
      schoolId: original.schoolId,
    });
    await newSeason.save();

    if (copyClasses) {
      const originalSections = await this.classSectionModel.find({ seasonId: original._id });
      for (const cs of originalSections) {
        const newCS = new this.classSectionModel({
          ...cs.toObject(),
          _id: undefined,
          seasonId: newSeason._id,
        });
        await newCS.save();
      }
    }
    return newSeason;
  }
}