import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  UseGuards, 
  Request, 
  Param,
  HttpStatus,
  HttpCode
} from '@nestjs/common';
import { BidsService } from './bids.service';
import { CreateBidDto } from './dto/create-bid.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/schemas/user.schema';

@UseGuards(JwtAuthGuard)
@Controller('bids')
export class BidsController {
  constructor(private readonly bidsService: BidsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createBidDto: CreateBidDto, @Request() req) {
    const bidData = {
      auctionId: createBidDto.auctionId,
      bidderId: req.user.userId,
      amount: createBidDto.amount,
    };
    return this.bidsService.create(bidData);
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  findAll() {
    return this.bidsService.findAll();
  }

  @Get('auction/:auctionId')
  findByAuction(@Param('auctionId') auctionId: string) {
    return this.bidsService.findByAuction(auctionId);
  }

  @Get('my-bids')
  findMyBids(@Request() req) {
    return this.bidsService.findByUser(req.user.userId);
  }

  @Get('highest/:auctionId')
  getHighestBid(@Param('auctionId') auctionId: string) {
    return this.bidsService.getHighestBid(auctionId);
  }
}
