import { Injectable, BadRequestException, ForbiddenException, NotFoundException, Inject, forwardRef } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Bid, BidDocument, BidStatus } from './schemas/bid.schema';
import { AuctionsService } from '../auctions/auctions.service';
import { AuctionStatus } from '../auctions/schemas/auction.schema';
import { AppGateway } from '../app.gateway';

@Injectable()
export class BidsService {
  constructor(
    @InjectModel(Bid.name) private bidModel: Model<BidDocument>,
    @Inject(forwardRef(() => AuctionsService))
    private auctionsService: AuctionsService,
    @Inject(forwardRef(() => AppGateway))
    private appGateway: AppGateway,
  ) {}

  async create(bidData: {
    auctionId: string;
    bidderId: string;
    amount: number;
  }) {
    const auction = await this.auctionsService.findOne(bidData.auctionId);
    
    if (!auction) {
      throw new NotFoundException('Auction not found');
    }

    // Check if auction is live
    if (auction.status !== AuctionStatus.LIVE) {
      throw new BadRequestException('Auction is not currently live');
    }

    // Check if user is trying to bid on their own auction
    // Handle populated seller object
    const sellerId = typeof auction.seller === 'object' && auction.seller._id
      ? auction.seller._id.toString()
      : auction.seller.toString();
    
    if (sellerId === bidData.bidderId) {
      throw new ForbiddenException('You cannot bid on your own auction');
    }

    // Check if bid amount is higher than current price
    if (bidData.amount <= auction.currentPrice) {
      throw new BadRequestException(
        `Bid amount must be higher than current price of $${auction.currentPrice}`
      );
    }

    // Create the bid
    const newBid = new this.bidModel({
      auctionId: new Types.ObjectId(bidData.auctionId),
      bidderId: new Types.ObjectId(bidData.bidderId),
      amount: bidData.amount,
      status: BidStatus.ACTIVE,
    });

    const savedBid = await newBid.save();
    await savedBid.populate(['bidderId', 'auctionId']);

    // Update previous highest bid status to OUTBID
    if (auction.winningBid) {
      await this.bidModel.findByIdAndUpdate(
        auction.winningBid,
        { status: BidStatus.OUTBID }
      );

      // Notify previous highest bidder
      const previousBid = await this.bidModel.findById(auction.winningBid).populate('bidderId');
      if (previousBid) {
        // Extract bidder ID - handle populated object
        const bidderId = typeof previousBid.bidderId === 'object' && previousBid.bidderId._id
          ? previousBid.bidderId._id.toString()
          : previousBid.bidderId.toString();
          
        await this.appGateway.notifyOutbid(
          bidderId,
          bidData.auctionId,
          bidData.amount
        );
      }
    }

    // Update auction with new highest bid
    await this.auctionsService.updateCurrentPrice(
      bidData.auctionId,
      bidData.amount,
      savedBid._id.toString()
    );

    // Set this bid as WINNING
    savedBid.status = BidStatus.WINNING;
    await savedBid.save();

    // Notify all users in auction room about new bid
    await this.appGateway.notifyNewBid(bidData.auctionId, {
      _id: savedBid._id,
      amount: savedBid.amount,
      bidder: savedBid.bidderId,
      placedAt: savedBid.placedAt
    });

    return savedBid;
  }

  async findByAuction(auctionId: string) {
    return this.bidModel
      .find({ auctionId: new Types.ObjectId(auctionId) })
      .populate('bidderId', 'username fullName')
      .sort({ amount: -1, placedAt: -1 })
      .exec();
  }

  async findByUser(userId: string) {
    return this.bidModel
      .find({ bidderId: new Types.ObjectId(userId) })
      .populate('auctionId')
      .sort({ placedAt: -1 })
      .exec();
  }

  async getHighestBid(auctionId: string) {
    return this.bidModel
      .findOne({ auctionId: new Types.ObjectId(auctionId) })
      .sort({ amount: -1 })
      .populate('bidderId', 'username fullName')
      .exec();
  }

  async findAll() {
    return this.bidModel
      .find()
      .populate('auctionId')
      .populate('bidderId', 'username fullName')
      .sort({ placedAt: -1 })
      .exec();
  }

  async updateBidStatus(bidId: string, status: BidStatus) {
    return this.bidModel.findByIdAndUpdate(
      bidId,
      { status },
      { new: true }
    ).exec();
  }
}
