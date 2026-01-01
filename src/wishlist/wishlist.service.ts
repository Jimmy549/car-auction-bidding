// wishlist.service.ts
import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Wishlist, WishlistDocument } from './schemas/wishlist.schema';
import { CreateWishlistDto } from './dto/create-wishlist.dto';

@Injectable()
export class WishlistService {
  constructor(
    @InjectModel(Wishlist.name) private wishlistModel: Model<WishlistDocument>,
  ) {}

  async addToWishlist(userId: string, auctionId: string) {
    try {
      const wishlistItem = new this.wishlistModel({
        userId: new Types.ObjectId(userId),
        auctionId: new Types.ObjectId(auctionId),
      });
      return await wishlistItem.save();
    } catch (error) {
      if (error.code === 11000) {
        throw new ConflictException('Auction already in wishlist');
      }
      throw error;
    }
  }

  async removeFromWishlist(userId: string, auctionId: string) {
    const result = await this.wishlistModel.findOneAndDelete({
      userId: new Types.ObjectId(userId),
      auctionId: new Types.ObjectId(auctionId),
    });

    if (!result) {
      throw new NotFoundException('Wishlist item not found');
    }

    return { message: 'Removed from wishlist' };
  }

  async getUserWishlist(userId: string) {
    return this.wishlistModel
      .find({ 
        userId: new Types.ObjectId(userId),
        isActive: true 
      })
      .populate({
        path: 'auctionId',
        populate: {
          path: 'car',
          select: 'title make model year photos startingPrice'
        }
      })
      .sort({ createdAt: -1 })
      .exec();
  }

  async isInWishlist(userId: string, auctionId: string): Promise<boolean> {
    const item = await this.wishlistModel.findOne({
      userId: new Types.ObjectId(userId),
      auctionId: new Types.ObjectId(auctionId),
      isActive: true,
    });
    return !!item;
  }

  async getWishlistCount(userId: string): Promise<number> {
    return this.wishlistModel.countDocuments({
      userId: new Types.ObjectId(userId),
      isActive: true,
    });
  }

  async findAll() {
    return this.wishlistModel
      .find({ isActive: true })
      .populate('userId', 'username fullName')
      .populate({
        path: 'auctionId',
        populate: {
          path: 'car',
          select: 'title make model year'
        }
      })
      .sort({ createdAt: -1 })
      .exec();
  }

  async clearUserWishlist(userId: string) {
    return this.wishlistModel.updateMany(
      { userId: new Types.ObjectId(userId) },
      { isActive: false }
    );
  }
}
