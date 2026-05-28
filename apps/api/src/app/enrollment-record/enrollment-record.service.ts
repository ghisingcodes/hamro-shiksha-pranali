import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { EnrollmentRecord, MonthlyFee } from './enrollment-record.schema';
import { CreateEnrollmentRecordDto, UpdateEnrollmentRecordDto, PayMonthlyFeeDto, BulkMonthlyFeesDto } from './enrollment-record.dto';
import { AcademicSeason } from '../academic-season/academic-season.schema';

@Injectable()
export class EnrollmentRecordService {
  constructor(
    @InjectModel(EnrollmentRecord.name) private enrollmentModel: Model<EnrollmentRecord>,
    @InjectModel(AcademicSeason.name) private seasonModel: Model<AcademicSeason>,
  ) {}

  async create(dto: CreateEnrollmentRecordDto, schoolId: string) {
    const existing = await this.enrollmentModel.findOne({
      studentId: dto.studentId,
      seasonId: dto.seasonId,
    });
    if (existing) throw new BadRequestException('Student already enrolled in this season');

    // Calculate total fees
    const totalFees = (dto.admissionFee || 0) + (dto.monthlyFeeAmount || 0) * 12 + (dto.examFee || 0) + (dto.otherFees || 0);
    const totalDue = totalFees;

    const record = new this.enrollmentModel({
      ...dto,
      schoolId: new Types.ObjectId(schoolId),
      totalFees,
      totalPaid: 0,
      totalDue,
    });
    return record.save();
  }

  async findAll(studentId?: string, seasonId?: string, schoolId?: string) {
    const filter: any = {};
    if (studentId) filter.studentId = new Types.ObjectId(studentId);
    if (seasonId) filter.seasonId = new Types.ObjectId(seasonId);
    if (schoolId) filter.schoolId = new Types.ObjectId(schoolId);
    return this.enrollmentModel.find(filter).populate('studentId seasonId classId').exec();
  }

  async findOne(id: string) {
    const record = await this.enrollmentModel.findById(id).populate('studentId seasonId classId');
    if (!record) throw new NotFoundException('Enrollment record not found');
    return record;
  }

  async update(id: string, dto: UpdateEnrollmentRecordDto) {
    const totalFees = (dto.admissionFee || 0) + (dto.monthlyFeeAmount || 0) * 12 + (dto.examFee || 0) + (dto.otherFees || 0);
    const totalPaid = (await this.enrollmentModel.findById(id))?.totalPaid || 0;
    const totalDue = totalFees - totalPaid;

    const updated = await this.enrollmentModel.findByIdAndUpdate(
      id,
      { ...dto, totalFees, totalDue },
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

  async payMonthlyFee(id: string, dto: PayMonthlyFeeDto) {
    const record = await this.enrollmentModel.findById(id);
    if (!record) throw new NotFoundException();

    const monthlyFeeIndex = record.monthlyFees.findIndex(mf => mf.month === dto.month);
    if (monthlyFeeIndex === -1) {
      throw new BadRequestException(`Monthly fee for ${dto.month} not found`);
    }

    const monthlyFee = record.monthlyFees[monthlyFeeIndex];
    if (monthlyFee.isPaid) {
      throw new BadRequestException(`Monthly fee for ${dto.month} is already paid`);
    }

    const amountToPay = dto.amount || monthlyFee.amount;
    monthlyFee.isPaid = true;
    monthlyFee.paidDate = new Date();
    monthlyFee.paymentMethod = dto.paymentMethod;
    monthlyFee.transactionId = dto.transactionId;

    record.totalPaid += amountToPay;
    record.totalDue = record.totalFees - record.totalPaid;

    await record.save();
    return record;
  }

  async setBulkMonthlyFees(id: string, dto: BulkMonthlyFeesDto) {
    const record = await this.enrollmentModel.findById(id);
    if (!record) throw new NotFoundException();

    record.monthlyFees = dto.monthlyFees;
    const monthlyTotal = dto.monthlyFees.reduce((sum, mf) => sum + mf.amount, 0);
    record.monthlyFeeAmount = monthlyTotal / 12;
    record.totalFees = (record.admissionFee || 0) + monthlyTotal + (record.examFee || 0) + (record.otherFees || 0);
    record.totalDue = record.totalFees - record.totalPaid;

    await record.save();
    return record;
  }
}