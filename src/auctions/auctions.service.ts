import { Injectable, NotFoundException, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Auction, AuctionDocument, AuctionStatus } from './schemas/auction.schema';
import { CreateAuctionDto } from './dto/create-auction.dto';
import { CarsService } from '../cars/cars.service';
import { AppGateway } from '../app.gateway';
import { BidStatus } from '../bids/schemas/bid.schema';

@Injectable()
export class AuctionsService {
  constructor(
    @InjectModel(Auction.name) private auctionModel: Model<AuctionDocument>,
    private carsService: CarsService,
    @Inject(forwardRef(() => AppGateway))
    private appGateway: AppGateway,
  ) {}

  async create(createAuctionDto: CreateAuctionDto, sellerId: string) {
    // Verify car exists and belongs to seller
    const car = await this.carsService.findOne(createAuctionDto.carId);
    if (!car) {
      throw new NotFoundException('Car not found');
    }

    // SECURITY: Verify ownership - only car owner can create auction
    console.log('🔍 Ownership check:');
    console.log('  car.sellerId:', car.sellerId);
    console.log('  car.sellerId type:', typeof car.sellerId);
    console.log('  sellerId:', sellerId);
    console.log('  sellerId type:', typeof sellerId);
    
    // Handle both populated and unpopulated sellerId
    // If sellerId is populated (object with _id), extract the _id
    // Otherwise, use sellerId directly
    let carSellerIdString: string;
    if (typeof car.sellerId === 'object' && car.sellerId._id) {
      carSellerIdString = car.sellerId._id.toString();
    } else {
      carSellerIdString = car.sellerId.toString();
    }
    
    const sellerIdString = sellerId.toString();
    
    console.log('  Comparing:', carSellerIdString, 'vs', sellerIdString);
    console.log('  Match?', carSellerIdString === sellerIdString);
    
    if (carSellerIdString !== sellerIdString) {
      console.log('❌ Ownership check FAILED');
      throw new BadRequestException('You can only create auctions for your own cars');
    }
    console.log('✅ Ownership check PASSED');

    // Check if car already has an active auction
    const existingAuction = await this.auctionModel.findOne({
      car: new Types.ObjectId(createAuctionDto.carId),
      status: { $in: [AuctionStatus.UPCOMING, AuctionStatus.LIVE] },
    });

    if (existingAuction) {
      throw new BadRequestException('Car already has an active auction');
    }

    // Determine initial status based on start time
    // If start time is now or within 10 seconds, set as LIVE
    const now = new Date();
    const startTime = new Date(createAuctionDto.startTime);
    const timeDiff = startTime.getTime() - now.getTime();
    const initialStatus = timeDiff <= 10000 ? AuctionStatus.LIVE : AuctionStatus.UPCOMING;

    const newAuction = new this.auctionModel({
      car: new Types.ObjectId(createAuctionDto.carId),
      seller: new Types.ObjectId(sellerId),
      title: createAuctionDto.title,
      description: createAuctionDto.description,
      startTime: createAuctionDto.startTime,
      endTime: createAuctionDto.endTime,
      startingPrice: createAuctionDto.startingPrice,
      currentPrice: createAuctionDto.startingPrice,
      status: initialStatus,
    });

    console.log(`✅ Auction created with status: ${initialStatus}`);
    return newAuction.save();
  }

