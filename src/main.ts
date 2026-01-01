// main.ts
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { GlobalExceptionFilter } from './filters/global-exception.filter';

async function bootstrap() {
  try {
    const app = await NestFactory.create(AppModule);

    // Enable CORS with specific configuration
    app.enableCors({
      origin: "*",
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    });

    // CRITICAL: Increase body size limit for base64 image uploads
    app.use(require('body-parser').json({ limit: '50mb' }));
    app.use(require('body-parser').urlencoded({ limit: '50mb', extended: true }));

    // Global exception filter
    app.useGlobalFilters(new GlobalExceptionFilter());

    // Global validation pipe for DTOs
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
        forbidNonWhitelisted: true,
      }),
    );

    // Apply JWT Guard globally except for public routes
    const reflector = app.get(Reflector);
    app.useGlobalGuards(new JwtAuthGuard(reflector));

    const port = process.env.PORT || 4000;
    await app.listen(port, '0.0.0.0');
    console.log(`🚀 Server is running on port ${port}`);
    console.log(`📡 Socket.IO enabled for real-time features`);
  } catch (error) {
    console.error('❌ Application startup error:', error);
    process.exit(1);
  }
}
bootstrap();