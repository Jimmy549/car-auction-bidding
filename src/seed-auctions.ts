import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AuctionsService } from './auctions/auctions.service';
import { CarsService } from './cars/cars.service';
import { UsersService } from './users/users.service';
import { AuctionStatus } from './auctions/schemas/auction.schema';

async function seedAuctions() {
  const app = await NestFactory.createApplicationContext(AppModule);
  
  const auctionsService = app.get(AuctionsService);
  const carsService = app.get(CarsService);
  const usersService = app.get(UsersService);

  try {
    // Create a sample user if none exists
    let user;
    try {
      user = await usersService.findByEmail('demo@example.com');
    } catch {
      user = await usersService.create({
        username: 'demo_user',
        email: 'demo@example.com',
        passwordHash: 'password123',
        fullName: 'Demo User',
        mobileNumber: '+1234567890'
      });
    }

    // Create sample cars
    const car1 = await carsService.create({
      title: '2023 BMW M4 Coupe',
      make: 'BMW',
      model: 'M4',
      year: 2023,
      color: 'Blue',
      mileage: 5000,
      bodyType: 'sports',
      condition: 'Excellent',
      description: 'Luxury sports car in pristine condition',
      photos: ['/yellow-bmw-m4-coupe.png'],
      startingPrice: 75000
    }, user.id);

    const car2 = await carsService.create({
      title: '2022 Ferrari 488 GTB',
      make: 'Ferrari',
      model: '488 GTB',
      year: 2022,
      color: 'Red',
      mileage: 2000,
      bodyType: 'sports',
      condition: 'Excellent',
      description: 'Exotic supercar with incredible performance',
      photos: ['/yellow-ferrari-sports-car.png'],
      startingPrice: 250000
    }, user.id);

    // Create sample auctions
    const now = new Date();
    const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);
    const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000);

    const auction1 = await auctionsService.create({
      carId: car1._id.toString(),
      title: '2023 BMW M4 - Premium Sports Car',
      description: 'Stunning BMW M4 in excellent condition with low mileage',
      startTime: now,
      endTime: oneHourFromNow,
      startingPrice: 75000
    }, user.id);

    const auction2 = await auctionsService.create({
      carId: car2._id.toString(),
      title: '2022 Ferrari 488 GTB - Exotic Supercar',
      description: 'Rare Ferrari 488 GTB with incredible performance and style',
      startTime: now,
      endTime: twoHoursFromNow,
      startingPrice: 250000
    }, user.id);

    // Update auction status to live
    await auctionsService.updateStatus(auction1._id.toString(), 'live' as any);
    await auctionsService.updateStatus(auction2._id.toString(), 'live' as any);

    console.log('Sample auctions created successfully!');
  } catch (error) {
    console.error('Error seeding auctions:', error);
  } finally {
    await app.close();
  }
}

seedAuctions();