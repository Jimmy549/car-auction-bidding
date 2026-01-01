import { Module, OnModuleInit, Logger } from '@nestjs/common';
import { MongooseModule, InjectConnection } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { ServeStaticModule } from '@nestjs/serve-static';
import { Connection } from 'mongoose';
import { join } from 'path';
import { CloudinaryService } from './config/cloudinary.service';

import { UsersModule } from './users/users.module';
import { CarsModule } from './cars/cars.module';
import { BidsModule } from './bids/bids.module';
import { PaymentsModule } from './payments/payments.module';
import { WishlistModule } from './wishlist/wishlist.module';
import { CategoriesModule } from './categories/categories.module';
import { AuctionsModule } from './auctions/auctions.module';
import { NotificationsModule } from './notifications/notifications.module';
import { AuthModule } from './auth/auth.module';
import { GatewayModule } from './gateway/gateway.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'uploads'),
      serveRoot: '/uploads',
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('MONGO_URI') || 'mongodb://localhost:27017/auction-platform',
      }),
      inject: [ConfigService],
    }),
    AuthModule,
    UsersModule,
    CarsModule,
    AuctionsModule,
    BidsModule,
    PaymentsModule,
    WishlistModule,
    CategoriesModule,
    NotificationsModule,
    GatewayModule,
  ],
  providers: [CloudinaryService],
})
export class AppModule implements OnModuleInit {
  private readonly logger = new Logger(AppModule.name);

  constructor(
    @InjectConnection() private readonly connection: Connection,
    private configService: ConfigService,
  ) {}

  onModuleInit() {
    const mongoUri = this.configService.get<string>('MONGO_URI') || 'mongodb://localhost:27017/auction-platform';
    this.logger.log(`MONGO_URI from ConfigService: ${mongoUri}`);

    if (this.connection.readyState === 1) {
      this.logger.log('Successfully connected to MongoDB.');
    } else {
      this.connection.once('open', () => {
        this.logger.log('Successfully connected to MongoDB.');
      });
      this.connection.on('error', (error) => {
        this.logger.error('MongoDB connection error:', error);
      });
    }
  }
}
