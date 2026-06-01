import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Section } from './section.schema';
import {
  CreateSectionDto,
  UpdateSectionDto,
  AssignClassTeacherDto,
  AssignPeriodTeacherDto,
  EndTeacherAssignmentDto,
  EndClassTeacherDto,
} from './section.dto';

@Injectable()
export class SectionService {
  constructor(
    @InjectModel(Section.name) private sectionModel: Model<Section>,
  ) {}

  async create(dto: CreateSectionDto) {
    console.log('Creating section with DTO:', dto);

    const existing = await this.sectionModel.findOne({
      classId: new Types.ObjectId(dto.classId),
      seasonId: new Types.ObjectId(dto.seasonId),
      schoolId: new Types.ObjectId(dto.schoolId),
      name: dto.name,
    });

    if (existing) {
      throw new BadRequestException(
        `Section ${dto.name} already exists for this class and season`,
      );
    }

    const section = new this.sectionModel({
      classId: new Types.ObjectId(dto.classId),
      seasonId: new Types.ObjectId(dto.seasonId),
      schoolId: new Types.ObjectId(dto.schoolId),
      name: dto.name,
      periodTeachers: new Map(),
      classTeacherHistory: [],
    });

    const saved = await section.save();
    console.log('Section created:', saved._id);
    return saved;
  }

  async findAll(seasonId?: string, classId?: string, schoolId?: string) {
    try {
      const filter: any = {};

      if (seasonId) {
        try {
          filter.seasonId = new Types.ObjectId(seasonId);
        } catch {
          filter.seasonId = seasonId;
        }
      }

      if (classId) {
        try {
          filter.classId = new Types.ObjectId(classId);
        } catch {
          filter.classId = classId;
        }
      }

      if (schoolId) {
        try {
          filter.schoolId = new Types.ObjectId(schoolId);
        } catch {
          filter.schoolId = schoolId;
        }
      }

      console.log('Section filter:', JSON.stringify(filter));

      const sections = await this.sectionModel
        .find(filter)
        .populate('classId', 'displayName periodCount')
        .populate('seasonId', 'name')
        .populate('currentClassTeacherId', 'name')
        .populate('currentClassTeacherSubjectId', 'name')
        .lean()
        .exec();

      console.log(`Found ${sections.length} sections`);

      // Convert periodTeachers Map to plain object for frontend
      return sections.map((section) => {
        let periodTeachersObj = {};

        if (section.periodTeachers) {
          if (section.periodTeachers instanceof Map) {
            periodTeachersObj = Object.fromEntries(section.periodTeachers);
          } else if (
            typeof section.periodTeachers === 'object' &&
            section.periodTeachers !== null
          ) {
            periodTeachersObj = section.periodTeachers;
          }
        }

        return {
          ...section,
          periodTeachers: periodTeachersObj,
        };
      });
    } catch (error) {
      console.error('Error in findAll sections:', error);
      throw error;
    }
  }

  async findOne(id: string) {
    const section = await this.sectionModel
      .findById(id)
      .populate('classId', 'displayName periodCount')
      .populate('seasonId', 'name')
      .populate('currentClassTeacherId', 'name')
      .populate('currentClassTeacherSubjectId', 'name')
      .populate('classTeacherHistory.teacherId', 'name')
      .populate('classTeacherHistory.subjectId', 'name')
      .lean()
      .exec();

    if (!section) throw new NotFoundException('Section not found');

    let periodTeachersObj = {};
    if (section.periodTeachers) {
      if (section.periodTeachers instanceof Map) {
        periodTeachersObj = Object.fromEntries(section.periodTeachers);
      } else if (typeof section.periodTeachers === 'object') {
        periodTeachersObj = section.periodTeachers;
      }
    }

    return {
      ...section,
      periodTeachers: periodTeachersObj,
    };
  }

  async update(id: string, dto: UpdateSectionDto) {
    const updated = await this.sectionModel.findByIdAndUpdate(id, dto, {
      new: true,
    });
    if (!updated) throw new NotFoundException();
    return updated;
  }

  async remove(id: string, schoolId: string) {
    const result = await this.sectionModel.deleteOne({
      _id: id,
      schoolId: new Types.ObjectId(schoolId),
    });
    if (result.deletedCount === 0) throw new NotFoundException();
    return { success: true };
  }

