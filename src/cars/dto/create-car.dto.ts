import {
  IsArray,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  Max,
  IsPositive,
} from 'class-validator';

export class CreateCarDto {
  @IsString()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  make: string;

  @IsString()
  model: string;

  @IsNumber()
  @Min(1900)
  @Max(new Date().getFullYear() + 1)
  year: number;

  @IsNumber()
  @IsPositive()
  mileage: number;

  @IsEnum(['sedan', 'sports', 'hatchback', 'convertible', 'suv', 'truck'])
  bodyType: string;

  @IsString()
  condition: string;

  @IsString()
  color: string;

  @IsArray()
  @IsOptional()
  photos?: string[];

  @IsNumber()
  @IsPositive()
  startingPrice: number;
}
