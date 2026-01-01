import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type PaymentDocument = Payment & Document;

export enum PaymentStatus {
  PENDING = 'pending',
  PAID = 'paid',
  READY_FOR_SHIPPING = 'ready_for_shipping',
  IN_TRANSIT = 'in_transit',
  DELIVERED = 'delivered',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REFUNDED = 'refunded',
}

export enum PaymentMethod {
  CREDIT_CARD = 'credit_card',
  DEBIT_CARD = 'debit_card',
  BANK_TRANSFER = 'bank_transfer',
  PAYPAL = 'paypal',
}

@Schema({ timestamps: true })
export class Payment {
  @Prop({ type: Types.ObjectId, ref: 'Auction', required: true })
  auctionId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  buyerId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  sellerId: Types.ObjectId;

  @Prop({ required: true })
  amount: number;

  @Prop({ type: String, enum: PaymentStatus, default: PaymentStatus.PENDING })
  status: PaymentStatus;

  @Prop({ type: String, enum: PaymentMethod })
  paymentMethod: PaymentMethod;

  @Prop()
  transactionId?: string;

  @Prop()
  paymentDate?: Date;

  @Prop({ type: Object })
  shippingAddress?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };

  @Prop([{
    status: { type: String, enum: PaymentStatus },
    timestamp: { type: Date, default: Date.now },
    note: String,
  }])
  statusHistory: {
    status: PaymentStatus;
    timestamp: Date;
    note?: string;
  }[];

  @Prop()
  trackingNumber?: string;

  @Prop()
  estimatedDelivery?: Date;
}

export const PaymentSchema = SchemaFactory.createForClass(Payment);

// Add indexes for better performance
PaymentSchema.index({ auctionId: 1 });
PaymentSchema.index({ buyerId: 1 });
PaymentSchema.index({ status: 1 });
