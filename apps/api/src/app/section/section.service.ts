// apps/api/src/app/section/section.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Section, PeriodTeacherEntry } from './section.schema';
import {
  CreateSectionDto,
  UpdateSectionDto,
  AssignPeriodTeacherDto,
  EndPeriodTeacherDto,
} from './section.dto';
import { Class } from '../class/class.schema';

@Injectable()
export class SectionService {
  constructor(
    @InjectModel(Section.name) private sectionModel: Model<Section>,
    @InjectModel(Class.name) private classModel: Model<Class>,
  ) {}

  async create(dto: CreateSectionDto) {
    console.log('Creating section with DTO:', dto);

    // Convert IDs to ObjectId
    const classId = new Types.ObjectId(dto.classId);
    const seasonId = new Types.ObjectId(dto.seasonId);
    const schoolId = new Types.ObjectId(dto.schoolId);

    const existing = await this.sectionModel.findOne({
      classId,
      seasonId,
      schoolId,
      name: dto.name,
    });

    if (existing) {
      throw new BadRequestException(
        `Section ${dto.name} already exists for this class and season`,
      );
    }

    const section = new this.sectionModel({
      classId,
      seasonId,
      schoolId,
      name: dto.name,
      periodTeachers: {},
      classTeacherHistory: [],
    });

    return section.save();
  }

  async addSection(
    classSectionId: string,
    sectionName: string,
    schoolId: string,
  ) {
    console.log('Adding section:', { classSectionId, sectionName, schoolId });

    // First find the section document
    const sectionDoc = await this.sectionModel.findById(classSectionId);
    if (!sectionDoc) {
      throw new NotFoundException('Section document not found');
    }

    // Verify schoolId matches
    if (sectionDoc.schoolId.toString() !== schoolId) {
      throw new BadRequestException('School ID mismatch');
    }

    // Check if section already exists
    if (
      sectionDoc.sections &&
      sectionDoc.sections.some((s) => s.name === sectionName)
    ) {
      throw new BadRequestException(`Section ${sectionName} already exists`);
    }

    // Get period count from class
    const classDoc = await this.classModel.findById(sectionDoc.classId);
    const periodCount = classDoc?.periodCount || 7;

    // Create empty routine: 5 days × periodCount
    const routine = Array.from({ length: 5 }, () =>
      Array.from({ length: periodCount }, () => ({ subject: '', teacher: '' })),
    );

    // Initialize sections array if not exists
    if (!sectionDoc.sections) {
      sectionDoc.sections = [];
    }

    // Add new section
    sectionDoc.sections.push({ name: sectionName, routine });

    await sectionDoc.save();
    return sectionDoc;
  }

