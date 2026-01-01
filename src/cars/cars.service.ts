// cars.service.ts
import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Car, CarDocument, CarStatus } from './schemas/car.schema';
import { CreateCarDto } from './dto/create-car.dto';
import { UpdateCarDto } from './dto/update-car.dto';
import { CloudinaryService } from '../config/cloudinary.service';

@Injectable()
export class CarsService {
  constructor(
    @InjectModel(Car.name) private carModel: Model<CarDocument>,
    private cloudinaryService: CloudinaryService,
  ) {}

  async create(createCarDto: CreateCarDto, sellerId: string) {
    try {
      // Process photos - upload base64 images to Cloudinary
      let processedPhotos = createCarDto.photos || [];
      
      if (processedPhotos.length > 0) {
        // Filter out base64 images and upload them to Cloudinary
        const base64Images = processedPhotos.filter(photo => 
          this.cloudinaryService.isBase64Image(photo)
        );
        
        const regularUrls = processedPhotos.filter(photo => 
          !this.cloudinaryService.isBase64Image(photo)
        );

        if (base64Images.length > 0) {
          console.log(`Uploading ${base64Images.length} images to Cloudinary...`);
          const cloudinaryUrls = await this.cloudinaryService.uploadMultipleBase64Images(base64Images);
          console.log('Images uploaded successfully to Cloudinary');
          processedPhotos = [...regularUrls, ...cloudinaryUrls];
        }
      }

      const newCar = new this.carModel({
        ...createCarDto,
        photos: processedPhotos,
        sellerId: new Types.ObjectId(sellerId),
        status: CarStatus.APPROVED, // Auto-approve cars for now
      });
      
      return newCar.save();
    } catch (error) {
      console.error('Error creating car:', error);
      throw error;
    }
  }

  async findAll(filters?: {
    status?: CarStatus;
    bodyType?: string;
    minPrice?: number;
    maxPrice?: number;
    search?: string;
  }) {
    const query: any = { isActive: true };

    if (filters?.status) {
      query.status = filters.status;
    }

    if (filters?.bodyType) {
      query.bodyType = filters.bodyType;
    }

    if (filters?.minPrice || filters?.maxPrice) {
      query.startingPrice = {};
      if (filters.minPrice) query.startingPrice.$gte = filters.minPrice;
      if (filters.maxPrice) query.startingPrice.$lte = filters.maxPrice;
    }

    if (filters?.search) {
      query.$or = [
        { title: { $regex: filters.search, $options: 'i' } },
        { make: { $regex: filters.search, $options: 'i' } },
        { model: { $regex: filters.search, $options: 'i' } },
        { description: { $regex: filters.search, $options: 'i' } },
      ];
    }

    return this.carModel
      .find(query)
      .populate('sellerId', 'username fullName')
      .sort({ createdAt: -1 })
      .exec();
  }

  async findOne(id: string) {
    const car = await this.carModel
      .findById(id)
      .populate('sellerId', 'username fullName email')
      .exec();

    if (!car) {
      throw new NotFoundException('Car not found');
    }

    return car;
  }

  async findByUser(userId: string) {
    return this.carModel
      .find({ sellerId: new Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .exec();
  }

  async update(id: string, updateCarDto: UpdateCarDto, userId: string) {
    const car = await this.findOne(id);
    
    if (car.sellerId.toString() !== userId) {
      throw new ForbiddenException('You can only update your own cars');
    }

    if (car.status !== CarStatus.PENDING) {
      throw new ForbiddenException('Cannot update car that is not in pending status');
    }

    return this.carModel.findByIdAndUpdate(
      id,
      updateCarDto,
      { new: true }
    ).populate('sellerId', 'username fullName');
  }

  async updateStatus(id: string, status: CarStatus) {
    return this.carModel.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    ).populate('sellerId', 'username fullName');
  }

  async delete(id: string, userId: string) {
    const car = await this.findOne(id);
    
    if (car.sellerId.toString() !== userId) {
      throw new ForbiddenException('You can only delete your own cars');
    }

    if (car.status !== CarStatus.PENDING) {
      throw new ForbiddenException('Cannot delete car that is not in pending status');
    }

    return this.carModel.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true }
    );
  }

  async getApprovedCars() {
    return this.carModel
      .find({ status: CarStatus.APPROVED, isActive: true })
      .populate('sellerId', 'username fullName')
      .sort({ createdAt: -1 })
      .exec();
  }

  async getPendingCars() {
    return this.carModel
      .find({ status: CarStatus.PENDING, isActive: true })
      .populate('sellerId', 'username fullName email')
      .sort({ createdAt: -1 })
      .exec();
  }
}
