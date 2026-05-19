import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ClassController } from './class.controller';
import { ClassService } from './class.service';
import { Class, ClassSchema } from './class.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: Class.name, schema: ClassSchema }])],
  controllers: [ClassController],
  providers: [ClassService],
  exports: [ClassService],
})
export class ClassModule {}