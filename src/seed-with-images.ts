import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { CarsService } from './cars/cars.service';
import { AuctionsService } from './auctions/auctions.service';
import { UsersService } from './users/users.service';
import { CategoriesService } from './categories/categories.service';
import { CarDocument } from './cars/schemas/car.schema';
import { AuctionDocument } from './auctions/schemas/auction.schema';

async function seedWithImages() {
  const app = await NestFactory.createApplicationContext(AppModule);
  
  const carsService = app.get(CarsService);
  const auctionsService = app.get(AuctionsService);
  const usersService = app.get(UsersService);
  const categoriesService = app.get(CategoriesService);

  try {
    console.log('🌱 Starting seed with actual images...');

    // Create categories
    const categories = await Promise.all([
      categoriesService.create({ name: 'Sedan' }),
      categoriesService.create({ name: 'SUV' }),
      categoriesService.create({ name: 'Sports Car' }),
      categoriesService.create({ name: 'Hatchback' }),
      categoriesService.create({ name: 'Luxury' }),
    ]);

    console.log('✅ Categories created');

    // Create demo user
    const demoUser = await usersService.create({
      fullName: 'Demo User',
      username: 'demouser',
      email: 'demo@example.com',
      passwordHash: 'password123',
      mobileNumber: '+1234567890',
    });

    console.log('✅ Demo user created');

    // Car data with actual images from public folder
    const carsData = [
      {
        title: '2023 BMW M4 Coupe',
        make: 'BMW',
        model: 'M4',
        year: 2023,
        color: 'White',
        mileage: 15000,
        photos: ['/AuctionList/bmw-m4.jpg', '/yellow-bmw-m4-coupe.png'],
        startingPrice: 65000,
        description: 'Beautiful BMW M4 in excellent condition',
        bodyType: 'sports',
        condition: 'excellent',
      },
      {
        title: '2022 Tata Tiago XZ',
        make: 'Tata',
        model: 'Tiago XZ',
        year: 2022,
        color: 'Red',
        mileage: 25000,
        photos: ['/AuctionList/tata-tiago.jpg', '/tata-tiago.png'],
        startingPrice: 8000,
        description: 'Reliable Tata Tiago in great condition',
        bodyType: 'hatchback',
        condition: 'good',
      },
      {
        title: '2023 Hyundai Verna',
        make: 'Hyundai',
        model: 'Verna',
        year: 2023,
        color: 'White',
        mileage: 12000,
        photos: ['/AuctionList/hyunai-verna.jpg', '/white-hyundai-verna-sedan.png'],
        startingPrice: 18000,
        description: 'Premium Hyundai Verna sedan',
        bodyType: 'sedan',
        condition: 'excellent',
      },
      {
        title: '2023 Range Rover Sport',
        make: 'Range Rover',
        model: 'Sport',
        year: 2023,
        color: 'White',
        mileage: 8000,
        photos: ['/AuctionList/range-rover.jpg', '/white-range-rover-main.png', '/white-range-rover-interior.png'],
        startingPrice: 85000,
        description: 'Luxury Range Rover Sport SUV',
        bodyType: 'suv',
        condition: 'excellent',
      },
      {
        title: '2022 Ferrari 488 GTB',
        make: 'Ferrari',
        model: '488 GTB',
        year: 2022,
        color: 'Yellow',
        mileage: 5000,
        photos: ['/AuctionList/ferrari.jpg', '/yellow-ferrari-sports-car.png'],
        startingPrice: 250000,
        description: 'Stunning Ferrari 488 GTB',
        bodyType: 'sports',
        condition: 'excellent',
      },
    ];

    // Create cars
    const cars: CarDocument[] = [];
    for (const carData of carsData) {
      const car = await carsService.create(carData, demoUser._id.toString());
      cars.push(car);
    }

    console.log('✅ Cars created with actual images');

    // Create auctions for each car
    const auctions: AuctionDocument[] = [];
    for (let i = 0; i < cars.length; i++) {
      const car = cars[i];
      const startTime = new Date();
      const endTime = new Date();
      endTime.setDate(endTime.getDate() + Math.floor(Math.random() * 7) + 1); // 1-7 days from now
      
      const auction = await auctionsService.create({
        carId: car._id.toString(),
        title: car.title,
        description: `${car.description}. Well maintained with ${car.mileage.toLocaleString()} miles. Don't miss this opportunity!`,
        startingPrice: car.startingPrice,
        startTime: startTime,
        endTime: endTime,
      }, demoUser._id.toString());
      auctions.push(auction);
    }

    console.log('✅ Auctions created');
    console.log(`🎉 Seed completed! Created ${categories.length} categories, ${cars.length} cars, and ${auctions.length} auctions`);
    
  } catch (error) {
    console.error('❌ Seed failed:', error);
  } finally {
    await app.close();
  }
}

seedWithImages();