  async findAll(filters?: {
    status?: AuctionStatus;
    minPrice?: number;
    maxPrice?: number;
    search?: string;
    make?: string;
    model?: string;
    yearMin?: number;
    yearMax?: number;
    bodyType?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) {
    const query: any = { isActive: true };

    // Status filter
    if (filters?.status) {
      query.status = filters.status;
    }

    // Price range filter
    if (filters?.minPrice || filters?.maxPrice) {
      query.currentPrice = {};
      if (filters.minPrice) query.currentPrice.$gte = filters.minPrice;
      if (filters.maxPrice) query.currentPrice.$lte = filters.maxPrice;
    }

    // Populate car to access make/model/year
    let auctionsQuery = this.auctionModel
      .find(query)
      .populate({
        path: 'car',
        match: this.buildCarFilters(filters),
      })
      .populate('seller', 'username fullName')
      .populate('winner', 'username fullName');

    // Search in title or description
    if (filters?.search) {
      query.$or = [
        { title: { $regex: filters.search, $options: 'i' } },
        { description: { $regex: filters.search, $options: 'i' } },
      ];
    }

    // Sorting
    const sortOptions: any = {};
    if (filters?.sortBy) {
      sortOptions[filters.sortBy] = filters.sortOrder === 'desc' ? -1 : 1;
    } else {
      sortOptions.createdAt = -1; // Default: newest first
    }

    auctionsQuery = auctionsQuery.sort(sortOptions);

    // Pagination
    const page = filters?.page || 1;
    const limit = filters?.limit || 10;
    const skip = (page - 1) * limit;

    const total = await this.auctionModel.countDocuments(query);
    const auctions = await auctionsQuery.skip(skip).limit(limit).exec();

    // Filter out auctions where car didn't match (from populate match)
    const filteredAuctions = auctions.filter(auction => auction.car !== null);

    return {
      data: filteredAuctions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
    };
  }

  private buildCarFilters(filters?: {
    make?: string;
    model?: string;
    yearMin?: number;
    yearMax?: number;
    bodyType?: string;
  }) {
    const carMatch: any = {};

    if (filters?.make) {
      carMatch.make = { $regex: filters.make, $options: 'i' };
    }

    if (filters?.model) {
      carMatch.model = { $regex: filters.model, $options: 'i' };
    }

    if (filters?.yearMin || filters?.yearMax) {
      carMatch.year = {};
      if (filters.yearMin) carMatch.year.$gte = filters.yearMin;
      if (filters.yearMax) carMatch.year.$lte = filters.yearMax;
    }

    if (filters?.bodyType) {
      carMatch.bodyType = filters.bodyType;
    }

    return Object.keys(carMatch).length > 0 ? carMatch : undefined;
  }

  async findOne(id: string) {
    const auction = await this.auctionModel
      .findById(id)
      .populate('car')
      .populate('seller', 'username fullName')
      .populate('winner', 'username fullName')
      .populate('winningBid')
      .exec();

    if (!auction) {
      throw new NotFoundException('Auction not found');
    }

    return auction;
  }

  async findByUser(userId: string) {
    return this.auctionModel
      .find({ seller: new Types.ObjectId(userId) })
      .populate('car')
      .populate('winner', 'username fullName')
      .sort({ createdAt: -1 })
      .exec();
  }

  async updateCurrentPrice(auctionId: string, newPrice: number, winningBidId: string) {
    return this.auctionModel.findByIdAndUpdate(
      auctionId,
      {
        currentPrice: newPrice,
        winningBid: new Types.ObjectId(winningBidId),
        $inc: { totalBids: 1 },
      },
      { new: true }
    ).exec();
  }

  async updateStatus(auctionId: string, status: AuctionStatus) {
    return this.auctionModel.findByIdAndUpdate(
      auctionId,
      { status },
      { new: true }
    ).exec();
  }

  // Automated auction status management
  @Cron(CronExpression.EVERY_MINUTE)
  async handleAuctionStatusUpdates() {
    const now = new Date();

    // Start upcoming auctions
    const upcomingAuctions = await this.auctionModel.find({
      status: AuctionStatus.UPCOMING,
      startTime: { $lte: now },
    }).populate('car');

    for (const auction of upcomingAuctions) {
      await this.updateStatus(auction._id.toString(), AuctionStatus.LIVE);
      
      // Notify all users that auction has started
      try {
        const carData = auction.car as any;
        await this.appGateway.notifyAuctionStarted(auction._id.toString(), {
          _id: auction._id,
          title: carData?.make && carData?.model 
            ? `${carData.make} ${carData.model}` 
            : 'Auction',
          car: auction.car,
        });
      } catch (error) {
        console.error('Failed to send auction started notification:', error.message);
      }
    }

    // End live auctions
    const liveAuctions = await this.auctionModel.find({
      status: AuctionStatus.LIVE,
      endTime: { $lte: now },
    }).populate(['car', 'winningBid']);

    for (const auction of liveAuctions) {
      await this.updateStatus(auction._id.toString(), AuctionStatus.ENDED);
      
      if (auction.winningBid) {
        // Set winner
        const winningBid = auction.winningBid as any;
        await this.auctionModel.findByIdAndUpdate(auction._id, {
          winner: winningBid.bidderId,
        });

        // Notify winner
        try {
          const carData = auction.car as any;
          await this.appGateway.notifyWinner(
            auction._id.toString(),
            winningBid.bidderId.toString(),
            {
              _id: auction._id,
              title: carData?.make && carData?.model 
                ? `${carData.make} ${carData.model}` 
                : 'Auction',
              car: auction.car,
              winningBid: winningBid.amount,
            }
          );
        } catch (error) {
          console.error('Failed to send winner notification:', error.message);
        }
      }

      // Notify auction ended
      try {
        await this.appGateway.notifyAuctionEnded(
          auction._id.toString(),
          auction.winningBid ? {
            _id: (auction.winningBid as any).bidderId,
            username: (auction.winningBid as any).bidderId?.username || 'Winner',
          } : undefined
        );
      } catch (error) {
        console.error('Failed to send auction ended notification:', error.message);
      }
    }
  }

  async getLiveAuctions() {
    return this.auctionModel
      .find({ status: AuctionStatus.LIVE })
      .populate('car')
      .populate('seller', 'username fullName')
      .sort({ endTime: 1 })
      .exec();
  }

  async getUpcomingAuctions() {
    return this.auctionModel
      .find({ status: AuctionStatus.UPCOMING })
      .populate('car')
      .populate('seller', 'username fullName')
      .sort({ startTime: 1 })
      .exec();
  }

  async findByStatus(status: AuctionStatus) {
    return this.auctionModel
      .find({ status })
      .populate('car')
      .populate('seller', 'username fullName')
      .populate('winner', 'username fullName')
      .sort({ createdAt: -1 })
      .exec();
  }

  async getRelatedAuctions(auctionId: string, limit: number = 4) {
    // Get the current auction to find similar ones
    const currentAuction = await this.auctionModel
      .findById(auctionId)
      .populate('car')
      .exec();

    if (!currentAuction || !currentAuction.car) {
      return [];
    }

    const car = currentAuction.car as any;

    // Find auctions with same make or model, exclude current auction
    return this.auctionModel
      .find({
        _id: { $ne: auctionId },
        status: { $in: [AuctionStatus.UPCOMING, AuctionStatus.LIVE] },
        isActive: true,
      })
      .populate({
        path: 'car',
        match: {
          $or: [
            { make: car.make },
            { model: car.model },
            { bodyType: car.bodyType },
          ],
        },
      })
      .populate('seller', 'username fullName')
      .limit(limit)
      .exec()
      .then(auctions => auctions.filter(auction => auction.car !== null));
  }
}
