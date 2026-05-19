import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Class } from './class.schema';
import { CreateClassDto, UpdateClassDto } from './class.dto';

@Injectable()
export class ClassService {
  constructor(@InjectModel(Class.name) private classModel: Model<Class>) {}

  async create(dto: CreateClassDto) {
    try {
      return await new this.classModel(dto).save();
    } catch (error) {
      if (error.code === 11000) {
        throw new ConflictException(`Class with name "${dto.name}" already exists`);
      }
      throw error;
    }
  }

  async findAll() {
    return this.classModel.find().exec();
  }

  async findOne(id: string) {
    const cls = await this.classModel.findById(id);
    if (!cls) throw new NotFoundException('Class not found');
    return cls;
  }

  async update(id: string, dto: UpdateClassDto) {
    try {
      const updated = await this.classModel.findByIdAndUpdate(id, dto, { new: true, runValidators: true });
      if (!updated) throw new NotFoundException();
      return updated;
    } catch (error) {
      if (error.code === 11000) {
        throw new ConflictException(`Class with name "${dto.name}" already exists`);
      }
      throw error;
    }
  }

  async remove(id: string) {
    const result = await this.classModel.deleteOne({ _id: id });
    if (result.deletedCount === 0) throw new NotFoundException();
    return { success: true };
  }
}