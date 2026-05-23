import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { StudentActivityController } from './student-activity.controller';
import { StudentActivityService } from './student-activity.service';
import { StudentActivity, StudentActivitySchema } from './student-activity.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: StudentActivity.name, schema: StudentActivitySchema }])],
  controllers: [StudentActivityController],
  providers: [StudentActivityService],
  exports: [StudentActivityService],
})
export class StudentActivityModule {}