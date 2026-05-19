import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Student } from './student.schema';
import { CreateStudentDto, UpdateStudentDto } from './student.dto';

@Injectable()
export class StudentService {
  constructor(@InjectModel(Student.name) private studentModel: Model<Student>) {}

  async create(dto: CreateStudentDto) {
    const student = new this.studentModel({ ...dto, seasonId: new Types.ObjectId(dto.seasonId), classId: new Types.ObjectId(dto.classId) });
    return student.save();
  }

  async findAll(seasonId?: string) {
    const filter = seasonId ? { seasonId: new Types.ObjectId(seasonId) } : {};
    return this.studentModel.find(filter).populate('seasonId classId').exec();
  }

  async findOne(id: string) {
    const student = await this.studentModel.findById(id).populate('seasonId classId');
    if (!student) throw new NotFoundException();
    return student;
  }

  async update(id: string, dto: UpdateStudentDto) {
    const updated = await this.studentModel.findByIdAndUpdate(id, dto, { new: true });
    if (!updated) throw new NotFoundException();
    return updated;
  }

  async remove(id: string) {
    const result = await this.studentModel.deleteOne({ _id: id });
    if (result.deletedCount === 0) throw new NotFoundException();
    return { success: true };
  }
}