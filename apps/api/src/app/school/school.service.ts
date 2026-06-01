import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { School } from './school.schema';
import { CreateSchoolDto, UpdateSchoolDto } from './school.dto';

@Injectable()
export class SchoolService {
  constructor(@InjectModel(School.name) private schoolModel: Model<School>) {}

  async create(dto: CreateSchoolDto) {
    const existing = await this.schoolModel.findOne({ $or: [{ name: dto.name }, { slug: dto.slug }] });
    if (existing) throw new BadRequestException('School with this name or slug already exists');

    const year = new Date().getFullYear();
    const count = await this.schoolModel.countDocuments();
    const schoolId = `SCH-${year}-${String(count + 1).padStart(5, '0')}`;

    const school = new this.schoolModel({ ...dto, schoolId });
    return school.save();
  }

  async findAll() {
    return this.schoolModel.find().exec();
  }

  async findBySlug(slug: string) {
    const school = await this.schoolModel.findOne({ slug, isActive: true });
    if (!school) throw new NotFoundException('School not found');
    return school;
  }

  async findOne(id: string) {
    const school = await this.schoolModel.findById(id);
    if (!school) throw new NotFoundException('School not found');
    return school;
  }

  async update(id: string, dto: UpdateSchoolDto) {
    const updated = await this.schoolModel.findByIdAndUpdate(id, dto, { new: true });
    if (!updated) throw new NotFoundException();
    return updated;
  }

  async remove(id: string) {
    const result = await this.schoolModel.deleteOne({ _id: id });
    if (result.deletedCount === 0) throw new NotFoundException();
    return { success: true };
  }
}