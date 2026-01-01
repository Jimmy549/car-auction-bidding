import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type BidDocument = Bid & Document;

export enum BidStatus {
  ACTIVE = 'active',
  OUTBID = 'outbid',
  WINNING = 'winning',
  WON = 'won',
  LOST = 'lost',
}

@Schema({ timestamps: true })
export class Bid {
  @Prop({ type: Types.ObjectId, ref: 'Auction', required: true })
  auctionId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  bidderId: Types.ObjectId;

  @Prop({ required: true })
  amount: number;

  @Prop({ type: String, enum: BidStatus, default: BidStatus.ACTIVE })
  status: BidStatus;

  @Prop({ default: Date.now })
  placedAt: Date;

  @Prop({ default: true })
  isValid: boolean;
}

export const BidSchema = SchemaFactory.createForClass(Bid);

// Add indexes for better performance
BidSchema.index({ auctionId: 1, amount: -1 });
BidSchema.index({ bidderId: 1, placedAt: -1 });
