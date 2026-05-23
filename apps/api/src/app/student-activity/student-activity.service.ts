import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { StudentActivity } from './student-activity.schema';
import { CreateStudentActivityDto, BulkStudentActivityDto, StudentActivityFilterDto } from './student-activity.dto';

@Injectable()
export class StudentActivityService {
  constructor(@InjectModel(StudentActivity.name) private activityModel: Model<StudentActivity>) {}

  async create(dto: CreateStudentActivityDto) {
    const activity = new this.activityModel(dto);
    return activity.save();
  }

  async createBulk(dto: BulkStudentActivityDto) {
    // Delete existing records for this date, class, section, period
    await this.activityModel.deleteMany({
      seasonId: new Types.ObjectId(dto.seasonId),
      classId: new Types.ObjectId(dto.classId),
      section: dto.section,
      date: dto.date,
      period: dto.period,
    });

    // Insert new records
    const records = dto.activities.map(activity => ({
      studentId: new Types.ObjectId(activity.studentId),
      seasonId: new Types.ObjectId(dto.seasonId),
      classId: new Types.ObjectId(dto.classId),
      section: dto.section,
      period: dto.period,
      date: dto.date,
      homeworkStatus: activity.homeworkStatus,
      homeworkIssue: activity.homeworkIssue,
      homeworkPhoto: activity.homeworkPhoto,
      classworkStatus: activity.classworkStatus,
      classworkIssue: activity.classworkIssue,
      classworkPhoto: activity.classworkPhoto,
      projectStatus: activity.projectStatus,
      projectIssue: activity.projectIssue,
      practicalStatus: activity.practicalStatus,
      practicalIssue: activity.practicalIssue,
      disciplineStatus: activity.disciplineStatus,
      disciplineIssue: activity.disciplineIssue,
      disciplineDetail: activity.disciplineDetail,
      readingStatus: activity.readingStatus,
      readingDifficulty: activity.readingDifficulty,
      writingStatus: activity.writingStatus,
      writingPhoto: activity.writingPhoto,
      healthProblems: activity.healthProblems || [],
      healthOther: activity.healthOther,
      healthCause: activity.healthCause,
      remarks: activity.remarks,
    }));
    
    if (records.length > 0) {
      return this.activityModel.insertMany(records);
    }
    return [];
  }

  async findAll(filter: StudentActivityFilterDto) {
    const query: any = {};
    if (filter.seasonId) query.seasonId = new Types.ObjectId(filter.seasonId);
    if (filter.classId) query.classId = new Types.ObjectId(filter.classId);
    if (filter.section) query.section = filter.section;
    if (filter.period) query.period = filter.period;
    if (filter.studentId) query.studentId = new Types.ObjectId(filter.studentId);
    if (filter.date) query.date = filter.date;
    if (filter.startDate && filter.endDate) {
      query.date = {
        $gte: new Date(filter.startDate),
        $lte: new Date(filter.endDate),
      };
    }
    return this.activityModel.find(query).populate('studentId').exec();
  }

  async findOne(id: string) {
    const activity = await this.activityModel.findById(id).populate('studentId');
    if (!activity) throw new NotFoundException('Activity record not found');
    return activity;
  }

  async update(id: string, dto: CreateStudentActivityDto) {
    const updated = await this.activityModel.findByIdAndUpdate(id, dto, { new: true });
    if (!updated) throw new NotFoundException();
    return updated;
  }

  async remove(id: string) {
    const result = await this.activityModel.deleteOne({ _id: id });
    if (result.deletedCount === 0) throw new NotFoundException();
    return { success: true };
  }
}