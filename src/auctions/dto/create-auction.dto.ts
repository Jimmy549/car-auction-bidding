import {
  IsDate,
  IsMongoId,
  IsNumber,
  IsOptional,
  IsString,
  IsPositive,
  MinDate,
  ValidateIf,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateAuctionDto {
  @IsMongoId()
  carId: string;

  @IsString()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsDate()
  @Type(() => Date)
  @MinDate(new Date())
  startTime: Date;

  @IsDate()
  @Type(() => Date)
  @ValidateIf((o) => o.endTime > o.startTime)
  endTime: Date;

  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  startingPrice: number;
}