 async assignPeriodTeacher(sectionId: string, dto: AssignPeriodTeacherDto) {
  try {
    console.log('=== assignPeriodTeacher called ===');
    console.log('Period:', dto.period);
    console.log('Days:', dto.days);
    
    const section = await this.sectionModel.findById(sectionId);
    if (!section) throw new NotFoundException('Section not found');

    const assignedDate = dto.assignedDate || new Date();
    const period = dto.period;
    const newDays = dto.days;

    // Convert periodTeachers to plain object if it's a Map
    let periodTeachers: any = {};
    
    if (section.periodTeachers instanceof Map) {
      section.periodTeachers.forEach((value, key) => {
        periodTeachers[key] = value;
      });
    } else if (section.periodTeachers && typeof section.periodTeachers === 'object') {
      periodTeachers = { ...section.periodTeachers };
    } else {
      periodTeachers = {};
    }

    // Get existing assignments for this period
    let periodAssignments = periodTeachers[period] || [];

    // Check if there's an existing assignment for the SAME teacher
    const existingForTeacher = periodAssignments.find(
      (a: any) => a.teacherId.toString() === dto.teacherId && !a.endDate
    );

    if (existingForTeacher) {
      const mergedDays = [...new Set([...existingForTeacher.days, ...newDays])];
      existingForTeacher.days = mergedDays;
      existingForTeacher.subjectId = new Types.ObjectId(dto.subjectId);
      
      periodAssignments = periodAssignments.map((a: any) =>
        a.teacherId.toString() === dto.teacherId && !a.endDate ? existingForTeacher : a
      );
    } else {
      periodAssignments = periodAssignments.map((a: any) => {
        if (!a.endDate && a.days.some((day: string) => newDays.includes(day))) {
          const remainingDays = a.days.filter((day: string) => !newDays.includes(day));
          if (remainingDays.length === 0) {
            return { ...a, endDate: assignedDate, reason: 'Replaced by new teacher' };
          }
          return { ...a, days: remainingDays };
        }
        return a;
      }).filter((a: any) => !a.endDate || a.days.length > 0);

      const newAssignment = {
        teacherId: new Types.ObjectId(dto.teacherId),
        subjectId: new Types.ObjectId(dto.subjectId),
        days: newDays,
        assignedDate,
        endDate: null,
        reason: '',
      };

      periodAssignments.push(newAssignment);
    }

    periodTeachers[period] = periodAssignments;
    
    await this.sectionModel.findByIdAndUpdate(
      sectionId,
      { $set: { periodTeachers: periodTeachers } }
    );

    // AUTO-SET CLASS TEACHER FROM PERIOD 1
    if (period === 1) {
      const period1Active = (periodTeachers[1] || []).filter((a: any) => !a.endDate);
      if (period1Active.length > 0) {
        const primaryAssignment = period1Active.find((a: any) => a.days.includes('M')) || period1Active[0];
        
        // Add to class teacher history
        const historyEntry = {
          teacherId: primaryAssignment.teacherId,
          subjectId: primaryAssignment.subjectId,
          assignedDate: assignedDate,
          endDate: null,
          reason: '',
        };
        
        await this.sectionModel.findByIdAndUpdate(
          sectionId,
          { 
            $set: { 
              currentClassTeacherId: primaryAssignment.teacherId,
              currentClassTeacherSubjectId: primaryAssignment.subjectId
            },
            $push: { classTeacherHistory: historyEntry }
          }
        );
        console.log('Class teacher updated successfully');
      }
    }
    
    console.log('Assignment successful!');
    return this.findOne(sectionId);
  } catch (error) {
    console.error('Error in assignPeriodTeacher:', error);
    throw error;
  }
}

async endPeriodTeacher(sectionId: string, dto: EndTeacherAssignmentDto) {
  try {
    const section = await this.sectionModel.findById(sectionId);
    if (!section) throw new NotFoundException('Section not found');

    const endDate = dto.endDate || new Date();
    const period = dto.period;
    const teacherId = dto.teacherId;
    const reason = dto.reason || 'Assignment ended';

    let periodTeachers: any = {};
    
    if (section.periodTeachers instanceof Map) {
      section.periodTeachers.forEach((value, key) => {
        periodTeachers[key] = value;
      });
    } else if (section.periodTeachers && typeof section.periodTeachers === 'object') {
      periodTeachers = { ...section.periodTeachers };
    } else {
      periodTeachers = {};
    }

    let periodAssignments = periodTeachers[period] || [];
    
    periodAssignments = periodAssignments.map((a: any) => {
      if (a.teacherId.toString() === teacherId && !a.endDate) {
        return { ...a, endDate, reason };
      }
      return a;
    });

    periodTeachers[period] = periodAssignments;
    
    await this.sectionModel.findByIdAndUpdate(
      sectionId,
      { $set: { periodTeachers: periodTeachers } }
    );

    // If ending a period 1 assignment, update class teacher history
    if (period === 1) {
      // Find and end the current class teacher history entry
      await this.sectionModel.updateOne(
        { 
          _id: sectionId,
          'classTeacherHistory.endDate': null 
        },
        { 
          $set: { 
            'classTeacherHistory.$.endDate': endDate,
            'classTeacherHistory.$.reason': reason
          }
        }
      );
      
      const remainingActive = (periodTeachers[1] || []).filter((a: any) => !a.endDate);
      if (remainingActive.length === 0) {
        await this.sectionModel.findByIdAndUpdate(
          sectionId,
          { $unset: { currentClassTeacherId: "", currentClassTeacherSubjectId: "" } }
        );
      } else if (remainingActive.length > 0) {
        const newPrimary = remainingActive[0];
        const newHistoryEntry = {
          teacherId: newPrimary.teacherId,
          subjectId: newPrimary.subjectId,
          assignedDate: new Date(),
          endDate: null,
          reason: '',
        };
        
        await this.sectionModel.findByIdAndUpdate(
          sectionId,
          { 
            $set: { 
              currentClassTeacherId: newPrimary.teacherId,
              currentClassTeacherSubjectId: newPrimary.subjectId
            },
            $push: { classTeacherHistory: newHistoryEntry }
          }
        );
      }
    }
    
    return this.findOne(sectionId);
  } catch (error) {
    console.error('Error in endPeriodTeacher:', error);
    throw error;
  }
}

  async endClassTeacher(sectionId: string, dto: EndClassTeacherDto) {
    const section = await this.sectionModel.findById(sectionId);
    if (!section) throw new NotFoundException('Section not found');

    const endDate = dto.endDate || new Date();

    if (section.currentClassTeacherId) {
      const currentHistory = section.classTeacherHistory.find(
        (h) => !h.endDate,
      );
      if (currentHistory) {
        currentHistory.endDate = endDate;
        currentHistory.reason = dto.reason || 'Teacher left';
      }
    }

    section.currentClassTeacherId = undefined;
    section.currentClassTeacherSubjectId = undefined;

    await section.save();
    return this.findOne(sectionId);
  }
}
