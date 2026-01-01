import { IsEnum, IsString, IsOptional, IsMongoId } from 'class-validator';
import { NotificationType } from '../schemas/notification.schema';

export class CreateNotificationDto {
  @IsEnum(NotificationType)
  type: NotificationType;

  @IsString()
  title: string;

  @IsString()
  message: string;

  @IsMongoId()
  @IsOptional()
  userId?: string;

  @IsMongoId()
  @IsOptional()
  auctionId?: string;

  @IsMongoId()
  @IsOptional()
  carId?: string;

  @IsOptional()
  data?: Record<string, any>;
}
