import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { EnrollmentRecord } from './enrollment-record.schema';
import { CreateEnrollmentRecordDto, UpdateEnrollmentRecordDto } from './enrollment-record.dto';

@Injectable()
export class EnrollmentRecordService {
  constructor(@InjectModel(EnrollmentRecord.name) private enrollmentModel: Model<EnrollmentRecord>) {}

  async create(dto: CreateEnrollmentRecordDto) {
    const existing = await this.enrollmentModel.findOne({
      studentId: dto.studentId,
      seasonId: dto.seasonId,
    });
    if (existing) throw new BadRequestException('Student already enrolled in this season');

    const totalFees = (dto.admissionFee || 0) + (dto.tuitionFee || 0) + (dto.examFee || 0) + (dto.otherFees || 0);
    const dueAmount = totalFees - (dto.paidAmount || 0);

    const record = new this.enrollmentModel({
      ...dto,
      totalFees,
      dueAmount,
    });
    return record.save();
  }

  async findAll(studentId?: string, seasonId?: string) {
    const filter: any = {};
    if (studentId) filter.studentId = new Types.ObjectId(studentId);
    if (seasonId) filter.seasonId = new Types.ObjectId(seasonId);
    return this.enrollmentModel.find(filter).populate('studentId seasonId classId').exec();
  }

  async findOne(id: string) {
    const record = await this.enrollmentModel.findById(id).populate('studentId seasonId classId');
    if (!record) throw new NotFoundException('Enrollment record not found');
    return record;
  }

  async update(id: string, dto: UpdateEnrollmentRecordDto) {
    const totalFees = (dto.admissionFee || 0) + (dto.tuitionFee || 0) + (dto.examFee || 0) + (dto.otherFees || 0);
    const dueAmount = totalFees - (dto.paidAmount || 0);

    const updated = await this.enrollmentModel.findByIdAndUpdate(
      id,
      { ...dto, totalFees, dueAmount },
      { new: true }
    );
    if (!updated) throw new NotFoundException();
    return updated;
  }

  async remove(id: string) {
    const result = await this.enrollmentModel.deleteOne({ _id: id });
    if (result.deletedCount === 0) throw new NotFoundException();
    return { success: true };
  }

  async updateStatus(id: string, status: string) {
    const record = await this.enrollmentModel.findById(id);
    if (!record) throw new NotFoundException();
    record.status = status;
    await record.save();
    return record;
  }
}