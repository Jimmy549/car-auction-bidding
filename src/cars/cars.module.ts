// cars.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { Car, CarSchema } from './schemas/car.schema';
import { CarsService } from './cars.service';
import { CarsController } from './cars.controller';
import { CloudinaryService } from '../config/cloudinary.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Car.name, schema: CarSchema }]),
    ConfigModule,
  ],
  providers: [CarsService, CloudinaryService],
  controllers: [CarsController],
  exports: [CarsService],
})
export class CarsModule {}
