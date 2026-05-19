import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Teacher } from './teacher.schema';
import { CreateTeacherDto, UpdateTeacherDto } from './teacher.dto';

@Injectable()
export class TeacherService {
  constructor(@InjectModel(Teacher.name) private teacherModel: Model<Teacher>) {}

  async create(dto: CreateTeacherDto) {
    return new this.teacherModel(dto).save();
  }

  async findAll() {
    return this.teacherModel.find().exec();
  }

  async findOne(id: string) {
    const teacher = await this.teacherModel.findById(id);
    if (!teacher) throw new NotFoundException('Teacher not found');
    return teacher;
  }

  async update(id: string, dto: UpdateTeacherDto) {
    const teacher = await this.teacherModel.findById(id);
    if (!teacher) throw new NotFoundException('Teacher not found');
    
    teacher.name = dto.name;
    teacher.email = dto.email;
    teacher.phone = dto.phone || '';
    teacher.subjects = dto.subjects || [];
    
    await teacher.save();
    return teacher;
  }

  async remove(id: string) {
    const result = await this.teacherModel.deleteOne({ _id: id });
    if (result.deletedCount === 0) throw new NotFoundException('Teacher not found');
    return { success: true };
  }
}