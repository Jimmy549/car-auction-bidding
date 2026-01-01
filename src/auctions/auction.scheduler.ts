import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { AuctionsService } from './auctions.service';
import { AuctionStatus } from './schemas/auction.schema';
import { AppGateway } from '../app.gateway';

@Injectable()
export class AuctionScheduler {
  private readonly logger = new Logger(AuctionScheduler.name);

  constructor(
    private readonly auctionsService: AuctionsService,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async handleAuctionStatusUpdates() {
    try {
      const now = new Date();

      // Start upcoming auctions
      const upcomingAuctions = await this.auctionsService.findByStatus(AuctionStatus.UPCOMING);
      for (const auction of upcomingAuctions) {
        if (auction.startTime <= now) {
          await this.auctionsService.updateStatus(auction._id.toString(), AuctionStatus.LIVE);
          this.logger.log(`Auction ${auction._id} started`);
        }
      }

      // End live auctions
      const liveAuctions = await this.auctionsService.findByStatus(AuctionStatus.LIVE);
      for (const auction of liveAuctions) {
        if (auction.endTime <= now) {
          await this.auctionsService.updateStatus(auction._id.toString(), AuctionStatus.ENDED);
          this.logger.log(`Auction ${auction._id} ended`);
        }
      }
    } catch (error) {
      this.logger.error('Error updating auction statuses:', error);
    }
  }
}