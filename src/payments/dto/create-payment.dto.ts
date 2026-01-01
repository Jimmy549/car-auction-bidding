import { 
  IsMongoId, 
  IsEnum, 
  IsOptional, 
  ValidateNested, 
  IsString 
} from 'class-validator';
import { Type } from 'class-transformer';
import { PaymentMethod } from '../schemas/payment.schema';

class ShippingAddressDto {
  @IsString()
  street: string;

  @IsString()
  city: string;

  @IsString()
  state: string;

  @IsString()
  zipCode: string;

  @IsString()
  country: string;
}

export class CreatePaymentDto {
  @IsMongoId()
  auctionId: string;

  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @ValidateNested()
  @Type(() => ShippingAddressDto)
  @IsOptional()
  shippingAddress?: ShippingAddressDto;
}
