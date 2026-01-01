import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Bid, BidSchema } from './schemas/bid.schema';
import { BidsService } from './bids.service';
import { BidsController } from './bids.controller';
import { AuctionsModule } from '../auctions/auctions.module';
import { AppGateway } from '../app.gateway';
import { NotificationsModule } from '../notifications/notifications.module';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Bid.name, schema: BidSchema }]),
    forwardRef(() => AuctionsModule),
    forwardRef(() => NotificationsModule),
    JwtModule,
  ],
  providers: [BidsService, AppGateway],
  controllers: [BidsController],
  exports: [BidsService],
})
export class BidsModule {}
