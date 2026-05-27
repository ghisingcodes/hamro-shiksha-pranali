import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Student } from './student.schema';
import { CreateStudentDto, UpdateStudentDto } from './student.dto';

@Injectable()
export class StudentService {
  constructor(@InjectModel(Student.name) private studentModel: Model<Student>) {}

  async searchStudents(query: string, schoolId: string) {
    if (!query || query.length < 2) return [];
    
    const searchRegex = new RegExp(query, 'i');
    return this.studentModel.find({
      schoolId: new Types.ObjectId(schoolId),
      $or: [
        { name: searchRegex },
        { studentId: searchRegex },
        { 'parents.phone': searchRegex },
        { 'parents.name': searchRegex },
      ]
    }).limit(10).exec();
  }

  async create(dto: CreateStudentDto, schoolId: string) {
    // Generate student ID if not provided
    let studentId = dto.studentId;
    if (!studentId) {
      const year = new Date().getFullYear();
      const count = await this.studentModel.countDocuments({ schoolId: new Types.ObjectId(schoolId) });
      studentId = `STD-${year}-${String(count + 1).padStart(5, '0')}`;
    }
    
    const student = new this.studentModel({ 
      ...dto, 
      studentId,
      schoolId: new Types.ObjectId(schoolId)
    });
    return student.save();
  }

  async findAll(schoolId: string) {
    return this.studentModel.find({ schoolId: new Types.ObjectId(schoolId) }).exec();
  }

  async findOne(id: string) {
    const student = await this.studentModel.findById(id);
    if (!student) throw new NotFoundException('Student not found');
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

  async getParentChildren(phone: string, schoolId: string) {
    return this.studentModel.find({ 
      schoolId: new Types.ObjectId(schoolId),
      'parents.phone': phone 
    }).exec();
  }
}