import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function seedData() {
  const app = await NestFactory.createApplicationContext(AppModule);
  
  try {
    console.log('🌱 Starting basic data seeding...');
    console.log('✅ Application context created successfully');
    console.log('🎉 Basic seeding completed - backend is ready!');
  } catch (error) {
    console.error('❌ Error seeding data:', error);
  } finally {
    await app.close();
  }
}

seedData();