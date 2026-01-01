import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async findAll(): Promise<User[]> {
    return this.userModel.find().exec();
  }

  async findById(id: string): Promise<User | null> {
    return this.userModel.findById(id).exec();
  }

  async create(data: Partial<User>): Promise<UserDocument> {
    const newUser = new this.userModel(data);
    return newUser.save();
  }

  async update(id: string, data: Partial<User>): Promise<User | null> {
    return this.userModel.findByIdAndUpdate(id, data, { new: true }).exec();
  }

  async delete(id: string): Promise<User | null> {
    return this.userModel.findByIdAndDelete(id).exec();
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email }).exec();
  }

  async findByUsername(username: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ username }).exec();
  }

  async getProfile(userId: string): Promise<User | null> {
    return this.userModel.findById(userId).select('-password').exec();
  }

  async updateProfile(userId: string, updateData: Partial<User>): Promise<User | null> {
    // Remove sensitive fields that shouldn't be updated via profile
    const { password, role, ...safeUpdateData } = updateData as any;
    
    return this.userModel.findByIdAndUpdate(
      userId,
      safeUpdateData,
      { new: true }
    ).select('-password').exec();
  }
}
