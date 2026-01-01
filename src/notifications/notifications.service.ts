import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Notification,
  NotificationDocument,
  NotificationType,
} from './schemas/notification.schema';
import { CreateNotificationDto } from './dto/create-notification.dto';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectModel(Notification.name)
    private notificationModel: Model<NotificationDocument>,
  ) {}

  async create(data: CreateNotificationDto): Promise<Notification> {
    const notification = new this.notificationModel({
      ...data,
      userId: data.userId ? new Types.ObjectId(data.userId) : undefined,
      auctionId: data.auctionId ? new Types.ObjectId(data.auctionId) : undefined,
      carId: data.carId ? new Types.ObjectId(data.carId) : undefined,
    });
    return notification.save();
  }

  async createForMultipleUsers(
    userIds: string[],
    notificationData: Omit<CreateNotificationDto, 'userId'>
  ): Promise<Notification[]> {
    const notifications = userIds.map(userId => 
      new this.notificationModel({
        ...notificationData,
        userId: new Types.ObjectId(userId),
        auctionId: notificationData.auctionId ? new Types.ObjectId(notificationData.auctionId) : undefined,
        carId: notificationData.carId ? new Types.ObjectId(notificationData.carId) : undefined,
      })
    );
    
    return this.notificationModel.insertMany(notifications);
  }

  async findByUser(
    userId: string,
    filters?: {
      isRead?: boolean;
      type?: NotificationType;
      limit?: number;
    }
  ): Promise<Notification[]> {
    const query: any = { userId: new Types.ObjectId(userId) };
    
    if (filters?.isRead !== undefined) {
      query.isRead = filters.isRead;
    }
    
    if (filters?.type) {
      query.type = filters.type;
    }

    let queryBuilder = this.notificationModel
      .find(query)
      .populate('auctionId', 'title currentPrice')
      .populate('carId', 'title make model')
      .sort({ createdAt: -1 });

    if (filters?.limit) {
      queryBuilder = queryBuilder.limit(filters.limit);
    }

    return queryBuilder.exec();
  }

  async findAll(): Promise<Notification[]> {
    return this.notificationModel
      .find()
      .populate('userId', 'username fullName')
      .populate('auctionId', 'title currentPrice')
      .populate('carId', 'title make model')
      .sort({ createdAt: -1 })
      .exec();
  }

  async markAsRead(id: string) {
    return this.notificationModel.findByIdAndUpdate(
      id,
      { isRead: true },
      { new: true },
    );
  }

  async markAllAsRead(userId: string) {
    return this.notificationModel.updateMany(
      { userId: new Types.ObjectId(userId), isRead: false },
      { isRead: true }
    );
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.notificationModel.countDocuments({
      userId: new Types.ObjectId(userId),
      isRead: false,
    });
  }

  async deleteNotification(id: string) {
    return this.notificationModel.findByIdAndDelete(id);
  }

  async deleteOldNotifications(daysOld: number = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);
    
    return this.notificationModel.deleteMany({
      createdAt: { $lt: cutoffDate },
      isRead: true,
    });
  }
}
