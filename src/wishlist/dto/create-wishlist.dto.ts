import { IsMongoId } from 'class-validator';

export class CreateWishlistDto {
  @IsMongoId()
  auctionId: string;
}
