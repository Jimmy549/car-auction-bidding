import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuctionsService } from './auctions.service';
import { AuctionsController } from './auctions.controller';
import { AuctionScheduler } from './auction.scheduler';
import { Auction, AuctionSchema } from './schemas/auction.schema';
import { CarsModule } from '../cars/cars.module';
import { BidsModule } from '../bids/bids.module';
import { GatewayModule } from '../gateway/gateway.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Auction.name, schema: AuctionSchema }]),
    CarsModule,
    forwardRef(() => BidsModule),
    forwardRef(() => GatewayModule),
  ],
  providers: [AuctionsService, AuctionScheduler],
  controllers: [AuctionsController],
  exports: [AuctionsService],
})
export class AuctionsModule {}
