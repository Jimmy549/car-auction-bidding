// wishlist.controller.ts
import { 
  Controller, 
  Get, 
  Post, 
  Delete,
  Body, 
  Param,
  UseGuards, 
  Request,
  HttpStatus,
  HttpCode
} from '@nestjs/common';
import { WishlistService } from './wishlist.service';
import { CreateWishlistDto } from './dto/create-wishlist.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/schemas/user.schema';

@UseGuards(JwtAuthGuard)
@Controller('wishlist')
export class WishlistController {
  constructor(private readonly wishlistService: WishlistService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  addToWishlist(@Body() createWishlistDto: CreateWishlistDto, @Request() req) {
    return this.wishlistService.addToWishlist(req.user.userId, createWishlistDto.auctionId);
  }

  @Delete(':auctionId')
  removeFromWishlist(@Param('auctionId') auctionId: string, @Request() req) {
    return this.wishlistService.removeFromWishlist(req.user.userId, auctionId);
  }

  @Get('my-wishlist')
  getMyWishlist(@Request() req) {
    return this.wishlistService.getUserWishlist(req.user.userId);
  }

  @Get('count')
  getWishlistCount(@Request() req) {
    return this.wishlistService.getWishlistCount(req.user.userId);
  }

  @Get('check/:auctionId')
  checkWishlist(@Param('auctionId') auctionId: string, @Request() req) {
    return this.wishlistService.isInWishlist(req.user.userId, auctionId);
  }

  @Delete('clear')
  clearWishlist(@Request() req) {
    return this.wishlistService.clearUserWishlist(req.user.userId);
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  findAll() {
    return this.wishlistService.findAll();
  }
}
