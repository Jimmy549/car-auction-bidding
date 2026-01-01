/* eslint-disable prettier/prettier */
// car.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type CarDocument = Car & Document;

export enum CarStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  SOLD = 'sold',
}

@Schema({ timestamps: true })
export class Car {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  sellerId: Types.ObjectId;

  @Prop({ required: true })
  title: string;

  @Prop()
  description: string;

  @Prop({ required: true })
  make: string;

  @Prop({ required: true })
  model: string;

  @Prop({ required: true })
  year: number;

  @Prop({ required: true })
  mileage: number;

  @Prop({
    required: true,
    enum: ['sedan', 'sports', 'hatchback', 'convertible', 'suv', 'truck'],
  })
  bodyType: string;

  @Prop({ required: true })
  condition: string;

  @Prop({ required: true })
  color: string;

  @Prop([String])
  photos: string[];

  @Prop({ required: true })
  startingPrice: number;

  @Prop({ type: String, enum: CarStatus, default: CarStatus.PENDING })
  status: CarStatus;

  @Prop({ default: true })
  isActive: boolean;
}

export const CarSchema = SchemaFactory.createForClass(Car);
