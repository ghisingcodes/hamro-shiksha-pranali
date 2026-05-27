import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Class } from './class.schema';
import { CreateClassDto, UpdateClassDto } from './class.dto';

@Injectable()
export class ClassService {
  constructor(@InjectModel(Class.name) private classModel: Model<Class>) {}

  async create(dto: CreateClassDto, schoolId: string) {
    const existing = await this.classModel.findOne({ name: dto.name, schoolId: new Types.ObjectId(schoolId) });
    if (existing) throw new BadRequestException('Class already exists for this school');
    
    const classDoc = new this.classModel({ ...dto, schoolId: new Types.ObjectId(schoolId) });
    return classDoc.save();
  }

  async findAll(schoolId: string) {
    return this.classModel.find({ schoolId: new Types.ObjectId(schoolId), isActive: true }).exec();
  }

  async findOne(id: string) {
    const classDoc = await this.classModel.findById(id);
    if (!classDoc) throw new NotFoundException('Class not found');
    return classDoc;
  }

  async update(id: string, dto: UpdateClassDto) {
    const updated = await this.classModel.findByIdAndUpdate(id, dto, { new: true });
    if (!updated) throw new NotFoundException();
    return updated;
  }

  async remove(id: string) {
    const result = await this.classModel.deleteOne({ _id: id });
    if (result.deletedCount === 0) throw new NotFoundException();
    return { success: true };
  }
}