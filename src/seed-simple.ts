import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AuctionsService } from './auctions/auctions.service';
import { CarsService } from './cars/cars.service';
import { UsersService } from './users/users.service';
import { CategoriesService } from './categories/categories.service';

async function seedData() {
  const app = await NestFactory.createApplicationContext(AppModule);
  
  const auctionsService = app.get(AuctionsService);
  const carsService = app.get(CarsService);
  const usersService = app.get(UsersService);
  const categoriesService = app.get(CategoriesService);

  try {
    console.log('🌱 Starting data seeding...');

    // Create categories
    const categories = [
      { name: 'Sports Car', description: 'High-performance sports vehicles' },
      { name: 'Luxury', description: 'Premium luxury vehicles' },
      { name: 'SUV', description: 'Sport utility vehicles' },
      { name: 'Sedan', description: 'Four-door passenger cars' },
      { name: 'Supercar', description: 'Exotic high-end supercars' }
    ];

    for (const cat of categories) {
      try {
        await categoriesService.create(cat);
        console.log(`✅ Category created: ${cat.name}`);
      } catch (error) {
        console.log(`⚠️ Category ${cat.name} might already exist`);
      }
    }

    // Create users
    const users = [
      {
        username: 'john_doe',
        email: 'john@example.com',
        passwordHash: 'password123',
        fullName: 'John Doe',
        mobileNumber: '+1234567890'
      },
      {
        username: 'jane_smith',
        email: 'jane@example.com',
        passwordHash: 'password123',
        fullName: 'Jane Smith',
        mobileNumber: '+1234567891'
      },
      {
        username: 'mike_wilson',
        email: 'mike@example.com',
        passwordHash: 'password123',
        fullName: 'Mike Wilson',
        mobileNumber: '+1234567892'
      }
    ];

    const createdUsers: any[] = [];
    for (const userData of users) {
      try {
        const user = await usersService.create(userData);
        createdUsers.push(user);
        console.log(`✅ User created: ${userData.username}`);
      } catch (error) {
        console.log(`⚠️ User ${userData.username} might already exist`);
        try {
          const existingUser = await usersService.findByEmail(userData.email);
          createdUsers.push(existingUser);
        } catch (e) {
          console.error(`❌ Error finding user: ${userData.username}`);
        }
      }
    }

    // Create cars with proper DTO structure
    const cars = [
      {
        title: '2023 BMW M4 Coupe',
        make: 'BMW',
        model: 'M4',
        year: 2023,
        color: 'Yellow',
        mileage: 5000,
        bodyType: 'sports',
        condition: 'Excellent',
        description: 'Luxury sports car in pristine condition',
        photos: ['/yellow-bmw-m4-coupe.png'],
        startingPrice: 75000
      },
      {
        title: '2022 Ferrari 488 GTB',
        make: 'Ferrari',
        model: '488 GTB',
        year: 2022,
        color: 'Yellow',
        mileage: 2000,
        bodyType: 'sports',
        condition: 'Excellent',
        description: 'Exotic supercar with incredible performance',
        photos: ['/yellow-ferrari-sports-car.png'],
        startingPrice: 250000
      },
      {
        title: '2023 Range Rover Sport',
        make: 'Range Rover',
        model: 'Sport',
        year: 2023,
        color: 'White',
        mileage: 8000,
        bodyType: 'suv',
        condition: 'Very Good',
        description: 'Luxury SUV with premium features',
        photos: ['/white-range-rover-main.png'],
        startingPrice: 85000
      },
      {
        title: '2022 Audi Q3',
        make: 'Audi',
        model: 'Q3',
        year: 2022,
        color: 'Red',
        mileage: 12000,
        bodyType: 'suv',
        condition: 'Good',
        description: 'Compact luxury SUV',
        photos: ['/red-audi-q3-front-view.png'],
        startingPrice: 45000
      },
      {
        title: '2023 Porsche 911',
        make: 'Porsche',
        model: '911',
        year: 2023,
        color: 'White',
        mileage: 3000,
        bodyType: 'sports',
        condition: 'Excellent',
        description: 'Iconic sports car',
        photos: ['/white-porsche-911-sports-car.png'],
        startingPrice: 120000
      }
    ];

    const createdCars: any[] = [];
    for (let i = 0; i < cars.length && i < createdUsers.length; i++) {
      const carData = cars[i];
      const owner = createdUsers[i % createdUsers.length];
      
      if (owner) {
        try {
          const car = await carsService.create(carData, owner.id);
          createdCars.push(car);
          console.log(`✅ Car created: ${carData.title}`);
        } catch (error) {
          console.error(`❌ Error creating car: ${carData.title}`, error.message);
        }
      }
    }

    // Create auctions
    const now = new Date();
    const auctions = [
      {
        title: '2023 BMW M4 - Premium Sports Car',
        description: 'Stunning BMW M4 in excellent condition with low mileage',
        startTime: new Date(now.getTime() - 30 * 60 * 1000),
        endTime: new Date(now.getTime() + 60 * 60 * 1000),
        startingPrice: 75000
      },
      {
        title: '2022 Ferrari 488 GTB - Exotic Supercar',
        description: 'Rare Ferrari 488 GTB with incredible performance',
        startTime: new Date(now.getTime() - 15 * 60 * 1000),
        endTime: new Date(now.getTime() + 2 * 60 * 60 * 1000),
        startingPrice: 250000
      },
      {
        title: '2023 Range Rover Sport - Luxury SUV',
        description: 'Premium luxury SUV with all features',
        startTime: new Date(now.getTime() + 30 * 60 * 1000),
        endTime: new Date(now.getTime() + 3 * 60 * 60 * 1000),
        startingPrice: 85000
      }
    ];

    for (let i = 0; i < Math.min(auctions.length, createdCars.length); i++) {
      const auctionData = auctions[i];
      const car = createdCars[i];
      const owner = createdUsers[i % createdUsers.length];
      
      if (car && owner) {
        try {
          const auction = await auctionsService.create({
            carId: car._id.toString(),
            ...auctionData
          }, owner.id);
          
          console.log(`✅ Auction created: ${auctionData.title}`);
        } catch (error) {
          console.error(`❌ Error creating auction: ${auctionData.title}`, error.message);
        }
      }
    }

    console.log('🎉 Data seeding completed successfully!');

  } catch (error) {
    console.error('❌ Error seeding data:', error);
  } finally {
    await app.close();
  }
}

seedData();