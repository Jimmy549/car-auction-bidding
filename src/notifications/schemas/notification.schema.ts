import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type NotificationDocument = Notification & Document;

export enum NotificationType {
  AUCTION_STARTED = 'auction_started',
  NEW_BID = 'new_bid',
  OUTBID = 'outbid',
  AUCTION_ENDED = 'auction_ended',
  AUCTION_WON = 'auction_won',
  AUCTION_LOST = 'auction_lost',
  PAYMENT_RECEIVED = 'payment_received',
  PAYMENT_REQUIRED = 'payment_required',
  SHIPPING_UPDATE = 'shipping_update',
  CAR_APPROVED = 'car_approved',
  CAR_REJECTED = 'car_rejected',
}

@Schema({ timestamps: true })
export class Notification {
  @Prop({ type: String, enum: NotificationType, required: true })
  type: NotificationType;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  message: string;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  userId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Auction' })
  auctionId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Car' })
  carId?: Types.ObjectId;

  @Prop({ default: false })
  isRead: boolean;

  @Prop({ type: Object })
  data?: Record<string, any>; // Additional data for the notification
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);

// Add indexes for better performance
NotificationSchema.index({ userId: 1, isRead: 1 });
NotificationSchema.index({ createdAt: -1 });
