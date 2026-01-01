import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type AuctionDocument = Auction & Document;

export enum AuctionStatus {
  UPCOMING = 'upcoming',
  LIVE = 'live',
  ENDED = 'ended',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

@Schema({
  timestamps: true,
  collection: 'auctions',
})
export class Auction {
  @Prop({ type: Types.ObjectId, ref: 'Car', required: true })
  car: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  seller: Types.ObjectId;

  @Prop({ required: true })
  title: string;

  @Prop()
  description: string;

  @Prop({ required: true, type: Date })
  startTime: Date;

  @Prop({ required: true, type: Date })
  endTime: Date;

  @Prop({
    type: String,
    enum: AuctionStatus,
    default: AuctionStatus.UPCOMING,
  })
  status: AuctionStatus;

  @Prop({ required: true, type: Number })
  startingPrice: number;

  @Prop({ type: Number, default: 0 })
  currentPrice: number;

  @Prop({ type: Types.ObjectId, ref: 'Bid', default: null })
  winningBid: Types.ObjectId | null;

  @Prop({ type: Types.ObjectId, ref: 'User', default: null })
  winner: Types.ObjectId | null;

  @Prop({ type: Number, default: 0 })
  totalBids: number;

  @Prop({ default: true })
  isActive: boolean;
}

export const AuctionSchema = SchemaFactory.createForClass(Auction);

// Add indexes for better performance
AuctionSchema.index({ status: 1, startTime: 1 });
AuctionSchema.index({ endTime: 1 });
AuctionSchema.index({ seller: 1 });
