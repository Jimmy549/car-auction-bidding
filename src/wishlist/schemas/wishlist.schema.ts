// wishlist.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type WishlistDocument = Wishlist & Document;

@Schema({ timestamps: true })
export class Wishlist {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Auction', required: true })
  auctionId: Types.ObjectId;

  @Prop({ default: true })
  isActive: boolean;
}

export const WishlistSchema = SchemaFactory.createForClass(Wishlist);

// Add compound index to prevent duplicate entries
WishlistSchema.index({ userId: 1, auctionId: 1 }, { unique: true });
