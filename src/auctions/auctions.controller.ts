import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Param, 
  UseGuards, 
  Request, 
  Query,
  HttpStatus,
  HttpCode
} from '@nestjs/common';
import { AuctionsService } from './auctions.service';
import { CreateAuctionDto } from './dto/create-auction.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/schemas/user.schema';
import { AuctionStatus } from './schemas/auction.schema';
import { Public } from '../auth/decorators/public.decorator';

@Controller('auctions')
export class AuctionsController {
  constructor(private readonly auctionsService: AuctionsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createAuctionDto: CreateAuctionDto, @Request() req) {
    return this.auctionsService.create(createAuctionDto, req.user.userId);
  }

  @Get()
  @Public()
  findAll(
    @Query('status') status?: AuctionStatus,
    @Query('minPrice') minPrice?: number,
    @Query('maxPrice') maxPrice?: number,
    @Query('search') search?: string,
    @Query('make') make?: string,
    @Query('model') model?: string,
    @Query('yearMin') yearMin?: number,
    @Query('yearMax') yearMax?: number,
    @Query('bodyType') bodyType?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
  ) {
    return this.auctionsService.findAll({
      status,
      minPrice,
      maxPrice,
      search,
      make,
      model,
      yearMin,
      yearMax,
      bodyType,
      page,
      limit,
      sortBy,
      sortOrder,
    });
  }

  @Get('live')
  @Public()
  getLiveAuctions() {
    return this.auctionsService.getLiveAuctions();
  }

  @Get('upcoming')
  @Public()
  getUpcomingAuctions() {
    return this.auctionsService.getUpcomingAuctions();
  }

  @Get('my-auctions')
  @UseGuards(JwtAuthGuard)
  getMyAuctions(@Request() req) {
    return this.auctionsService.findByUser(req.user.userId);
  }

  @Get(':id')
  @Public()
  findOne(@Param('id') id: string) {
    return this.auctionsService.findOne(id);
  }

  @Get(':id/related')
  @Public()
  getRelated(@Param('id') id: string, @Query('limit') limit?: number) {
    return this.auctionsService.getRelatedAuctions(id, limit || 4);
  }
}
