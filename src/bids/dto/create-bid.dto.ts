import { IsMongoId, IsNumber, IsPositive, Min } from 'class-validator';

export class CreateBidDto {
  @IsMongoId()
  auctionId: string;

  @IsNumber()
  @IsPositive()
  @Min(1)
  amount: number;
}
