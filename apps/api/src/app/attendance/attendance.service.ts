import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Attendance } from './attendance.schema';
import { CreateAttendanceDto, BulkAttendanceDto, AttendanceFilterDto } from './attendance.dto';

@Injectable()
export class AttendanceService {
  constructor(@InjectModel(Attendance.name) private attendanceModel: Model<Attendance>) {}

  async create(dto: CreateAttendanceDto) {
    const attendance = new this.attendanceModel(dto);
    return attendance.save();
  }

  async createBulk(dto: BulkAttendanceDto & { schoolId: string }) {
    // Delete existing records for this date, class, section
    await this.attendanceModel.deleteMany({
      schoolId: new Types.ObjectId(dto.schoolId),
      seasonId: new Types.ObjectId(dto.seasonId),
      classId: new Types.ObjectId(dto.classId),
      section: dto.section,
      date: dto.date,
    });

    // Insert new records
    const records = dto.attendance.map(record => ({
      schoolId: new Types.ObjectId(dto.schoolId),
      studentId: new Types.ObjectId(record.studentId),
      seasonId: new Types.ObjectId(dto.seasonId),
      classId: new Types.ObjectId(dto.classId),
      section: dto.section,
      date: dto.date,
      status: record.status,
      absentReason: record.absentReason,
      hygieneIssues: record.hygieneIssues || [],
      remarks: record.remarks,
    }));
    
    if (records.length > 0) {
      return this.attendanceModel.insertMany(records);
    }
    return [];
  }

  async findAll(filter: AttendanceFilterDto & { schoolId: string }) {
    const query: any = {};
    if (filter.schoolId) query.schoolId = new Types.ObjectId(filter.schoolId);
    if (filter.seasonId) query.seasonId = new Types.ObjectId(filter.seasonId);
    if (filter.classId) query.classId = new Types.ObjectId(filter.classId);
    if (filter.section) query.section = filter.section;
    if (filter.studentId) query.studentId = new Types.ObjectId(filter.studentId);
    if (filter.startDate && filter.endDate) {
      query.date = {
        $gte: new Date(filter.startDate),
        $lte: new Date(filter.endDate),
      };
    }
    return this.attendanceModel.find(query).populate('studentId').exec();
  }

  async findOne(id: string) {
    const attendance = await this.attendanceModel.findById(id).populate('studentId');
    if (!attendance) throw new NotFoundException('Attendance record not found');
    return attendance;
  }

  async update(id: string, dto: CreateAttendanceDto) {
    const updated = await this.attendanceModel.findByIdAndUpdate(id, dto, { new: true });
    if (!updated) throw new NotFoundException();
    return updated;
  }

  async remove(id: string) {
    const result = await this.attendanceModel.deleteOne({ _id: id });
    if (result.deletedCount === 0) throw new NotFoundException();
    return { success: true };
  }
}