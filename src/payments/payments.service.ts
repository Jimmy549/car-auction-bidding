// payments.service.ts
import { Injectable, NotFoundException, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Payment, PaymentDocument, PaymentStatus } from './schemas/payment.schema';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { AuctionsService } from '../auctions/auctions.service';
import { AuctionStatus } from '../auctions/schemas/auction.schema';
import { AppGateway } from '../app.gateway';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectModel(Payment.name) private paymentModel: Model<PaymentDocument>,
    @Inject(forwardRef(() => AuctionsService))
    private auctionsService: AuctionsService,
    @Inject(forwardRef(() => AppGateway))
    private appGateway: AppGateway,
  ) {}

  async create(createPaymentDto: CreatePaymentDto, buyerId: string) {
    const auction = await this.auctionsService.findOne(createPaymentDto.auctionId);
    
    if (!auction) {
      throw new NotFoundException('Auction not found');
    }

    if (auction.status !== AuctionStatus.ENDED) {
      throw new BadRequestException('Auction must be ended to create payment');
    }

    if (!auction.winner || auction.winner.toString() !== buyerId) {
      throw new BadRequestException('Only the auction winner can create payment');
    }

    // Check if payment already exists
    const existingPayment = await this.paymentModel.findOne({
      auctionId: new Types.ObjectId(createPaymentDto.auctionId),
    });

    if (existingPayment) {
      throw new BadRequestException('Payment already exists for this auction');
    }

    const newPayment = new this.paymentModel({
      auctionId: new Types.ObjectId(createPaymentDto.auctionId),
      buyerId: new Types.ObjectId(buyerId),
      sellerId: auction.seller,
      amount: auction.currentPrice,
      paymentMethod: createPaymentDto.paymentMethod,
      shippingAddress: createPaymentDto.shippingAddress,
      status: PaymentStatus.PENDING,
      statusHistory: [{
        status: PaymentStatus.PENDING,
        timestamp: new Date(),
        note: 'Payment created',
      }],
    });

    const savedPayment = await newPayment.save();
    await savedPayment.populate(['auctionId', 'buyerId', 'sellerId']);

    return savedPayment;
  }

  async updatePaymentStatus(
    paymentId: string, 
    status: PaymentStatus, 
    note?: string,
    trackingNumber?: string
  ) {
    const payment = await this.paymentModel.findById(paymentId);
    
    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    const updateData: any = {
      status,
      $push: {
        statusHistory: {
          status,
          timestamp: new Date(),
          note: note || `Status updated to ${status}`,
        },
      },
    };

    if (status === PaymentStatus.PAID) {
      updateData.paymentDate = new Date();
    }

    if (trackingNumber) {
      updateData.trackingNumber = trackingNumber;
    }

    if (status === PaymentStatus.IN_TRANSIT) {
      updateData.estimatedDelivery = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now
    }

    const updatedPayment = await this.paymentModel.findByIdAndUpdate(
      paymentId,
      updateData,
      { new: true }
    ).populate(['auctionId', 'buyerId', 'sellerId']);

    if (!updatedPayment) {
      throw new NotFoundException('Payment not found after update');
    }

    // Notify buyer about status update
    try {
      await this.appGateway.notifyPaymentUpdate(
        payment.buyerId.toString(),
        {
          _id: updatedPayment._id,
          status: updatedPayment.status,
          auctionId: updatedPayment.auctionId,
          trackingNumber: updatedPayment.trackingNumber,
        }
      );
    } catch (error) {
      console.error('Failed to send payment update notification:', error.message);
    }

    // If delivered, mark auction as completed
    if (status === PaymentStatus.DELIVERED) {
      await this.auctionsService.updateStatus(
        payment.auctionId.toString(),
        AuctionStatus.COMPLETED
      );
    }

    return updatedPayment;
  }

  async findAll() {
    return this.paymentModel
      .find()
      .populate('auctionId')
      .populate('buyerId', 'username fullName email')
      .populate('sellerId', 'username fullName email')
      .sort({ createdAt: -1 })
      .exec();
  }

  async findByUser(userId: string) {
    return this.paymentModel
      .find({
        $or: [
          { buyerId: new Types.ObjectId(userId) },
          { sellerId: new Types.ObjectId(userId) },
        ],
      })
      .populate('auctionId')
      .populate('buyerId', 'username fullName')
      .populate('sellerId', 'username fullName')
      .sort({ createdAt: -1 })
      .exec();
  }

  async findOne(id: string) {
    const payment = await this.paymentModel
      .findById(id)
      .populate('auctionId')
      .populate('buyerId', 'username fullName email')
      .populate('sellerId', 'username fullName email')
      .exec();

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    return payment;
  }

  // Automated payment status updates (simulating real payment processing)
  @Cron(CronExpression.EVERY_MINUTE)
  async handleAutomatedStatusUpdates() {
    // Simulate payment processing: PENDING -> PAID
    const pendingPayments = await this.paymentModel.find({
      status: PaymentStatus.PENDING,
      createdAt: { $lte: new Date(Date.now() - 2 * 60 * 1000) }, // 2 minutes old
    });

    for (const payment of pendingPayments) {
      await this.updatePaymentStatus(
        payment._id.toString(),
        PaymentStatus.PAID,
        'Payment processed successfully'
      );
    }

    // Simulate shipping: PAID -> READY_FOR_SHIPPING
    const paidPayments = await this.paymentModel.find({
      status: PaymentStatus.PAID,
      paymentDate: { $lte: new Date(Date.now() - 3 * 60 * 1000) }, // 3 minutes after payment
    });

    for (const payment of paidPayments) {
      await this.updatePaymentStatus(
        payment._id.toString(),
        PaymentStatus.READY_FOR_SHIPPING,
        'Item prepared for shipping'
      );
    }

    // Simulate shipping: READY_FOR_SHIPPING -> IN_TRANSIT
    const readyPayments = await this.paymentModel.find({
      status: PaymentStatus.READY_FOR_SHIPPING,
      updatedAt: { $lte: new Date(Date.now() - 2 * 60 * 1000) }, // 2 minutes in ready status
    });

    for (const payment of readyPayments) {
      const trackingNumber = `TRK${Date.now()}${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
      await this.updatePaymentStatus(
        payment._id.toString(),
        PaymentStatus.IN_TRANSIT,
        'Item shipped',
        trackingNumber
      );
    }

    // Simulate delivery: IN_TRANSIT -> DELIVERED
    const inTransitPayments = await this.paymentModel.find({
      status: PaymentStatus.IN_TRANSIT,
      updatedAt: { $lte: new Date(Date.now() - 5 * 60 * 1000) }, // 5 minutes in transit
    });

    for (const payment of inTransitPayments) {
      await this.updatePaymentStatus(
        payment._id.toString(),
        PaymentStatus.DELIVERED,
        'Item delivered successfully'
      );
    }

    // Auto-complete: DELIVERED -> COMPLETED
    const deliveredPayments = await this.paymentModel.find({
      status: PaymentStatus.DELIVERED,
      updatedAt: { $lte: new Date(Date.now() - 2 * 60 * 1000) }, // 2 minutes after delivery
    });

    for (const payment of deliveredPayments) {
      await this.updatePaymentStatus(
        payment._id.toString(),
        PaymentStatus.COMPLETED,
        'Transaction completed'
      );
    }
  }

  async getPaymentsByStatus(status: PaymentStatus) {
    return this.paymentModel
      .find({ status })
      .populate('auctionId')
      .populate('buyerId', 'username fullName')
      .populate('sellerId', 'username fullName')
      .sort({ createdAt: -1 })
      .exec();
  }
}
