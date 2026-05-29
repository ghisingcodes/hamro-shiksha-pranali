import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { AcademicRecord } from './academic-record.schema';
import { CreateAcademicRecordDto, UpdateAcademicRecordDto, PromoteStudentDto } from './academic-record.dto';
import { AcademicSeason } from '../academic-season/academic-season.schema';
import { Class } from '../class/class.schema';

@Injectable()
export class AcademicRecordService {
  constructor(
    @InjectModel(AcademicRecord.name) private recordModel: Model<AcademicRecord>,
    @InjectModel(AcademicSeason.name) private seasonModel: Model<AcademicSeason>,
    @InjectModel(Class.name) private classModel: Model<Class>,
  ) {}

  async create(dto: CreateAcademicRecordDto, schoolId: string) {
    const existing = await this.recordModel.findOne({
      studentId: dto.studentId,
      seasonId: dto.seasonId,
    });
    if (existing) throw new BadRequestException('Student already enrolled in this season');
    
    const record = new this.recordModel({ ...dto, schoolId: new Types.ObjectId(schoolId) });
    return record.save();
  }

  async findAll(
    studentId?: string, 
    seasonId?: string, 
    classId?: string, 
    section?: string, 
    schoolId?: string
  ) {
    const filter: any = {};
    
    if (studentId) filter.studentId = new Types.ObjectId(studentId);
    if (seasonId) filter.seasonId = new Types.ObjectId(seasonId);
    if (classId) filter.classId = new Types.ObjectId(classId);
    if (section) filter.section = section;
    if (schoolId) filter.schoolId = new Types.ObjectId(schoolId);
    
    console.log('🔍 AcademicRecord Filter:', JSON.stringify(filter, null, 2));
    
    const records = await this.recordModel
      .find(filter)
      .populate('studentId seasonId classId')
      .exec();
    
    console.log(`📊 Found ${records.length} academic records`);
    return records;
  }

  async findOne(id: string) {
    const record = await this.recordModel.findById(id).populate('studentId seasonId classId');
    if (!record) throw new NotFoundException('Academic record not found');
    return record;
  }

  async update(id: string, dto: UpdateAcademicRecordDto) {
    const updated = await this.recordModel.findByIdAndUpdate(id, dto, { new: true });
    if (!updated) throw new NotFoundException();
    return updated;
  }

  async remove(id: string) {
    const result = await this.recordModel.deleteOne({ _id: id });
    if (result.deletedCount === 0) throw new NotFoundException();
    return { success: true };
  }

  async updateStatus(id: string, status: string) {
    const record = await this.recordModel.findById(id);
    if (!record) throw new NotFoundException();
    record.status = status;
    await record.save();
    return record;
  }

  async promoteStudent(dto: PromoteStudentDto) {
    const fromRecord = await this.recordModel.findById(dto.fromRecordId).populate('classId');
    if (!fromRecord) throw new NotFoundException('Source record not found');

    const toSeason = await this.seasonModel.findById(dto.toSeasonId);
    if (!toSeason) throw new NotFoundException('Target season not found');

    let targetClassId = dto.newClassId;
    if (!targetClassId) {
      const currentGrade = (fromRecord.classId as any).grade;
      const nextClass = await this.classModel.findOne({ grade: currentGrade + 1 });
      if (!nextClass) throw new BadRequestException('Next class not found');
      targetClassId = nextClass._id;
    }

    const existing = await this.recordModel.findOne({
      studentId: fromRecord.studentId,
      seasonId: dto.toSeasonId,
    });
    if (existing) throw new BadRequestException('Student already has a record for this season');

    const newRecord = new this.recordModel({
      studentId: fromRecord.studentId,
      seasonId: dto.toSeasonId,
      classId: targetClassId,
      section: fromRecord.section,
      rollNumber: '',
      status: 'active',
      previousAcademicRecordId: fromRecord._id,
      schoolId: fromRecord.schoolId,
    });
    await newRecord.save();

    fromRecord.status = 'promoted';
    fromRecord.nextAcademicRecordId = newRecord._id;
    await fromRecord.save();

    return newRecord;
  }
}