import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Staff } from './staff.schema';
import { CreateStaffDto, UpdateStaffDto } from './staff.dto';

@Injectable()
export class StaffService {
  constructor(@InjectModel(Staff.name) private staffModel: Model<Staff>) {}

  async create(dto: CreateStaffDto) {
    const existing = await this.staffModel.findOne({ staffId: dto.staffId });
    if (existing) throw new BadRequestException('Staff ID already exists');
    return new this.staffModel(dto).save();
  }

  async findAll() {
    return this.staffModel.find().exec();
  }

  async findOne(id: string) {
    const staff = await this.staffModel.findById(id);
    if (!staff) throw new NotFoundException('Staff not found');
    return staff;
  }

  async update(id: string, dto: UpdateStaffDto) {
    const updated = await this.staffModel.findByIdAndUpdate(id, dto, { new: true });
    if (!updated) throw new NotFoundException();
    return updated;
  }

  async remove(id: string) {
    const result = await this.staffModel.deleteOne({ _id: id });
    if (result.deletedCount === 0) throw new NotFoundException();
    return { success: true };
  }
}