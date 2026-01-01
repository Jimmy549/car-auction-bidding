import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AuctionsService } from './auctions/auctions.service';
import { CarsService } from './cars/cars.service';
import { UsersService } from './users/users.service';

async function quickSeed() {
  const app = await NestFactory.createApplicationContext(AppModule);
  
  const auctionsService = app.get(AuctionsService);
  const carsService = app.get(CarsService);
  const usersService = app.get(UsersService);

  try {
    // Get existing cars and users
    const cars = await carsService.findAll();
    const users = await usersService.findAll();

    console.log(`Found ${cars.length} cars and ${users.length} users`);

    if (cars.length > 0 && users.length > 0) {
      const now = new Date();
      
      // Create live auctions
      for (let i = 0; i < Math.min(3, cars.length); i++) {
        const car = cars[i];
        const user = users[i % users.length];
        
        try {
          const auction = await auctionsService.create({
            carId: car._id.toString(),
            title: `${car.title} - Live Auction`,
            description: car.description || `Amazing ${car.make} ${car.model}`,
            startTime: new Date(now.getTime() - 30 * 60 * 1000), // Started 30 min ago
            endTime: new Date(now.getTime() + 2 * 60 * 60 * 1000), // Ends in 2 hours
            startingPrice: car.startingPrice
          }, car.sellerId._id ? car.sellerId._id.toString() : car.sellerId.toString());
          
          console.log(`✅ Auction created: ${auction.title}`);
        } catch (error) {
          console.error(`❌ Error creating auction for ${car.title}:`, error.message);
        }
      }
    }

    console.log('🎉 Quick seed completed!');
  } catch (error) {
    console.error('❌ Error in quick seed:', error);
  } finally {
    await app.close();
  }
}

quickSeed();