  async findAll(seasonId?: string, classId?: string, schoolId?: string) {
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

    const sections = await this.sectionModel
      .find(filter)
      .populate('classId', 'displayName periodCount')
      .populate('seasonId', 'name')
      .populate('currentClassTeacherId', 'name')
      .populate('currentClassTeacherSubjectId', 'name')
      .lean()
      .exec();

    // Ensure periodTeachers is always an object for each section
    return sections.map((section) => ({
      ...section,
      periodTeachers: section.periodTeachers || {},
    }));
  }
  async findOne(id: string) {
    const section = await this.sectionModel
      .findById(id)
      .populate('classId', 'displayName periodCount')
      .populate('seasonId', 'name')
      .populate('currentClassTeacherId', 'name')
      .populate('currentClassTeacherSubjectId', 'name')
      .lean()
      .exec();

    if (!section) throw new NotFoundException('Section not found');

    // Ensure periodTeachers is always an object
    if (!section.periodTeachers) {
      section.periodTeachers = {};
    }

    return section;
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
      console.log('Section ID:', sectionId);
      console.log('Period:', dto.period);
      console.log('Teacher ID:', dto.teacherId);
      console.log('Subject ID:', dto.subjectId);
      console.log('Days:', dto.days);

      const section = await this.sectionModel.findById(sectionId);
      if (!section) throw new NotFoundException('Section not found');

      const assignedDate = dto.assignedDate || new Date();
      const period = dto.period;
      const newDays = dto.days;

      // Initialize periodTeachers if it doesn't exist
      if (!section.periodTeachers) {
        section.periodTeachers = {};
      }

      // Get existing assignments for this period
      let periodAssignments = section.periodTeachers[period] || [];

      // Check if there's an existing assignment for the SAME teacher
      const existingForTeacher = periodAssignments.find(
        (a: any) => a.teacherId.toString() === dto.teacherId && !a.endDate,
      );

      if (existingForTeacher) {
        // Merge days
        const mergedDays = [
          ...new Set([...existingForTeacher.days, ...newDays]),
        ];
        existingForTeacher.days = mergedDays;
        existingForTeacher.subjectId = new Types.ObjectId(dto.subjectId);

        // Update the assignment
        periodAssignments = periodAssignments.map((a: any) =>
          a.teacherId.toString() === dto.teacherId && !a.endDate
            ? existingForTeacher
            : a,
        );
      } else {
        // Remove overlapping days from other active assignments
        periodAssignments = periodAssignments
          .map((a: any) => {
            if (
              !a.endDate &&
              a.days.some((day: string) => newDays.includes(day))
            ) {
              const remainingDays = a.days.filter(
                (day: string) => !newDays.includes(day),
              );
              if (remainingDays.length === 0) {
                return {
                  ...a,
                  endDate: assignedDate,
                  reason: dto.reason || 'Replaced by new teacher',
                };
              }
              return { ...a, days: remainingDays };
            }
            return a;
          })
          .filter((a: any) => !a.endDate || a.days.length > 0);

        // Add new assignment
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

      // CRITICAL: Save back to periodTeachers
      section.periodTeachers[period] = periodAssignments;

      // Mark as modified to ensure Mongoose saves it
      section.markModified('periodTeachers');

      // If period 1, also update class teacher
      if (period === 1) {
        const primaryAssignment =
          periodAssignments.find((a: any) => a.days.includes('M')) ||
          periodAssignments[0];
        if (primaryAssignment) {
          // End current class teacher history
          const currentHistory = section.classTeacherHistory.find(
            (h: any) => !h.endDate,
          );
          if (currentHistory) {
            currentHistory.endDate = assignedDate;
            currentHistory.reason = 'Replaced by new period 1 teacher';
          }

          // Add new history entry
          section.classTeacherHistory.push({
            teacherId: primaryAssignment.teacherId,
            subjectId: primaryAssignment.subjectId,
            assignedDate,
            endDate: null,
            reason: '',
          });

          section.currentClassTeacherId = primaryAssignment.teacherId;
          section.currentClassTeacherSubjectId = primaryAssignment.subjectId;
        }
      }

      await section.save();
      console.log('Assignment saved successfully');
      console.log(
        'Updated periodTeachers:',
        JSON.stringify(section.periodTeachers, null, 2),
      );

      return this.findOne(sectionId);
    } catch (error) {
      console.error('Error in assignPeriodTeacher:', error);
      throw error;
    }
  }

  async endPeriodTeacher(sectionId: string, dto: EndPeriodTeacherDto) {
    const section = await this.sectionModel.findById(sectionId);
    if (!section) throw new NotFoundException('Section not found');

    const endDate = dto.endDate || new Date();
    const period = dto.period;

    if (!section.periodTeachers) section.periodTeachers = {};

    let periodAssignments = section.periodTeachers[period] || [];

    periodAssignments = periodAssignments.map((assignment) => {
      if (
        assignment.teacherId.toString() === dto.teacherId &&
        !assignment.endDate
      ) {
        return {
          ...assignment,
          endDate,
          reason: dto.reason || 'Assignment ended',
        };
      }
      return assignment;
    });

    section.periodTeachers[period] = periodAssignments;

    // If period 1, update class teacher
    if (period === 1) {
      const remainingActive = periodAssignments.filter((a) => !a.endDate);
      if (remainingActive.length === 0) {
        section.currentClassTeacherId = undefined;
        section.currentClassTeacherSubjectId = undefined;
      } else {
        const newPrimary = remainingActive[0];
        section.currentClassTeacherId = newPrimary.teacherId;
        section.currentClassTeacherSubjectId = newPrimary.subjectId;
      }
    }

    await section.save();
    return this.findOne(sectionId);
  }

  async getTeacherSchedule(teacherId: string) {
    const allSections = await this.sectionModel
      .find()
      .populate('classId', 'displayName periodCount')
      .populate('seasonId', 'name')
      .lean()
      .exec();

    const schedule = [];

    for (const section of allSections) {
      const periodTeachers = section.periodTeachers || {};
      for (const [period, assignments] of Object.entries(periodTeachers)) {
        const active = (assignments as any[]).find(
          (a) => !a.endDate && a.teacherId.toString() === teacherId,
        );
        if (active) {
          schedule.push({
            period: parseInt(period),
            className: (section.classId as any).displayName,
            classId: (section.classId as any)._id,
            section: section.name,
            subject: active.subjectId,
            subjectName: active.subjectName,
            days: active.days,
          });
        }
      }
    }

    return schedule;
  }
}
